import pandas as pd
import numpy as np
from services.preprocess import preprocess_data
from services.forecast import forecast_demand

def calculate_reorder_strategy():
    import numpy as np
    from services.preprocess import preprocess_data
    from services.forecast import forecast_demand

    df = preprocess_data()
    forecast = forecast_demand(periods=6)["forecast_table"]

    # Lấy forecast tổng nhu cầu trong 6 tháng
    forecast_df = pd.DataFrame(forecast)
    forecast_df["predicted_orders"] = forecast_df["predicted_orders"].astype(int)
    avg_demand_per_month = forecast_df["predicted_orders"].mean()

    # Tính shipping_duration trung bình theo danh mục
    lead_time_df = df.groupby("product_category_name")["shipping_duration"].mean().reset_index()
    lead_time_df.columns = ["product_category_name", "avg_lead_time"]

    z_score = 1.65  # 95% service level
    holding_cost_per_unit_per_month = 2  # giả định chi phí lưu kho 2đ/sản phẩm/tháng

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

        # ✅ Tính holding cost
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

    return strategy
