import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#4ade80', '#f87171']; // Xanh: đúng hạn, đỏ: trễ
const RADIAN = Math.PI / 180;

// Hiển thị label phần trăm
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={12}
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
};

const DeliveryDelayChart = ({ data }) => {
  console.log('DeliveryDelayChart data:', data); // ✅ DEBUG

  if (!Array.isArray(data) || data.length === 0) {
    return <p>Không có dữ liệu để hiển thị biểu đồ giao trễ.</p>;
  }

  const total = data.reduce((sum, item) => sum + item.count, 0);

  const chartData = data.map(item => ({
    ...item,
    value: item.count,
    percent: item.count / total,
  }));

  return (
    <div className="chart-container">
      <h3 className="chart-title">Tỷ lệ đơn hàng giao trễ</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={80}
              dataKey="value"
              nameKey="status"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [`${value.toLocaleString('vi-VN')} đơn`, name]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DeliveryDelayChart;
