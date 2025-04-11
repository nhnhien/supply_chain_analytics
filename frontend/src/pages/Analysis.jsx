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
} from "../services/api"
import LoadingSpinner from "../components/LoadingSpinner"
import ErrorMessage from "../components/ErrorMessage"
import "./Analysis.css"

const Analysis = () => {
  const [monthlyOrders, setMonthlyOrders] = useState([])
  const [topCategories, setTopCategories] = useState([])
  const [deliveryDelay, setDeliveryDelay] = useState([])
  const [sellerShipping, setSellerShipping] = useState([])
  const [shippingCost, setShippingCost] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

  useEffect(() => {
    const fetchAnalysisData = async () => {
      try {
        setLoading(true)
        const [monthlyOrdersRes, topCategoriesRes, deliveryDelayRes, sellerShippingRes, shippingCostRes] =
          await Promise.all([
            getMonthlyOrdersChart(),
            getTopCategoriesChart(),
            getDeliveryDelayChart(),
            getSellerShippingChart(),
            getShippingCostCategoryChart(),
          ])

        setMonthlyOrders(monthlyOrdersRes.data.data)
        setTopCategories(topCategoriesRes.data.data)
        setDeliveryDelay(deliveryDelayRes.data.data)
        setSellerShipping(sellerShippingRes.data.data)
        setShippingCost(shippingCostRes.data.data)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching analysis data:", err)
        setError("Không thể tải dữ liệu phân tích. Vui lòng thử lại sau.")
        setLoading(false)
      }
    }

    fetchAnalysisData()
  }, [])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />

  return (
    <div className="analysis">
      <h1 className="page-title">Phân tích dữ liệu</h1>

      {/* Biểu đồ đơn hàng theo tháng */}
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

      {/* Biểu đồ top danh mục */}
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

      <div className="charts-row">
        {/* Biểu đồ tỷ lệ giao hàng */}
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

        {/* Biểu đồ thời gian giao hàng theo seller */}
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
      </div>

      {/* Biểu đồ chi phí vận chuyển theo danh mục */}
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
              <YAxis />
              <Tooltip formatter={(value) => value.toLocaleString()} />
              <Legend />
              <Bar dataKey="cost" name="Chi phí vận chuyển" fill="#9c27b0" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default Analysis
