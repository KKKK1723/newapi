/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { API, showError, showSuccess } from '../../helpers';
import dayjs from 'dayjs';

export const useIpStatsData = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [ipStats, setIpStats] = useState([]);
  const [ipStatsCount, setIpStatsCount] = useState(0);
  const [activePage, setActivePage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Filter states
  const [searchIp, setSearchIp] = useState('');
  const [startTimestamp, setStartTimestamp] = useState(
    dayjs().startOf('day').unix()
  );
  const [endTimestamp, setEndTimestamp] = useState(dayjs().endOf('day').unix());

  // IP Detail Modal states
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedIp, setSelectedIp] = useState('');
  const [ipDetailLogs, setIpDetailLogs] = useState([]);
  const [ipDetailLogsCount, setIpDetailLogsCount] = useState(0);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailActivePage, setDetailActivePage] = useState(1);
  const [detailPageSize, setDetailPageSize] = useState(10);

  // Fetch IP stats - accepts optional overrides for page and size
  const loadIpStats = useCallback(async (page, size) => {
    const reqPage = page !== undefined ? page : activePage;
    const reqSize = size !== undefined ? size : pageSize;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        p: reqPage,
        page_size: reqSize,
      });

      if (searchIp) {
        params.append('ip', searchIp);
      }
      if (startTimestamp) {
        params.append('start_timestamp', startTimestamp);
      }
      if (endTimestamp) {
        params.append('end_timestamp', endTimestamp);
      }

      const res = await API.get(`/api/log/ip/stat?${params.toString()}`);
      const { success, message, data } = res.data;
      if (success) {
        const formattedStats = (data.items || []).map((item, index) => ({
          ...item,
          key: `${item.ip}-${index}`,
        }));
        setIpStats(formattedStats);
        setIpStatsCount(data.total || 0);
      } else {
        showError(message);
      }
    } catch (error) {
      showError(error.message || t('获取IP统计失败'));
    } finally {
      setLoading(false);
    }
  }, [activePage, pageSize, searchIp, startTimestamp, endTimestamp, t]);

  // Fetch IP detail logs
  const loadIpDetailLogs = useCallback(async () => {
    if (!selectedIp) return;
    setDetailLoading(true);
    try {
      const params = new URLSearchParams({
        ip: selectedIp,
        p: detailActivePage,
        page_size: detailPageSize,
      });

      if (startTimestamp) {
        params.append('start_timestamp', startTimestamp);
      }
      if (endTimestamp) {
        params.append('end_timestamp', endTimestamp);
      }

      const res = await API.get(`/api/log/ip/detail?${params.toString()}`);
      const { success, message, data } = res.data;
      if (success) {
        const formattedLogs = (data.items || []).map((item, index) => ({
          ...item,
          key: `${item.id}-${index}`,
        }));
        setIpDetailLogs(formattedLogs);
        setIpDetailLogsCount(data.total || 0);
      } else {
        showError(message);
      }
    } catch (error) {
      showError(error.message || t('获取IP详情失败'));
    } finally {
      setDetailLoading(false);
    }
  }, [selectedIp, detailActivePage, detailPageSize, startTimestamp, endTimestamp, t]);

  // Load IP stats on mount and when filters change
  useEffect(() => {
    loadIpStats();
  }, [loadIpStats]);

  // Load IP detail logs when modal is opened
  useEffect(() => {
    if (detailModalVisible && selectedIp) {
      loadIpDetailLogs();
    }
  }, [detailModalVisible, selectedIp, detailActivePage, detailPageSize, loadIpDetailLogs]);

  // Handlers
  const handlePageChange = (page) => {
    setActivePage(page);
  };

  const handlePageSizeChange = async (size) => {
    setPageSize(size);
    setActivePage(1);
    await loadIpStats(1, size);
  };

  const handleSearch = () => {
    setActivePage(1);
    loadIpStats();
  };

  const handleReset = () => {
    setSearchIp('');
    setStartTimestamp(dayjs().startOf('day').unix());
    setEndTimestamp(dayjs().endOf('day').unix());
    setActivePage(1);
  };

  const handlePrevDay = () => {
    const prevDay = dayjs.unix(startTimestamp).subtract(1, 'day');
    setStartTimestamp(prevDay.startOf('day').unix());
    setEndTimestamp(prevDay.endOf('day').unix());
    setActivePage(1);
  };

  const handleNextDay = () => {
    const nextDay = dayjs.unix(startTimestamp).add(1, 'day');
    if (nextDay.startOf('day').unix() > dayjs().startOf('day').unix()) return;
    setStartTimestamp(nextDay.startOf('day').unix());
    setEndTimestamp(nextDay.endOf('day').unix());
    setActivePage(1);
  };

  const handleDateRangeChange = (dateRange) => {
    if (dateRange && dateRange.length === 2) {
      setStartTimestamp(dayjs(dateRange[0]).unix());
      setEndTimestamp(dayjs(dateRange[1]).unix());
    } else {
      setStartTimestamp(null);
      setEndTimestamp(null);
    }
  };

  const showIpDetail = (ip) => {
    setSelectedIp(ip);
    setDetailActivePage(1);
    setDetailModalVisible(true);
  };

  const closeDetailModal = () => {
    setDetailModalVisible(false);
    setSelectedIp('');
    setIpDetailLogs([]);
    setIpDetailLogsCount(0);
  };

  const handleDetailPageChange = (page) => {
    setDetailActivePage(page);
  };

  const handleDetailPageSizeChange = (size) => {
    setDetailPageSize(size);
    setDetailActivePage(1);
  };

  // Ban IP
  const banIp = useCallback(async (ip, reason = '') => {
    try {
      const res = await API.post('/api/banned-ip', { ip, reason });
      const { success, message } = res.data;
      if (success) {
        showSuccess(t('IP 封禁成功'));
        loadIpStats();
        return true;
      } else {
        showError(message);
        return false;
      }
    } catch (error) {
      showError(error.message || t('封禁 IP 失败'));
      return false;
    }
  }, [t, loadIpStats]);

  // Unban IP
  const unbanIp = useCallback(async (ip) => {
    try {
      const res = await API.delete(`/api/banned-ip/${encodeURIComponent(ip)}`);
      const { success, message } = res.data;
      if (success) {
        showSuccess(t('IP 解封成功'));
        loadIpStats();
        return true;
      } else {
        showError(message);
        return false;
      }
    } catch (error) {
      showError(error.message || t('解封 IP 失败'));
      return false;
    }
  }, [t, loadIpStats]);

  // Check if IP is banned
  const checkIpBanned = useCallback(async (ip) => {
    try {
      const res = await API.get(`/api/banned-ip/check/${encodeURIComponent(ip)}`);
      const { success, data } = res.data;
      if (success) {
        return data.banned;
      }
      return false;
    } catch (error) {
      return false;
    }
  }, []);

  return {
    t,
    loading,
    ipStats,
    ipStatsCount,
    activePage,
    pageSize,
    searchIp,
    setSearchIp,
    startTimestamp,
    endTimestamp,
    handlePageChange,
    handlePageSizeChange,
    handleSearch,
    handleReset,
    handlePrevDay,
    handleNextDay,
    handleDateRangeChange,
    showIpDetail,
    // Detail modal
    detailModalVisible,
    selectedIp,
    ipDetailLogs,
    ipDetailLogsCount,
    detailLoading,
    detailActivePage,
    detailPageSize,
    closeDetailModal,
    handleDetailPageChange,
    handleDetailPageSizeChange,
    // Ban IP actions
    banIp,
    unbanIp,
    checkIpBanned,
  };
};
