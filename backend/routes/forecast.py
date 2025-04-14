from flask import Blueprint, jsonify
from services.forecast import forecast_demand  # ✅ import hàm đúng

forecast_bp = Blueprint("forecast", __name__, url_prefix="/forecast")

@forecast_bp.route("/demand", methods=["GET"])
def get_demand_forecast():
    try:
        result = forecast_demand()  # ✅ gọi hàm đã xử lý XGBoost + ARIMA + chart_data đúng
        return jsonify(result)
    except Exception as e:
        print(f"❌ Error in /forecast/demand: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Không thể dự báo",
            "chart_data": [],
            "forecast_table": [],
            "chart": ""
        }), 500
