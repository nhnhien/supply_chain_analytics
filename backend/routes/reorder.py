from flask import Blueprint, jsonify, request
from services.reorder import calculate_reorder_strategy, generate_optimization_recommendations, cluster_suppliers, analyze_bottlenecks
import pandas as pd
import os
from flask import send_file
from services.preprocess import is_large_dataset

reorder_bp = Blueprint("reorder", __name__, url_prefix="/reorder")

@reorder_bp.route("/strategy", methods=["GET"])
def get_reorder_strategy():
    # Kiểm tra xem có yêu cầu sử dụng Spark không
    use_spark = request.args.get("use_spark", "false").lower() == "true"
    
    # Nếu không chỉ định, kiểm tra kích thước dữ liệu
    if not use_spark:
        use_spark = is_large_dataset()
        
    if use_spark:
        print("🚀 Sử dụng Spark để tính toán chiến lược tồn kho")
        from services.spark_analytics import calculate_reorder_strategy_spark
        result = calculate_reorder_strategy_spark()
    else:
        result = calculate_reorder_strategy()
        
    strategy_df = pd.DataFrame(result)

    # Cập nhật file Excel và khuyến nghị tiềm năng
    generate_optimization_recommendations(strategy_df.to_dict(orient="records"))

    for index, row in strategy_df.iterrows():
        category = row["category"]
        holding_cost = row["holding_cost"]
        safety_stock = row["safety_stock"]
        demand = row["forecast_avg_demand"]
        lead_time = row["avg_lead_time_days"]
        
        category_recommendations = []

        if holding_cost > 10000:
            category_recommendations.append(f"Cảnh báo: Chi phí lưu kho quá cao ({holding_cost}). Xem xét giảm tồn kho tối ưu.")
        if safety_stock > demand * 2:
            category_recommendations.append(f"Safety stock ({safety_stock}) cao hơn gấp đôi nhu cầu trung bình ({demand}). Có thể giảm để tiết kiệm chi phí.")
        if lead_time > 15:
            category_recommendations.append(f"Lead time dài ({lead_time} ngày). Xem xét tìm nhà cung cấp có thời gian giao hàng ngắn hơn.")
        if safety_stock < demand * 0.2 and demand > 100:
            category_recommendations.append(f"Cảnh báo: Safety stock ({safety_stock}) quá thấp so với nhu cầu ({demand}). Có rủi ro hết hàng.")
        if demand > 500 and holding_cost < 5000:
            category_recommendations.append(f"Danh mục có nhu cầu cao ({demand}) và chi phí lưu kho thấp ({holding_cost}). Chiến lược tồn kho hiện tại tốt.")
        
        if category_recommendations:
            result[index]["optimization_recommendations"] = category_recommendations

    return jsonify(result)

@reorder_bp.route("/charts/top-reorder", methods=["GET"])
def get_top_reorder_points():
    # Tạo cache key riêng cho endpoint này để tối ưu hiệu suất
    from utils.cache import get_cache, set_cache
    cache_key = "top_reorder_points"
    
    cached = get_cache(cache_key)
    if cached:
        return jsonify({"data": cached})
    
    # Kiểm tra xem có sử dụng Spark không
    use_spark = request.args.get("use_spark", "false").lower() == "true"
    if not use_spark:
        use_spark = is_large_dataset()
        
    if use_spark:
        print("🚀 Sử dụng Spark để tính toán top reorder points")
        from services.spark_analytics import get_top_reorder_points_spark
        data = get_top_reorder_points_spark(15)
    else:
        result = calculate_reorder_strategy()
        top_reorder = sorted(result, key=lambda x: x['reorder_point'], reverse=True)[:15]
        data = [{"category": item["category"], "value": item["reorder_point"]} for item in top_reorder]
    
    # Cache kết quả
    set_cache(cache_key, data, ttl_seconds=3600)
    
    return jsonify({"data": data})

