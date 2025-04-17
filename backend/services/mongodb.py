from pymongo import MongoClient
from datetime import datetime
import os

# ✅ Kết nối MongoDB Atlas
MONGO_URI = os.getenv(
    "MONGODB_URI",
    "mongodb+srv://nhiennh:Ai123456@supply-chain-analytics.32bti02.mongodb.net/?retryWrites=true&w=majority&appName=supply-chain-analytics"
)

client = MongoClient(MONGO_URI)
db = client["supply_chain"]  # 📦 Database chính

# ✅ 1. Lưu kết quả dự báo
def save_forecast_result(forecast_result: dict):
    forecast_result["timestamp"] = datetime.utcnow()
    db["forecast_results"].replace_one(
        {"category": forecast_result.get("category")},  # ghi đè theo category
        forecast_result,
        upsert=True
    )
    print(f"✅ Đã cập nhật forecast: {forecast_result.get('category')}")

# ✅ 2. Lưu chiến lược tồn kho
def save_reorder_strategy(strategy_list: list):
    now = datetime.utcnow()
    for entry in strategy_list:
        entry["timestamp"] = now
        db["reorder_strategies"].replace_one(
            {"category": entry["category"]},
            entry,
            upsert=True
        )
    print(f"✅ Đã cập nhật {len(strategy_list)} chiến lược reorder_strategies")

# ✅ 3. Lưu khuyến nghị tối ưu tồn kho
def save_reorder_recommendations(recommendations: list):
    now = datetime.utcnow()
    for rec in recommendations:
        rec["timestamp"] = now
        db["reorder_recommendations"].replace_one(
            {"category": rec["category"]},
            rec,
            upsert=True
        )
    print(f"✅ Đã cập nhật {len(recommendations)} khuyến nghị reorder_recommendations")

# ✅ 4. Lưu phân cụm supplier
def save_supplier_clusters(cluster_result: list):
    now = datetime.utcnow()
    for supplier in cluster_result:
        supplier["timestamp"] = now
        db["supplier_clusters"].replace_one(
            {"seller_id": supplier["seller_id"]},
            supplier,
            upsert=True
        )
    print(f"✅ Đã cập nhật {len(cluster_result)} supplier clusters")

# ✅ 5. Lưu phân tích bottleneck seller
def save_bottleneck_analysis(bottlenecks: list):
    now = datetime.utcnow()
    for seller in bottlenecks:
        seller["timestamp"] = now
        db["shipping_bottlenecks"].replace_one(
            {"seller_id": seller["seller_id"]},
            seller,
            upsert=True
        )
    print(f"✅ Đã cập nhật {len(bottlenecks)} bottlenecks")

# ✅ 6. Lưu EDA summary
def save_eda_summary(summary_dict: dict):
    summary_dict["timestamp"] = datetime.utcnow()
    db["eda_summaries"].insert_one(summary_dict)
    print("✅ Đã lưu EDA summary")

# ✅ 7. Truy vấn lịch sử forecast gần nhất
def get_recent_forecasts(limit=10):
    try:
        return list(db["forecast_results"].find({}, {"_id": 0}).sort("timestamp", -1).limit(limit))
    except Exception as e:
        print(f"❌ Lỗi khi lấy forecast history từ MongoDB: {e}")
        return []
