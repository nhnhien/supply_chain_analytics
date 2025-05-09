from flask import Blueprint, jsonify, request
from services.preprocess import preprocess_data, is_large_dataset
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
        # Kiểm tra xem có yêu cầu sử dụng Spark không
        use_spark = request.args.get("use_spark", "false").lower() == "true"
        
        # Nếu không chỉ định, kiểm tra kích thước dữ liệu
        if not use_spark:
            use_spark = is_large_dataset()
            
        if use_spark:
            print(f"🚀 Sử dụng Spark để dự báo cho danh mục {category_name}")
            from services.spark_analytics import forecast_demand_by_category_spark
            result = forecast_demand_by_category_spark(category_name)
        else:
            result = forecast_demand_by_category(category_name)
            
        return jsonify(result)
    except Exception as e:
        print(f"❌ Route error for category {category_name}: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error processing forecast for category {category_name}: {str(e)}",
            "forecast_table": [],
            "chart_data": []
        }), 500


@forecast_bp.route("/demand/all", methods=["GET"])
def get_forecast_for_all_categories():
    try:
        limit = int(request.args.get("limit", 15))
        cache_key = f"forecast_all_categories_{limit}"
        
        # Kiểm tra xem có yêu cầu sử dụng Spark không
        use_spark = request.args.get("use_spark", "false").lower() == "true"
        
        # Thêm tham số force để bắt buộc tính toán lại bỏ qua cache
        force_refresh = request.args.get("force", "false").lower() == "true"
        
        # Nếu không force và có cache, sử dụng cache
        cached_result = get_cache(cache_key) if not force_refresh else None
        if cached_result:
            print(f"✅ Returning cached forecast for {limit} categories")
            return jsonify(cached_result)

        # Nếu không chỉ định, kiểm tra kích thước dữ liệu
        if not use_spark:
            use_spark = is_large_dataset()

        all_forecasts = []
            
        # Sử dụng Spark cho tập dữ liệu lớn
        if use_spark:
            print(f"🚀 Sử dụng Spark để dự báo cho tất cả danh mục")
            from services.spark_analytics import forecast_demand_spark, forecast_demand_by_category_spark
            
            # Dự báo tổng thể
            print("🚀 Forecasting for Tổng thể với Spark...")
            t0 = time.time()
            overall = forecast_demand_spark()
            overall["category"] = "Overall"
            all_forecasts.append(overall)
            print(f"✅ Done Tổng thể with Spark in {round(time.time() - t0, 2)}s")
            
            # Sử dụng Spark để xử lý song song các danh mục
            print(f"🚀 Sử dụng Spark để dự báo song song cho {limit} danh mục...")
            from services.spark_analytics import forecast_all_categories_spark
            category_forecasts = forecast_all_categories_spark(limit)
            all_forecasts.extend(category_forecasts)
            
        else:
            # Sử dụng Pandas và ProcessPoolExecutor như trước
            df = preprocess_data()
            all_categories = df["product_category_name"].dropna().unique().tolist()
            unique_categories = list(dict.fromkeys(all_categories))
            limited_categories = unique_categories[:limit]

            print("🚀 Forecasting for Tổng thể...")
            t0 = time.time()
            overall = forecast_demand()
            overall["category"] = "Overall"
            all_forecasts.append(overall)
            print(f"✅ Done Tổng thể in {round(time.time() - t0, 2)}s")

            print(f"🚀 Forecasting for {len(limited_categories)} categories in parallel...")
            with ProcessPoolExecutor(max_workers=4) as executor:
                futures = {executor.submit(safe_forecast, cat): cat for cat in limited_categories}
            for future in as_completed(futures):
                category = futures[future]
                try:
                    result = future.result()
                    print(f"✅ Forecast success for {category} - status: {result.get('status')}")
                    all_forecasts.append(result)
                except Exception as e:
                    print(f"❌ Forecast failed for {category}: {str(e)}")

        # 👉 Lọc ra những danh mục thành công
        successful_forecasts = [f for f in all_forecasts if f.get("status") == "success"]
        print(f"📊 Tổng cộng {len(successful_forecasts)}/{len(all_forecasts)} danh mục có dự báo thành công")

        set_cache(cache_key, successful_forecasts, ttl_seconds=60 * 60)
        return jsonify(successful_forecasts)


    except Exception as e:
        print(f"❌ Error in /forecast/demand/all: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error processing all categories: {str(e)}",
            "stacktrace": str(e)
        }), 500


@forecast_bp.route("/clear-cache", methods=["POST"])
def clear_forecast_cache():
    from utils.cache import _cache_store
    _cache_store.clear()
    return jsonify({"message": "Cache cleared!"})