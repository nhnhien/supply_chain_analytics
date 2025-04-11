// src/context/AppContext.jsx
import React, { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [reorderData, setReorderData] = useState(null);
  
  // Xử lý lỗi chung
  const handleError = (error) => {
    console.error('Error:', error);
    setError(error.response?.data?.error || error.message || 'Đã xảy ra lỗi, vui lòng thử lại sau');
    setLoading(false);
  };
  
  // Xóa thông báo lỗi
  const clearError = () => setError(null);
  
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
    forecastData,
    setForecastData,
    reorderData,
    setReorderData
  };
  
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => useContext(AppContext);

export default AppContext;