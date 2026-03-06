package controller

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"

	"github.com/gin-gonic/gin"
)

// ─── 硬编码监控模型列表 ──────────────────────────────────────────

type MonitorModelConfig struct {
	Name     string `json:"name"`
	ModelId  string `json:"modelId"`
	Provider string `json:"provider"`
}

var monitoredModels = []MonitorModelConfig{
	{Name: "Claude Sonnet 4.6", ModelId: "claude-sonnet-4-6", Provider: "Anthropic"},
	{Name: "Claude Opus 4.6", ModelId: "claude-opus-4-6", Provider: "Anthropic"},
	{Name: "Claude Haiku 4.5", ModelId: "claude-haiku-4-5-20251001", Provider: "Anthropic"},
}

var monitorOnce sync.Once

// ─── 后台 goroutine ──────────────────────────────────────────────

func AutomaticallyMonitorModels() {
	if !common.IsMasterNode {
		return
	}
	monitorOnce.Do(func() {
		common.SysLog("starting model monitor probe")
		lastCleanup := time.Now()
		// 启动后立即执行一次探测
		probeAllModels()
		for {
			time.Sleep(3 * time.Minute)
			probeAllModels()
			// 每 24 小时清理一次 30 天前的旧记录
			if time.Since(lastCleanup) >= 24*time.Hour {
				_ = model.CleanupOldMonitorRecords(30)
				lastCleanup = time.Now()
			}
		}
	})
}

func probeAllModels() {
	for _, mc := range monitoredModels {
		probeModel(mc)
	}
}

func probeModel(mc MonitorModelConfig) {
	// 1. 从 abilities 表找一个已启用渠道
	ch, err := model.GetEnabledChannelForModel(mc.ModelId)
	if err != nil || ch == nil {
		record := &model.MonitorRecord{
			ModelName: mc.ModelId,
			ChannelId: 0,
			Status:    "fail",
			Latency:   0,
			Ping:      0,
			ErrorMsg:  "no enabled channel found for model: " + mc.ModelId,
			CheckedAt: time.Now().Unix(),
		}
		_ = model.CreateMonitorRecord(record)
		return
	}

	// 2. Ping 探测
	baseURL := ch.GetBaseURL()
	pingMs := pingEndpoint(baseURL)

	// 3. 对话探测：直接用 Anthropic Messages API 格式请求上游
	apiKey := ch.Key
	keys := ch.GetKeys()
	if len(keys) > 0 {
		apiKey = keys[0]
	}
	latencyMs, probeErr := probeChatAnthropic(baseURL, apiKey, mc.ModelId)

	status := "ok"
	errMsg := ""
	if probeErr != nil {
		status = "fail"
		errMsg = probeErr.Error()
		latencyMs = 0
	}

	record := &model.MonitorRecord{
		ModelName: mc.ModelId,
		ChannelId: ch.Id,
		Status:    status,
		Latency:   latencyMs,
		Ping:      pingMs,
		ErrorMsg:  errMsg,
		CheckedAt: time.Now().Unix(),
	}
	_ = model.CreateMonitorRecord(record)
}

// probeChatAnthropic 直接用 Anthropic Messages API 格式探测上游渠道
func probeChatAnthropic(baseURL string, apiKey string, modelId string) (int64, error) {
	if baseURL == "" {
		return 0, fmt.Errorf("channel base URL is empty")
	}
	if !strings.HasPrefix(baseURL, "http") {
		baseURL = "https://" + baseURL
	}
	baseURL = strings.TrimSuffix(baseURL, "/")

	reqBody := map[string]interface{}{
		"model":      modelId,
		"max_tokens": 5,
		"system": []map[string]interface{}{
			{
				"type": "text",
				"text": "You are Claude Code, Anthropic's official CLI for Claude.",
				"cache_control": map[string]string{
					"type": "ephemeral",
				},
			},
		},
		"messages": []map[string]string{
			{"role": "user", "content": "hi"},
		},
	}
	bodyBytes, _ := json.Marshal(reqBody)

	url := baseURL + "/v1/messages"
	req, err := http.NewRequest("POST", url, bytes.NewReader(bodyBytes))
	if err != nil {
		return 0, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", apiKey)
	req.Header.Set("anthropic-version", "2023-06-01")
	req.Header.Set("User-Agent", "claude-cli/2.0.65 (external, cli)")

	client := &http.Client{Timeout: 30 * time.Second}
	tik := time.Now()
	resp, err := client.Do(req)
	latency := time.Since(tik).Milliseconds()
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return latency, fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(respBody))
	}

	return latency, nil
}