@reorder_bp.route("/charts/top-safety-stock", methods=["GET"])
def get_top_safety_stock():
    from utils.cache import get_cache, set_cache
    cache_key = "top_safety_stock"
    
    cached = get_cache(cache_key)
    if cached:
        return jsonify({"data": cached})
    
    # Kiểm tra xem có sử dụng Spark không
    use_spark = request.args.get("use_spark", "false").lower() == "true"
    if not use_spark:
        use_spark = is_large_dataset()
        
    if use_spark:
        print("🚀 Sử dụng Spark để tính toán top safety stock")
        from services.spark_analytics import get_top_safety_stock_spark
        data = get_top_safety_stock_spark(15)
    else:
        result = calculate_reorder_strategy()
        top_ss = sorted(result, key=lambda x: x['safety_stock'], reverse=True)[:15]
        data = [{"category": item["category"], "value": item["safety_stock"]} for item in top_ss]
    
    # Cache kết quả
    set_cache(cache_key, data, ttl_seconds=3600)
    
    return jsonify({"data": data})

@reorder_bp.route("/charts/top-lead-time", methods=["GET"])
def get_top_lead_time():
    from utils.cache import get_cache, set_cache
    cache_key = "top_lead_time"
    
    cached = get_cache(cache_key)
    if cached:
        return jsonify({"data": cached})
    
    # Kiểm tra xem có sử dụng Spark không
    use_spark = request.args.get("use_spark", "false").lower() == "true"
    if not use_spark:
        use_spark = is_large_dataset()
        
    if use_spark:
        print("🚀 Sử dụng Spark để tính toán top lead time")
        from services.spark_analytics import get_top_lead_time_spark
        data = get_top_lead_time_spark(15)
    else:
        result = calculate_reorder_strategy()
        top_lt = sorted(result, key=lambda x: x['avg_lead_time_days'], reverse=True)[:15]
        data = [{"category": item["category"], "value": round(item["avg_lead_time_days"], 1)} for item in top_lt]
    
    # Cache kết quả
    set_cache(cache_key, data, ttl_seconds=3600)
    
    return jsonify({"data": data})

@reorder_bp.route("/charts/top-inventory", methods=["GET"])
def get_top_optimal_inventory():
    from utils.cache import get_cache, set_cache
    cache_key = "top_optimal_inventory"
    
    cached = get_cache(cache_key)
    if cached:
        return jsonify({"data": cached})
    
    # Kiểm tra xem có sử dụng Spark không
    use_spark = request.args.get("use_spark", "false").lower() == "true"
    if not use_spark:
        use_spark = is_large_dataset()
        
    if use_spark:
        print("🚀 Sử dụng Spark để tính toán top optimal inventory")
        from services.spark_analytics import get_top_optimal_inventory_spark
        data = get_top_optimal_inventory_spark(15)
    else:
        result = calculate_reorder_strategy()
        top_inventory = sorted(result, key=lambda x: x['optimal_inventory'], reverse=True)[:15]
        data = [{"category": item["category"], "value": item["optimal_inventory"]} for item in top_inventory]
    
    # Cache kết quả
    set_cache(cache_key, data, ttl_seconds=3600)
    
    return jsonify({"data": data})

@reorder_bp.route("/charts/top-holding-cost", methods=["GET"])
def get_top_holding_cost():
    from utils.cache import get_cache, set_cache
    cache_key = "top_holding_cost"
    
    cached = get_cache(cache_key)
    if cached:
        return jsonify({"data": cached})
    
    # Kiểm tra xem có sử dụng Spark không
    use_spark = request.args.get("use_spark", "false").lower() == "true"
    if not use_spark:
        use_spark = is_large_dataset()
        
    if use_spark:
        print("🚀 Sử dụng Spark để tính toán top holding cost")
        from services.spark_analytics import get_top_holding_cost_spark
        data = get_top_holding_cost_spark(15)
    else:
        result = calculate_reorder_strategy()
        top_cost = sorted(result, key=lambda x: x['holding_cost'], reverse=True)[:15]
        data = [{"category": item["category"], "value": item["holding_cost"]} for item in top_cost]
    
    # Cache kết quả
    set_cache(cache_key, data, ttl_seconds=3600)
    
    return jsonify({"data": data})

