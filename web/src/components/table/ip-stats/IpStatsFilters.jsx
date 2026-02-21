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

import React from 'react';
import { Input, DatePicker, Button, Space } from '@douyinfe/semi-ui';
import { IconSearch, IconRefresh, IconChevronLeft, IconChevronRight } from '@douyinfe/semi-icons';
import dayjs from 'dayjs';

const IpStatsFilters = (ipStatsData) => {
  const {
    searchIp,
    setSearchIp,
    startTimestamp,
    endTimestamp,
    handleSearch,
    handleReset,
    handlePrevDay,
    handleNextDay,
    handleDateRangeChange,
    t,
  } = ipStatsData;

  const isToday = dayjs.unix(startTimestamp).startOf('day').unix() >= dayjs().startOf('day').unix();

  return (
    <Space wrap>
      <Input
        placeholder={t('搜索IP地址')}
        value={searchIp}
        onChange={setSearchIp}
        prefix={<IconSearch />}
        showClear
        style={{ width: 200 }}
      />
      <DatePicker
        type='dateTimeRange'
        value={[
          startTimestamp ? dayjs.unix(startTimestamp).toDate() : null,
          endTimestamp ? dayjs.unix(endTimestamp).toDate() : null,
        ]}
        onChange={handleDateRangeChange}
        style={{ width: 360 }}
        placeholder={[t('开始时间'), t('结束时间')]}
      />
      <Button
        theme='solid'
        type='primary'
        icon={<IconSearch />}
        onClick={handleSearch}
      >
        {t('搜索')}
      </Button>
      <Button
        theme='light'
        type='tertiary'
        icon={<IconRefresh />}
        onClick={handleReset}
      >
        {t('重置')}
      </Button>
      <Button
        theme='light'
        type='tertiary'
        icon={<IconChevronLeft />}
        onClick={handlePrevDay}
      >
        {t('前一天')}
      </Button>
      <Button
        theme='light'
        type='tertiary'
        icon={<IconChevronRight />}
        onClick={handleNextDay}
        disabled={isToday}
      >
        {t('后一天')}
      </Button>
    </Space>
  );
};

export default IpStatsFilters;
