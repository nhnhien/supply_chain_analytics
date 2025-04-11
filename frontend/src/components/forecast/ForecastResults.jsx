// src/components/forecast/ForecastResults.jsx
import React from 'react';

const ForecastResults = ({ forecastData }) => {
  if (!forecastData) return null;
  
  const { forecast_table = [], chart = '' } = forecastData;
  
  return (
    <div className="space-y-8">
      {/* Biểu đồ dự báo */}
      <div className="chart-container">
        <h3 className="chart-title">Dự báo số đơn hàng theo tháng</h3>
        <img 
          src={`data:image/png;base64,${chart}`} 
          alt="Forecast Chart"
          className="w-full"
        />
      </div>
      
      {/* Bảng dự báo */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium mb-4">Bảng dự báo 6 tháng tới</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tháng
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dự báo số đơn hàng
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {forecast_table.map((item, index) => (
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
      
      {/* Thống kê dự báo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Tháng có dự báo cao nhất</p>
          {forecast_table.length > 0 && (
            <>
              <p className="text-xl font-semibold">
                {forecast_table.reduce((max, item) => 
                  item.predicted_orders > max.predicted_orders ? item : max
                ).month}
              </p>
              <p className="text-sm text-primary-600">
                {forecast_table.reduce((max, item) => 
                  item.predicted_orders > max.predicted_orders ? item : max
                ).predicted_orders.toLocaleString('vi-VN')} đơn
              </p>
            </>
          )}
        </div>
        
        <div className="bg-white p-4 rounded shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Tháng có dự báo thấp nhất</p>
          {forecast_table.length > 0 && (
            <>
              <p className="text-xl font-semibold">
                {forecast_table.reduce((min, item) => 
                  item.predicted_orders < min.predicted_orders ? item : min
                ).month}
              </p>
              <p className="text-sm text-primary-600">
                {forecast_table.reduce((min, item) => 
                  item.predicted_orders < min.predicted_orders ? item : min
                ).predicted_orders.toLocaleString('vi-VN')} đơn
              </p>
            </>
          )}
        </div>
        
        <div className="bg-white p-4 rounded shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Dự báo trung bình</p>
          {forecast_table.length > 0 && (
            <>
              <p className="text-xl font-semibold">
                {Math.round(forecast_table.reduce((sum, item) => 
                  sum + item.predicted_orders, 0
                ) / forecast_table.length).toLocaleString('vi-VN')} đơn
              </p>
              <p className="text-sm text-primary-600">
                Cho 6 tháng tới
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForecastResults;

