import pandas as pd
import numpy as np
from services.preprocess import preprocess_data
from services.forecast import forecast_demand
from utils.cache import get_cache, set_cache

def calculate_reorder_strategy():
    cache_key = "reorder_strategy"
    cached = get_cache(cache_key)
    if cached:
        return cached

    df = preprocess_data()
    forecast = forecast_demand(periods=6)["forecast_table"]

    forecast_df = pd.DataFrame(forecast)
    forecast_df["predicted_orders"] = forecast_df["predicted_orders"].astype(int)
    avg_demand_per_month = forecast_df["predicted_orders"].mean()

    lead_time_df = df.groupby("product_category_name")["shipping_duration"].mean().reset_index()
    lead_time_df.columns = ["product_category_name", "avg_lead_time"]

    z_score = 1.65
    holding_cost_per_unit_per_month = 2

    strategy = []

    for _, row in lead_time_df.iterrows():
        category = row["product_category_name"]
        lead_time = row["avg_lead_time"]

        cat_df = df[df["product_category_name"] == category]
        monthly_orders = cat_df.groupby("order_month").size()
        demand_std = monthly_orders.std() if len(monthly_orders) >= 2 else 0

        safety_stock = int(z_score * demand_std * np.sqrt(lead_time)) if lead_time > 0 else 0
        reorder_point = int(avg_demand_per_month * lead_time + safety_stock)
        optimal_inventory = reorder_point + safety_stock

        lead_time_months = round(lead_time / 30, 2)
        holding_cost = int(optimal_inventory * holding_cost_per_unit_per_month * lead_time_months)

        strategy.append({
            "category": category,
            "avg_lead_time_days": round(lead_time, 2),
            "forecast_avg_demand": int(avg_demand_per_month),
            "demand_std": int(demand_std),
            "safety_stock": safety_stock,
            "reorder_point": reorder_point,
            "optimal_inventory": optimal_inventory,
            "holding_cost": holding_cost
        })

    set_cache(cache_key, strategy, ttl_seconds=3600)
    return strategy


def generate_optimization_recommendations(strategy_df): 
    # 1. Tính chi phí lưu kho hiện tại
    strategy_df["holding_cost_optimized"] = strategy_df["optimal_inventory"] * 10  # 10đ/đơn vị

    # 2. Lọc các danh mục có chi phí cao
    high_holding_cost = strategy_df.sort_values("holding_cost_optimized", ascending=False).head(10)
    recommendations = []

    for _, row in high_holding_cost.iterrows():
        category = row["category"]
        holding_cost = row["holding_cost_optimized"]
        safety_stock = row["safety_stock"]
        reorder_point = row["reorder_point"]

        # Đề xuất nếu chi phí quá cao
        if holding_cost > 1_000_000:
            new_safety_stock = int(safety_stock * 0.8)
            new_reorder_point = int(reorder_point * 0.9)
            new_optimal_inventory = new_reorder_point + new_safety_stock
            new_holding_cost = new_optimal_inventory * 10
            potential_saving = holding_cost - new_holding_cost

            recommendations.append({
                "category": category,
                "recommendation": f"Giảm Safety Stock từ {safety_stock} xuống {new_safety_stock} để tiết kiệm chi phí.",
                "new_safety_stock": new_safety_stock,
                "new_reorder_point": new_reorder_point,
                "potential_saving": int(potential_saving)  # ✅ Rất quan trọng cho biểu đồ
            })

    recommendations_df = pd.DataFrame(recommendations)
    recommendations_df.to_excel("charts/optimization_recommendations.xlsx", index=False)

    return recommendations_df
