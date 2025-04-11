"use client"

import { useState, useEffect } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { getDemandForecast } from "../services/api"
import LoadingSpinner from "../components/LoadingSpinner"
import ErrorMessage from "../components/ErrorMessage"
import "./Forecast.css"

const Forecast = () => {
  const [forecastData, setForecastData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchForecastData = async () => {
      try {
        setLoading(true)
        const response = await getDemandForecast()
        setForecastData(response.data)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching forecast data:", err)
        setError("Không thể tải dữ liệu dự báo. Vui lòng thử lại sau.")
        setLoading(false)
      }
    }

    fetchForecastData()
  }, [])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />

  // Tính toán các chỉ số dự báo
  const historicalData = forecastData?.chart_data.filter((item) => item.type === "Thực tế") || []
  const forecastedData = forecastData?.chart_data.filter((item) => item.type === "Dự báo") || []

  const lastActualMonth = historicalData[historicalData.length - 1]
  const firstForecastMonth = forecastedData[0]

  const forecastChange =
    lastActualMonth && firstForecastMonth
      ? (((firstForecastMonth.orders - lastActualMonth.orders) / lastActualMonth.orders) * 100).toFixed(1)
      : 0

  const avgForecast = forecastedData.length
    ? (forecastedData.reduce((sum, item) => sum + item.orders, 0) / forecastedData.length).toFixed(0)
    : 0

  return (
    <div className="forecast">
      <h1 className="page-title">Dự báo nhu cầu</h1>

      {/* Thống kê dự báo */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon forecast-icon">📈</div>
          <div className="stat-info">
            <div className="stat-title">Dự báo tháng tới</div>
            <div className="stat-value">{firstForecastMonth?.orders.toLocaleString() || 0}</div>
            <div className={`stat-change ${forecastChange >= 0 ? "positive" : "negative"}`}>
              {forecastChange >= 0 ? "↑" : "↓"} {Math.abs(forecastChange)}% so với tháng hiện tại
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon average-icon">📊</div>
          <div className="stat-info">
            <div className="stat-title">Trung bình 6 tháng tới</div>
            <div className="stat-value">{avgForecast.toLocaleString()}</div>
            <div className="stat-detail">đơn hàng/tháng</div>
          </div>
        </div>
      </div>

      {/* Biểu đồ dự báo */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Dự báo đơn hàng 6 tháng tới</h2>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={forecastData?.chart_data || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => value.toLocaleString()} />
              <Legend />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#2196f3"
                name="Thực tế"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls
                isAnimationActive={true}
                animationDuration={1000}
                animationEasing="ease-in-out"
              />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#ff9800"
                name="Dự báo"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 4 }}
                connectNulls
                isAnimationActive={true}
                animationDuration={1000}
                animationEasing="ease-in-out"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bảng dự báo chi tiết */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Chi tiết dự báo theo tháng</h2>
        </div>
        <div className="card-body">
          <div className="table-container">
            <table className="forecast-table">
              <thead>
                <tr>
                  <th>Tháng</th>
                  <th>Số đơn hàng dự báo</th>
                </tr>
              </thead>
              <tbody>
                {forecastData?.forecast_table.map((item, index) => (
                  <tr key={index}>
                    <td>{item.month}</td>
                    <td>{item.predicted_orders.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Forecast
