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
          console.log(`Top categories received: ${topCategoriesRes.data.data.length}`)
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
        setError("Unable to load analysis data. Please try again later.")
        setLoading(false)

        // If error and haven't retried too many times, retry after 5 seconds
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
      <LoadingSpinner message="Loading analysis data. This may take a few minutes if the data was just uploaded." />
    )

  if (error)
    return (
      <div className="error-with-retry">
        <ErrorMessage message={error} />
        <button className="retry-button" onClick={handleRetry}>
          Retry
        </button>
        <p className="retry-note">
        Note: After uploading new data, the system needs time to process and compute analytics.
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
        <ErrorMessage message="Unable to load analysis data. Please try again later." />
        <button className="retry-button" onClick={handleRetry}>
          Retry
        </button>
      </div>
    )
  }

  // Truncate long seller IDs to make them more readable
  const processedSellerShipping = sellerShipping.map(item => ({
    ...item,
    // Truncate the seller ID if too long (keeping first and last 3 characters)
    displaySeller: item.seller.length > 8 ? 
      `${item.seller.substring(0, 3)}...${item.seller.substring(item.seller.length - 3)}` : 
      item.seller
  }));

  return (
    <div className="analysis">
      <h1 className="page-title">Data Analysis</h1>

      {/* Biểu đồ đơn hàng theo tháng */}
      {monthlyOrders.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Monthly Orders</h2>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart 
                data={monthlyOrders}
                margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  height={60}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  width={80}
                  tickFormatter={(value) => value.toLocaleString()}
                />
                <Tooltip formatter={(value) => value.toLocaleString()} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#2196f3"
                  name="Number of Orders"
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
  <h2 className="card-title">Top Product Categories by Order Volume</h2>
</div>

          <div className="card-body">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart 
                data={topCategories}
                margin={{ top: 20, right: 30, left: 20, bottom: 120 }} // Tăng margin bottom cho labels
                layout="vertical" // Đổi sang dạng ngang để dễ hiển thị nhãn
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number"
                  tickFormatter={(value) => value.toLocaleString()}
                />
                <YAxis 
                  dataKey="category" 
                  type="category"
                  width={160} // Tăng chiều rộng của trục Y
                  tick={{ fontSize: 12 }}
                />
                <Tooltip formatter={(value) => value.toLocaleString()} />
                <Legend />
                <Bar dataKey="value" name="Order Volume" fill="#2196f3" />
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
              <h2 className="card-title">On-time Delivery Rate</h2>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
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
              <h2 className="card-title">Delivery Time by Seller</h2>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={processedSellerShipping} 
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="displaySeller" 
                    type="category" 
                    width={100} // Tăng chiều rộng để hiển thị ID 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${value.toFixed(1)} days`, 
                      "Delivery Time"
                    ]}
                    labelFormatter={(label, payload) => {
                      if (payload && payload.length > 0) {
                        // Lấy ID đầy đủ từ dữ liệu gốc
                        return `Seller ID: ${payload[0].payload.seller}`;
                      }
                      return label;
                    }}
                  />
                  <Legend />
                  <Bar dataKey="duration" name="Delivery Time (days)" fill="#ff9800" />
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
  <h2 className="card-title">Top Categories by Shipping Cost</h2>
</div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart 
                data={shippingCost}
                margin={{ top: 20, right: 30, left: 20, bottom: 120 }}
                layout="vertical" // Đổi sang dạng ngang 
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number"
                  tickFormatter={(value) => value.toLocaleString()}
                />
                <YAxis 
                  dataKey="category" 
                  type="category"
                  width={160} // Tăng chiều rộng của trục Y 
                  tick={{ fontSize: 12 }}
                />
                <Tooltip formatter={(value) => formatVND(value)} />
                <Legend />
                <Bar dataKey="cost" name="Shipping Cost" fill="#9c27b0" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}

export default Analysis