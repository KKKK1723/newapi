package common

import (
	"strconv"
	"sync"
)

var (
	bannedIpCache = make(map[string]bool)
	bannedIpMutex sync.RWMutex
)

// InitBannedIpCache initializes the banned IP cache with pre-loaded IPs
func InitBannedIpCache(ips map[string]bool) {
	bannedIpMutex.Lock()
	defer bannedIpMutex.Unlock()
	bannedIpCache = ips
	SysLog("banned IP cache initialized with " + strconv.Itoa(len(ips)) + " IPs")
}

// AddBannedIp adds an IP to the banned cache
func AddBannedIp(ip string) {
	bannedIpMutex.Lock()
	defer bannedIpMutex.Unlock()
	bannedIpCache[ip] = true
}

// RemoveBannedIp removes an IP from the banned cache
func RemoveBannedIp(ip string) {
	bannedIpMutex.Lock()
	defer bannedIpMutex.Unlock()
	delete(bannedIpCache, ip)
}

// IsIpBanned checks if an IP is banned (O(1) lookup)
func IsIpBanned(ip string) bool {
	bannedIpMutex.RLock()
	defer bannedIpMutex.RUnlock()
	return bannedIpCache[ip]
}

// GetBannedIpCount returns the count of banned IPs in cache
func GetBannedIpCount() int {
	bannedIpMutex.RLock()
	defer bannedIpMutex.RUnlock()
	return len(bannedIpCache)
}
