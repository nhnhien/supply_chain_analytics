from flask import Blueprint, jsonify
from services.reorder import calculate_reorder_strategy

reorder_bp = Blueprint("reorder", __name__, url_prefix="/reorder")

@reorder_bp.route("/strategy", methods=["GET"])
def get_reorder_strategy():
    result = calculate_reorder_strategy()
    return jsonify(result)
