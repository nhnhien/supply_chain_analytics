import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getReorderStrategy,
  getTopReorderPoints,
  getTopSafetyStock,
  getTopLeadTime,
  getTopOptimalInventory,
  getTopHoldingCost,
} from '../api';
import { Card, Spin } from 'antd';
import Layout from '../components/common/Layout';
import ReorderCharts from '../components/charts/ReorderCharts';
import ReorderStrategy from '../components/reorder/ReorderStrategy';

const Reorder = () => {
  const { data: strategy, isLoading: loadingStrategy, isError } = useQuery({
    queryKey: ['reorderStrategy'],
    queryFn: getReorderStrategy,
  });

  const { data: reorderPoints } = useQuery({
    queryKey: ['reorderPoints'],
    queryFn: getTopReorderPoints,
    enabled: !!strategy,
  });

  const { data: safetyStock } = useQuery({
    queryKey: ['safetyStock'],
    queryFn: getTopSafetyStock,
    enabled: !!strategy,
  });

  const { data: leadTime } = useQuery({
    queryKey: ['leadTime'],
    queryFn: getTopLeadTime,
    enabled: !!strategy,
  });

  const { data: inventory } = useQuery({
    queryKey: ['optimalInventory'],
    queryFn: getTopOptimalInventory,
    enabled: !!strategy,
  });

  const { data: holdingCost } = useQuery({
    queryKey: ['holdingCost'],
    queryFn: getTopHoldingCost,
    enabled: !!strategy,
  });

  if (loadingStrategy) {
    return (
      <Layout>
        <Spin tip="Đang tải chiến lược đặt hàng..." size="large" />
      </Layout>
    );
  }
  
  if (isError) {
    return (
      <Layout>
        <p className="text-red-500">❌ Không thể tải dữ liệu chiến lược.</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <ReorderStrategy reorderData={strategy?.data} />
        
        <div className="mt-8">
          <ReorderCharts
            reorderPoints={reorderPoints?.data?.data}
            safetyStock={safetyStock?.data?.data}
            leadTime={leadTime?.data?.data}
            optimalInventory={inventory?.data?.data}
            holdingCost={holdingCost?.data?.data}
          />
        </div>
      </div>
    </Layout>
  );
};

export default Reorder;