// src/pages/Dashboard.jsx
import React, { useEffect } from 'react';
import Layout from '../components/common/Layout';
import DashboardStats from '../components/dashboard/DashboardStats';
import { useApp } from '../context/AppContext';
import { getEdaSummary, getMonthlyOrdersChart, getDeliveryDelayChart } from '../api';

const Dashboard = () => {
  const { loading, setLoading, handleError, dashboardData, setDashboardData, fileUploaded } = useApp();

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const summary = await getEdaSummary();
        const monthlyChart = await getMonthlyOrdersChart();
        const delayChart = await getDeliveryDelayChart();
        
        setDashboardData({
          ...summary.data,
          monthlyChart: monthlyChart.data.chart,
          delayChart: delayChart.data.chart
        });
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    };

    if (fileUploaded) {
      fetchDashboardData();
    }
  }, [fileUploaded]);

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Bảng điều khiển</h1>
      
      {!fileUploaded ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Vui lòng tải lên dữ liệu trước khi sử dụng bảng điều khiển.
                <a href="/upload" className="font-medium underline text-yellow-700 hover:text-yellow-600">
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
          <DashboardStats data={dashboardData} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {dashboardData?.monthlyChart && (
              <div className="chart-container">
                <h3 className="chart-title">Số lượng đơn hàng theo tháng</h3>
                <img 
                  src={`data:image/png;base64,${dashboardData.monthlyChart}`} 
                  alt="Monthly Orders Chart" 
                  className="w-full"
                />
              </div>
            )}
            
            {dashboardData?.delayChart && (
              <div className="chart-container">
                <h3 className="chart-title">Tỷ lệ đơn hàng giao trễ</h3>
                <img 
                  src={`data:image/png;base64,${dashboardData.delayChart}`} 
                  alt="Delivery Delay Chart" 
                  className="w-full"
                />
              </div>
            )}
          </div>
        </>
      )}
    </Layout>
  );
};

export default Dashboard;