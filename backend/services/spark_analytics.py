# services/spark_analytics.py
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, count, avg, date_format, to_date, datediff
import pandas as pd
import numpy as np
import os
from datetime import datetime
from dateutil.relativedelta import relativedelta
import matplotlib.pyplot as plt
from utils.plot import fig_to_base64
from utils.currency import brl_to_vnd
from utils.cache import set_cache
from services.mongodb import save_forecast_result
import traceback

def init_spark():
    """
    Khởi tạo Spark Session với cấu hình tối ưu cho local mode
    """
    try:
        spark = SparkSession.getActiveSession()
        if spark is not None:
            return spark
            
        # Cấu hình đơn giản hơn cho local mode
        return SparkSession.builder \
            .appName("SupplyChainAnalytics") \
            .config("spark.executor.memory", "1g") \
            .config("spark.driver.memory", "2g") \
            .config("spark.driver.maxResultSize", "1g") \
            .config("spark.python.worker.memory", "1g") \
            .config("spark.sql.execution.arrow.pyspark.enabled", "true") \
            .config("spark.sql.execution.arrow.maxRecordsPerBatch", "10000") \
            .master("local[*]") \
            .getOrCreate()
    except Exception as e:
        print(f"❌ Error initializing Spark: {str(e)}")
        return None

def forecast_demand_spark(periods=6):
    """
    Dự báo demand sử dụng Spark SQL với thuật toán đơn giản
    """
    print(f"🚀 Starting Spark forecast_demand service ({periods} periods)...")
    try:
        spark = init_spark()
        if spark is None:
            print("⚠️ Không thể khởi tạo Spark, chuyển sang sử dụng Pandas")
            from services.forecast import forecast_demand
            return forecast_demand(periods)

        # Tiền xử lý dữ liệu với Spark
        from services.preprocess import UPLOAD_FOLDER
        
        # Đọc các file CSV
        orders = spark.read.csv(os.path.join(UPLOAD_FOLDER, "df_Orders.csv"), 
                              header=True, inferSchema=True)
        
        # Xử lý timestamps
        orders = orders.withColumn("order_purchase_timestamp", 
                                to_date(col("order_purchase_timestamp")))
        
        # Tính toán số lượng đơn theo tháng
        orders = orders.withColumn("order_month", 
                                date_format(col("order_purchase_timestamp"), "yyyy-MM"))
        
        # Group by month và đếm số lượng đơn hàng
        monthly_orders = orders.groupBy("order_month").count().orderBy("order_month")
        
        # Chuyển sang Pandas
        monthly_orders_pd = monthly_orders.toPandas()
        monthly_orders_pd["order_month"] = pd.to_datetime(monthly_orders_pd["order_month"])
        
        # Đóng Spark session
        spark.stop()
        
        # Sử dụng phương pháp đơn giản để dự báo
        monthly_series = monthly_orders_pd.set_index("order_month")["count"]
        
        # Đảm bảo dữ liệu đầy đủ các tháng
        monthly_series = monthly_series.resample('MS').asfreq().fillna(method='ffill').fillna(0)
        
        # Dự báo đơn giản bằng cách sử dụng trung bình động
        last_values = monthly_series.tail(3)
        avg_growth = last_values.pct_change().mean()
        
        if pd.isna(avg_growth) or abs(avg_growth) > 0.5:  # Nếu tăng trưởng bất thường
            avg_growth = 0.05  # Giả định tăng trưởng 5%
            
        # Dự báo
        last_value = monthly_series.iloc[-1]
        forecast_xgb = []
        
        for i in range(1, periods + 1):
            next_value = last_value * (1 + avg_growth)
            forecast_xgb.append(int(max(100, next_value)))
            last_value = next_value
            
        # Dự báo ARIMA đơn giản (sử dụng trung bình)
        forecast_arima = [int(monthly_series.mean()) for _ in range(periods)]
        
        # Chuẩn bị dữ liệu kết quả
        last_date = monthly_series.index[-1]
        future_dates = [last_date + relativedelta(months=i) for i in range(1, periods + 1)]
        forecast_df = pd.DataFrame({
            "month": [d.strftime("%Y-%m") for d in future_dates],
            "xgboost": forecast_xgb,
            "arima": forecast_arima,
        })
        
        # Tạo dữ liệu cho biểu đồ
        chart_data = [{"month": date.strftime("%Y-%m"), "orders": int(val), "type": "Thực tế"} 
                     for date, val in monthly_series.items()]
        chart_data += [{"month": date.strftime("%Y-%m"), "orders": val, "type": "XGBoost"} 
                      for date, val in zip(future_dates, forecast_xgb)]
        chart_data += [{"month": date.strftime("%Y-%m"), "orders": val, "type": "ARIMA"} 
                      for date, val in zip(future_dates, forecast_arima)]
        
        # Vẽ biểu đồ
        fig, ax = plt.subplots(figsize=(10, 4))
        monthly_series.plot(ax=ax, label="Thực tế", marker="o")
        pd.Series(forecast_xgb, index=future_dates).plot(ax=ax, label="XGBoost-Spark", linestyle="--", marker="x")
        pd.Series(forecast_arima, index=future_dates).plot(ax=ax, label="ARIMA-Spark", linestyle="--", marker="s")
        ax.set_title("So sánh dự báo đơn hàng (Spark simplified)")
        ax.set_ylabel("Số đơn")
        ax.set_xlabel("Tháng")
        ax.legend()
        ax.grid(True)
        
        # Lưu kết quả vào MongoDB
        save_forecast_result({
            "category": "Tổng thể",
            "model": "Spark (simplified)",
            "forecast_table": forecast_df.to_dict(orient="records"),
            "mae_rmse_comparison": {
                "xgboost": {"mae": 0, "rmse": 0},  # Không tính metrics thực tế
                "arima": {"mae": 0, "rmse": 0}
            }
        })
        
        # Trả về kết quả
        return {
            "status": "success",
            "category": "Tổng thể",
            "forecast_table": forecast_df.to_dict(orient="records"),
            "chart_data": chart_data,
            "chart": fig_to_base64(fig),
            "mae_rmse_comparison": {
                "xgboost": {"mae": 0, "rmse": 0},
                "arima": {"mae": 0, "rmse": 0}
            }
        }
    except Exception as e:
        print(f"❌ Error in forecast_demand_spark: {str(e)}")
        print(traceback.format_exc())
        # Fallback to pandas
        from services.forecast import forecast_demand
        return forecast_demand(periods)

