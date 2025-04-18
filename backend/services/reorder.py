import pandas as pd
import numpy as np
from services.preprocess import preprocess_data, is_large_dataset
from services.forecast import forecast_demand, forecast_demand_by_category
from utils.cache import get_cache, set_cache
from utils.currency import brl_to_vnd, format_vnd
import os
from sklearn.cluster import KMeans
from services.mongodb import (
    save_reorder_strategy,
    save_reorder_recommendations,
    save_supplier_clusters,
    save_bottleneck_analysis,
)

def calculate_reorder_strategy():
    cache_key = "reorder_strategy"
    cached = get_cache(cache_key)
    if cached:
        return cached

    # Kiểm tra xem có dùng Spark hay không
    use_spark = is_large_dataset()
    if use_spark:
        print("📊 Sử dụng Spark để tính toán chiến lược reorder (dữ liệu lớn)")
        from services.spark_analytics import calculate_reorder_strategy_spark
        return calculate_reorder_strategy_spark()
    
    # Nếu không dùng Spark, tiếp tục với code hiện tại
    df = preprocess_data()
    categories = df["product_category_name"].dropna().unique()

    forecast_cache_key = "forecast_all_categories_15"
    cached_forecasts = get_cache(forecast_cache_key)

    # 🔁 Nếu chưa có cache, tự gọi forecast_demand_all
    if not cached_forecasts:
        print("⚠️ Forecast cache chưa có, tự động gọi forecast_demand_all...")
        from routes.forecast import get_forecast_for_all_categories
        response = get_forecast_for_all_categories()
        cached_forecasts = response.get_json()

    if not cached_forecasts:
        print("❌ Forecast cache vẫn chưa sẵn sàng sau khi gọi. Dừng lại.")
        return []

    forecast_map = {f["category"]: f for f in cached_forecasts if f["status"] == "success"}

    z_score = 1.65
    # Chuyển đổi giá trị từ BRL sang VND
    holding_cost_per_unit_per_month = brl_to_vnd(2)  # Giả sử chi phí 2 BRL/đơn vị/tháng
    strategy = []

    for category in categories:
        if category not in forecast_map:
            print(f"⚠️ Bỏ qua {category} vì không có trong forecast cache.")
            continue

        try:
            forecast_result = forecast_map[category]
            forecast_df = pd.DataFrame(forecast_result["forecast_table"])
            forecast_df["predicted_orders"] = forecast_df["xgboost"].astype(int)
            avg_demand = forecast_df["predicted_orders"].mean()
            demand_std = forecast_df["predicted_orders"].std()

            cat_df = df[df["product_category_name"] == category]
            lead_time = cat_df["shipping_duration"].mean()
            lead_time_months = round(lead_time / 30, 2)

            safety_stock = int(z_score * demand_std * np.sqrt(lead_time)) if lead_time > 0 else 0
            reorder_point = int(avg_demand * lead_time + safety_stock)
            optimal_inventory = reorder_point + safety_stock
            holding_cost = int(optimal_inventory * holding_cost_per_unit_per_month * lead_time_months)

            strategy.append({
                "category": category,
                "avg_lead_time_days": round(lead_time, 2),
                "forecast_avg_demand": int(avg_demand),
                "demand_std": int(demand_std),
                "safety_stock": safety_stock,
                "reorder_point": reorder_point,
                "optimal_inventory": optimal_inventory,
                "holding_cost": holding_cost
            })
            print(f"✅ {category} | Holding cost = {format_vnd(holding_cost)}")

        except Exception as e:
            print(f"⚠️ Lỗi khi xử lý {category}: {str(e)}")
            continue

    set_cache(cache_key, strategy, ttl_seconds=3600)
    save_reorder_strategy(strategy)
    return strategy