@reorder_bp.route("/charts/top-potential-saving", methods=["GET"])
def get_top_potential_saving():
    from utils.cache import get_cache, set_cache
    cache_key = "top_potential_saving"
    
    cached = get_cache(cache_key)
    if cached:
        return jsonify({"data": cached})
    
    # Kiểm tra xem có sử dụng Spark không
    use_spark = request.args.get("use_spark", "false").lower() == "true"
    if not use_spark:
        use_spark = is_large_dataset()
        
    if use_spark:
        print("🚀 Sử dụng Spark để tính toán top potential saving")
        from services.spark_analytics import get_top_potential_saving_spark
        data = get_top_potential_saving_spark(15)
    else:
        strategy = calculate_reorder_strategy()
        recommendations_df = generate_optimization_recommendations(strategy, return_df=True)

        if recommendations_df.empty or "potential_saving" not in recommendations_df.columns:
            print("⚠️ Không có cột hoặc dữ liệu potential_saving.")
            return jsonify({"data": []})

        top_save = recommendations_df.sort_values("potential_saving", ascending=False).head(15)
        data = [{"category": row["category"], "value": row["potential_saving"]} for _, row in top_save.iterrows()]
    
    # Cache kết quả
    set_cache(cache_key, data, ttl_seconds=3600)
    
    return jsonify({"data": data})

@reorder_bp.route("/download/recommendations", methods=["GET"])
def download_recommendations():
    try:
        # Kiểm tra xem có file đã tồn tại không
        recommendations_path = os.path.join("charts", "reorder", "optimization_recommendations.xlsx")
        if os.path.exists(recommendations_path):
            return send_file(recommendations_path, as_attachment=True)

        # Nếu chưa có, kiểm tra xem có nên dùng Spark không
        use_spark = request.args.get("use_spark", "false").lower() == "true"
        if not use_spark:
            use_spark = is_large_dataset()
            
        if use_spark:
            print("🚀 Sử dụng Spark để tạo file khuyến nghị")
            from services.spark_analytics import generate_optimization_recommendations_spark
            generated_path = generate_optimization_recommendations_spark()
        else:
            strategy = calculate_reorder_strategy()
            from services.reorder import generate_optimization_recommendations
            generated_path = generate_optimization_recommendations(strategy)

        if generated_path and os.path.exists(generated_path):
            return send_file(generated_path, as_attachment=True)
        else:
            return jsonify({"error": "Không có khuyến nghị để tải"}), 400

    except Exception as e:
        print(f"❌ Error in download_recommendations: {str(e)}")
        return jsonify({"error": str(e)}), 500

@reorder_bp.route("/analysis/clustering", methods=["GET"])
def get_supplier_clusters():
    try:
        from services.mongodb import db
        # Truy vấn dữ liệu từ MongoDB
        result = list(db["supplier_clusters"].find({}, {"_id": 0}))  # ✅ Ẩn _id
        
        # Nếu không có dữ liệu trong MongoDB, thực hiện phân tích và lưu kết quả
        if not result:
            print("⚠️ Không có dữ liệu supplier_clusters trong DB, sẽ chạy phân tích mới...")
            
            # Kiểm tra xem có nên dùng Spark không
            use_spark = request.args.get("use_spark", "false").lower() == "true"
            if not use_spark:
                use_spark = is_large_dataset()
                
            if use_spark:
                print("🚀 Sử dụng Spark để phân cụm nhà cung cấp")
                from services.spark_analytics import cluster_suppliers_spark
                result = cluster_suppliers_spark()
            else:
                result = cluster_suppliers()
            
        return jsonify(result)
    except Exception as e:
        print(f"❌ Lỗi trong get_supplier_clusters: {str(e)}")
        return jsonify({"error": str(e)}), 500

@reorder_bp.route("/analysis/bottlenecks", methods=["GET"])
def get_shipping_bottlenecks():
    try:
        from services.mongodb import db
        # Truy vấn dữ liệu từ MongoDB
        result = list(db["shipping_bottlenecks"].find({}, {"_id": 0}))  # ✅ Ẩn _id
        
        # Nếu không có dữ liệu trong MongoDB, thực hiện phân tích và lưu kết quả
        if not result:
            print("⚠️ Không có dữ liệu shipping_bottlenecks trong DB, sẽ chạy phân tích mới...")
            
            # Kiểm tra xem có nên dùng Spark không
            use_spark = request.args.get("use_spark", "false").lower() == "true"
            if not use_spark:
                use_spark = is_large_dataset()
                
            if use_spark:
                print("🚀 Sử dụng Spark để phân tích bottlenecks")
                from services.spark_analytics import analyze_bottlenecks_spark
                result = analyze_bottlenecks_spark()
            else:
                result = analyze_bottlenecks()
            
        return jsonify(result)
    except Exception as e:
        print(f"❌ Lỗi trong get_shipping_bottlenecks: {str(e)}")
        return jsonify({"error": str(e)}), 500