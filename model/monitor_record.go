package model

import (
	"fmt"
	"time"

	"github.com/QuantumNous/new-api/common"
)

type MonitorRecord struct {
	Id        int    `json:"id" gorm:"primaryKey;autoIncrement"`
	ModelName string `json:"model_name" gorm:"type:varchar(255);not null;index:idx_monitor_model_checked"`
	ChannelId int    `json:"channel_id"`
	Status    string `json:"status" gorm:"type:varchar(20);not null"` // "ok" | "fail"
	Latency   int64  `json:"latency"`                                 // 对话延迟 ms
	Ping      int64  `json:"ping"`                                    // 网络往返 ms
	ErrorMsg  string `json:"error_msg" gorm:"type:text"`
	CheckedAt int64  `json:"checked_at" gorm:"not null;index:idx_monitor_model_checked"`
}

func (MonitorRecord) TableName() string {
	return "monitor_records"
}

func CreateMonitorRecord(record *MonitorRecord) error {
	return DB.Create(record).Error
}

func GetAllMonitorRecordsSince(since int64) ([]*MonitorRecord, error) {
	var records []*MonitorRecord
	err := DB.Where("checked_at >= ?", since).Order("checked_at asc").Find(&records).Error
	return records, err
}

func GetLatestMonitorRecords() ([]*MonitorRecord, error) {
	var records []*MonitorRecord
	// 每个模型取最新一条记录
	subQuery := DB.Model(&MonitorRecord{}).
		Select("MAX(id) as id").
		Group("model_name")
	err := DB.Where("id IN (?)", subQuery).Find(&records).Error
	return records, err
}

func CleanupOldMonitorRecords(days int) error {
	threshold := time.Now().Unix() - int64(days*86400)
	result := DB.Where("checked_at < ?", threshold).Delete(&MonitorRecord{})
	if result.Error != nil {
		return result.Error
	}
	common.SysLog(fmt.Sprintf("cleaned up old monitor records, deleted: %d", result.RowsAffected))
	return nil
}

// GetEnabledChannelForModel 从 abilities 表查找支持指定模型的已启用渠道（不限分组）
func GetEnabledChannelForModel(modelName string) (*Channel, error) {
	var ability Ability
	err := DB.Where("model = ? AND enabled = ?", modelName, true).First(&ability).Error
	if err != nil {
		return nil, err
	}
	channel := &Channel{}
	err = DB.First(channel, "id = ?", ability.ChannelId).Error
	if err != nil {
		return nil, err
	}
	return channel, nil
}

// GetActiveTokenForMonitor 查找一个可用于监控探测的 token（default 分组）
func GetActiveTokenForMonitor() (*Token, error) {
	var token Token
	// 优先找 group 显式为 default 的 token
	err := DB.Where("`group` = ? AND status = ?", "default", 1).First(&token).Error
	if err == nil {
		return &token, nil
	}
	// 其次找 group 为空（继承用户 group）且用户 group 为 default 的 token
	err = DB.Joins("JOIN users ON users.id = tokens.user_id").
		Where("tokens.`group` = '' AND tokens.status = ? AND users.`group` = ?", 1, "default").
		First(&token).Error
	return &token, err
}
