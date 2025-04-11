import React, { createContext, useState, useContext, useEffect } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [chartsData, setChartsData] = useState({});
  const [forecastData, setForecastData] = useState(null);
  const [reorderData, setReorderData] = useState(null);
  
  // Kiểm tra xem đã tải lên file hay chưa khi khởi động
  useEffect(() => {
    // Kiểm tra localStorage hoặc sessionStorage nếu bạn đã lưu trạng thái
    const savedFileUploadedState = localStorage.getItem('fileUploaded');
    if (savedFileUploadedState === 'true') {
      setFileUploaded(true);
    }
  }, []);

  // Lưu trạng thái tải lên file
  useEffect(() => {
    localStorage.setItem('fileUploaded', fileUploaded);
  }, [fileUploaded]);
  
  // Xử lý lỗi chung
  const handleError = (error) => {
    console.error('Error:', error);
    const errorMessage = error.response?.data?.error || error.message || 'Đã xảy ra lỗi, vui lòng thử lại sau';
    setError(errorMessage);
    setLoading(false);
  };
  
  // Xóa thông báo lỗi
  const clearError = () => setError(null);
  
  // Xóa dữ liệu (reset)
  const clearData = () => {
    setDashboardData(null);
    setChartsData({});
    setForecastData(null);
    setReorderData(null);
    setFileUploaded(false);
    localStorage.removeItem('fileUploaded');
  };
  
  const value = {
    loading,
    setLoading,
    error,
    setError,
    handleError,
    clearError,
    fileUploaded,
    setFileUploaded,
    dashboardData,
    setDashboardData,
    chartsData,
    setChartsData,
    forecastData,
    setForecastData,
    reorderData,
    setReorderData,
    clearData
  };
  
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => useContext(AppContext);

export default AppContext;