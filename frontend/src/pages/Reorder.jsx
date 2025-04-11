import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getReorderStrategy,
  getTopReorderPoints,
  getTopSafetyStock,
  getTopLeadTime,
  getTopOptimalInventory,
  getTopHoldingCost,
} from '@/api';
import { Card, Spin } from 'antd';
import ReorderCharts from '@/components/charts/ReorderCharts';

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

  if (loadingStrategy) return <Spin tip="Đang tải chiến lược đặt hàng..." size="large" />;
  if (isError) return <p>❌ Không thể tải dữ liệu chiến lược.</p>;

  return (
    <div className="p-6">
      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Chiến lược đặt hàng</h2>
        <pre>{JSON.stringify(strategy, null, 2)}</pre>
      </Card>
      <ReorderCharts
        reorderPoints={reorderPoints}
        safetyStock={safetyStock}
        leadTime={leadTime}
        inventory={inventory}
        holdingCost={holdingCost}
      />
    </div>
  );
};

export default Reorder;
