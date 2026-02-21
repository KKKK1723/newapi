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

import React, { useState } from 'react';
import { Empty, Tag, Typography, Button, Space, Popconfirm, Modal, Input, Popover } from '@douyinfe/semi-ui';
import CardTable from '../../common/ui/CardTable';
import {
  IllustrationNoResult,
  IllustrationNoResultDark,
} from '@douyinfe/semi-illustrations';
import dayjs from 'dayjs';
import { renderQuotaWithPrompt } from '../../../helpers/render';

const { Text } = Typography;

const IpStatsTable = (ipStatsData) => {
  const {
    ipStats,
    loading,
    activePage,
    pageSize,
    ipStatsCount,
    handlePageChange,
    handlePageSizeChange,
    showIpDetail,
    banIp,
    unbanIp,
    t,
  } = ipStatsData;

  const [banModalVisible, setBanModalVisible] = useState(false);
  const [banIpTarget, setBanIpTarget] = useState('');
  const [banReason, setBanReason] = useState('');
  const [banLoading, setBanLoading] = useState(false);

  const handleBanClick = (ip) => {
    setBanIpTarget(ip);
    setBanReason('');
    setBanModalVisible(true);
  };

  const handleBanConfirm = async () => {
    setBanLoading(true);
    const success = await banIp(banIpTarget, banReason);
    setBanLoading(false);
    if (success) {
      setBanModalVisible(false);
      setBanIpTarget('');
      setBanReason('');
    }
  };

  const handleUnban = async (ip) => {
    await unbanIp(ip);
  };

  const columns = [
    {
      title: t('IP地址'),
      dataIndex: 'ip',
      key: 'ip',
      render: (text) => (
        <Button
          type='tertiary'
          theme='borderless'
          onClick={() => showIpDetail(text)}
          style={{ padding: 0 }}
        >
          {text}
        </Button>
      ),
    },
    {
      title: t('请求次数'),
      dataIndex: 'request_count',
      key: 'request_count',
      sorter: (a, b) => a.request_count - b.request_count,
      render: (text) => (
        <Tag color='blue' type='light'>
          {text}
        </Tag>
      ),
    },
    {
      title: t('错误次数'),
      dataIndex: 'error_count',
      key: 'error_count',
      sorter: (a, b) => a.error_count - b.error_count,
      render: (text) => (
        <Tag color={text > 0 ? 'red' : 'grey'} type='light'>
          {text}
        </Tag>
      ),
    },
    {
      title: t('消费额度'),
      dataIndex: 'total_quota',
      key: 'total_quota',
      sorter: (a, b) => a.total_quota - b.total_quota,
      render: (text) => renderQuotaWithPrompt(text),
    },
    {
      title: t('关联用户'),
      dataIndex: 'usernames',
      key: 'usernames',
      render: (usernames, record) => (
        <Space wrap>
          {(usernames || []).slice(0, 3).map((name, idx) => (
            <Tag key={idx} color='grey' shape='circle'>
              {name}
              {record.user_remarks && record.user_remarks[name] && (
                <Text type='tertiary' size='small' style={{ marginLeft: 4 }}>
                  ({record.user_remarks[name]})
                </Text>
              )}
            </Tag>
          ))}
          {usernames && usernames.length > 3 && (
            <Popover
              trigger='click'
              position='bottom'
              showArrow
              content={
                <div style={{ maxHeight: 300, overflowY: 'auto', padding: '4px 0' }}>
                  <Space wrap>
                    {usernames.map((name, idx) => (
                      <Tag key={idx} color='grey' shape='circle'>
                        {name}
                        {record.user_remarks && record.user_remarks[name] && (
                          <Text type='tertiary' size='small' style={{ marginLeft: 4 }}>
                            ({record.user_remarks[name]})
                          </Text>
                        )}
                      </Tag>
                    ))}
                  </Space>
                </div>
              }
            >
              <Tag
                color='grey'
                shape='circle'
                style={{ cursor: 'pointer' }}
              >
                +{usernames.length - 3}
              </Tag>
            </Popover>
          )}
        </Space>
      ),
    },
    {
      title: t('关联令牌'),
      dataIndex: 'token_names',
      key: 'token_names',
      render: (tokenNames) => (
        <Space wrap>
          {(tokenNames || []).slice(0, 3).map((name, idx) => (
            <Tag key={idx} color='orange' shape='circle'>
              {name}
            </Tag>
          ))}
          {tokenNames && tokenNames.length > 3 && (
            <Popover
              trigger='click'
              position='bottom'
              showArrow
              content={
                <div style={{ maxHeight: 300, overflowY: 'auto', padding: '4px 0' }}>
                  <Space wrap>
                    {tokenNames.map((name, idx) => (
                      <Tag key={idx} color='orange' shape='circle'>
                        {name}
                      </Tag>
                    ))}
                  </Space>
                </div>
              }
            >
              <Tag
                color='orange'
                shape='circle'
                style={{ cursor: 'pointer' }}
              >
                +{tokenNames.length - 3}
              </Tag>
            </Popover>
          )}
        </Space>
      ),
    },
    {
      title: t('关联分组'),
      dataIndex: 'groups',
      key: 'groups',
      render: (groups) => (
        <Space wrap>
          {(groups || []).slice(0, 3).map((group, idx) => (
            <Tag key={idx} color='blue' shape='circle'>
              {group}
            </Tag>
          ))}
          {groups && groups.length > 3 && (
            <Popover
              trigger='click'
              position='bottom'
              showArrow
              content={
                <div style={{ maxHeight: 300, overflowY: 'auto', padding: '4px 0' }}>
                  <Space wrap>
                    {groups.map((group, idx) => (
                      <Tag key={idx} color='blue' shape='circle'>
                        {group}
                      </Tag>
                    ))}
                  </Space>
                </div>
              }
            >
              <Tag
                color='blue'
                shape='circle'
                style={{ cursor: 'pointer' }}
              >
                +{groups.length - 3}
              </Tag>
            </Popover>
          )}
        </Space>
      ),
    },
    {
      title: t('最后活动'),
      dataIndex: 'last_seen_at',
      key: 'last_seen_at',
      sorter: (a, b) => a.last_seen_at - b.last_seen_at,
      render: (text) => (
        <Text>{dayjs.unix(text).format('YYYY-MM-DD HH:mm:ss')}</Text>
      ),
    },
    {
      title: t('操作'),
      key: 'action',
      width: 120,
      render: (_, record) => (
        record.is_banned ? (
          <Popconfirm
            title={t('确定要解封该 IP 吗？')}
            position='leftTop'
            onConfirm={() => handleUnban(record.ip)}
            okText={t('确定')}
            cancelText={t('取消')}
          >
            <Button
              type='tertiary'
              theme='light'
              size='small'
            >
              {t('解封')}
            </Button>
          </Popconfirm>
        ) : (
          <Button
            type='danger'
            theme='light'
            size='small'
            onClick={() => handleBanClick(record.ip)}
          >
            {t('封禁')}
          </Button>
        )
      ),
    },
  ];

  return (
    <>
      <CardTable
        columns={columns}
        dataSource={ipStats}
        rowKey='key'
        loading={loading}
        scroll={undefined}
        className='rounded-xl overflow-hidden'
        size='middle'
        empty={
          <Empty
            image={<IllustrationNoResult style={{ width: 150, height: 150 }} />}
            darkModeImage={
              <IllustrationNoResultDark style={{ width: 150, height: 150 }} />
            }
            description={t('暂无数据')}
            style={{ padding: 30 }}
          />
        }
        hidePagination={true}
      />
      <Modal
        title={t('封禁 IP')}
        visible={banModalVisible}
        onOk={handleBanConfirm}
        onCancel={() => setBanModalVisible(false)}
        confirmLoading={banLoading}
        okText={t('确认封禁')}
        cancelText={t('取消')}
      >
        <div style={{ marginBottom: 16 }}>
          <Text>{t('确定要封禁 IP')} <Text strong>{banIpTarget}</Text> {t('吗？')}</Text>
        </div>
        <div>
          <Text style={{ marginBottom: 8, display: 'block' }}>{t('封禁原因（可选）')}</Text>
          <Input
            placeholder={t('请输入封禁原因')}
            value={banReason}
            onChange={(value) => setBanReason(value)}
          />
        </div>
      </Modal>
    </>
  );
};

export default IpStatsTable;
