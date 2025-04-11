"use client"

import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import {
  getReorderStrategy,
  getTopReorderPoints,
  getTopSafetyStock,
  getTopLeadTime,
  getTopInventory,
  getTopHoldingCost,
  getUploadedFiles,
} from "../services/api"
import LoadingSpinner from "../components/LoadingSpinner"
import ErrorMessage from "../components/ErrorMessage"
import { useNavigate } from "react-router-dom"
import { AlertTriangle, CheckCircle, Info } from "react-feather"
import "./Reorder.css"

const Reorder = () => {
  const [reorderStrategy, setReorderStrategy] = useState([])
  const [topReorderPoints, setTopReorderPoints] = useState([])
  const [topSafetyStock, setTopSafetyStock] = useState([])
  const [topLeadTime, setTopLeadTime] = useState([])
  const [topInventory, setTopInventory] = useState([])
  const [topHoldingCost, setTopHoldingCost] = useState([])
  const [optimizationRecommendations, setOptimizationRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("strategy")
  const [retryCount, setRetryCount] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchReorderData = async () => {
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
          const strategyRes = await getReorderStrategy()
          setReorderStrategy(strategyRes.data)

          // Kiểm tra và lấy optimization_recommendations nếu có
          const recommendationsData = []

          if (strategyRes.data && strategyRes.data.length > 0) {
            strategyRes.data.forEach((item) => {
              if (item.optimization_recommendations && item.optimization_recommendations.length > 0) {
                recommendationsData.push({
                  category: item.category,
                  recommendations: item.optimization_recommendations,
                })
              }
            })

            if (recommendationsData.length > 0) {
              setOptimizationRecommendations(recommendationsData)
            }
          }
        } catch (err) {
          console.error("Error fetching reorder strategy:", err)
        }

        try {
          const reorderPointsRes = await getTopReorderPoints()
          setTopReorderPoints(reorderPointsRes.data.data)
        } catch (err) {
          console.error("Error fetching top reorder points:", err)
        }

        try {
          const safetyStockRes = await getTopSafetyStock()
          setTopSafetyStock(safetyStockRes.data.data)
        } catch (err) {
          console.error("Error fetching top safety stock:", err)
        }

        try {
          const leadTimeRes = await getTopLeadTime()
          setTopLeadTime(leadTimeRes.data.data)
        } catch (err) {
          console.error("Error fetching top lead time:", err)
        }

        try {
          const inventoryRes = await getTopInventory()
          setTopInventory(inventoryRes.data.data)
        } catch (err) {
          console.error("Error fetching top inventory:", err)
        }

        try {
          const holdingCostRes = await getTopHoldingCost()
          setTopHoldingCost(holdingCostRes.data.data)
        } catch (err) {
          console.error("Error fetching top holding cost:", err)
        }

        setLoading(false)
      } catch (err) {
        console.error("Error fetching reorder data:", err)
        setError("Không thể tải dữ liệu chiến lược tồn kho. Vui lòng thử lại sau.")
        setLoading(false)

        // Nếu lỗi và chưa retry quá nhiều lần, thử lại sau 5 giây
        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount((prev) => prev + 1)
          }, 5000)
        }
      }
    }

    fetchReorderData()
  }, [navigate, retryCount])

  // Hàm retry thủ công
  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
  }

  if (loading)
    return (
      <LoadingSpinner message="Đang tải dữ liệu chiến lược tồn kho. Quá trình này có thể mất vài phút nếu dữ liệu vừa được tải lên." />
    )

  if (error)
    return (
      <div className="error-with-retry">
        <ErrorMessage message={error} />
        <button className="retry-button" onClick={handleRetry}>
          Thử lại
        </button>
        <p className="retry-note">
          Lưu ý: Sau khi tải lên dữ liệu mới, hệ thống cần thời gian để xử lý và tính toán chiến lược tồn kho.
        </p>
      </div>
    )

  // Kiểm tra xem có dữ liệu nào được tải thành công không
  const hasStrategyData = reorderStrategy && reorderStrategy.length > 0
  const hasChartData =
    topReorderPoints.length > 0 ||
    topSafetyStock.length > 0 ||
    topLeadTime.length > 0 ||
    topInventory.length > 0 ||
    topHoldingCost.length > 0
  const hasRecommendations = optimizationRecommendations && optimizationRecommendations.length > 0

  // Nếu không có dữ liệu nào, hiển thị thông báo lỗi
  if (!hasStrategyData && !hasChartData) {
    return (
      <div className="error-with-retry">
        <ErrorMessage message="Không thể tải dữ liệu chiến lược tồn kho. Vui lòng thử lại sau." />
        <button className="retry-button" onClick={handleRetry}>
          Thử lại
        </button>
      </div>
    )
  }

  return (
    <div className="reorder">
      <h1 className="page-title">Chiến lược tồn kho</h1>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === "strategy" ? "active" : ""}`} onClick={() => setActiveTab("strategy")}>
          Bảng chiến lược
        </button>
        <button className={`tab ${activeTab === "charts" ? "active" : ""}`} onClick={() => setActiveTab("charts")}>
          Biểu đồ phân tích
        </button>
        {hasRecommendations && (
          <button
            className={`tab ${activeTab === "recommendations" ? "active" : ""}`}
            onClick={() => setActiveTab("recommendations")}
          >
            Khuyến nghị tối ưu
          </button>
        )}
      </div>

      {/* Bảng chiến lược tồn kho */}
      {activeTab === "strategy" && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Chiến lược tồn kho theo danh mục</h2>
          </div>
          <div className="card-body">
            {hasStrategyData ? (
              <div className="table-container">
                <table className="reorder-table">
                  <thead>
                    <tr>
                      <th>Danh mục</th>
                      <th>Lead Time (ngày)</th>
                      <th>Dự báo nhu cầu</th>
                      <th>Độ lệch chuẩn</th>
                      <th>Safety Stock</th>
                      <th>Reorder Point</th>
                      <th>Tồn kho tối ưu</th>
                      <th>Chi phí lưu kho</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reorderStrategy.map((item, index) => (
                      <tr key={index}>
                        <td>{item.category}</td>
                        <td>{item.avg_lead_time_days.toFixed(1)}</td>
                        <td>{item.forecast_avg_demand.toLocaleString()}</td>
                        <td>{item.demand_std ? item.demand_std.toLocaleString() : "N/A"}</td>
                        <td>{item.safety_stock.toLocaleString()}</td>
                        <td>{item.reorder_point.toLocaleString()}</td>
                        <td>{item.optimal_inventory.toLocaleString()}</td>
                        <td>{item.holding_cost.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-data-message">
                <p>Không có dữ liệu chiến lược tồn kho. Vui lòng thử lại sau.</p>
                <button className="retry-button" onClick={handleRetry}>
                  Thử lại
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Khuyến nghị tối ưu */}
      {activeTab === "recommendations" && hasRecommendations && (
        <div className="recommendations-container">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Khuyến nghị tối ưu hóa tồn kho</h2>
            </div>
            <div className="card-body">
              <div className="recommendations-intro">
                <Info size={20} />
                <p>
                  Dựa trên phân tích dữ liệu, hệ thống đưa ra các khuyến nghị để tối ưu hóa chiến lược tồn kho cho từng
                  danh mục sản phẩm.
                </p>
              </div>

              {optimizationRecommendations.map((item, index) => (
                <div className="recommendation-card" key={index}>
                  <h3 className="recommendation-category">{item.category}</h3>
                  <ul className="recommendation-list">
                    {item.recommendations.map((rec, recIndex) => {
                      // Xác định loại khuyến nghị dựa trên nội dung
                      const isWarning =
                        rec.toLowerCase().includes("cảnh báo") ||
                        rec.toLowerCase().includes("quá cao") ||
                        rec.toLowerCase().includes("quá thấp") ||
                        rec.toLowerCase().includes("rủi ro")

                      const isPositive =
                        rec.toLowerCase().includes("tốt") ||
                        rec.toLowerCase().includes("phù hợp") ||
                        rec.toLowerCase().includes("hiệu quả")

                      return (
                        <li
                          key={recIndex}
                          className={`recommendation-item ${isWarning ? "warning" : ""} ${isPositive ? "positive" : ""}`}
                        >
                          {isWarning && <AlertTriangle size={16} />}
                          {isPositive && <CheckCircle size={16} />}
                          {!isWarning && !isPositive && <Info size={16} />}
                          <span>{rec}</span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Biểu đồ phân tích */}
      {activeTab === "charts" && (
        <div className="charts-container">
          {/* Biểu đồ Reorder Points */}
          {topReorderPoints.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Top 10 danh mục theo Reorder Point</h2>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={topReorderPoints}>
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
                    <Bar dataKey="value" name="Reorder Point" fill="#2196f3" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Biểu đồ Safety Stock */}
          {topSafetyStock.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Top 10 danh mục theo Safety Stock</h2>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={topSafetyStock}>
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
                    <Bar dataKey="value" name="Safety Stock" fill="#4caf50" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Biểu đồ Lead Time */}
          {topLeadTime.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Top 10 danh mục theo Lead Time</h2>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={topLeadTime}>
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
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Lead Time (ngày)" fill="#ff9800" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Biểu đồ Tồn kho tối ưu */}
          {topInventory.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Top 10 danh mục theo Tồn kho tối ưu</h2>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={topInventory}>
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
                    <Bar dataKey="value" name="Tồn kho tối ưu" fill="#9c27b0" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Biểu đồ Chi phí lưu kho */}
          {topHoldingCost.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Top 10 danh mục theo Chi phí lưu kho</h2>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={topHoldingCost}>
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
                    <Bar dataKey="value" name="Chi phí lưu kho" fill="#f44336" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {!hasChartData && (
            <div className="no-data-message">
              <p>Không có dữ liệu biểu đồ phân tích. Vui lòng thử lại sau.</p>
              <button className="retry-button" onClick={handleRetry}>
                Thử lại
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Reorder
