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

const SellerShippingChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="chart-container">
      <h3 className="chart-title">Thời gian giao hàng trung bình (Top 10 seller)</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 90, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" unit=" ngày" />
            <YAxis
              type="category"
              dataKey="seller"
              tick={{ fontSize: 12 }}
              width={90}
            />
            <Tooltip
              formatter={(value) => [`${value} ngày`, 'Thời gian giao hàng']}
            />
            <Legend />
            <Bar
              dataKey="value"
              name="Thời gian giao hàng"
              fill="#f97316"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SellerShippingChart;
