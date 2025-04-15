import pandas as pd
import numpy as np
from services.preprocess import preprocess_data
from services.forecast import forecast_demand, forecast_demand_by_category
from utils.cache import get_cache, set_cache
import os
from utils.cache import get_cache

def calculate_reorder_strategy():
    cache_key = "reorder_strategy"
    cached = get_cache(cache_key)
    if cached:
        return cached

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
    holding_cost_per_unit_per_month = 2
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
            print(f"✅ {category} | Holding cost = {holding_cost}")

        except Exception as e:
            print(f"⚠️ Lỗi khi xử lý {category}: {str(e)}")
            continue

    set_cache(cache_key, strategy, ttl_seconds=3600)
    return strategy


def generate_optimization_recommendations(strategy_data):
    """
    Tạo đề xuất tối ưu hóa tồn kho dựa trên chiến lược hiện tại.
    - Ưu tiên các danh mục có chi phí lưu kho cao.
    - Giảm Safety Stock và Reorder Point.
    - Tính toán potential_saving dựa trên thông số thực tế.
    """
    strategy_df = pd.DataFrame(strategy_data)

    if "holding_cost" not in strategy_df.columns:
        print("❌ Không có cột 'holding_cost' trong dữ liệu chiến lược. Bỏ qua generate_optimization_recommendations.")
        return pd.DataFrame()

    strategy_df["holding_cost"] = pd.to_numeric(strategy_df["holding_cost"], errors="coerce").fillna(0).astype(int)

    # Lọc ra top 10 danh mục có chi phí lưu kho cao nhất
    high_holding_cost = strategy_df.sort_values("holding_cost", ascending=False).head(10)

    recommendations = []

    for _, row in high_holding_cost.iterrows():
        category = row["category"]
        holding_cost = row["holding_cost"]
        safety_stock = row["safety_stock"]
        reorder_point = row["reorder_point"]
        avg_lead_time_days = row.get("avg_lead_time_days", 30)
        holding_cost_per_unit = row.get("holding_cost_per_unit", 5)

        if holding_cost > 100_000:
            # Giảm tồn kho hợp lý
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

    # Xuất file Excel nếu có dữ liệu
    output_dir = os.path.join("charts", "reorder")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "optimization_recommendations.xlsx")

    if recommendations:
        pd.DataFrame(recommendations).to_excel(output_path, index=False)
        print(f"✅ File khuyến nghị đã được tạo tại: {output_path}")
    else:
        print("⚠️ Không có khuyến nghị nào đủ điều kiện tạo Excel.")

    return pd.DataFrame(recommendations)
