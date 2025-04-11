import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';

const Chart = ({ title, data, color, yAxisWidth = 100 }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="chart-container">
      <h3 className="chart-title">{title}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: yAxisWidth, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis
              dataKey="category"
              type="category"
              tick={{ fontSize: 11 }}
              width={yAxisWidth}
            />
            <Tooltip formatter={(value) => [value.toLocaleString('vi-VN'), '']} />
            <Legend />
            <Bar
              dataKey="value"
              name={title}
              fill={color}
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const ReorderCharts = ({
  reorderPoints = [],
  safetyStock = [],
  leadTime = [],
  optimalInventory = [],
  holdingCost = [],
}) => {
  return (
    <div className="space-y-8">
      <h2 className="text-xl font-medium">Biểu đồ phân tích</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Chart
          title="Top 10 danh mục có Reorder Point cao nhất"
          data={reorderPoints}
          color="#0ea5e9"
          yAxisWidth={120}
        />

        <Chart
          title="Top 10 danh mục có Safety Stock cao nhất"
          data={safetyStock}
          color="#f97316"
          yAxisWidth={120}
        />

        <Chart
          title="Top 10 danh mục có Lead Time dài nhất (ngày)"
          data={leadTime}
          color="#10b981"
          yAxisWidth={120}
        />

        <Chart
          title="Top 10 danh mục có Optimal Inventory cao nhất"
          data={optimalInventory}
          color="#8b5cf6"
          yAxisWidth={120}
        />
      </div>

      <Chart
        title="Top 10 danh mục có Holding Cost cao nhất"
        data={holdingCost}
        color="#ef4444"
        yAxisWidth={120}
      />
    </div>
  );
};

export default ReorderCharts;