def generate_optimization_recommendations(strategy_data, return_df=False):
    recommendations = []
    
    strategy_df = pd.DataFrame(strategy_data)

    if "holding_cost" not in strategy_df.columns:
        print("❌ Không có cột 'holding_cost'.")
        return pd.DataFrame() if return_df else None

    strategy_df["holding_cost"] = pd.to_numeric(strategy_df["holding_cost"], errors="coerce").fillna(0).astype(int)
    high_holding_cost = strategy_df.sort_values("holding_cost", ascending=False).head(10)

    for _, row in high_holding_cost.iterrows():
        category = row["category"]
        holding_cost = row["holding_cost"]
        safety_stock = row["safety_stock"]
        reorder_point = row["reorder_point"]
        avg_lead_time_days = row.get("avg_lead_time_days", 30)
        holding_cost_per_unit = row.get("holding_cost_per_unit", brl_to_vnd(5))

        if holding_cost > 100_000:
            new_safety_stock = int(safety_stock * 0.8)
            new_reorder_point = int(reorder_point * 0.9)
            new_optimal_inventory = new_safety_stock + new_reorder_point
            new_holding_cost = int(new_optimal_inventory * holding_cost_per_unit * round(avg_lead_time_days / 30, 2))
            potential_saving = holding_cost - new_holding_cost

            recommendations.append({
                "category": category,
                "recommendation": (
                    f"Giảm Safety Stock từ {safety_stock} → {new_safety_stock} "
                    f"và Reorder Point từ {reorder_point} → {new_reorder_point} để tiết kiệm chi phí."
                ),
                "new_safety_stock": new_safety_stock,
                "new_reorder_point": new_reorder_point,
                "new_optimal_inventory": new_optimal_inventory,
                "new_holding_cost": new_holding_cost,
                "potential_saving": potential_saving
            })

    if not recommendations:
        print("⚠️ Không có khuyến nghị nào đủ điều kiện.")
        return pd.DataFrame() if return_df else None

    save_reorder_recommendations(recommendations)

    df = pd.DataFrame(recommendations)

    # ✅ Ghi file Excel để hỗ trợ route download
    output_dir = os.path.join("charts", "reorder")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "optimization_recommendations.xlsx")
    df.to_excel(output_path, index=False)

    print(f"✅ File khuyến nghị đã được tạo tại: {output_path}")

    return df if return_df else output_path


