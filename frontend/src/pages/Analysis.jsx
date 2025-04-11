// src/pages/Analysis.jsx
import React, { useEffect, useState } from 'react';
import Layout from '../components/common/Layout';
import { useApp } from '../context/AppContext';
import {
  getEdaSummary,
  getMonthlyOrdersChart,
  getTopCategoriesChart,
  getDeliveryDelayChart,
  getSellerShippingChart,
  getShippingCostCategoryChart
} from '../api';

const Analysis = () => {
  const { loading, setLoading, handleError, fileUploaded } = useApp();
  const [charts, setCharts] = useState({});
  const [summary, setSummary] = useState(null);
  const [activeTab, setActiveTab] = useState('charts');

  useEffect(() => {
    const fetchData = async () => {
      if (!fileUploaded) return;
      
      setLoading(true);
      try {
        // Lấy dữ liệu tổng quan
        const summaryRes = await getEdaSummary();
        setSummary(summaryRes.data);
        
        // Lấy các biểu đồ
        const [
          monthlyOrdersRes, 
          topCategoriesRes, 
          deliveryDelayRes, 
          sellerShippingRes, 
          shippingCostCategoryRes
        ] = await Promise.all([
          getMonthlyOrdersChart(),
          getTopCategoriesChart(),
          getDeliveryDelayChart(),
          getSellerShippingChart(),
          getShippingCostCategoryChart()
        ]);
        
        setCharts({
          monthlyOrders: monthlyOrdersRes.data.chart,
          topCategories: topCategoriesRes.data.chart,
          deliveryDelay: deliveryDelayRes.data.chart,
          sellerShipping: sellerShippingRes.data.chart,
          shippingCostCategory: shippingCostCategoryRes.data.chart
        });
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fileUploaded]);

  // Hiển thị tab phân tích biểu đồ
  const renderChartsTab = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(charts).map(([key, base64Data]) => {
          let title = '';
          switch (key) {
            case 'monthlyOrders':
              title = 'Số lượng đơn hàng theo tháng';
              break;
            case 'topCategories':
              title = 'Top 10 danh mục sản phẩm phổ biến';
              break;
            case 'deliveryDelay':
              title = 'Tỷ lệ đơn hàng giao trễ';
              break;
            case 'sellerShipping':
              title = 'Thời gian giao hàng trung bình (Top 10 seller)';
              break;
            case 'shippingCostCategory':
              title = 'Chi phí vận chuyển trung bình theo danh mục';
              break;
            default:
              title = 'Biểu đồ';
          }
          
          return (
            <div key={key} className="chart-container">
              <h3 className="chart-title">{title}</h3>
              <img 
                src={`data:image/png;base64,${base64Data}`} 
                alt={title}
                className="w-full"
              />
            </div>
          );
        })}
      </div>
    );
  };

  // Hiển thị tab dữ liệu
  const renderDataTab = () => {
    if (!summary) return null;
    
    return (
      <div className="space-y-8">
        {/* Dữ liệu đơn hàng theo tháng */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Đơn hàng theo tháng</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tháng
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số lượng đơn
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(summary.orders_by_month || {}).map(([month, count]) => (
                  <tr key={month}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {month}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Top 10 danh mục sản phẩm */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Top 10 danh mục sản phẩm</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Danh mục
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số lượng
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(summary.top_categories || {}).map(([category, count]) => (
                  <tr key={category}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Thông tin chi phí vận chuyển */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Chi phí vận chuyển theo danh mục</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Danh mục
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chi phí trung bình (VND)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(summary.avg_shipping_cost_by_category || {}).map(([category, cost]) => (
                  <tr key={category}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cost.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Phân tích dữ liệu</h1>
      
      {!fileUploaded ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Vui lòng tải lên dữ liệu trước khi sử dụng phân tích.
                <a href="/upload" className="font-medium underline text-yellow-700 hover:text-yellow-600 ml-1">
                  Tải lên ngay
                </a>
              </p>
            </div>
          </div>
        </div>
      ) : loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Đang tải dữ liệu...</p>
        </div>
      ) : (
        <>
          {/* Tab navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('charts')}
                className={`${
                  activeTab === 'charts'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Biểu đồ
              </button>
              <button
                onClick={() => setActiveTab('data')}
                className={`${
                  activeTab === 'data'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Dữ liệu chi tiết
              </button>
            </nav>
          </div>
          
          {/* Tab content */}
          <div className="tab-content">
            {activeTab === 'charts' ? renderChartsTab() : renderDataTab()}
          </div>
        </>
      )}
    </Layout>
  );
};

export default Analysis;
