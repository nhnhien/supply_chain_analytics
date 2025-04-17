# routes/history.py
from flask import Blueprint, jsonify
from services.mongodb import get_recent_forecasts

history_bp = Blueprint("history", __name__, url_prefix="/history")

@history_bp.route("/forecast", methods=["GET"])
def view_forecast_history():
    try:
        results = get_recent_forecasts(limit=20)  # ⬅️ Lấy tối đa 20 bản ghi mới nhất
        return jsonify({
            "status": "success",
            "count": len(results),
            "results": results
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e),
            "results": []
        }), 500
