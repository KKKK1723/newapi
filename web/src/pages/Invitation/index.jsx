import React, { useEffect, useState } from 'react';
import {
  Button,
  Table,
  Tag,
  Modal,
  InputNumber,
  Typography,
  Popconfirm,
  Input,
} from '@douyinfe/semi-ui';
import { IconSearch, IconPlus, IconDelete, IconCopy } from '@douyinfe/semi-icons';
import { API, showError, showSuccess } from '../../helpers';
import { copy } from '../../helpers/utils';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

const ITEMS_PER_PAGE = 10;

const Invitation = () => {
  const { t } = useTranslation();
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addCount, setAddCount] = useState(1);
  const [addLoading, setAddLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searching, setSearching] = useState(false);

  const loadCodes = async (page) => {
    setLoading(true);
    try {
      const url = searching && searchKeyword
        ? `/api/invitation/search?keyword=${encodeURIComponent(searchKeyword)}&p=${page}&page_size=${ITEMS_PER_PAGE}`
        : `/api/invitation/?p=${page}&page_size=${ITEMS_PER_PAGE}`;
      const res = await API.get(url);
      const { success, message, data } = res.data;
      if (success) {
        setCodes(data.items || []);
        setTotal(data.total || 0);
      } else {
        showError(message);
      }
    } catch (error) {
      showError(t('加载失败'));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCodes(currentPage);
  }, [currentPage]);

  const handleSearch = () => {
    setSearching(!!searchKeyword);
    setCurrentPage(1);
    loadCodes(1);
  };

  const handleClearSearch = () => {
    setSearchKeyword('');
    setSearching(false);
    setCurrentPage(1);
    loadCodes(1);
  };

  const handleAdd = async () => {
    if (addCount < 1 || addCount > 100) {
      showError(t('数量必须在 1-100 之间'));
      return;
    }
    setAddLoading(true);
    try {
      const res = await API.post('/api/invitation/', { count: addCount });
      const { success, message, data } = res.data;
      if (success) {
        showSuccess(t('成功生成') + ` ${data.length} ` + t('个邀请码'));
        setShowAddModal(false);
        setAddCount(1);
        loadCodes(1);
        setCurrentPage(1);
      } else {
        showError(message);
      }
    } catch (error) {
      showError(t('生成失败'));
    }
    setAddLoading(false);
  };

  const handleDelete = async (id) => {
    try {
      const res = await API.delete(`/api/invitation/${id}`);
      const { success, message } = res.data;
      if (success) {
        showSuccess(t('删除成功'));
        loadCodes(currentPage);
      } else {
        showError(message);
      }
    } catch (error) {
      showError(t('删除失败'));
    }
  };

  const renderStatus = (status) => {
    if (status === 1) {
      return <Tag color='green'>{t('未使用')}</Tag>;
    }
    return <Tag color='red'>{t('已使用')}</Tag>;
  };

  const renderCode = (code) => {
    const masked = code.substring(0, 8) + '...' + code.substring(code.length - 4);
    return (
      <div className='flex items-center gap-1'>
        <Text copyable={{ content: code }}>{masked}</Text>
      </div>
    );
  };

  const renderTime = (timestamp) => {
    if (!timestamp) return '-';
    return new Date(timestamp * 1000).toLocaleString();
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 70,
    },
    {
      title: t('邀请码'),
      dataIndex: 'code',
      render: (text) => renderCode(text),
    },
    {
      title: t('状态'),
      dataIndex: 'status',
      width: 100,
      render: (text) => renderStatus(text),
    },
    {
      title: t('创建时间'),
      dataIndex: 'created_time',
      width: 180,
      render: (text) => renderTime(text),
    },
    {
      title: t('使用者ID'),
      dataIndex: 'used_by',
      width: 100,
      render: (text) => (text ? text : '-'),
    },
    {
      title: t('使用时间'),
      dataIndex: 'used_time',
      width: 180,
      render: (text) => renderTime(text),
    },
    {
      title: t('操作'),
      dataIndex: 'action',
      width: 100,
      render: (_, record) => (
        <Popconfirm
          title={t('确认删除')}
          content={t('确定要删除该邀请码吗？')}
          onConfirm={() => handleDelete(record.id)}
        >
          <Button
            type='danger'
            theme='light'
            size='small'
            icon={<IconDelete />}
          >
            {t('删除')}
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className='mt-[60px] px-2'>
      <div className='flex justify-between items-center mb-4 flex-wrap gap-2'>
        <div className='flex items-center gap-2'>
          <Input
            placeholder={t('搜索邀请码')}
            value={searchKeyword}
            onChange={setSearchKeyword}
            onEnterPress={handleSearch}
            prefix={<IconSearch />}
            showClear
            onClear={handleClearSearch}
            style={{ width: 240 }}
          />
          <Button onClick={handleSearch}>{t('搜索')}</Button>
        </div>
        <Button
          theme='solid'
          type='primary'
          icon={<IconPlus />}
          onClick={() => setShowAddModal(true)}
        >
          {t('生成邀请码')}
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={codes}
        loading={loading}
        rowKey='id'
        pagination={{
          currentPage,
          pageSize: ITEMS_PER_PAGE,
          total,
          onPageChange: (page) => setCurrentPage(page),
        }}
      />

      <Modal
        title={t('生成邀请码')}
        visible={showAddModal}
        onOk={handleAdd}
        onCancel={() => setShowAddModal(false)}
        okText={t('生成')}
        cancelText={t('取消')}
        confirmLoading={addLoading}
      >
        <div className='py-4'>
          <div className='mb-2'>{t('生成数量（1-100）')}</div>
          <InputNumber
            value={addCount}
            onChange={setAddCount}
            min={1}
            max={100}
            style={{ width: '100%' }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default Invitation;