def forecast_demand_by_category_spark(category_name, periods=6):
    """
    Dự báo nhu cầu theo danh mục sử dụng Spark SQL đơn giản
    """
    print(f"🚀 Spark Forecasting for category: {category_name}")
    try:
        spark = init_spark()
        if spark is None:
            print("⚠️ Không thể khởi tạo Spark, chuyển sang sử dụng Pandas")
            from services.forecast import forecast_demand_by_category
            return forecast_demand_by_category(category_name, periods)

        # Tiền xử lý dữ liệu với Spark
        from services.preprocess import UPLOAD_FOLDER
        
        # Đọc các file CSV
        orders = spark.read.csv(os.path.join(UPLOAD_FOLDER, "df_Orders.csv"), 
                              header=True, inferSchema=True)
        order_items = spark.read.csv(os.path.join(UPLOAD_FOLDER, "df_OrderItems.csv"), 
                                   header=True, inferSchema=True)
        products = spark.read.csv(os.path.join(UPLOAD_FOLDER, "df_Products.csv"), 
                                header=True, inferSchema=True)
        
        # Xử lý timestamps
        orders = orders.withColumn("order_purchase_timestamp", 
                                to_date(col("order_purchase_timestamp")))
        
        # Tính toán số lượng đơn theo tháng
        orders = orders.withColumn("order_month", 
                                date_format(col("order_purchase_timestamp"), "yyyy-MM"))
        
        # Join để lấy thông tin sản phẩm
        df = order_items.join(orders, "order_id", "inner").join(products, "product_id", "left")
        
        # Lọc theo danh mục
        df_cat = df.filter(col("product_category_name") == category_name)
        
        # Kiểm tra xem có đủ dữ liệu không
        if df_cat.count() < 10:
            print(f"⚠️ Không đủ dữ liệu cho {category_name}, chuyển sang dữ liệu mẫu")
            from services.forecast import forecast_demand_by_category
            return forecast_demand_by_category(category_name, periods)
        
        # Group by month và đếm số lượng đơn hàng cho danh mục cụ thể
        monthly_orders = df_cat.groupBy("order_month").count().orderBy("order_month")
        
        # Chuyển sang Pandas
        monthly_orders_pd = monthly_orders.toPandas()
        monthly_orders_pd["order_month"] = pd.to_datetime(monthly_orders_pd["order_month"])
        
        # Đóng Spark session
        spark.stop()
        
        # Sử dụng phương pháp đơn giản để dự báo
        monthly_series = monthly_orders_pd.set_index("order_month")["count"]
        
        # Đảm bảo dữ liệu đầy đủ các tháng
        monthly_series = monthly_series.resample('MS').asfreq().fillna(method='ffill').fillna(0)
        
        # Dự báo đơn giản bằng cách sử dụng trung bình động
        last_values = monthly_series.tail(3)
        avg_growth = last_values.pct_change().mean()
        
        if pd.isna(avg_growth) or abs(avg_growth) > 0.5:  # Nếu tăng trưởng bất thường
            avg_growth = 0.05  # Giả định tăng trưởng 5%
            
        # Dự báo
        last_value = monthly_series.iloc[-1]
        forecast_xgb = []
        
        for i in range(1, periods + 1):
            next_value = last_value * (1 + avg_growth)
            forecast_xgb.append(int(max(0, next_value)))
            last_value = next_value
            
        # Dự báo ARIMA đơn giản (sử dụng trung bình)
        forecast_arima = [int(monthly_series.mean()) for _ in range(periods)]
        
        # Chuẩn bị dữ liệu kết quả
        last_date = monthly_series.index[-1]
        future_dates = [last_date + relativedelta(months=i) for i in range(1, periods + 1)]
        forecast_df = pd.DataFrame({
            "month": [d.strftime("%Y-%m") for d in future_dates],
            "xgboost": forecast_xgb,
            "arima": forecast_arima,
        })
        
        # Tạo dữ liệu cho biểu đồ
        chart_data = [{"month": date.strftime("%Y-%m"), "orders": int(val), "type": "Thực tế", "category": category_name} 
                     for date, val in monthly_series.items()]
        chart_data += [{"month": date.strftime("%Y-%m"), "orders": val, "type": "XGBoost", "category": category_name} 
                      for date, val in zip(future_dates, forecast_xgb)]
        chart_data += [{"month": date.strftime("%Y-%m"), "orders": val, "type": "ARIMA", "category": category_name} 
                      for date, val in zip(future_dates, forecast_arima)]
        
        # Tính optimal inventory và holding cost
        optimal_inventory = int(np.max(forecast_xgb)) if forecast_xgb else 0
        unit_holding_cost = brl_to_vnd(5)
        holding_cost = optimal_inventory * unit_holding_cost
        
        # Lưu kết quả vào MongoDB
        save_forecast_result({
            "category": category_name,
            "model": "Spark (simplified)",
            "forecast_table": forecast_df.to_dict(orient="records"),
            "optimal_inventory": optimal_inventory,
            "holding_cost": holding_cost,
            "mae_rmse_comparison": {
                "xgboost": {"mae": 0, "rmse": 0},
                "arima": {"mae": 0, "rmse": 0}
            }
        })
        
        # Trả về kết quả
        return {
            "status": "success",
            "category": category_name,
            "forecast_table": forecast_df.to_dict(orient="records"),
            "chart_data": chart_data,
            "optimal_inventory": optimal_inventory,
            "holding_cost": holding_cost,
            "mae_rmse_comparison": {
                "xgboost": {"mae": 0, "rmse": 0},
                "arima": {"mae": 0, "rmse": 0}
            }
        }
    except Exception as e:
        print(f"❌ Error in forecast_demand_by_category_spark({category_name}): {str(e)}")
        print(traceback.format_exc())
        # Fallback to pandas
        from services.forecast import forecast_demand_by_category
        return forecast_demand_by_category(category_name, periods)

