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

import React, { useState, useEffect, useCallback } from 'react';
import { Typography } from '@douyinfe/semi-ui';
import { IconCoinMoneyStroked } from '@douyinfe/semi-icons';
import CardPro from '../../common/ui/CardPro';
import UsersTable from './UsersTable';
import UsersActions from './UsersActions';
import UsersFilters from './UsersFilters';
import UsersDescription from './UsersDescription';
import AddUserModal from './modals/AddUserModal';
import EditUserModal from './modals/EditUserModal';
import { useUsersData } from '../../../hooks/users/useUsersData';
import { useIsMobile } from '../../../hooks/common/useIsMobile';
import { createCardProPagination } from '../../../helpers/utils';
import { API, showError } from '../../../helpers';
import { renderQuota } from '../../../helpers/render';

const { Text } = Typography;

const UsersPage = () => {
  const usersData = useUsersData();
  const isMobile = useIsMobile();
  const [totalRemainQuota, setTotalRemainQuota] = useState(null);

  const fetchQuotaStats = useCallback(async () => {
    try {
      const res = await API.get('/api/user/quota_stats');
      const { success, data } = res.data;
      if (success) {
        setTotalRemainQuota(data.total_remain_quota);
      }
    } catch (e) {
      showError(e.message);
    }
  }, []);

  useEffect(() => {
    fetchQuotaStats();
  }, [fetchQuotaStats]);

  const {
    // Modal state
    showAddUser,
    showEditUser,
    editingUser,
    setShowAddUser,
    closeAddUser,
    closeEditUser,
    refresh: originalRefresh,

    // Form state
    formInitValues,
    setFormApi,
    searchUsers,
    loadUsers,
    activePage,
    pageSize,
    groupOptions,
    loading,
    searching,

    // Description state
    compactMode,
    setCompactMode,

    // Translation
    t,
  } = usersData;

  const refresh = useCallback(async () => {
    await originalRefresh();
    fetchQuotaStats();
  }, [originalRefresh, fetchQuotaStats]);

  return (
    <>
      <AddUserModal
        refresh={refresh}
        visible={showAddUser}
        handleClose={closeAddUser}
      />

      <EditUserModal
        refresh={refresh}
        visible={showEditUser}
        handleClose={closeEditUser}
        editingUser={editingUser}
      />

      <CardPro
        type='type1'
        descriptionArea={
          <div className='flex flex-col gap-3 w-full'>
            <UsersDescription
              compactMode={compactMode}
              setCompactMode={setCompactMode}
              t={t}
            />
            {totalRemainQuota !== null && (
              <div
                className='flex items-center gap-2 px-3 py-2 rounded-lg'
                style={{
                  background: 'var(--semi-color-fill-0)',
                }}
              >
                <IconCoinMoneyStroked size='large' style={{ color: 'var(--semi-color-warning)' }} />
                <Text strong style={{ fontSize: 16 }}>
                  {t('用户剩余总额度')}
                  {t('（不含 root）')}：
                </Text>
                <Text strong style={{ fontSize: 18, color: 'var(--semi-color-warning)' }}>
                  {renderQuota(totalRemainQuota)}
                </Text>
              </div>
            )}
          </div>
        }
        actionsArea={
          <div className='flex flex-col md:flex-row justify-between items-center gap-2 w-full'>
            <UsersActions setShowAddUser={setShowAddUser} t={t} />

            <UsersFilters
              formInitValues={formInitValues}
              setFormApi={setFormApi}
              searchUsers={searchUsers}
              loadUsers={loadUsers}
              activePage={activePage}
              pageSize={pageSize}
              groupOptions={groupOptions}
              loading={loading}
              searching={searching}
              t={t}
            />
          </div>
        }
        paginationArea={createCardProPagination({
          currentPage: usersData.activePage,
          pageSize: usersData.pageSize,
          total: usersData.userCount,
          onPageChange: usersData.handlePageChange,
          onPageSizeChange: usersData.handlePageSizeChange,
          isMobile: isMobile,
          t: usersData.t,
        })}
        t={usersData.t}
      >
        <UsersTable {...usersData} />
      </CardPro>
    </>
  );
};

export default UsersPage;
