"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  ZAxis,
  Scatter,
} from "recharts";
import {
  getReorderStrategy,
  getTopReorderPoints,
  getTopSafetyStock,
  getTopLeadTime,
  getTopInventory,
  getTopHoldingCost,
  getTopPotentialSaving,
  getUploadedFiles,
  getSupplierClusters,
  getBottleneckAnalysis,
} from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle, Info } from "react-feather";
import "./Reorder.css";
import { downloadRecommendationExcel } from "../services/api";
import { formatVND } from "../utils/currency";

const Reorder = () => {
  const [reorderStrategy, setReorderStrategy] = useState([]);
  const [topReorderPoints, setTopReorderPoints] = useState([]);
  const [topSafetyStock, setTopSafetyStock] = useState([]);
  const [topLeadTime, setTopLeadTime] = useState([]);
  const [topInventory, setTopInventory] = useState([]);
  const [topPotentialSaving, setTopPotentialSaving] = useState([]);
  const [topHoldingCost, setTopHoldingCost] = useState([]);
  const [supplierClusters, setSupplierClusters] = useState([]);
  const [bottlenecks, setBottlenecks] = useState([]);

  const [optimizationRecommendations, setOptimizationRecommendations] =
    useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("strategy");
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();
  const handleDownloadExcel = async () => {
    try {
      await downloadRecommendationExcel();
    } catch (error) {
      alert(
        "❌ Unable to download the recommendation Excel file. There may be no suitable data."
      );
      console.error("Download failed:", error);
    }
  };

  useEffect(() => {
    const fetchReorderData = async () => {
      try {
        // Kiểm tra xem đã có file được upload chưa
        const uploadedFiles = getUploadedFiles();
        if (uploadedFiles.length === 0) {
          // Nếu chưa có file nào được upload, chuyển hướng đến trang upload
          navigate("/upload");
          return;
        }

        setLoading(true);
        setError(null);

        // Tải dữ liệu theo từng phần để tránh timeout
        try {
          const strategyRes = await getReorderStrategy();
          setReorderStrategy(strategyRes.data);

          // Kiểm tra và lấy optimization_recommendations nếu có
          const recommendationsData = [];

          if (strategyRes.data && strategyRes.data.length > 0) {
            strategyRes.data.forEach((item) => {
              if (
                item.optimization_recommendations &&
                item.optimization_recommendations.length > 0
              ) {
                recommendationsData.push({
                  category: item.category,
                  recommendations: item.optimization_recommendations,
                });
              }
            });

            if (recommendationsData.length > 0) {
              const sortedRecommendations = recommendationsData.sort((a, b) => {
                const savingA = a.potential_saving || 0;
                const savingB = b.potential_saving || 0;
                return savingB - savingA;
              });
              setOptimizationRecommendations(sortedRecommendations);
            }
          }
        } catch (err) {
          console.error("Error fetching reorder strategy:", err);
        }

        try {
          const reorderPointsRes = await getTopReorderPoints();
          setTopReorderPoints(reorderPointsRes.data.data);
        } catch (err) {
          console.error("Error fetching top reorder points:", err);
        }

        try {
          const safetyStockRes = await getTopSafetyStock();
          setTopSafetyStock(safetyStockRes.data.data);
        } catch (err) {
          console.error("Error fetching top safety stock:", err);
        }

        try {
          const leadTimeRes = await getTopLeadTime();
          setTopLeadTime(leadTimeRes.data.data);
        } catch (err) {
          console.error("Error fetching top lead time:", err);
        }

        try {
          const inventoryRes = await getTopInventory();
          setTopInventory(inventoryRes.data.data);
        } catch (err) {
          console.error("Error fetching top inventory:", err);
        }

        try {
          const holdingCostRes = await getTopHoldingCost();
          setTopHoldingCost(holdingCostRes.data.data);
        } catch (err) {
          console.error("Error fetching top holding cost:", err);
        }
        try {
          const potentialSavingRes = await getTopPotentialSaving();
          setTopPotentialSaving(potentialSavingRes.data.data);
        } catch (err) {
          console.error("Error fetching top potential saving:", err);
        }
        const supplierClustersRes = await getSupplierClusters();
        setSupplierClusters(
          Array.isArray(supplierClustersRes.data)
            ? supplierClustersRes.data
            : supplierClustersRes.data?.data || []
        );
        console.log("🐞 Raw supplierClustersRes:", supplierClustersRes.data);

        const bottlenecksRes = await getBottleneckAnalysis();
        setBottlenecks(bottlenecksRes.data || []);

        setLoading(false);
      } catch (err) {
        console.error("Error fetching reorder data:", err);
        setError(
          "Unable to load inventory strategy data. Please try again later."
        );
        setLoading(false);

        // Nếu lỗi và chưa retry quá nhiều lần, Retry sau 5 giây
        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
          }, 5000);
        }
      }
    };

    fetchReorderData();
  }, [navigate, retryCount]);
  useEffect(() => {
    console.log("📦 supplierClusters useEffect triggered:", supplierClusters);
  }, [supplierClusters]);

  // Hàm retry thủ công
  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  if (loading)
    return (
      <LoadingSpinner message="Loading inventory strategy data. This may take a few minutes if the data was just uploaded." />
    );

  if (error)
    return (
      <div className="error-with-retry">
        <ErrorMessage message={error} />
        <button className="retry-button" onClick={handleRetry}>
          Retry
        </button>
        <p className="retry-note">
        Note: After uploading new data, the system needs time to process and compute inventory strategies.
        </p>
      </div>
    );

  // Kiểm tra xem có dữ liệu nào được tải thành công không
  const hasStrategyData = reorderStrategy && reorderStrategy.length > 0;
  const hasChartData =
    topReorderPoints.length > 0 ||
    topSafetyStock.length > 0 ||
    topLeadTime.length > 0 ||
    topInventory.length > 0 ||
    topHoldingCost.length > 0 ||
    topPotentialSaving.length > 0;
  const hasRecommendations =
    optimizationRecommendations && optimizationRecommendations.length > 0;

  // Nếu không có dữ liệu nào, hiển thị thông báo lỗi
  if (!hasStrategyData && !hasChartData) {
    return (
      <div className="error-with-retry">
        <ErrorMessage message="Unable to load inventory strategy data. Please retry later." />
        <button className="retry-button" onClick={handleRetry}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="reorder">
      <h1 className="page-title">Inventory Strategy</h1>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === "analysis" ? "active" : ""}`}
          onClick={() => setActiveTab("analysis")}
        >
          Supplier Analysis
        </button>

        <button
          className={`tab ${activeTab === "strategy" ? "active" : ""}`}
          onClick={() => setActiveTab("strategy")}
        >
          Strategy Table
        </button>
        <button
          className={`tab ${activeTab === "charts" ? "active" : ""}`}
          onClick={() => setActiveTab("charts")}
        >
          Analytical Charts
        </button>
        {hasRecommendations && (
          <button
            className={`tab ${activeTab === "recommendations" ? "active" : ""}`}
            onClick={() => setActiveTab("recommendations")}
          >
            Optimization Recommendations
          </button>
        )}
      </div>

      {/* Bảng chiến lược tồn kho */}
      {activeTab === "strategy" && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Inventory Strategy by Category</h2>
          </div>
          <div className="card-body">
            {hasStrategyData ? (
              <div className="table-container">
                <table className="reorder-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Lead Time (days)</th>
                      <th>Forecasted Demand</th>
                      <th>Standard Deviation</th>
                      <th>Safety Stock</th>
                      <th>Reorder Point</th>
                      <th>Optimal Inventory</th>
                      <th>Holding Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reorderStrategy.map((item, index) => (
                      <tr key={index}>
                        <td>{item.category}</td>
                        <td>{item.avg_lead_time_days.toFixed(1)}</td>
                        <td>{item.forecast_avg_demand.toLocaleString()}</td>
                        <td>
                          {item.demand_std
                            ? item.demand_std.toLocaleString()
                            : "N/A"}
                        </td>
                        <td>{item.safety_stock.toLocaleString()}</td>
                        <td>{item.reorder_point.toLocaleString()}</td>
                        <td>{item.optimal_inventory.toLocaleString()}</td>
                        <td>{formatVND(item.holding_cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-data-message">
                <p>
                No inventory strategy data available. Please try again later.
                </p>
                <button className="retry-button" onClick={handleRetry}>
                  Retry
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
              <h2 className="card-title">Inventory Optimization Recommendations</h2>
            </div>
            <div className="card-body">
              <div className="download-section">
                <button
                  className="download-button"
                  onClick={handleDownloadExcel}
                >
                  📥 Download Recommendation Excel
                </button>
              </div>

              <div className="recommendations-intro">
                <Info size={20} />
                <p>
                Based on data analysis, the system provides recommendations to optimize the inventory strategy for each product category.
                </p>
              </div>

              {optimizationRecommendations.map((item, index) => (
                <div className="recommendation-card" key={index}>
                  <h3 className="recommendation-category">{item.category}</h3>
                  <ul className="recommendation-list">
                    {item.recommendations.map((rec, recIndex) => {
                      // Xác định loại khuyến nghị dựa trên nội dung
                      const isWarning =
                        rec.toLowerCase().includes("warning") ||
                        rec.toLowerCase().includes("too high") ||
                        rec.toLowerCase().includes("too low") ||
                        rec.toLowerCase().includes("risk");

                      const isPositive =
                        rec.toLowerCase().includes("good") ||
                        rec.toLowerCase().includes("appropriate") ||
                        rec.toLowerCase().includes("efficient");

                      return (
                        <li
                          key={recIndex}
                          className={`recommendation-item ${
                            isWarning ? "warning" : ""
                          } ${isPositive ? "positive" : ""}`}
                        >
                          {isWarning && <AlertTriangle size={16} />}
                          {isPositive && <CheckCircle size={16} />}
                          {!isWarning && !isPositive && <Info size={16} />}
                          <span>{rec}</span>
                        </li>
                      );
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
      <h2 className="card-title">
      Top 15 Categories by Reorder Point
      </h2>
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
          <YAxis tickFormatter={(value) => value.toLocaleString()} />
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
                <h2 className="card-title">
                Top 15 Categories by Safety Stock
                </h2>
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
                <h2 className="card-title">Top 15 Categories by Lead Time</h2>
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
                    <Bar
                      dataKey="value"
                      name="Lead Time (days)"
                      fill="#ff9800"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Biểu đồ Tồn kho tối ưu */}
          {topInventory.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">
                Top 15 Categories by Optimal Inventory
                </h2>
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
                    <Bar dataKey="value" name="Optimal Inventory" fill="#9c27b0" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
{/* Biểu đồ Chi phí lưu kho */}
{topHoldingCost.length > 0 && (
  <div className="card">
    <div className="card-header">
      <h2 className="card-title">
      Top 15 Categories by Holding Cost
      </h2>
    </div>
    <div className="card-body">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={topHoldingCost} margin={{ top: 30, right: 40, bottom: 50, left: 80 }}>
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
          <Bar dataKey="value" name="Holding Cost" fill="#f44336" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
)}
   {/* Biểu đồ Tiềm năng tiết kiệm chi phí */}
{topPotentialSaving.length > 0 && (
  <div className="card">
    <div className="card-header">
      <h2 className="card-title">
      Top 15 Categories by Potential Cost Savings
      </h2>
    </div>
    <div className="card-body">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={topPotentialSaving} margin={{ top: 30, right: 40, bottom: 50, left: 80 }}>
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
          <Bar
            dataKey="value"
            name="Potential Savings"
            fill="#00bcd4"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
)}
          {!hasChartData && (
            <div className="no-data-message">
              <p>No analytical chart data available. Please try again later.</p>
              <button className="retry-button" onClick={handleRetry}>
                Retry
              </button>
            </div>
          )}
        </div>
      )}
      {activeTab === "analysis" && (
        <div className="charts-container">
          {console.log("🔥 Tab: analysis rendered")}

          {/* Biểu đồ clustering nhà cung cấp */}
          {supplierClusters.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">
                Supplier Clustering by Delivery Behavior
                </h2>
              </div>
              <div className="card-body">
                {console.log("✅ Clustering data loaded:", supplierClusters)}
                <ResponsiveContainer width="100%" height={400}>
                  <ScatterChart>
                    <CartesianGrid />
                    <XAxis
                      type="number"
                      dataKey="avg_shipping_days"
                      name="Average Shipping Days"
                      unit=" days"
                    />
                    <YAxis
                      type="number"
                      dataKey="avg_freight"
                      name="Average Freight Cost"
                      // unit=" ₫"
                      tickFormatter={(value) => `${value / 1000}k`}
                    />
                    <ZAxis
                      type="number"
                      dataKey="total_orders"
                      range={[60, 400]}
                      name="Total Orders"
                      unit=" orders"
                    />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === "Average Freight Cost") {
                          return [formatVND(value), name];
                        }
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Scatter
                      name="Cluster 0"
                      data={supplierClusters.filter((s) => s.cluster === 0)}
                      fill="#2196f3"
                    />
                    <Scatter
                      name="Cluster 1"
                      data={supplierClusters.filter((s) => s.cluster === 1)}
                      fill="#f44336"
                    />
                    <Scatter
                      name="Cluster 2"
                      data={supplierClusters.filter((s) => s.cluster === 2)}
                      fill="#4caf50"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Biểu đồ bottlenecks (tỷ lệ giao hàng trễ) */}
          {bottlenecks.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">
                Categories with High Late Delivery Rate
                </h2>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={bottlenecks}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="seller_id"
                      tick={{ fontSize: 12 }}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis unit="%" />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend />
                    <Bar
                      dataKey="late_ratio"
                      name="Late Delivery Rate (%)"
                      fill="#e91e63"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {supplierClusters.length === 0 && bottlenecks.length === 0 && (
            <div className="no-data-message">
              <p>No supplier analysis or bottleneck data available.</p>
              <button className="retry-button" onClick={handleRetry}>
                Retry
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reorder;
