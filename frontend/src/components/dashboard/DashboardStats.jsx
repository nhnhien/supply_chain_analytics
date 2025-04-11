// src/components/dashboard/DashboardStats.jsx
import React from 'react';

const DashboardStats = ({ data }) => {
  if (!data) return null;

  const { 
    orders_by_month = {}, 
    top_categories = {}, 
    delivery_delay_rate = 0, 
    avg_shipping_duration_by_seller = {},
    avg_shipping_cost_by_category = {} 
  } = data;

  // Tính tổng đơn hàng
  const totalOrders = Object.values(orders_by_month).reduce((sum, count) => sum + count, 0);
  
  // Tính số lượng sản phẩm theo danh mục
  const totalProducts = Object.values(top_categories).reduce((sum, count) => sum + count, 0);
  
  // Lấy chi phí vận chuyển trung bình cao nhất
  const maxShippingCost = Math.max(...Object.values(avg_shipping_cost_by_category));
  
  // Lấy thời gian giao hàng trung bình ngắn nhất
  const minShippingDuration = Math.min(...Object.values(avg_shipping_duration_by_seller));

  const stats = [
    {
      label: 'Tổng đơn hàng',
      value: totalOrders.toLocaleString('vi-VN'),
    },
    {
      label: 'Tỷ lệ giao trễ',
      value: `${delivery_delay_rate}%`,
    },
    {
      label: 'Số lượng sản phẩm',
      value: totalProducts.toLocaleString('vi-VN'),
    },
    {
      label: 'Chi phí vận chuyển cao nhất',
      value: `${maxShippingCost.toLocaleString('vi-VN')} VND`,
    },
    {
      label: 'Thời gian giao hàng nhanh nhất',
      value: `${minShippingDuration.toFixed(1)} ngày`,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
      {stats.map((stat, index) => (
        <div key={index} className="dashboard-card">
          <div className="dashboard-card-title">{stat.label}</div>
          <div className="dashboard-card-value">{stat.value}</div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;

