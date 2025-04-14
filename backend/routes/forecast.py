from flask import Blueprint, jsonify, request
from services.preprocess import preprocess_data
from services.forecast import forecast_demand, forecast_demand_by_category
from utils.cache import get_cache, set_cache

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
        limit = int(request.args.get("limit", 3))
        cache_key = f"forecast_all_categories_{limit}"

        cached_result = get_cache(cache_key)
        if cached_result:
            print(f"✅ Returning cached forecast for {limit} categories")
            return jsonify(cached_result)

        df = preprocess_data()
        all_categories = df["product_category_name"].dropna().unique().tolist()

        # Chỉ lấy giới hạn ban đầu
        limited_categories = all_categories[:limit]

        all_forecasts = []

        # Tổng thể
        overall = forecast_demand()
        overall["category"] = "Tổng thể"
        all_forecasts.append(overall)

        # Chạy từng danh mục được giới hạn
        for category_name in limited_categories:
            try:
                result = forecast_demand_by_category(category_name)
                result["category"] = category_name
                all_forecasts.append(result)
            except Exception as e:
                print(f"⚠️ Skipping category {category_name} due to error: {str(e)}")
                all_forecasts.append({
                    "category": category_name,
                    "forecast_table": [],
                    "chart_data": [],
                    "status": "error",
                    "message": str(e)
                })

        # Cache trước khi trả về
        set_cache(cache_key, all_forecasts, ttl_seconds=60 * 60)

        # ⛔️ Không gọi forecast thêm ở đâu nữa sau dòng này
        return jsonify(all_forecasts)

    except Exception as e:
        print(f"❌ Error in /forecast/demand/all: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Lỗi khi xử lý tất cả danh mục: {str(e)}"
        }), 500


# @forecast_bp.route("/demand/all", methods=["GET"])
# def get_forecast_for_all_categories():
#     try:
#         cache_key = "forecast_all_categories"
#         cached_result = get_cache(cache_key)

#         if cached_result:
#             print("✅ Returning cached forecast for all categories")
#             return jsonify(cached_result)

#         df = preprocess_data()
#         # all_categories = df["product_category_name"].dropna().unique().tolist()
#         all_categories = df["product_category_name"].dropna().unique().tolist()[:10]

#         all_forecasts = []

#         # Tổng thể
#         overall = forecast_demand()
#         overall["category"] = "Tổng thể"
#         all_forecasts.append(overall)

#         # Theo danh mục
#         for category_name in all_categories:
#             try:
#                 result = forecast_demand_by_category(category_name)
#                 result["category"] = category_name
#                 all_forecasts.append(result)
#             except Exception as e:
#                 print(f"⚠️ Skipping category {category_name} due to error: {str(e)}")
#                 all_forecasts.append({
#                     "category": category_name,
#                     "forecast_table": [],
#                     "chart_data": [],
#                     "status": "error",
#                     "message": str(e)
#                 })

#         # Cache kết quả trong 1 giờ
#         set_cache(cache_key, all_forecasts, ttl_seconds=60 * 60)

#         return jsonify(all_forecasts)

#     except Exception as e:
#         print(f"❌ Error in /forecast/demand/all: {str(e)}")
#         return jsonify({
#             "status": "error",
#             "message": f"Lỗi khi xử lý tất cả danh mục: {str(e)}"
#         }), 500


@forecast_bp.route("/clear-cache", methods=["POST"])
def clear_forecast_cache():
    from utils.cache import _cache_store
    _cache_store.clear()
    return jsonify({"message": "Cache cleared!"})