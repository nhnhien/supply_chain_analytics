// src/components/reorder/ReorderStrategy.jsx
import React, { useState } from 'react';

const ReorderStrategy = ({ reorderData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'reorder_point', direction: 'desc' });

  if (!reorderData || !reorderData.length) return null;

  // Sắp xếp dữ liệu
  const sortedData = [...reorderData].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Tìm kiếm dữ liệu
  const filteredData = sortedData.filter(item => 
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Hàm để thay đổi tiêu chí sắp xếp
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Hiển thị biểu tượng sắp xếp
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? '▲' : '▼';
  };

  return (
    <div className="space-y-6">
      {/* Tìm kiếm */}
      <div className="mb-4">
        <label htmlFor="search" className="sr-only">Tìm kiếm</label>
        <input
          id="search"
          type="text"
          placeholder="Tìm kiếm theo danh mục sản phẩm..."
          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Bảng kế hoạch đặt hàng */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('category')}
              >
                Danh mục {getSortIcon('category')}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('reorder_point')}
              >
                Điểm đặt hàng {getSortIcon('reorder_point')}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('safety_stock')}
              >
                Safety Stock {getSortIcon('safety_stock')}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('optimal_inventory')}
              >
                Tồn kho tối ưu {getSortIcon('optimal_inventory')}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('avg_lead_time_days')}
              >
                Lead Time (ngày) {getSortIcon('avg_lead_time_days')}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('holding_cost')}
              >
                Chi phí lưu kho {getSortIcon('holding_cost')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.reorder_point}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.safety_stock}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.optimal_inventory}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.avg_lead_time_days.toFixed(1)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.holding_cost.toLocaleString('vi-VN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Thống kê */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Danh mục có ROP cao nhất</p>
          {reorderData.length > 0 && (
            <>
              <p className="text-xl font-semibold">
                {reorderData.reduce((max, item) => 
                  item.reorder_point > max.reorder_point ? item : max
                ).category}
              </p>
              <p className="text-sm text-primary-600">
                ROP: {reorderData.reduce((max, item) => 
                  item.reorder_point > max.reorder_point ? item : max
                ).reorder_point.toLocaleString('vi-VN')}
              </p>
            </>
          )}
        </div>
        
        <div className="bg-white p-4 rounded shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Danh mục có Lead Time dài nhất</p>
          {reorderData.length > 0 && (
            <>
              <p className="text-xl font-semibold">
                {reorderData.reduce((max, item) => 
                  item.avg_lead_time_days > max.avg_lead_time_days ? item : max
                ).category}
              </p>
              <p className="text-sm text-primary-600">
                {reorderData.reduce((max, item) => 
                  item.avg_lead_time_days > max.avg_lead_time_days ? item : max
                ).avg_lead_time_days.toFixed(1)} ngày
              </p>
            </>
          )}
        </div>
        
        <div className="bg-white p-4 rounded shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Chi phí lưu kho cao nhất</p>
          {reorderData.length > 0 && (
            <>
              <p className="text-xl font-semibold">
                {reorderData.reduce((max, item) => 
                  item.holding_cost > max.holding_cost ? item : max
                ).category}
              </p>
              <p className="text-sm text-primary-600">
                {reorderData.reduce((max, item) => 
                  item.holding_cost > max.holding_cost ? item : max
                ).holding_cost.toLocaleString('vi-VN')} VND
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReorderStrategy;