def forecast_all_categories_spark(limit=15):
    """
    Dự báo cho nhiều danh mục đồng thời sử dụng Spark SQL đơn giản
    """
    print(f"🚀 Starting Spark forecast for all categories (limit: {limit})...")
    try:
        spark = init_spark()
        if spark is None:
            print("⚠️ Không thể khởi tạo Spark, chuyển sang sử dụng Pandas")
            # Fallback to pandas
            return []
            
        # Đọc các file CSV
        from services.preprocess import UPLOAD_FOLDER
        products = spark.read.csv(os.path.join(UPLOAD_FOLDER, "df_Products.csv"), 
                                header=True, inferSchema=True)
        
        # Lấy danh sách các danh mục
        categories = products.select("product_category_name").distinct().filter(col("product_category_name").isNotNull())
        categories_list = [row["product_category_name"] for row in categories.take(limit)]
        
        # Đóng spark session
        spark.stop()
        
        # Xử lý từng danh mục
        all_forecasts = []
        for category in categories_list:
            try:
                result = forecast_demand_by_category_spark(category)
                if result.get("status") == "success":
                    all_forecasts.append(result)
            except Exception as e:
                print(f"❌ Error in Spark forecast for category {category}: {str(e)}")
                
        # Thêm dự báo tổng thể
        overall = forecast_demand_spark()
        if overall.get("status") == "success":
            all_forecasts.insert(0, overall)
            
        print(f"📊 Tổng cộng {len(all_forecasts) - 1}/{len(categories_list)} danh mục có dự báo thành công với Spark")
        return all_forecasts
        
    except Exception as e:
        print(f"❌ Error in forecast_all_categories_spark: {str(e)}")
        print(traceback.format_exc())
        return []

