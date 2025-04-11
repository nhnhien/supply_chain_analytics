import React from 'react';

const DashboardStats = ({ data }) => {
  if (!data) return null;

  const {
    orders_by_month = {},
    top_categories = {},
    delivery_delay_rate = 0,
    avg_shipping_duration_by_seller = {},
    avg_shipping_cost_by_category = {},
  } = data;

  // Tính toán tổng hợp
  const totalOrders = Object.values(orders_by_month).reduce((sum, count) => sum + count, 0);
  const totalProducts = Object.values(top_categories).reduce((sum, count) => sum + count, 0);

  const maxShippingCost = Object.values(avg_shipping_cost_by_category).length > 0
    ? Math.max(...Object.values(avg_shipping_cost_by_category))
    : 0;

  const minShippingDuration = Object.values(avg_shipping_duration_by_seller).length > 0
    ? Math.min(...Object.values(avg_shipping_duration_by_seller))
    : 0;

  const stats = [
    {
      label: 'Tổng đơn hàng',
      value: totalOrders.toLocaleString('vi-VN'),
    },
    {
      label: 'Tỷ lệ giao trễ',
      value: `${delivery_delay_rate.toFixed(1)}%`,
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
        <div
          key={index}
          className="bg-white p-4 rounded-lg shadow text-center border border-gray-100 hover:shadow-md transition"
        >
          <div className="text-sm text-gray-500 mb-1">{stat.label}</div>
          <div className="text-xl font-semibold text-gray-800">{stat.value}</div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;
