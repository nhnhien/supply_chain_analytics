import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDemandForecast } from '../api';
import { Card, Spin } from 'antd';
import Layout from '../components/common/Layout';
import ForecastChart from '../components/charts/ForecastChart';

const Forecast = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['demandForecast'],
    queryFn: getDemandForecast,
  });

  if (isLoading) {
    return (
      <Layout>
        <Spin tip="Đang tải dự báo nhu cầu..." size="large" />
      </Layout>
    );
  }
  
  if (isError) {
    return (
      <Layout>
        <p className="text-red-500">❌ Không thể tải dữ liệu dự báo.</p>
      </Layout>
    );
  }

  // Truy cập đúng cấu trúc dữ liệu từ API response
  const chartData = data?.data?.chart_data || [];
  const forecastTable = data?.data?.forecast_table || [];

  return (
    <Layout>
      <div className="p-6">
        <Card>
          <h2 className="text-xl font-semibold mb-4">Biểu đồ dự báo nhu cầu</h2>
          <ForecastChart data={chartData} forecastTable={forecastTable} />
        </Card>
      </div>
    </Layout>
  );
};

export default Forecast;