package controller

import (
	"net/http"
	"strconv"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"

	"github.com/gin-gonic/gin"
)

func GetAllInvitationCodes(c *gin.Context) {
	pageInfo := common.GetPageQuery(c)
	codes, total, err := model.GetAllInvitationCodes(pageInfo.GetStartIdx(), pageInfo.GetPageSize())
	if err != nil {
		common.ApiError(c, err)
		return
	}
	pageInfo.SetTotal(int(total))
	pageInfo.SetItems(codes)
	common.ApiSuccess(c, pageInfo)
}

func SearchInvitationCodes(c *gin.Context) {
	keyword := c.Query("keyword")
	pageInfo := common.GetPageQuery(c)
	codes, total, err := model.SearchInvitationCodes(keyword, pageInfo.GetStartIdx(), pageInfo.GetPageSize())
	if err != nil {
		common.ApiError(c, err)
		return
	}
	pageInfo.SetTotal(int(total))
	pageInfo.SetItems(codes)
	common.ApiSuccess(c, pageInfo)
}

func AddInvitationCode(c *gin.Context) {
	invitation := model.InvitationCode{}
	err := c.ShouldBindJSON(&invitation)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if invitation.Count <= 0 {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "邀请码个数必须大于0",
		})
		return
	}
	if invitation.Count > 100 {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "一次批量生成的邀请码个数不能大于 100",
		})
		return
	}
	var codes []string
	for i := 0; i < invitation.Count; i++ {
		code := common.GetUUID()
		cleanInvitation := model.InvitationCode{
			Code:        code,
			CreatedBy:   c.GetInt("id"),
			CreatedTime: common.GetTimestamp(),
		}
		err = cleanInvitation.Insert()
		if err != nil {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": err.Error(),
				"data":    codes,
			})
			return
		}
		codes = append(codes, code)
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    codes,
	})
}

func DeleteInvitationCode(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	err := model.DeleteInvitationCodeById(id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
	})
}
