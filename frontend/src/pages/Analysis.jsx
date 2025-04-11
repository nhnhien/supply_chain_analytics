import React, { useState } from 'react';
import { Card, Tabs, Spin } from 'antd';
import { useQuery } from '@tanstack/react-query';
import {
  getEdaSummary,
  getMonthlyOrdersData,
  getTopCategoriesData,
  getDeliveryDelayData,
  getSellerShippingData,
  getShippingCostCategoryData,
} from '@/api';

import MonthlyOrdersChart from '@/components/charts/MonthlyOrdersChart';
import TopCategoriesChart from '@/components/charts/TopCategoriesChart';
import DeliveryDelayChart from '@/components/charts/DeliveryDelayChart';
import SellerShippingChart from '@/components/charts/SellerShippingChart';
import ShippingCostChart from '@/components/charts/ShippingCostChart';

const Analysis = () => {
  const [activeTab, setActiveTab] = useState('charts');

  // Tổng quan dữ liệu
  const {
    data: summary,
    isLoading: loadingSummary,
    isError,
  } = useQuery({
    queryKey: ['edaSummary'],
    queryFn: getEdaSummary,
  });

  // Các biểu đồ (sau khi có summary)
  const { data: monthlyOrders } = useQuery({
    queryKey: ['monthlyOrders'],
    queryFn: getMonthlyOrdersData,
    enabled: !!summary,
  });

  const { data: topCategories } = useQuery({
    queryKey: ['topCategories'],
    queryFn: getTopCategoriesData,
    enabled: !!summary,
  });

  const { data: deliveryDelay } = useQuery({
    queryKey: ['deliveryDelay'],
    queryFn: getDeliveryDelayData,
    enabled: !!summary,
  });

  const { data: sellerShipping } = useQuery({
    queryKey: ['sellerShipping'],
    queryFn: getSellerShippingData,
    enabled: !!summary,
  });

  const { data: shippingCost } = useQuery({
    queryKey: ['shippingCost'],
    queryFn: getShippingCostCategoryData,
    enabled: !!summary,
  });

  if (loadingSummary) {
    return <Spin tip="Đang tải dữ liệu tổng quan..." size="large" />;
  }

  if (isError) {
    return <p className="text-red-500">❌ Không thể tải dữ liệu phân tích.</p>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Tổng quan dữ liệu */}
      <Card>
        <h2 className="text-xl font-semibold mb-2">Tổng quan dữ liệu</h2>
        <ul className="list-disc list-inside">
          <li>Số tháng có đơn hàng: {Object.keys(summary.data.orders_by_month || {}).length}</li>
          <li>Tỷ lệ giao trễ: {summary.data.delivery_delay_rate}%</li>
          <li>Số danh mục phổ biến: {Object.keys(summary.data.top_categories || {}).length}</li>
        </ul>
      </Card>

      {/* Tabs hiển thị biểu đồ hoặc dữ liệu thô */}
      <Tabs activeKey={activeTab} onChange={(key) => setActiveTab(key)} type="card">
        <Tabs.TabPane tab="Biểu đồ" key="charts">
          <div className="space-y-6">
            <MonthlyOrdersChart data={monthlyOrders?.data} />
            <TopCategoriesChart data={topCategories?.data} />
            <DeliveryDelayChart data={deliveryDelay?.data?.data} />
            <SellerShippingChart data={sellerShipping?.data} />
            <ShippingCostChart data={shippingCost?.data} />
          </div>
        </Tabs.TabPane>
        <Tabs.TabPane tab="Dữ liệu thô" key="raw">
          <pre>{JSON.stringify(summary.data, null, 2)}</pre>
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

export default Analysis;
