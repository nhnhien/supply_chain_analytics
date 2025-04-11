import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const ShippingCostChart = ({ data }) => {
  console.log("ShippingCostChart data:", data); // Debug dữ liệu

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="chart-container">
        <h3 className="chart-title">Chi phí vận chuyển trung bình theo danh mục</h3>
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">Không có dữ liệu để hiển thị</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <h3 className="chart-title">Chi phí vận chuyển trung bình theo danh mục</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="category" 
              angle={-45} 
              textAnchor="end" 
              height={80}
              tick={{ fontSize: 11 }}
            />
            <YAxis />
            <Tooltip 
              formatter={(value) => [`${value.toLocaleString('vi-VN')} VND`, 'Chi phí']}
            />
            <Legend />
            <Bar 
              dataKey="cost" 
              name="Chi phí vận chuyển" 
              fill="#a855f7" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ShippingCostChart;