def cluster_suppliers(n_clusters=3):
    """
    Phân cụm nhà cung cấp dựa trên số lượng đơn hàng, thời gian giao hàng,
    và chi phí vận chuyển trung bình.
    """
    try:
        print("🚀 Bắt đầu phân cụm nhà cung cấp...")
        cache_key = "supplier_clusters"
        cached = get_cache(cache_key)
        if cached:
            return cached

        # Kiểm tra xem có nên dùng Spark hay không
        use_spark = is_large_dataset()
        if use_spark:
            print("📊 Sử dụng Spark để phân cụm nhà cung cấp (dữ liệu lớn)")
            from services.spark_analytics import cluster_suppliers_spark
            clusters = cluster_suppliers_spark(n_clusters)
            
            # Cache và lưu kết quả
            set_cache(cache_key, clusters, ttl_seconds=3600*24)
            save_supplier_clusters(clusters)
            
            return clusters

        # Nếu không dùng Spark, tiếp tục với code hiện tại
        df = preprocess_data()

        supplier_df = df.groupby("seller_id").agg({
            "order_id": "nunique",
            "shipping_duration": "mean",
            "shipping_charges": "mean"  # ✅ dùng đúng tên cột
        }).reset_index()

        supplier_df.columns = ["seller_id", "total_orders", "avg_shipping_days", "avg_freight"]
        
        # Đảm bảo dữ liệu có đúng định dạng
        supplier_df["avg_shipping_days"] = supplier_df["avg_shipping_days"].fillna(0).astype(float)
        supplier_df["avg_freight"] = supplier_df["avg_freight"].apply(lambda x: float(brl_to_vnd(x)) if pd.notnull(x) else 0)
        supplier_df["total_orders"] = supplier_df["total_orders"].fillna(0).astype(int)
        
        # Lọc những nhà cung cấp có ít nhất 5 đơn hàng
        filtered_suppliers = supplier_df[supplier_df["total_orders"] >= 5].copy()
        
        if len(filtered_suppliers) < n_clusters:
            print(f"⚠️ Không đủ nhà cung cấp để phân thành {n_clusters} cụm. Chỉ có {len(filtered_suppliers)} seller đủ điều kiện.")
            # Giảm số cụm nếu không đủ dữ liệu
            n_clusters = max(2, len(filtered_suppliers) // 2)
            
        print(f"ℹ️ Phân cụm {len(filtered_suppliers)} nhà cung cấp thành {n_clusters} nhóm")

        # Chuẩn hóa dữ liệu để tránh bias
        features = filtered_suppliers[["total_orders", "avg_shipping_days", "avg_freight"]].fillna(0)
        from sklearn.preprocessing import StandardScaler
        scaler = StandardScaler()
        features_scaled = scaler.fit_transform(features)

        # Phân cụm
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        filtered_suppliers["cluster"] = kmeans.fit_predict(features_scaled)

        # Thêm mô tả cụm
        cluster_stats = filtered_suppliers.groupby("cluster").agg({
            "avg_shipping_days": "mean",
            "avg_freight": "mean",
            "total_orders": "mean"
        })
        
        cluster_descriptions = {}
        for cluster_id, stats in cluster_stats.iterrows():
            if stats["avg_shipping_days"] < 15 and stats["avg_freight"] < 500000:
                description = "Nhanh và rẻ"
            elif stats["avg_shipping_days"] < 15 and stats["avg_freight"] >= 500000:
                description = "Nhanh nhưng đắt"
            elif stats["avg_shipping_days"] >= 15 and stats["avg_freight"] < 500000:
                description = "Chậm nhưng rẻ"
            else:
                description = "Chậm và đắt"
                
            cluster_descriptions[cluster_id] = description
            
        filtered_suppliers["cluster_description"] = filtered_suppliers["cluster"].map(cluster_descriptions)

        # Chuyển thành dạng dict để lưu và trả về
        clusters = filtered_suppliers.to_dict(orient="records")
        
        # Cache và lưu kết quả
        set_cache(cache_key, clusters, ttl_seconds=3600*24)
        save_supplier_clusters(clusters)
        
        print(f"✅ Hoàn thành phân cụm: {len(clusters)} nhà cung cấp")
        return clusters

    except Exception as e:
        print(f"❌ Lỗi trong quá trình phân cụm nhà cung cấp: {str(e)}")
        import traceback
        traceback.print_exc()
        return []


def analyze_bottlenecks(threshold_days=20):
    """
    Phân tích các bottleneck trong quy trình giao hàng, xác định các nhà cung cấp 
    có tỷ lệ giao hàng trễ cao
    """
    try:
        print("🚀 Bắt đầu phân tích bottleneck giao hàng...")
        cache_key = "shipping_bottlenecks"
        cached = get_cache(cache_key)
        if cached:
            return cached

        # Kiểm tra xem có nên dùng Spark hay không
        use_spark = is_large_dataset()
        if use_spark:
            print("📊 Sử dụng Spark để phân tích bottlenecks (dữ liệu lớn)")
            from services.spark_analytics import analyze_bottlenecks_spark
            bottlenecks = analyze_bottlenecks_spark(threshold_days)
            
            # Cache và lưu kết quả
            set_cache(cache_key, bottlenecks, ttl_seconds=3600*24)
            save_bottleneck_analysis(bottlenecks)
            
            return bottlenecks

        # Nếu không dùng Spark, tiếp tục với code hiện tại
        df = preprocess_data()

        # Xác định đơn hàng nào bị trễ dựa trên ngưỡng
        df["is_late"] = df["shipping_duration"] > threshold_days
        
        print("📦 Thống kê shipping_duration:")
        print(df["shipping_duration"].describe())
        
        late_ratio_all = (df["is_late"].mean() * 100)
        print(f"⚠️ Tỷ lệ đơn hàng bị trễ toàn bộ theo ngưỡng {threshold_days} ngày: {late_ratio_all:.2f}%")

        # Phân tích theo từng nhà cung cấp
        bottlenecks = df.groupby("seller_id").agg({
            "order_id": "count",
            "is_late": "mean",
            "product_category_name": lambda x: x.mode()[0] if not x.mode().empty else "Unknown",
            "shipping_duration": "mean"
        }).reset_index()

        bottlenecks.columns = ["seller_id", "total_orders", "late_ratio", "top_category", "avg_delivery_time"]

        # Chỉ lấy seller có ít nhất 5 đơn và tỷ lệ trễ cao hơn trung bình
        bottlenecks = bottlenecks[(bottlenecks["total_orders"] >= 5) & 
                                  (bottlenecks["late_ratio"] > late_ratio_all/100)]

        # Thêm thông tin phần trăm
        bottlenecks["late_percentage"] = (bottlenecks["late_ratio"] * 100).round(1)
        
        # Thêm ghi chú mức độ nghiêm trọng
        def get_severity(row):
            if row["late_percentage"] > 75:
                return "Rất nghiêm trọng"
            elif row["late_percentage"] > 50:
                return "Nghiêm trọng"
            elif row["late_percentage"] > 25:
                return "Trung bình"
            else:
                return "Nhẹ"
        
        bottlenecks["severity"] = bottlenecks.apply(get_severity, axis=1)
        
        # Lấy 10 seller có vấn đề nhất
        top_bottlenecks = bottlenecks.sort_values("late_percentage", ascending=False).head(10)
        
        # Chuẩn bị kết quả
        top_bottlenecks_list = top_bottlenecks.to_dict(orient="records")
        
        # Cache và lưu kết quả
        set_cache(cache_key, top_bottlenecks_list, ttl_seconds=3600*24)
        save_bottleneck_analysis(top_bottlenecks_list)
        
        print(f"✅ Hoàn thành phân tích bottleneck: {len(top_bottlenecks_list)} seller có vấn đề")
        return top_bottlenecks_list

    except Exception as e:
        print(f"❌ Lỗi trong quá trình phân tích bottleneck: {str(e)}")
        import traceback
        traceback.print_exc()
        return []