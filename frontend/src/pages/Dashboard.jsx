"use client"

import { useState, useEffect } from "react"
import { 
  getAnalysisSummary, 
  getMonthlyOrdersChart, 
  getDeliveryDelayChart, 
  getTopCategoriesChart,
  getDemandForecast,
  getUploadedFiles
} from "../services/api"
import LoadingSpinner from "../components/LoadingSpinner"
import ErrorMessage from "../components/ErrorMessage"
import { useNavigate } from "react-router-dom"
import "./Dashboard.css"

const Dashboard = () => {
  const [summary, setSummary] = useState(null)
  const [monthlyOrders, setMonthlyOrders] = useState([])
  const [deliveryDelay, setDeliveryDelay] = useState([])
  const [topCategories, setTopCategories] = useState([])
  const [forecast, setForecast] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Check if files have been uploaded
        const uploadedFiles = await getUploadedFiles()
        if (uploadedFiles.length === 0) {
          navigate("/upload")
          return
        }

        setLoading(true)
        setError(null)

        // Fetch all necessary data in parallel
        const [
          summaryRes, 
          monthlyOrdersRes, 
          deliveryDelayRes,
          topCategoriesRes,
          forecastRes
        ] = await Promise.all([
          getAnalysisSummary(),
          getMonthlyOrdersChart(),
          getDeliveryDelayChart(),
          getTopCategoriesChart(),
          getDemandForecast()
        ])

        setSummary(summaryRes.data)
        setMonthlyOrders(monthlyOrdersRes.data.data)
        setDeliveryDelay(deliveryDelayRes.data.data)
        setTopCategories(topCategoriesRes.data.data)
        
        // Process forecast data - find overall forecast
        const overallForecast = forecastRes.data.find(item => item.category === "Overall")
        setForecast(overallForecast)
        
        setLoading(false)
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
        setError("Failed to load dashboard data. Please try again later.")
        setLoading(false)

        // Auto-retry up to 3 times
        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount((prev) => prev + 1)
          }, 5000)
        }
      }
    }

    fetchDashboardData()
  }, [navigate, retryCount])

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
  }

  const navigateTo = (path) => {
    navigate(path)
  }

  if (loading)
    return (
      <LoadingSpinner message="Loading dashboard data. This may take a few minutes if new data was recently uploaded." />
    )

  if (error)
    return (
      <div className="error-with-retry">
        <ErrorMessage message={error} />
        <button className="retry-button" onClick={handleRetry}>
        Retry
        </button>
        <p className="retry-note">
        Note: After uploading new data, the system needs time to process and compute the analysis.
        </p>
      </div>
    )

  // Calculate key metrics
  // 1. Total orders
  const totalOrders = monthlyOrders.reduce((sum, item) => sum + item.value, 0)
  const lastMonthOrders = monthlyOrders[monthlyOrders.length - 1]?.value || 0
  const prevMonthOrders = monthlyOrders[monthlyOrders.length - 2]?.value || 0
  const orderGrowth = prevMonthOrders ? (((lastMonthOrders - prevMonthOrders) / prevMonthOrders) * 100).toFixed(1) : 0

  // 2. On-time delivery rate
  const onTimeDelivery = deliveryDelay.find((item) => item.status === "On Time")?.count || 0
  const lateDelivery = deliveryDelay.find((item) => item.status === "Delayed")?.count || 0
  const totalDeliveries = onTimeDelivery + lateDelivery
  const onTimeRate = totalDeliveries ? ((onTimeDelivery / totalDeliveries) * 100).toFixed(1) : 0

  // 3. Product categories count
  const categoriesCount = Object.keys(summary?.top_categories || {}).length
  const topCategory = topCategories[0]?.category || "N/A"

  // 4. Forecast growth
  let nextForecastValue = 0
  let forecastGrowth = 0
  
  if (forecast && forecast.chart_data) {
    const actualData = forecast.chart_data.filter(item => item.type === "Actual")
    const forecastData = forecast.chart_data.filter(item => item.type === "XGBoost")
    
    const lastActualValue = actualData.length > 0 ? parseInt(actualData[actualData.length - 1].orders) : 0
    nextForecastValue = forecastData.length > 0 ? parseInt(forecastData[0].orders) : 0
    forecastGrowth = lastActualValue ? (((nextForecastValue - lastActualValue) / lastActualValue) * 100).toFixed(1) : 0
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="page-title">Supply Chain Analytics Dashboard</h1>
        <div className="dashboard-actions">
          <button onClick={() => navigateTo('/analysis')} className="action-button">
          View Analysis
          </button>
          <button onClick={() => navigateTo('/forecast')} className="action-button primary">
          Demand Forecast
          </button>
          <button onClick={() => navigateTo('/reorder')} className="action-button">
          Inventory Strategy
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon box-icon">📦</div>
          <div className="kpi-content">
            <h3 className="kpi-title">Total Orders</h3>
            <div className="kpi-value">{totalOrders.toLocaleString()}</div>
            <div className={`kpi-detail ${Number(orderGrowth) >= 0 ? 'positive' : 'negative'}`}>
              {Number(orderGrowth) >= 0 ? '↑' : '↓'} {Math.abs(Number(orderGrowth))}% compared to last month
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon truck-icon">🚚</div>
          <div className="kpi-content">
            <h3 className="kpi-title">On-time Delivery Rate</h3>
            <div className="kpi-value">{onTimeRate}%</div>
            <div className="kpi-detail">
              {onTimeDelivery.toLocaleString()} / {totalDeliveries.toLocaleString()} orders
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon tag-icon">🏷️</div>
          <div className="kpi-content">
            <h3 className="kpi-title">Product Categories</h3>
            <div className="kpi-value">{categoriesCount}</div>
            <div className="kpi-detail">
            Top Category: {topCategory}
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon chart-icon">📈</div>
          <div className="kpi-content">
            <h3 className="kpi-title">Forecasted Growth</h3>
            <div className="kpi-value">{forecastGrowth}%</div>
            <div className="kpi-detail">
            Next Forecast: {nextForecastValue.toLocaleString()} orders
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard tiles */}
      <div className="dashboard-tiles">
        {/* Analysis Section */}
        <div className="dashboard-tile">
          <h2 className="tile-title">Demand Analysis</h2>
          <div className="tile-content">
            <div className="analysis-metrics">
              <div className="metric">
                <div className="metric-label">Top Category</div>
                <div className="metric-value">{topCategory}</div>
              </div>
              <div className="metric">
                <div className="metric-label">Average Orders / Month</div>
                <div className="metric-value">
                  {(totalOrders / (monthlyOrders.length || 1)).toFixed(0)}
                </div>
              </div>
              <div className="metric">
                <div className="metric-label">On-time Deliveries</div>
                <div className="metric-value">{onTimeRate}%</div>
              </div>
            </div>
            <button onClick={() => navigateTo('/analysis')} className="tile-button">
            View Detailed Analysis
            </button>
          </div>
        </div>

        {/* Forecast Section */}
        <div className="dashboard-tile">
          <h2 className="tile-title">Demand Forecast</h2>
          <div className="tile-content">
            <div className="forecast-metrics">
              <div className="metric">
                <div className="metric-label">6-Month Forecast</div>
                <div className="metric-value">
                  {forecast?.forecast_table?.[forecast.forecast_table.length - 1]?.xgboost || "N/A"}
                </div>
              </div>
              <div className="metric">
                <div className="metric-label">Forecast Model</div>
                <div className="metric-value">XGBoost + ARIMA</div>
              </div>
              <div className="metric">
                <div className="metric-label">Expected Growth</div>
                <div className="metric-value">{forecastGrowth}%</div>
              </div>
            </div>
            <button onClick={() => navigateTo('/forecast')} className="tile-button primary">
            View Detailed Forecast
            </button>
          </div>
        </div>

        {/* Inventory Section */}
        <div className="dashboard-tile">
          <h2 className="tile-title">Inventory Optimization</h2>
          <div className="tile-content">
            <div className="inventory-metrics">
              <div className="metric">
                <div className="metric-label">Inventory Categories</div>
                <div className="metric-value">{categoriesCount}</div>
              </div>
              <div className="metric">
                <div className="metric-label">Average Delivery Time</div>
                <div className="metric-value">
                  {summary?.avg_shipping_duration_by_seller ? 
                    Object.values(summary.avg_shipping_duration_by_seller).reduce((sum, val) => sum + val, 0) / 
                    Object.values(summary.avg_shipping_duration_by_seller).length : "N/A"} days
                </div>
              </div>
              <div className="metric">
                <div className="metric-label">Shipping Cost</div>
                <div className="metric-value">
                  {summary?.avg_shipping_cost_by_category ?
                    (Object.values(summary.avg_shipping_cost_by_category).reduce((sum, val) => sum + val, 0) / 
                    Object.values(summary.avg_shipping_cost_by_category).length).toLocaleString() : "N/A"} đ
                </div>
              </div>
            </div>
            <button onClick={() => navigateTo('/reorder')} className="tile-button">
            View Inventory Strategy
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard