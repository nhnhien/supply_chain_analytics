// src/pages/Forecast.jsx
import React, { useEffect } from 'react';
import Layout from '../components/common/Layout';
import ForecastResults from '../components/forecast/ForecastResults';
import { useApp } from '../context/AppContext';
import { getDemandForecast } from '../api';

const Forecast = () => {
  const { loading, setLoading, handleError, fileUploaded, forecastData, setForecastData } = useApp();

  useEffect(() => {
    const fetchForecastData = async () => {
      if (!fileUploaded) return;
      
      setLoading(true);
      try {
        const response = await getDemandForecast();
        setForecastData(response.data);
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchForecastData();
  }, [fileUploaded]);

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Dự báo nhu cầu</h1>
      
      {!fileUploaded ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Vui lòng tải lên dữ liệu trước khi sử dụng dự báo.
                <a href="/upload" className="font-medium underline text-yellow-700 hover:text-yellow-600 ml-1">
                  Tải lên ngay
                </a>
              </p>
            </div>
          </div>
        </div>
      ) : loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Đang tính toán dự báo...</p>
        </div>
      ) : (
        <>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Dự báo được tính toán dựa trên phương pháp ARIMA và dữ liệu đơn hàng theo thời gian. Dự báo có thể thay đổi khi có thêm dữ liệu mới.
                </p>
              </div>
            </div>
          </div>
          
          <ForecastResults forecastData={forecastData} />
        </>
      )}
    </Layout>
  );
};

export default Forecast;