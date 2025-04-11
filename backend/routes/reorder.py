from flask import Blueprint, jsonify
from services.reorder import calculate_reorder_strategy

reorder_bp = Blueprint("reorder", __name__, url_prefix="/reorder")

@reorder_bp.route("/strategy", methods=["GET"])
def get_reorder_strategy():
    result = calculate_reorder_strategy()
    
    # Dữ liệu đã sẵn sàng cho hiển thị bảng
    return jsonify(result)

@reorder_bp.route("/charts/top-reorder", methods=["GET"])
def get_top_reorder_points():
    result = calculate_reorder_strategy()
    
    # Sắp xếp theo reorder_point và lấy top 10
    top_reorder = sorted(result, key=lambda x: x['reorder_point'], reverse=True)[:10]
    
    # Định dạng dữ liệu cho biểu đồ
    data = [
        {"category": item["category"], "value": item["reorder_point"]} 
        for item in top_reorder
    ]
    
    return jsonify({"data": data})

@reorder_bp.route("/charts/top-safety-stock", methods=["GET"])
def get_top_safety_stock():
    result = calculate_reorder_strategy()
    
    # Sắp xếp theo safety_stock và lấy top 10
    top_ss = sorted(result, key=lambda x: x['safety_stock'], reverse=True)[:10]
    
    # Định dạng dữ liệu cho biểu đồ
    data = [
        {"category": item["category"], "value": item["safety_stock"]} 
        for item in top_ss
    ]
    
    return jsonify({"data": data})

@reorder_bp.route("/charts/top-lead-time", methods=["GET"])
def get_top_lead_time():
    result = calculate_reorder_strategy()
    
    # Sắp xếp theo avg_lead_time_days và lấy top 10
    top_lt = sorted(result, key=lambda x: x['avg_lead_time_days'], reverse=True)[:10]
    
    # Định dạng dữ liệu cho biểu đồ
    data = [
        {"category": item["category"], "value": round(item["avg_lead_time_days"], 1)} 
        for item in top_lt
    ]
    
    return jsonify({"data": data})

@reorder_bp.route("/charts/top-inventory", methods=["GET"])
def get_top_optimal_inventory():
    result = calculate_reorder_strategy()
    
    # Sắp xếp theo optimal_inventory và lấy top 10
    top_inventory = sorted(result, key=lambda x: x['optimal_inventory'], reverse=True)[:10]
    
    # Định dạng dữ liệu cho biểu đồ
    data = [
        {"category": item["category"], "value": item["optimal_inventory"]} 
        for item in top_inventory
    ]
    
    return jsonify({"data": data})

@reorder_bp.route("/charts/top-holding-cost", methods=["GET"])
def get_top_holding_cost():
    result = calculate_reorder_strategy()
    
    # Sắp xếp theo holding_cost và lấy top 10
    top_cost = sorted(result, key=lambda x: x['holding_cost'], reverse=True)[:10]
    
    # Định dạng dữ liệu cho biểu đồ
    data = [
        {"category": item["category"], "value": item["holding_cost"]} 
        for item in top_cost
    ]
    
    return jsonify({"data": data})