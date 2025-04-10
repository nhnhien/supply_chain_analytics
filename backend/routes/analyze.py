from flask import Blueprint, jsonify
from services.eda import generate_eda_summary
from services.eda import (
    generate_monthly_orders_chart,
    generate_top_categories_chart,
    generate_delivery_delay_pie,
    generate_shipping_duration_by_seller_chart,
    generate_shipping_cost_by_category_chart
)
analyze_bp = Blueprint("analyze", __name__, url_prefix="/analyze")

@analyze_bp.route("/summary", methods=["GET"])
def get_eda_summary():
    eda_result = generate_eda_summary()
    return jsonify(eda_result)

@analyze_bp.route("/chart/monthly-orders", methods=["GET"])
def get_monthly_orders_chart():
    base64_img = generate_monthly_orders_chart()
    return jsonify({"chart": base64_img})

@analyze_bp.route("/chart/top-categories", methods=["GET"])
def get_top_categories_chart():
    return jsonify({"chart": generate_top_categories_chart()})

@analyze_bp.route("/chart/delivery-delay", methods=["GET"])
def get_delivery_delay_chart():
    return jsonify({"chart": generate_delivery_delay_pie()})

@analyze_bp.route("/chart/seller-shipping", methods=["GET"])
def get_shipping_duration_by_seller_chart():
    return jsonify({"chart": generate_shipping_duration_by_seller_chart()})

@analyze_bp.route("/chart/shipping-cost-category", methods=["GET"])
def get_shipping_cost_by_category_chart():
    return jsonify({"chart": generate_shipping_cost_by_category_chart()})