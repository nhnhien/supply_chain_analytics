import os
import pandas as pd
import matplotlib.pyplot as plt
from services.preprocess import preprocess_data
from utils.plot import fig_to_base64
from pmdarima import auto_arima
from datetime import datetime
from dateutil.relativedelta import relativedelta
import numpy as np
from utils.cache import get_cache, set_cache

def forecast_demand(periods=6):
    cache_key = f"forecast_demand_{periods}"
    cached = get_cache(cache_key)
    if cached:
        return cached

    df = preprocess_data()
    monthly_orders = df.groupby("order_month").size()
    monthly_orders.index = pd.to_datetime(monthly_orders.index)
    monthly_orders = monthly_orders[monthly_orders > 100]

    model = auto_arima(monthly_orders, seasonal=False, suppress_warnings=True)
    forecast = model.predict(n_periods=periods)
    forecast = np.maximum(forecast, 0)

    last_date = monthly_orders.index[-1]
    future_index = [last_date + relativedelta(months=i) for i in range(1, periods + 1)]

    forecast_series = pd.Series(forecast, index=future_index)
    forecast_df = pd.DataFrame({
        "month": [d.strftime("%Y-%m") for d in future_index],
        "predicted_orders": forecast.astype(int)
    })

    fig, ax = plt.subplots(figsize=(10, 4))
    monthly_orders.plot(ax=ax, label="Thực tế", marker="o")
    forecast_series.plot(ax=ax, label="Dự báo", linestyle="--", marker="x", color="orange")
    ax.set_title("Dự báo số đơn hàng theo tháng (ARIMA)")
    ax.set_ylabel("Số đơn")
    ax.set_xlabel("Tháng")
    ax.legend()
    ax.grid(True)

    charts_dir = os.path.join(os.path.dirname(__file__), "../charts")
    os.makedirs(charts_dir, exist_ok=True)
    fig_path = os.path.join(charts_dir, "forecast_chart.png")
    fig.savefig(fig_path, bbox_inches='tight')

    chart_base64 = fig_to_base64(fig)

    result = {
        "forecast_table": forecast_df.to_dict(orient="records"),
        "chart": chart_base64
    }

    set_cache(cache_key, result, ttl_seconds=3600)
    return result