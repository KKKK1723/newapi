package model

import (
	"errors"

	"github.com/QuantumNous/new-api/common"

	"gorm.io/gorm"
)

type InvitationCode struct {
	Id          int            `json:"id"`
	Code        string         `json:"code" gorm:"type:char(32);uniqueIndex"`
	Status      int            `json:"status" gorm:"default:1"`
	CreatedBy   int            `json:"created_by"`
	UsedBy      int            `json:"used_by"`
	CreatedTime int64          `json:"created_time" gorm:"bigint"`
	UsedTime    int64          `json:"used_time" gorm:"bigint"`
	Count       int            `json:"count" gorm:"-:all"` // only for api request
	DeletedAt   gorm.DeletedAt `gorm:"index"`
}

func GetAllInvitationCodes(startIdx int, num int) (codes []*InvitationCode, total int64, err error) {
	tx := DB.Begin()
	if tx.Error != nil {
		return nil, 0, tx.Error
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	err = tx.Model(&InvitationCode{}).Count(&total).Error
	if err != nil {
		tx.Rollback()
		return nil, 0, err
	}

	err = tx.Order("id desc").Limit(num).Offset(startIdx).Find(&codes).Error
	if err != nil {
		tx.Rollback()
		return nil, 0, err
	}

	if err = tx.Commit().Error; err != nil {
		return nil, 0, err
	}

	return codes, total, nil
}

func SearchInvitationCodes(keyword string, startIdx int, num int) (codes []*InvitationCode, total int64, err error) {
	tx := DB.Begin()
	if tx.Error != nil {
		return nil, 0, tx.Error
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	query := tx.Model(&InvitationCode{}).Where("code LIKE ?", keyword+"%")

	err = query.Count(&total).Error
	if err != nil {
		tx.Rollback()
		return nil, 0, err
	}

	err = query.Order("id desc").Limit(num).Offset(startIdx).Find(&codes).Error
	if err != nil {
		tx.Rollback()
		return nil, 0, err
	}

	if err = tx.Commit().Error; err != nil {
		return nil, 0, err
	}

	return codes, total, nil
}

func ValidateInvitationCode(code string) error {
	if code == "" {
		return errors.New("邀请码不能为空")
	}
	var invitation InvitationCode
	err := DB.Where("code = ?", code).First(&invitation).Error
	if err != nil {
		return errors.New("无效的邀请码")
	}
	if invitation.Status != common.InvitationCodeStatusUnused {
		return errors.New("该邀请码已被使用")
	}
	return nil
}

func UseInvitationCode(code string, userId int) error {
	if code == "" {
		return errors.New("邀请码不能为空")
	}
	if userId == 0 {
		return errors.New("无效的用户ID")
	}

	common.RandomSleep()
	return DB.Transaction(func(tx *gorm.DB) error {
		var invitation InvitationCode
		err := tx.Set("gorm:query_option", "FOR UPDATE").Where("code = ?", code).First(&invitation).Error
		if err != nil {
			return errors.New("无效的邀请码")
		}
		if invitation.Status != common.InvitationCodeStatusUnused {
			return errors.New("该邀请码已被使用")
		}
		invitation.Status = common.InvitationCodeStatusUsed
		invitation.UsedBy = userId
		invitation.UsedTime = common.GetTimestamp()
		return tx.Save(&invitation).Error
	})
}

func (code *InvitationCode) Insert() error {
	return DB.Create(code).Error
}

func (code *InvitationCode) Delete() error {
	return DB.Delete(code).Error
}

func DeleteInvitationCodeById(id int) error {
	if id == 0 {
		return errors.New("id 为空！")
	}
	invitation := InvitationCode{Id: id}
	err := DB.Where(invitation).First(&invitation).Error
	if err != nil {
		return err
	}
	return invitation.Delete()
}
