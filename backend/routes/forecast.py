from flask import Blueprint, jsonify, request
from services.preprocess import preprocess_data
from services.forecast import forecast_demand, forecast_demand_by_category
from utils.cache import get_cache, set_cache
from concurrent.futures import ProcessPoolExecutor, as_completed
import time
from routes.helpers.safe_forecast import safe_forecast

forecast_bp = Blueprint("forecast", __name__, url_prefix="/forecast")


@forecast_bp.route("/demand", methods=["GET"])
def get_demand_forecast():
    return get_forecast_for_all_categories()


@forecast_bp.route("/demand/category/<category_name>", methods=["GET"])
def get_forecast_by_category(category_name):
    try:
        result = forecast_demand_by_category(category_name)
        return jsonify(result)
    except Exception as e:
        print(f"❌ Route error for category {category_name}: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Lỗi khi xử lý dự báo cho danh mục {category_name}: {str(e)}",
            "forecast_table": [],
            "chart_data": []
        }), 500


@forecast_bp.route("/demand/all", methods=["GET"])
def get_forecast_for_all_categories():
    try:
        limit = int(request.args.get("limit", 15))
        cache_key = f"forecast_all_categories_{limit}"

        cached_result = get_cache(cache_key)
        if cached_result:
            print(f"✅ Returning cached forecast for {limit} categories")
            return jsonify(cached_result)

        df = preprocess_data()
        all_categories = df["product_category_name"].dropna().unique().tolist()
        unique_categories = list(dict.fromkeys(all_categories))
        limited_categories = unique_categories[:limit]

        all_forecasts = []

        print("🚀 Forecasting for Tổng thể...")
        t0 = time.time()
        overall = forecast_demand()
        overall["category"] = "Tổng thể"
        all_forecasts.append(overall)
        print(f"✅ Done Tổng thể in {round(time.time() - t0, 2)}s")

        print(f"🚀 Forecasting for {len(limited_categories)} categories in parallel...")
        with ProcessPoolExecutor(max_workers=4) as executor:
            futures = {executor.submit(safe_forecast, cat): cat for cat in limited_categories}
            for future in as_completed(futures):
                category = futures[future]
                try:
                    result = future.result()
                    all_forecasts.append(result)
                except Exception as e:
                    print(f"❌ Forecast failed for {category}: {str(e)}")

        set_cache(cache_key, all_forecasts, ttl_seconds=60 * 60)

        print(f"✅ All forecasts completed in {round(time.time() - t0, 2)}s")
        return jsonify(all_forecasts)

    except Exception as e:
        print(f"❌ Error in /forecast/demand/all: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Lỗi khi xử lý tất cả danh mục: {str(e)}"
        }), 500


@forecast_bp.route("/clear-cache", methods=["POST"])
def clear_forecast_cache():
    from utils.cache import _cache_store
    _cache_store.clear()
    return jsonify({"message": "Cache cleared!"})
