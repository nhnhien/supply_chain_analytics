"use client"

import { useState, useEffect } from "react"
import {
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
import { getAnalysisSummary, getMonthlyOrdersChart, getDeliveryDelayChart, getUploadedFiles } from "../services/api"
import LoadingSpinner from "../components/LoadingSpinner"
import ErrorMessage from "../components/ErrorMessage"
import { useNavigate } from "react-router-dom"
import "./Dashboard.css"

const Dashboard = () => {
  const [summary, setSummary] = useState(null)
  const [monthlyOrders, setMonthlyOrders] = useState([])
  const [deliveryDelay, setDeliveryDelay] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const navigate = useNavigate()

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

  useEffect(() => {
    const fetchDashboardData = async () => {
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

        const [summaryRes, monthlyOrdersRes, deliveryDelayRes] = await Promise.all([
          getAnalysisSummary(),
          getMonthlyOrdersChart(),
          getDeliveryDelayChart(),
        ])

        setSummary(summaryRes.data)
        setMonthlyOrders(monthlyOrdersRes.data.data)
        setDeliveryDelay(deliveryDelayRes.data.data)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
        setError("Không thể tải dữ liệu dashboard. Vui lòng thử lại sau.")
        setLoading(false)

        // Nếu lỗi và chưa retry quá nhiều lần, thử lại sau 5 giây
        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount((prev) => prev + 1)
          }, 5000)
        }
      }
    }

    fetchDashboardData()
  }, [navigate, retryCount])

  // Hàm retry thủ công
  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
  }

  if (loading)
    return (
      <LoadingSpinner message="Đang tải dữ liệu dashboard. Quá trình này có thể mất vài phút nếu dữ liệu vừa được tải lên." />
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

  // Tính toán các chỉ số tổng quan
  const totalOrders = monthlyOrders.reduce((sum, item) => sum + item.value, 0)
  const lastMonthOrders = monthlyOrders[monthlyOrders.length - 1]?.value || 0
  const prevMonthOrders = monthlyOrders[monthlyOrders.length - 2]?.value || 0
  const orderGrowth = prevMonthOrders ? (((lastMonthOrders - prevMonthOrders) / prevMonthOrders) * 100).toFixed(1) : 0

  const onTimeDelivery = deliveryDelay.find((item) => item.status === "Đúng hạn")?.count || 0
  const lateDelivery = deliveryDelay.find((item) => item.status === "Trễ")?.count || 0
  const totalDeliveries = onTimeDelivery + lateDelivery
  const onTimeRate = totalDeliveries ? ((onTimeDelivery / totalDeliveries) * 100).toFixed(1) : 0

  return (
    <div className="dashboard">
      <h1 className="page-title">Dashboard</h1>

      {/* Thống kê tổng quan */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon orders-icon">📦</div>
          <div className="stat-info">
            <div className="stat-title">Tổng đơn hàng</div>
            <div className="stat-value">{totalOrders.toLocaleString()}</div>
            <div className={`stat-change ${orderGrowth >= 0 ? "positive" : "negative"}`}>
              {orderGrowth >= 0 ? "↑" : "↓"} {Math.abs(orderGrowth)}% so với tháng trước
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon delivery-icon">🚚</div>
          <div className="stat-info">
            <div className="stat-title">Tỷ lệ giao đúng hạn</div>
            <div className="stat-value">{onTimeRate}%</div>
            <div className="stat-detail">
              {onTimeDelivery.toLocaleString()} / {totalDeliveries.toLocaleString()} đơn hàng
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon categories-icon">🏷️</div>
          <div className="stat-info">
            <div className="stat-title">Danh mục sản phẩm</div>
            <div className="stat-value">{Object.keys(summary?.top_categories || {}).length}</div>
          </div>
        </div>
      </div>

      {/* Biểu đồ đơn hàng theo tháng */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Đơn hàng theo tháng</h2>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyOrders}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#2196f3" name="Số đơn hàng" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Biểu đồ tỷ lệ giao hàng */}
      <div className="charts-row">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Tỷ lệ giao hàng</h2>
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
      </div>
    </div>
  )
}

export default Dashboard
