import React from 'react';
import Layout from '../components/common/Layout';
import DashboardStats from '../components/dashboard/DashboardStats';
import { useApp } from '../context/AppContext';
import {
  getEdaSummary,
  getMonthlyOrdersData,
  getDeliveryDelayData
} from '@/api';
import { useQuery } from '@tanstack/react-query';
import MonthlyOrdersChart from '@/components/charts/MonthlyOrdersChart';
import DeliveryDelayChart from '@/components/charts/DeliveryDelayChart';

const Dashboard = () => {
  const { fileUploaded } = useApp();

  // Tổng quan EDA
  const {
    data: summary,
    isLoading: loadingSummary,
    isError: summaryError,
  } = useQuery({
    queryKey: ['edaSummary'],
    queryFn: getEdaSummary,
    enabled: fileUploaded,
  });

  // Biểu đồ đơn hàng theo tháng
  const {
    data: monthlyChart,
    isLoading: loadingMonthly,
  } = useQuery({
    queryKey: ['monthlyOrdersChart'],
    queryFn: getMonthlyOrdersData,
    enabled: !!summary,
  });

  // Biểu đồ tỷ lệ giao trễ
  const {
    data: deliveryDelayChart,
    isLoading: loadingDelay,
  } = useQuery({
    queryKey: ['deliveryDelayChart'],
    queryFn: getDeliveryDelayData,
    enabled: !!summary,
  });

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Bảng điều khiển</h1>

      {!fileUploaded ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="text-sm text-yellow-700">
            Vui lòng tải lên dữ liệu trước khi sử dụng bảng điều khiển.
            <a href="/upload" className="font-medium underline ml-1 text-yellow-700 hover:text-yellow-600">
              Tải lên ngay
            </a>
          </p>
        </div>
      ) : loadingSummary ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Đang tải dữ liệu tổng quan...</p>
        </div>
      ) : summaryError ? (
        <p className="text-red-500">❌ Lỗi tải dữ liệu tổng quan.</p>
      ) : (
        <>
          {/* Tổng quan thống kê */}
          <DashboardStats data={summary.data} />

          {/* Biểu đồ Recharts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              {loadingMonthly ? (
                <div className="h-64 flex justify-center items-center text-gray-400">Đang tải biểu đồ đơn hàng...</div>
              ) : (
                <MonthlyOrdersChart data={monthlyChart?.data} />
              )}
            </div>

            <div>
              {loadingDelay ? (
                <div className="h-64 flex justify-center items-center text-gray-400">Đang tải biểu đồ giao trễ...</div>
              ) : (
                <DeliveryDelayChart data={deliveryDelayChart?.data} />
              )}
            </div>
          </div>
        </>
      )}
    </Layout>
  );
};

export default Dashboard;
