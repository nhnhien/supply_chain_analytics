import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const MonthlyOrdersChart = ({ data }) => {
    console.log("MonthlyOrdersChart data:", data); // ✅ debug

  if (!data || data.length === 0) return null;

  return (
    <div className="chart-container">
      <h3 className="chart-title">Số lượng đơn hàng theo tháng</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              angle={-45}
              textAnchor="end"
              height={60}
              tick={{ fontSize: 12 }}
            />
            <YAxis />
            <Tooltip
              formatter={(value) => [`${value.toLocaleString('vi-VN')} đơn`, 'Số lượng']}
              labelFormatter={(label) => `Tháng: ${label}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              name="Số đơn hàng"
              stroke="#0ea5e9"
              activeDot={{ r: 8 }}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MonthlyOrdersChart;
