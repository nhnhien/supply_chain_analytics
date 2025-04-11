// src/api/index.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API Upload file
export const uploadFile = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post('/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  };

// API lấy tổng quan phân tích
export const getEdaSummary = () => api.get('/analyze/summary');

// API lấy các biểu đồ phân tích
export const getMonthlyOrdersChart = () => api.get('/analyze/chart/monthly-orders');
export const getTopCategoriesChart = () => api.get('/analyze/chart/top-categories');
export const getDeliveryDelayChart = () => api.get('/analyze/chart/delivery-delay');
export const getSellerShippingChart = () => api.get('/analyze/chart/seller-shipping');
export const getShippingCostCategoryChart = () => api.get('/analyze/chart/shipping-cost-category');

// API dự báo
export const getDemandForecast = () => api.get('/forecast/demand');

// API kế hoạch đặt hàng
export const getReorderStrategy = () => api.get('/reorder/strategy');

export default api;