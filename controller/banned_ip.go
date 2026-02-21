package controller

import (
	"net/http"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
)

type BanIpRequest struct {
	Ip     string `json:"ip" binding:"required"`
	Reason string `json:"reason"`
}

// BanIp handles POST /api/banned-ip
func BanIp(c *gin.Context) {
	var req BanIpRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "无效的请求参数",
		})
		return
	}

	if req.Ip == "" {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "IP 地址不能为空",
		})
		return
	}

	// Check if IP is already banned
	if model.IsBannedIpExists(req.Ip) {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "该 IP 已被封禁",
		})
		return
	}

	err := model.BanIp(req.Ip, req.Reason)
	if err != nil {
		common.ApiError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "IP 封禁成功",
	})
}

// UnbanIp handles DELETE /api/banned-ip/:ip
func UnbanIp(c *gin.Context) {
	ip := c.Param("ip")
	if ip == "" {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "IP 地址不能为空",
		})
		return
	}

	// Check if IP exists in banned list
	if !model.IsBannedIpExists(ip) {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "该 IP 未被封禁",
		})
		return
	}

	err := model.UnbanIp(ip)
	if err != nil {
		common.ApiError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "IP 解封成功",
	})
}

// GetBannedIpList handles GET /api/banned-ip
func GetBannedIpList(c *gin.Context) {
	pageInfo := common.GetPageQuery(c)
	keyword := c.Query("keyword")

	bannedIps, total, err := model.GetBannedIpList(pageInfo.GetStartIdx(), pageInfo.GetPageSize(), keyword)
	if err != nil {
		common.ApiError(c, err)
		return
	}

	pageInfo.SetTotal(int(total))
	pageInfo.SetItems(bannedIps)
	common.ApiSuccess(c, pageInfo)
}

// CheckIpBanned handles GET /api/banned-ip/check/:ip - check if an IP is banned
func CheckIpBanned(c *gin.Context) {
	ip := c.Param("ip")
	if ip == "" {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "IP 地址不能为空",
		})
		return
	}

	banned := common.IsIpBanned(ip)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"ip":     ip,
			"banned": banned,
		},
	})
}
