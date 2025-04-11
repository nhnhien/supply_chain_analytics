import axios from "axios"

// Cấu hình axios
const api = axios.create({
  baseURL: "http://localhost:8000", // Thay đổi URL này theo địa chỉ backend của bạn
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

// API cho phân tích dữ liệu
export const getAnalysisSummary = () => api.get("/analyze/summary")
export const getMonthlyOrdersChart = () => api.get("/analyze/chart/monthly-orders")
export const getTopCategoriesChart = () => api.get("/analyze/chart/top-categories")
export const getDeliveryDelayChart = () => api.get("/analyze/chart/delivery-delay")
export const getSellerShippingChart = () => api.get("/analyze/chart/seller-shipping")
export const getShippingCostCategoryChart = () => api.get("/analyze/chart/shipping-cost-category")

// API cho dự báo
export const getDemandForecast = () => api.get("/forecast/demand")

// API cho chiến lược tồn kho
export const getReorderStrategy = () => api.get("/reorder/strategy")
export const getTopReorderPoints = () => api.get("/reorder/charts/top-reorder")
export const getTopSafetyStock = () => api.get("/reorder/charts/top-safety-stock")
export const getTopLeadTime = () => api.get("/reorder/charts/top-lead-time")
export const getTopInventory = () => api.get("/reorder/charts/top-inventory")
export const getTopHoldingCost = () => api.get("/reorder/charts/top-holding-cost")

// API cho upload file
export const uploadFile = (file) => {
  const formData = new FormData()
  formData.append("file", file)

  return api.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })
}

export default api
