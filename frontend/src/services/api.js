import axios from "axios"

// Cấu hình axios với timeout dài hơn
const api = axios.create({
  baseURL: "http://localhost:8000", // Thay đổi URL này theo địa chỉ backend của bạn
  timeout: 60000, // Tăng timeout từ 30s lên 60s
  headers: {
    "Content-Type": "application/json",
  },
})

// Thêm hàm retry cho các API calls
const withRetry = async (apiCall, maxRetries = 5, delay = 2000) => {
  let lastError

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiCall()
    } catch (error) {
      console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`)
      lastError = error
      await new Promise((resolve) => setTimeout(resolve, delay))
      // Tăng thời gian chờ giữa các lần retry
      delay = delay * 1.5
    }
  }

  throw lastError
}

// Thêm caching cho các API calls
const withCache = (apiCall, cacheKey, expireTime = 3600000) => {
  return async () => {
    // Kiểm tra xem có dữ liệu trong cache không
    const cachedData = localStorage.getItem(cacheKey)
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData)
      // Kiểm tra xem cache có hết hạn chưa
      if (Date.now() - timestamp < expireTime) {
        console.log(`Using cached data for ${cacheKey}`)
        return { data }
      }
    }

    // Nếu không có cache hoặc cache đã hết hạn, gọi API
    const response = await apiCall()

    // Lưu kết quả vào cache
    localStorage.setItem(
      cacheKey,
      JSON.stringify({
        data: response.data,
        timestamp: Date.now(),
      }),
    )

    return response
  }
}

// API cho phân tích dữ liệu với retry và cache
export const getAnalysisSummary = () => withRetry(withCache(() => api.get("/analyze/summary"), "analysisSummary"))
export const getMonthlyOrdersChart = () =>
  withRetry(withCache(() => api.get("/analyze/chart/monthly-orders"), "monthlyOrdersChart"))
export const getTopCategoriesChart = () =>
  withRetry(withCache(() => api.get("/analyze/chart/top-categories"), "topCategoriesChart"))
export const getDeliveryDelayChart = () =>
  withRetry(withCache(() => api.get("/analyze/chart/delivery-delay"), "deliveryDelayChart"))
export const getSellerShippingChart = () =>
  withRetry(withCache(() => api.get("/analyze/chart/seller-shipping"), "sellerShippingChart"))
export const getShippingCostCategoryChart = () =>
  withRetry(withCache(() => api.get("/analyze/chart/shipping-cost-category"), "shippingCostCategoryChart"))

// API cho dự báo với retry và cache
export const getDemandForecast = () => withRetry(withCache(() => api.get("/forecast/demand"), "demandForecast"))

// API cho chiến lược tồn kho với retry và cache
export const getReorderStrategy = () => withRetry(withCache(() => api.get("/reorder/strategy"), "reorderStrategy"))
export const getTopReorderPoints = () =>
  withRetry(withCache(() => api.get("/reorder/charts/top-reorder"), "topReorderPoints"))
export const getTopSafetyStock = () =>
  withRetry(withCache(() => api.get("/reorder/charts/top-safety-stock"), "topSafetyStock"))
export const getTopLeadTime = () => withRetry(withCache(() => api.get("/reorder/charts/top-lead-time"), "topLeadTime"))
export const getTopInventory = () =>
  withRetry(withCache(() => api.get("/reorder/charts/top-inventory"), "topInventory"))
export const getTopHoldingCost = () =>
  withRetry(withCache(() => api.get("/reorder/charts/top-holding-cost"), "topHoldingCost"))

// Hàm để xóa tất cả cache khi cần thiết
export const clearAllCache = () => {
  const cacheKeys = [
    "analysisSummary",
    "monthlyOrdersChart",
    "topCategoriesChart",
    "deliveryDelayChart",
    "sellerShippingChart",
    "shippingCostCategoryChart",
    "demandForecast",
    "reorderStrategy",
    "topReorderPoints",
    "topSafetyStock",
    "topLeadTime",
    "topInventory",
    "topHoldingCost",
    "uploadedFiles",
    "dataLoaded",
  ]

  cacheKeys.forEach((key) => localStorage.removeItem(key))
}

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

// Lưu thông tin về file đã upload
export const saveUploadedFiles = (files) => {
  const fileInfos = files.map((file) => ({
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    uploadedAt: Date.now(),
  }))

  localStorage.setItem("uploadedFiles", JSON.stringify(fileInfos))
}

// Lấy thông tin về file đã upload
export const getUploadedFiles = () => {
  const savedFiles = localStorage.getItem("uploadedFiles")
  return savedFiles ? JSON.parse(savedFiles) : []
}

// Kiểm tra xem dữ liệu đã được tải trước đó chưa
export const isDataLoaded = () => {
  return localStorage.getItem("dataLoaded") === "true"
}

// Đánh dấu dữ liệu đã được tải
export const markDataAsLoaded = () => {
  localStorage.setItem("dataLoaded", "true")
}

// Tải trước tất cả dữ liệu sau khi upload
export const preloadAllData = async () => {
  try {
    // Tạo một mảng các promises cho tất cả các API calls
    const promises = [
      getAnalysisSummary(),
      getMonthlyOrdersChart(),
      getTopCategoriesChart(),
      getDeliveryDelayChart(),
      getSellerShippingChart(),
      getShippingCostCategoryChart(),
      getDemandForecast(),
      getReorderStrategy(),
      getTopReorderPoints(),
      getTopSafetyStock(),
      getTopLeadTime(),
      getTopInventory(),
      getTopHoldingCost(),
    ]

    // Chạy tất cả các API calls song song
    await Promise.allSettled(promises)

    // Đánh dấu dữ liệu đã được tải
    markDataAsLoaded()

    return true
  } catch (error) {
    console.error("Error preloading data:", error)
    return false
  }
}

export default api
