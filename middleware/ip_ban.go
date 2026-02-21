package middleware

import (
	"net/http"

	"github.com/QuantumNous/new-api/common"
	"github.com/gin-gonic/gin"
)

// IpBanCheck middleware checks if the client IP is banned
func IpBanCheck() gin.HandlerFunc {
	return func(c *gin.Context) {
		clientIp := c.ClientIP()
		if common.IsIpBanned(clientIp) {
			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"message": "你的ip被我ban咯，就不给你用，就不给你用",
			})
			c.Abort()
			return
		}
		c.Next()
	}
}