func pingEndpoint(baseURL string) int64 {
	if baseURL == "" {
		return 0
	}
	if !strings.HasPrefix(baseURL, "http") {
		baseURL = "https://" + baseURL
	}
	client := &http.Client{Timeout: 10 * time.Second}
	tik := time.Now()
	resp, err := client.Head(baseURL)
	if err != nil {
		return 0
	}
	defer resp.Body.Close()
	return time.Since(tik).Milliseconds()
}

// ─── API Handler ──────────────────────────────────────────────────

func GetMonitorStatus(c *gin.Context) {
	period := c.DefaultQuery("period", "7d")
	days := parsePeriodDays(period)

	since := time.Now().Unix() - int64(days*86400)
	records, err := model.GetAllMonitorRecordsSince(since)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "failed to query monitor records: " + err.Error(),
		})
		return
	}

	// 按模型分组
	type modelRecords struct {
		records []*model.MonitorRecord
	}
	grouped := make(map[string]*modelRecords)
	for _, r := range records {
		if grouped[r.ModelName] == nil {
			grouped[r.ModelName] = &modelRecords{}
		}
		grouped[r.ModelName].records = append(grouped[r.ModelName].records, r)
	}

	// 构建返回数据
	var data []gin.H
	for _, mc := range monitoredModels {
		mr := grouped[mc.ModelId]

		var (
			latency      int64
			ping         int64
			successCount int
			totalCount   int
			history      []gin.H
		)

		if mr != nil && len(mr.records) > 0 {
			totalCount = len(mr.records)
			for _, r := range mr.records {
				if r.Status == "ok" {
					successCount++
				}
			}

			// 最新一条的延迟和 ping
			latest := mr.records[len(mr.records)-1]
			latency = latest.Latency
			ping = latest.Ping

			// 取最后 60 条作为 history
			historyRecords := mr.records
			if len(historyRecords) > 60 {
				historyRecords = historyRecords[len(historyRecords)-60:]
			}
			for _, r := range historyRecords {
				h := gin.H{
					"status":  r.Status,
					"time":    time.Unix(r.CheckedAt, 0).UTC().Format(time.RFC3339),
					"latency": r.Latency,
					"ping":    r.Ping,
				}
				if r.ErrorMsg != "" {
					h["error"] = r.ErrorMsg
				}
				history = append(history, h)
			}
		}

		if history == nil {
			history = []gin.H{}
		}

		var rate float64
		if totalCount > 0 {
			rate = float64(successCount) / float64(totalCount)
		}

		status := determineStatus(rate, latency)

		data = append(data, gin.H{
			"id":       mc.ModelId,
			"name":     mc.Name,
			"provider": mc.Provider,
			"modelId":  mc.ModelId,
			"status":   status,
			"latency":  latency,
			"ping":     ping,
			"availability": gin.H{
				"success": successCount,
				"total":   totalCount,
				"rate":    rate,
			},
			"history": history,
		})
	}

	if data == nil {
		data = []gin.H{}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    data,
	})
}

func determineStatus(rate float64, latency int64) string {
	if rate >= 0.95 && latency < 5000 {
		return "operational"
	}
	if rate >= 0.80 {
		return "degraded"
	}
	return "failed"
}

func parsePeriodDays(period string) int {
	period = strings.TrimSuffix(period, "d")
	days, err := strconv.Atoi(period)
	if err != nil || days <= 0 {
		return 7
	}
	if days > 30 {
		return 30
	}
	return days
}
