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
import { Modal, Table, Tag, Typography, Empty } from '@douyinfe/semi-ui';
import {
  IllustrationNoResult,
  IllustrationNoResultDark,
} from '@douyinfe/semi-illustrations';
import dayjs from 'dayjs';
import { renderQuotaWithPrompt } from '../../../../helpers/render';

const { Text } = Typography;

const IpDetailModal = (ipStatsData) => {
  const {
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
    t,
  } = ipStatsData;

  const logTypeMap = {
    0: { text: t('未知'), color: 'grey' },
    1: { text: t('充值'), color: 'green' },
    2: { text: t('消费'), color: 'blue' },
    3: { text: t('管理'), color: 'orange' },
    4: { text: t('系统'), color: 'violet' },
    5: { text: t('错误'), color: 'red' },
    6: { text: t('退款'), color: 'cyan' },
  };

  const columns = [
    {
      title: t('时间'),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (text) => (
        <Text>{dayjs.unix(text).format('YYYY-MM-DD HH:mm:ss')}</Text>
      ),
    },
    {
      title: t('类型'),
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type) => {
        const typeInfo = logTypeMap[type] || logTypeMap[0];
        return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>;
      },
    },
    {
      title: t('用户'),
      dataIndex: 'username',
      key: 'username',
      width: 100,
    },
    {
      title: t('令牌'),
      dataIndex: 'token_name',
      key: 'token_name',
      width: 120,
    },
    {
      title: t('模型'),
      dataIndex: 'model_name',
      key: 'model_name',
      width: 150,
    },
    {
      title: t('分组'),
      dataIndex: 'group',
      key: 'group',
      width: 100,
    },
    {
      title: t('额度'),
      dataIndex: 'quota',
      key: 'quota',
      width: 100,
      render: (text) => renderQuotaWithPrompt(text),
    },
    {
      title: t('内容'),
      dataIndex: 'content',
      key: 'content',
      width: 200,
      ellipsis: true,
    },
  ];

  return (
    <Modal
      title={`${t('IP详情')}: ${selectedIp}`}
      visible={detailModalVisible}
      onCancel={closeDetailModal}
      footer={null}
      width={1200}
      style={{ maxHeight: '80vh' }}
    >
      <Table
        columns={columns}
        dataSource={ipDetailLogs}
        rowKey='key'
        loading={detailLoading}
        scroll={{ x: 'max-content', y: 400 }}
        size='small'
        empty={
          <Empty
            image={<IllustrationNoResult style={{ width: 100, height: 100 }} />}
            darkModeImage={
              <IllustrationNoResultDark style={{ width: 100, height: 100 }} />
            }
            description={t('暂无日志')}
          />
        }
        pagination={{
          currentPage: detailActivePage,
          pageSize: detailPageSize,
          total: ipDetailLogsCount,
          pageSizeOptions: [10, 20, 50],
          showSizeChanger: true,
          onPageSizeChange: handleDetailPageSizeChange,
          onPageChange: handleDetailPageChange,
        }}
      />
    </Modal>
  );
};

export default IpDetailModal;
