from flask import Blueprint, jsonify
from services.preprocess import preprocess_data
from pmdarima import auto_arima
from datetime import datetime
from dateutil.relativedelta import relativedelta
import pandas as pd
import numpy as np

forecast_bp = Blueprint("forecast", __name__, url_prefix="/forecast")

@forecast_bp.route("/demand", methods=["GET"])
def get_demand_forecast():
    df = preprocess_data()

    # Tính đơn hàng theo tháng
    monthly_orders = df.groupby("order_month").size()
    monthly_orders.index = pd.to_datetime(monthly_orders.index)

    # Bỏ các tháng có số lượng đơn quá nhỏ (giảm nhiễu)
    monthly_orders = monthly_orders[monthly_orders > 100]

    # Chuyển đổi dữ liệu lịch sử thành định dạng cho Recharts/ChartJS
    historical_data = [
        {"month": date.strftime("%Y-%m"), "orders": int(count), "type": "Thực tế"} 
        for date, count in monthly_orders.items()
    ]

    # Dự báo ARIMA (không seasonal để tránh lỗi)
    model = auto_arima(monthly_orders, seasonal=False, suppress_warnings=True)
    forecast = model.predict(n_periods=6)

    # Không cho phép kết quả dự báo âm
    forecast = np.maximum(forecast, 0)

    # Tạo index cho tương lai
    last_date = monthly_orders.index[-1]
    future_index = [last_date + relativedelta(months=i) for i in range(1, 7)]

    # Chuyển đổi dữ liệu dự báo thành định dạng cho Recharts/ChartJS
    forecast_data = [
        {"month": date.strftime("%Y-%m"), "orders": int(count), "type": "Dự báo"} 
        for date, count in zip(future_index, forecast)
    ]

    # Kết hợp dữ liệu lịch sử và dự báo cho biểu đồ
    chart_data = historical_data + forecast_data

    # Tạo bảng dự báo riêng
    forecast_table = [
        {"month": date.strftime("%Y-%m"), "predicted_orders": int(count)} 
        for date, count in zip(future_index, forecast)
    ]

    return jsonify({
        "chart_data": chart_data,
        "forecast_table": forecast_table
    })