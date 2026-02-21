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
import CardPro from '../../common/ui/CardPro';
import IpStatsTable from './IpStatsTable';
import IpStatsFilters from './IpStatsFilters';
import IpDetailModal from './modals/IpDetailModal';
import { useIpStatsData } from '../../../hooks/ip-stats/useIpStatsData';
import { useIsMobile } from '../../../hooks/common/useIsMobile';
import { createCardProPagination } from '../../../helpers/utils';

const IpStatsPage = () => {
  const ipStatsData = useIpStatsData();
  const isMobile = useIsMobile();

  return (
    <>
      {/* Modals */}
      <IpDetailModal {...ipStatsData} />

      {/* Main Content */}
      <CardPro
        type='type2'
        searchArea={<IpStatsFilters {...ipStatsData} />}
        paginationArea={createCardProPagination({
          currentPage: ipStatsData.activePage,
          pageSize: ipStatsData.pageSize,
          total: ipStatsData.ipStatsCount,
          onPageChange: ipStatsData.handlePageChange,
          onPageSizeChange: ipStatsData.handlePageSizeChange,
          isMobile: isMobile,
          t: ipStatsData.t,
        })}
        t={ipStatsData.t}
      >
        <IpStatsTable {...ipStatsData} />
      </CardPro>
    </>
  );
};

export default IpStatsPage;
