import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// 👉 Tạo instance axios có timeout mặc định + baseURL
const api = axios.create({
  baseURL: API_URL,
  timeout:30000, // ✅ timeout 10 giây
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Interceptor để xử lý lỗi tập trung
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 👉 Có thể log, toast, hoặc xử lý lỗi ở đây
    console.error('API Error:', error);

    // Nếu lỗi có response từ server
    if (error.response) {
      const { status, data } = error.response;
      console.warn(`❌ ${status}: ${data?.message || data}`);
      alert(`Lỗi ${status}: ${data?.message || 'Đã xảy ra lỗi từ server'}`);
    } else if (error.code === 'ECONNABORTED') {
      alert('⏱️ Request timeout! Vui lòng thử lại sau.');
    } else {
      alert('⚠️ Không thể kết nối đến server.');
    }

    return Promise.reject(error);
  }
);

// === API định nghĩa ===
export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);

  return api.post('/upload/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getEdaSummary = () => api.get('/analyze/summary');

export const getMonthlyOrdersData = () => api.get('/analyze/chart/monthly-orders');
export const getTopCategoriesData = () => api.get('/analyze/chart/top-categories');
export const getDeliveryDelayData = () => api.get('/analyze/chart/delivery-delay');
export const getSellerShippingData = () => api.get('/analyze/chart/seller-shipping');
export const getShippingCostCategoryData = () => api.get('/analyze/chart/shipping-cost-category');

export const getDemandForecast = () => api.get('/forecast/demand');

export const getReorderStrategy = () => api.get('/reorder/strategy');
export const getTopReorderPoints = () => api.get('/reorder/charts/top-reorder');
export const getTopSafetyStock = () => api.get('/reorder/charts/top-safety-stock');
export const getTopLeadTime = () => api.get('/reorder/charts/top-lead-time');
export const getTopOptimalInventory = () => api.get('/reorder/charts/top-inventory');
export const getTopHoldingCost = () => api.get('/reorder/charts/top-holding-cost');

export default api;
