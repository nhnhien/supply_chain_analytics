from flask import Blueprint, jsonify
from services.forecast import forecast_demand

forecast_bp = Blueprint("forecast", __name__, url_prefix="/forecast")

@forecast_bp.route("/demand", methods=["GET"])
def get_demand_forecast():
    result = forecast_demand(periods=6)
    return jsonify({
        "forecast_table": result["forecast_table"],  # bảng dự báo
        "chart": result["chart"]                     # biểu đồ base64
    })