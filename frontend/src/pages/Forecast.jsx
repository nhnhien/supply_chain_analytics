import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDemandForecast } from '@/api';
import { Card, Spin } from 'antd';
import ForecastChart from '@/components/charts/ForecastChart';

const Forecast = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['demandForecast'],
    queryFn: getDemandForecast,
  });

  if (isLoading) return <Spin tip="Đang tải dự báo nhu cầu..." size="large" />;
  if (isError) return <p className="text-red-500">❌ Không thể tải dữ liệu dự báo.</p>;

  const chartData = data?.chart_data || [];
  const forecastTable = data?.forecast_table || [];

  return (
    <div className="p-6">
      <Card>
        <h2 className="text-xl font-semibold mb-4">Biểu đồ dự báo nhu cầu</h2>
        <ForecastChart data={chartData} table={forecastTable} />
      </Card>
    </div>
  );
};

export default Forecast;
