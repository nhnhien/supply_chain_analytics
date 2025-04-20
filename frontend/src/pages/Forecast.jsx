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
  const [forecastData, setForecastData] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedModel, setSelectedModel] = useState("xgboost");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchForecastData = async () => {
      try {
        const uploadedFiles = await getUploadedFiles();
        if (!uploadedFiles || uploadedFiles.length === 0) {
          navigate("/upload");
          return;
        }

        setLoading(true);
        setError(null);

        const response = await getDemandForecast(); // Không còn `.data`
        console.log("📦 Raw forecast response:", response);

          const allResults = Array.isArray(response.data)
          ? response.data.filter((cat) => cat.status === "success")
          : [];
        
        if (allResults.length === 0) {
          throw new Error("No category has enough data for forecasting.");
        }

        setForecastData(allResults);
        setSelectedCategory(allResults[0].category);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching forecast data:", err);
        setError(err.message || "Failed to load forecast data.");
        setLoading(false);
        if (retryCount < 3) {
          setTimeout(() => setRetryCount((prev) => prev + 1), 5000);
        }
      }
    };

    fetchForecastData();
  }, [retryCount, navigate]);
  
  const handleRetry = () => setRetryCount((prev) => prev + 1);

  const currentCategoryData = forecastData.find((cat) => cat.category === selectedCategory);

  const historicalData = currentCategoryData?.chart_data.filter((item) => item.type === "Thực tế") || [];
  const forecastedXGB = currentCategoryData?.chart_data.filter((item) => item.type === "XGBoost") || [];
  const forecastedARIMA = currentCategoryData?.chart_data.filter((item) => item.type === "ARIMA") || [];

  const currentForecast =
    selectedModel === "xgboost"
      ? forecastedXGB
      : selectedModel === "arima"
      ? forecastedARIMA
      : [...forecastedXGB];

  const firstForecast = currentForecast[0];
  const lastActual = historicalData[historicalData.length - 1];

  const forecastChange =
    lastActual && firstForecast
      ? (((firstForecast.orders - lastActual.orders) / lastActual.orders) * 100).toFixed(1)
      : 0;

  const avgForecast =
    currentForecast.length > 0
      ? (
          currentForecast.reduce((sum, item) => sum + (item.orders || 0), 0) / currentForecast.length
        ).toFixed(0)
      : 0;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{`Month: ${label}`}</p>
          <p className="tooltip-value">{`${payload[0].name}: ${payload[0].value.toLocaleString()}`}</p>
          {payload[0].payload.type && <p className="tooltip-type">{`Type: ${payload[0].payload.type}`}</p>}
        </div>
      );
    }
    return null;
  };

  if (loading)
    return (
      <LoadingSpinner message="Loading forecast data. This may take a few minutes if the data was just uploaded." />
    );

  if (error)
    return (
      <div className="error-with-retry">
        <ErrorMessage message={error} />
        <button className="retry-button" onClick={handleRetry}>
          Retry
        </button>
        <p className="retry-note">Note: After uploading new data, the system requires time to process and compute the forecasts.</p>
      </div>
    );

  return (
    <div className="forecast">
      <h1 className="page-title">Demand Forecast</h1>

      <div className="selectors">
        <div className="category-selector">
          <label>Select Category: </label>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            {forecastData.map((cat) => (
              <option key={cat.category} value={cat.category}>
                {cat.category}
              </option>
            ))}
          </select>
        </div>

        <div className="model-selector">
          <label>Select Forecast Model: </label>
          <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
            <option value="xgboost">XGBoost</option>
            <option value="arima">ARIMA</option>
            <option value="both">Compare Both Models</option>
          </select>
        </div>
      </div>

      {/* Thống kê dự báo */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon forecast-icon">📈</div>
          <div className="stat-info">
            <div className="stat-title">Forecast for Next Month</div>
            <div className="stat-value">{firstForecast?.orders?.toLocaleString() || "-"}</div>
            <div className={`stat-change ${forecastChange >= 0 ? "positive" : "negative"}`}>
              {forecastChange >= 0 ? "↑" : "↓"} {Math.abs(forecastChange)}%
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon average-icon">📊</div>
          <div className="stat-info">
            <div className="stat-title">Average for Next 6 Months</div>
            <div className="stat-value">{Number(avgForecast).toLocaleString()}</div>
            <div className="stat-detail">orders/month</div>
          </div>
        </div>
      </div>

      {/* Biểu đồ */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Forecast Chart</h2>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={[...historicalData, ...forecastedXGB, ...forecastedARIMA]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" allowDuplicatedCategory={false} tickFormatter={(value) => value.split("-")[1]} />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#2196f3"
                name="Actual"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls
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
          <h2 className="card-title">Monthly Forecast Details</h2>
        </div>
        <div className="card-body">
          <div className="table-container">
            <table className="forecast-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Forecasted Orders</th>
                  <th>Compared to Previous Month</th>
                </tr>
              </thead>
              <tbody>
                {currentForecast.map((item, index) => {
                  const prev = currentForecast[index - 1]?.orders || item.orders;
                  const diff = prev && prev !== 0 ? (((item.orders - prev) / prev) * 100).toFixed(1) : 0;
                  return (
                    <tr key={index}>
                      <td>{item.month}</td>
                      <td>{item.orders != null ? item.orders.toLocaleString() : "-"}</td>
                      <td className={diff >= 0 ? "positive" : "negative"}>
                        {diff > 0 ? "+" : ""}{diff}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {currentCategoryData?.mae_rmse_comparison && (
  <div className="card">
    <div className="card-header">
      <h2 className="card-title">Model Accuracy Comparison</h2>
    </div>
    <div className="card-body">
      <table className="forecast-table">
        <thead>
          <tr>
            <th>Model</th>
            <th>MAE</th>
            <th>RMSE</th>
          </tr>
        </thead>
        <tbody>
  {["xgboost", "arima"].map((model) => {
    const mae = currentCategoryData.mae_rmse_comparison[model].mae;
    const rmse = currentCategoryData.mae_rmse_comparison[model].rmse;

    const betterMaeModel =
      currentCategoryData.mae_rmse_comparison.xgboost.mae <
      currentCategoryData.mae_rmse_comparison.arima.mae
        ? "xgboost"
        : "arima";

    const betterRmseModel =
      currentCategoryData.mae_rmse_comparison.xgboost.rmse <
      currentCategoryData.mae_rmse_comparison.arima.rmse
        ? "xgboost"
        : "arima";

    return (
<tr key={model}>
  <td style={{ fontWeight: "600" }}>{model.toUpperCase()}</td>

  <td className={model === betterMaeModel ? "highlight-better" : "highlight-worse"}>
    {mae.toLocaleString()}
    {model === betterMaeModel && (
      <span className="ml-1" title="Better MAE">👍</span>
    )}
  </td>

  <td className={model === betterRmseModel ? "highlight-better" : "highlight-worse"}>
    {rmse.toLocaleString()}
    {model === betterRmseModel && (
      <span className="ml-1" title="Better RMSE">👍</span>
    )}
  </td>
</tr>

    );
  })}
</tbody>

      </table>
    </div>
  </div>
)}

    </div>
  );
};

export default Forecast;