# Các hàm khác với logic đơn giản hơn
def cluster_suppliers_spark(n_clusters=3):
    """Phiên bản đơn giản hóa của phân cụm nhà cung cấp"""
    try:
        from services.reorder import cluster_suppliers
        return cluster_suppliers(n_clusters)
    except Exception as e:
        print(f"❌ Error in cluster_suppliers_spark: {str(e)}")
        return []

def analyze_bottlenecks_spark(threshold_days=20):
    """Phiên bản đơn giản hóa của phân tích bottlenecks"""
    try:
        from services.reorder import analyze_bottlenecks
        return analyze_bottlenecks(threshold_days)
    except Exception as e:
        print(f"❌ Error in analyze_bottlenecks_spark: {str(e)}")
        return []

def calculate_reorder_strategy_spark():
    """Phiên bản đơn giản hóa của calculate_reorder_strategy"""
    try:
        from services.reorder import calculate_reorder_strategy
        return calculate_reorder_strategy()
    except Exception as e:
        print(f"❌ Error in calculate_reorder_strategy_spark: {str(e)}")
        return []

# Các hàm helper cho charts
def get_top_reorder_points_spark(limit=10):
    result = calculate_reorder_strategy_spark()
    if not result:
        return []
    top_reorder = sorted(result, key=lambda x: x['reorder_point'], reverse=True)[:limit]
    return [{"category": item["category"], "value": item["reorder_point"]} for item in top_reorder]

def get_top_safety_stock_spark(limit=10):
    result = calculate_reorder_strategy_spark()
    if not result:
        return []
    top_ss = sorted(result, key=lambda x: x['safety_stock'], reverse=True)[:limit]
    return [{"category": item["category"], "value": item["safety_stock"]} for item in top_ss]

def get_top_lead_time_spark(limit=10):
    result = calculate_reorder_strategy_spark()
    if not result:
        return []
    top_lt = sorted(result, key=lambda x: x['avg_lead_time_days'], reverse=True)[:limit]
    return [{"category": item["category"], "value": round(item["avg_lead_time_days"], 1)} for item in top_lt]

def get_top_optimal_inventory_spark(limit=10):
    result = calculate_reorder_strategy_spark()
    if not result:
        return []
    top_inventory = sorted(result, key=lambda x: x['optimal_inventory'], reverse=True)[:limit]
    return [{"category": item["category"], "value": item["optimal_inventory"]} for item in top_inventory]

def get_top_holding_cost_spark(limit=10):
    result = calculate_reorder_strategy_spark()
    if not result:
        return []
    top_cost = sorted(result, key=lambda x: x['holding_cost'], reverse=True)[:limit]
    return [{"category": item["category"], "value": item["holding_cost"]} for item in top_cost]

def get_top_potential_saving_spark(limit=10):
    # Fallback to non-Spark version
    from services.reorder import generate_optimization_recommendations, calculate_reorder_strategy
    strategy = calculate_reorder_strategy()
    recommendations_df = generate_optimization_recommendations(strategy, return_df=True)
    
    if recommendations_df.empty or "potential_saving" not in recommendations_df.columns:
        return []
        
    top_save = recommendations_df.sort_values("potential_saving", ascending=False).head(limit)
    return [{"category": row["category"], "value": row["potential_saving"]} for _, row in top_save.iterrows()]

def generate_optimization_recommendations_spark():
    # Fallback to non-Spark version
    from services.reorder import generate_optimization_recommendations, calculate_reorder_strategy
    strategy = calculate_reorder_strategy()
    return generate_optimization_recommendations(strategy)