"use client"

import { useState, useEffect } from "react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer,
} from "recharts"
import {
  getMonthlyOrdersChart,
  getTopCategoriesChart,
  getDeliveryDelayChart,
  getSellerShippingChart,
  getShippingCostCategoryChart,
  getUploadedFiles,
} from "../services/api"
import LoadingSpinner from "../components/LoadingSpinner"
import ErrorMessage from "../components/ErrorMessage"
import { useNavigate } from "react-router-dom"
import "./Analysis.css"
import { formatVND } from "../utils/currency"

const Analysis = () => {
  const [monthlyOrders, setMonthlyOrders] = useState([])
  const [topCategories, setTopCategories] = useState([])
  const [deliveryDelay, setDeliveryDelay] = useState([])
  const [sellerShipping, setSellerShipping] = useState([])
  const [shippingCost, setShippingCost] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const navigate = useNavigate()

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

  useEffect(() => {
    const fetchAnalysisData = async () => {
      try {
        // Kiểm tra xem đã có file được upload chưa
        const uploadedFiles = getUploadedFiles()
        if (uploadedFiles.length === 0) {
          // Nếu chưa có file nào được upload, chuyển hướng đến trang upload
          navigate("/upload")
          return
        }

        setLoading(true)
        setError(null)

        // Tải dữ liệu theo từng phần để tránh timeout
        try {
          const monthlyOrdersRes = await getMonthlyOrdersChart()
          setMonthlyOrders(monthlyOrdersRes.data.data)
        } catch (err) {
          console.error("Error fetching monthly orders:", err)
        }

        try {
          const topCategoriesRes = await getTopCategoriesChart()
          setTopCategories(topCategoriesRes.data.data)
        } catch (err) {
          console.error("Error fetching top categories:", err)
        }

        try {
          const deliveryDelayRes = await getDeliveryDelayChart()
          setDeliveryDelay(deliveryDelayRes.data.data)
        } catch (err) {
          console.error("Error fetching delivery delay:", err)
        }

        try {
          const sellerShippingRes = await getSellerShippingChart()
          setSellerShipping(sellerShippingRes.data.data)
        } catch (err) {
          console.error("Error fetching seller shipping:", err)
        }

        try {
          const shippingCostRes = await getShippingCostCategoryChart()
          setShippingCost(shippingCostRes.data.data)
        } catch (err) {
          console.error("Error fetching shipping cost:", err)
        }

        setLoading(false)
      } catch (err) {
        console.error("Error fetching analysis data:", err)
        setError("Không thể tải dữ liệu phân tích. Vui lòng thử lại sau.")
        setLoading(false)

        // Nếu lỗi và chưa retry quá nhiều lần, thử lại sau 5 giây
        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount((prev) => prev + 1)
          }, 5000)
        }
      }
    }

    fetchAnalysisData()
  }, [navigate, retryCount])

  // Hàm retry thủ công
  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
  }

  if (loading)
    return (
      <LoadingSpinner message="Đang tải dữ liệu phân tích. Quá trình này có thể mất vài phút nếu dữ liệu vừa được tải lên." />
    )

  if (error)
    return (
      <div className="error-with-retry">
        <ErrorMessage message={error} />
        <button className="retry-button" onClick={handleRetry}>
          Thử lại
        </button>
        <p className="retry-note">
          Lưu ý: Sau khi tải lên dữ liệu mới, hệ thống cần thời gian để xử lý và tính toán các phân tích.
        </p>
      </div>
    )

  // Kiểm tra xem có dữ liệu nào được tải thành công không
  const hasData =
    monthlyOrders.length > 0 ||
    topCategories.length > 0 ||
    deliveryDelay.length > 0 ||
    sellerShipping.length > 0 ||
    shippingCost.length > 0

  // Nếu không có dữ liệu nào, hiển thị thông báo lỗi
  if (!hasData) {
    return (
      <div className="error-with-retry">
        <ErrorMessage message="Không thể tải dữ liệu phân tích. Vui lòng thử lại sau." />
        <button className="retry-button" onClick={handleRetry}>
          Thử lại
        </button>
      </div>
    )
  }

  return (
    <div className="analysis">
      <h1 className="page-title">Phân tích dữ liệu</h1>

      {/* Biểu đồ đơn hàng theo tháng */}
      {monthlyOrders.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Đơn hàng theo tháng</h2>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={monthlyOrders}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => value.toLocaleString()} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#2196f3"
                  name="Số đơn hàng"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Biểu đồ top danh mục */}
      {topCategories.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Top 10 danh mục sản phẩm</h2>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topCategories}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip formatter={(value) => value.toLocaleString()} />
                <Legend />
                <Bar dataKey="value" name="Số lượng" fill="#2196f3" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="charts-row">
        {/* Biểu đồ tỷ lệ giao hàng */}
        {deliveryDelay.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Tỷ lệ giao hàng đúng hạn</h2>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={deliveryDelay}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="status"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    {deliveryDelay.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => value.toLocaleString()} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Biểu đồ thời gian giao hàng theo seller */}
        {sellerShipping.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Thời gian giao hàng theo seller</h2>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sellerShipping} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="seller" type="category" width={80} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="duration" name="Thời gian (ngày)" fill="#ff9800" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

   {/* Biểu đồ chi phí vận chuyển theo danh mục */}
{shippingCost.length > 0 && (
  <div className="card">
    <div className="card-header">
      <h2 className="card-title">Chi phí vận chuyển theo danh mục</h2>
    </div>
    <div className="card-body">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={shippingCost}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="category"
            tick={{ fontSize: 12 }}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={100}
          />
          <YAxis 
            tickFormatter={(value) => value.toLocaleString()} 
            width={100}
          />
          <Tooltip formatter={(value) => formatVND(value)} />
          <Legend />
          <Bar dataKey="cost" name="Chi phí vận chuyển" fill="#9c27b0" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
)}

    </div>
  )
}

export default Analysis
