import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const TopCategoriesChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="chart-container">
      <h3 className="chart-title">Top 10 danh mục sản phẩm phổ biến</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis 
              dataKey="category" 
              type="category" 
              tick={{ fontSize: 12 }}
              width={100}
            />
            <Tooltip
              formatter={(value) => [`${value.toLocaleString('vi-VN')}`, 'Số lượng']}
            />
            <Legend />
            <Bar 
              dataKey="value" 
              name="Số lượng sản phẩm" 
              fill="#60a5fa" 
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TopCategoriesChart;
