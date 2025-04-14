"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getDemandForecast, getUploadedFiles } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { useNavigate } from "react-router-dom";
import "./Forecast.css";

const Forecast = () => {
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedModel, setSelectedModel] = useState("xgboost"); // "xgboost" | "arima" | "both"
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem("demandForecast");

    const fetchForecastData = async () => {
      try {
        const uploadedFiles = getUploadedFiles();
        if (uploadedFiles.length === 0) {
          navigate("/upload");
          return;
        }

        setLoading(true);
        setError(null);
        const response = await getDemandForecast();

        if (!response.data || !response.data.forecast_table || !response.data.chart_data) {
          throw new Error("Dữ liệu không hợp lệ từ API");
        }

        setForecastData(response.data);

              // 🔍 Log ra các type hiện có trong dữ liệu trả về
      console.log("📊 forecastData types:", [
        ...new Set(response.data.chart_data.map(d => d.type))
      ]);

        setLoading(false);
      } catch (err) {
        console.error("Error fetching forecast data:", err);
        setError(err.message || "Không thể tải dữ liệu dự báo. Vui lòng thử lại sau.");
        setLoading(false);

        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
          }, 5000);
        }
      }
    };

    fetchForecastData();
  }, [navigate, retryCount]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{`Tháng: ${label}`}</p>
          <p className="tooltip-value">
            {`${payload[0].name}: ${payload[0].value.toLocaleString()}`}
          </p>
          {payload[0].payload.type && (
            <p className="tooltip-type">{`Loại: ${payload[0].payload.type}`}</p>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading)
    return (
      <LoadingSpinner message="Đang tải dữ liệu dự báo. Quá trình này có thể mất vài phút nếu dữ liệu vừa được tải lên." />
    );

  if (error)
    return (
      <div className="error-with-retry">
        <ErrorMessage message={error} />
        <button className="retry-button" onClick={handleRetry}>
          Thử lại
        </button>
        <p className="retry-note">
          Lưu ý: Sau khi tải lên dữ liệu mới, hệ thống cần thời gian để xử lý và tính toán dự báo.
        </p>
      </div>
    );

  const historicalData = forecastData.chart_data.filter((item) => item.type === "Thực tế");
  const forecastedXGB = forecastData.chart_data.filter((item) => item.type === "XGBoost");
  const forecastedARIMA = forecastData.chart_data.filter((item) => item.type === "ARIMA");
  console.log("📊 Forecast data types:", {
    historicalData,
    forecastedXGB,
    forecastedARIMA
  });
  
  const currentForecast =
    selectedModel === "xgboost"
      ? forecastedXGB
      : selectedModel === "arima"
      ? forecastedARIMA
      : [...forecastedXGB]; // default

  const firstForecast = currentForecast[0];
  const lastActual = historicalData[historicalData.length - 1];

  const forecastChange =
    lastActual && firstForecast
      ? (((firstForecast.orders - lastActual.orders) / lastActual.orders) * 100).toFixed(1)
      : 0;

  const avgForecast =
    currentForecast.length > 0
      ? (
          currentForecast.reduce((sum, item) => sum + (item.orders || 0), 0) /
          currentForecast.length
        ).toFixed(0)
      : 0;

  return (
    <div className="forecast">
      <h1 className="page-title">Dự báo nhu cầu</h1>

      <div className="model-selector">
        <label>Chọn mô hình dự báo: </label>
        <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
          <option value="xgboost">XGBoost</option>
          <option value="arima">ARIMA</option>
          <option value="both">So sánh cả 2 mô hình</option>
        </select>
      </div>

      {/* Thống kê dự báo */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon forecast-icon">📈</div>
          <div className="stat-info">
            <div className="stat-title">Dự báo tháng tới</div>
            <div className="stat-value">{firstForecast?.orders?.toLocaleString() || "-"}</div>
            <div className={`stat-change ${forecastChange >= 0 ? "positive" : "negative"}`}>
              {forecastChange >= 0 ? "↑" : "↓"} {Math.abs(forecastChange)}%
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon average-icon">📊</div>
          <div className="stat-info">
            <div className="stat-title">Trung bình 6 tháng tới</div>
            <div className="stat-value">{Number(avgForecast).toLocaleString()}</div>
            <div className="stat-detail">đơn hàng/tháng</div>
          </div>
        </div>
      </div>

      {/* Biểu đồ */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Biểu đồ dự báo</h2>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={400}>
          <LineChart data={[...historicalData, ...forecastedXGB, ...forecastedARIMA]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                allowDuplicatedCategory={false}
                tickFormatter={(value) => value.split("-")[1]}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
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
                data={historicalData}
              />
              {(selectedModel === "xgboost" || selectedModel === "both") && (
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="#ff9800"
                  name="XGBoost"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 4 }}
                  connectNulls
                  isAnimationActive={true}
                  animationDuration={1000}
                  data={forecastedXGB}
                />
              )}
              {(selectedModel === "arima" || selectedModel === "both") && (
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="#4caf50"
                  name="ARIMA"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={{ r: 4 }}
                  connectNulls
                  isAnimationActive={true}
                  animationDuration={1000}
                  data={forecastedARIMA}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bảng chi tiết */}
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
                  <th>So với tháng trước</th>
                </tr>
              </thead>
              <tbody>
                {currentForecast.map((item, index) => {
                  const prev = currentForecast[index - 1]?.orders || item.orders;
                  const diff = prev && prev !== 0
                  ? (((item.orders - prev) / prev) * 100).toFixed(1)
                  : 0;
                  return (
                    <tr key={index}>
                      <td>{item.month}</td>
                      <td>{item.orders != null ? item.orders.toLocaleString() : "-"}</td>
                      <td className={diff >= 0 ? "positive" : "negative"}>
                      {diff > 0 ? "+" : diff < 0 ? "" : ""}{diff}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Forecast;
