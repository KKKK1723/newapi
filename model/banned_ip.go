package model

import (
	"strconv"
	"time"

	"github.com/QuantumNous/new-api/common"
)

type BannedIp struct {
	Id        int    `json:"id" gorm:"primaryKey;autoIncrement"`
	Ip        string `json:"ip" gorm:"type:varchar(45);uniqueIndex;not null"`
	Reason    string `json:"reason" gorm:"type:varchar(255)"`
	CreatedAt int64  `json:"created_at" gorm:"autoCreateTime"`
}

func (BannedIp) TableName() string {
	return "banned_ips"
}

// BanIp adds an IP to the banned list
func BanIp(ip string, reason string) error {
	bannedIp := BannedIp{
		Ip:        ip,
		Reason:    reason,
		CreatedAt: time.Now().Unix(),
	}
	err := DB.Create(&bannedIp).Error
	if err != nil {
		return err
	}
	// Update memory cache
	common.AddBannedIp(ip)
	return nil
}

// UnbanIp removes an IP from the banned list
func UnbanIp(ip string) error {
	err := DB.Where("ip = ?", ip).Delete(&BannedIp{}).Error
	if err != nil {
		return err
	}
	// Update memory cache
	common.RemoveBannedIp(ip)
	return nil
}

// GetBannedIpList returns a paginated list of banned IPs
func GetBannedIpList(startIdx int, num int, keyword string) ([]*BannedIp, int64, error) {
	var bannedIps []*BannedIp
	var total int64

	query := DB.Model(&BannedIp{})
	if keyword != "" {
		query = query.Where("ip LIKE ? OR reason LIKE ?", "%"+keyword+"%", "%"+keyword+"%")
	}

	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	err = query.Order("id desc").Limit(num).Offset(startIdx).Find(&bannedIps).Error
	if err != nil {
		return nil, 0, err
	}

	return bannedIps, total, nil
}

// LoadBannedIps loads all banned IPs into a map for caching
func LoadBannedIps() map[string]bool {
	var bannedIps []BannedIp
	result := make(map[string]bool)

	err := DB.Find(&bannedIps).Error
	if err != nil {
		common.SysLog("failed to load banned IPs: " + err.Error())
		return result
	}

	for _, ip := range bannedIps {
		result[ip.Ip] = true
	}

	common.SysLog("loaded " + strconv.Itoa(len(result)) + " banned IPs")
	return result
}

// IsBannedIpExists checks if an IP is already banned
func IsBannedIpExists(ip string) bool {
	var count int64
	DB.Model(&BannedIp{}).Where("ip = ?", ip).Count(&count)
	return count > 0
}
