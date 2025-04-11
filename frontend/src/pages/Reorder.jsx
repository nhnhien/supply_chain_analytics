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
} from "../services/api"
import LoadingSpinner from "../components/LoadingSpinner"
import ErrorMessage from "../components/ErrorMessage"
import "./Reorder.css"

const Reorder = () => {
  const [reorderStrategy, setReorderStrategy] = useState([])
  const [topReorderPoints, setTopReorderPoints] = useState([])
  const [topSafetyStock, setTopSafetyStock] = useState([])
  const [topLeadTime, setTopLeadTime] = useState([])
  const [topInventory, setTopInventory] = useState([])
  const [topHoldingCost, setTopHoldingCost] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("strategy")

  useEffect(() => {
    const fetchReorderData = async () => {
      try {
        setLoading(true)
        const [strategyRes, reorderPointsRes, safetyStockRes, leadTimeRes, inventoryRes, holdingCostRes] =
          await Promise.all([
            getReorderStrategy(),
            getTopReorderPoints(),
            getTopSafetyStock(),
            getTopLeadTime(),
            getTopInventory(),
            getTopHoldingCost(),
          ])

        setReorderStrategy(strategyRes.data)
        setTopReorderPoints(reorderPointsRes.data.data)
        setTopSafetyStock(safetyStockRes.data.data)
        setTopLeadTime(leadTimeRes.data.data)
        setTopInventory(inventoryRes.data.data)
        setTopHoldingCost(holdingCostRes.data.data)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching reorder data:", err)
        setError("Không thể tải dữ liệu chiến lược tồn kho. Vui lòng thử lại sau.")
        setLoading(false)
      }
    }

    fetchReorderData()
  }, [])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />

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
      </div>

      {/* Bảng chiến lược tồn kho */}
      {activeTab === "strategy" && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Chiến lược tồn kho theo danh mục</h2>
          </div>
          <div className="card-body">
            <div className="table-container">
              <table className="reorder-table">
                <thead>
                  <tr>
                    <th>Danh mục</th>
                    <th>Lead Time (ngày)</th>
                    <th>Dự báo nhu cầu</th>
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
                      <td>{item.safety_stock.toLocaleString()}</td>
                      <td>{item.reorder_point.toLocaleString()}</td>
                      <td>{item.optimal_inventory.toLocaleString()}</td>
                      <td>{item.holding_cost.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Biểu đồ phân tích */}
      {activeTab === "charts" && (
        <div className="charts-container">
          {/* Biểu đồ Reorder Points */}
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

          {/* Biểu đồ Safety Stock */}
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

          {/* Biểu đồ Lead Time */}
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

          {/* Biểu đồ Tồn kho tối ưu */}
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

          {/* Biểu đồ Chi phí lưu kho */}
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
        </div>
      )}
    </div>
  )
}

export default Reorder
