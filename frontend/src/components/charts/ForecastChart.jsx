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

const ForecastChart = ({ data, forecastTable }) => {
  console.log("ForecastChart data:", data);
  console.log("ForecastChart table:", forecastTable);

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="chart-container">
        <h3 className="chart-title">Dự báo số đơn hàng theo tháng</h3>
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">Không có dữ liệu dự báo</p>
        </div>
      </div>
    );
  }

  const calculateStats = () => {
    if (!forecastTable || !Array.isArray(forecastTable) || forecastTable.length === 0) return null;

    const maxForecast = forecastTable.reduce((max, item) =>
      item.predicted_orders > max.predicted_orders ? item : max, forecastTable[0]
    );

    const minForecast = forecastTable.reduce((min, item) =>
      item.predicted_orders < min.predicted_orders ? item : min, forecastTable[0]
    );

    const avgForecast = Math.round(
      forecastTable.reduce((sum, item) => sum + item.predicted_orders, 0) / forecastTable.length
    );

    return { maxForecast, minForecast, avgForecast };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-8">
      <div className="chart-container">
        <h3 className="chart-title">Dự báo số đơn hàng theo tháng</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                formatter={(value, name, props) => [
                  `${value.toLocaleString('vi-VN')} đơn`,
                  props.payload.type
                ]}
                labelFormatter={(label) => `Tháng: ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#0ea5e9"
                strokeWidth={2}
                name="Đơn hàng"
                connectNulls
                dot={(props) => {
                  const payload = props.payload;
                  return payload.type === 'Thực tế' ? (
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={4}
                      fill="#0ea5e9"
                      stroke="white"
                      strokeWidth={1}
                    />
                  ) : (
                    <rect
                      x={props.cx - 4}
                      y={props.cy - 4}
                      width={8}
                      height={8}
                      fill="#f97316"
                      stroke="white"
                      strokeWidth={1}
                    />
                  );
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {forecastTable && forecastTable.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium mb-4">Bảng dự báo 6 tháng tới</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tháng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dự báo số đơn hàng
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {forecastTable.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.month}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.predicted_orders.toLocaleString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Tháng có dự báo cao nhất</p>
            <p className="text-xl font-semibold">{stats.maxForecast.month}</p>
            <p className="text-sm text-primary-600">
              {stats.maxForecast.predicted_orders.toLocaleString('vi-VN')} đơn
            </p>
          </div>

          <div className="bg-white p-4 rounded shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Tháng có dự báo thấp nhất</p>
            <p className="text-xl font-semibold">{stats.minForecast.month}</p>
            <p className="text-sm text-primary-600">
              {stats.minForecast.predicted_orders.toLocaleString('vi-VN')} đơn
            </p>
          </div>

          <div className="bg-white p-4 rounded shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Dự báo trung bình</p>
            <p className="text-xl font-semibold">
              {stats.avgForecast.toLocaleString('vi-VN')} đơn
            </p>
            <p className="text-sm text-primary-600">Cho 6 tháng tới</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForecastChart;