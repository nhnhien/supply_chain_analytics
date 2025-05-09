from collections import defaultdict
from services.preprocess import preprocess_data
from utils.plot import fig_to_base64
from utils.cache import get_cache, set_cache
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from utils.currency import brl_to_vnd
from services.mongodb import save_eda_summary

# ✅ Tổng quan EDA
def generate_eda_summary():
    cache_key = "eda_summary"
    cached = get_cache(cache_key)
    if cached:
        return cached

    df = preprocess_data()
    result = defaultdict(dict)

    orders_by_month = df.groupby("order_month").size().sort_index()
    result["orders_by_month"] = orders_by_month.to_dict()

    top_categories = df["product_category_name"].value_counts().head(15)
    result["top_categories"] = top_categories.to_dict()

    delay_counts = df["delivery_delay"].dropna().apply(lambda x: x > 0).value_counts()
    total_delays = delay_counts.sum()
    delay_rate = (delay_counts.get(True, 0) / total_delays) * 100
    result["delivery_delay_rate"] = round(delay_rate, 2)

    seller_duration = df.groupby("seller_id")["shipping_duration"].mean().sort_values().head(10)
    result["avg_shipping_duration_by_seller"] = seller_duration.to_dict()

    shipping_cost = df.groupby("product_category_name")["shipping_charges"].mean().sort_values(ascending=False).head(15)
    result["avg_shipping_cost_by_category"] = shipping_cost.to_dict()

    save_eda_summary(dict(result))

    set_cache(cache_key, result, ttl_seconds=3600)
    return result


# ✅ Chart 1: Đơn hàng theo tháng
def generate_monthly_orders_chart():
    cache_key = "chart_monthly_orders"
    cached = get_cache(cache_key)
    if cached:
        return cached

    df = preprocess_data()
    orders_by_month = df.groupby("order_month").size().sort_index()
    chart_data = [{"month": k, "value": int(v)} for k, v in orders_by_month.items()]

    fig, ax = plt.subplots(figsize=(10, 4))
    orders_by_month.plot(kind="line", ax=ax, marker="o")
    ax.set_title("Số lượng đơn hàng theo tháng")
    ax.set_xlabel("Tháng")
    ax.set_ylabel("Số đơn hàng")
    ax.tick_params(axis='x', rotation=45)

    result = {
        "chart": fig_to_base64(fig),
        "data": chart_data
    }

    set_cache(cache_key, result, ttl_seconds=3600)
    return result


# ✅ Chart 2: Top categories
def generate_top_categories_chart():
    cache_key = "chart_top_categories"
    cached = get_cache(cache_key)
    if cached:
        return cached

    df = preprocess_data()
    top_categories = df["product_category_name"].value_counts().head(15)
    chart_data = [{"category": k, "value": int(v)} for k, v in top_categories.items()]

    fig, ax = plt.subplots(figsize=(8, 4))
    top_categories.plot(kind="bar", ax=ax, color="skyblue")
    ax.set_title("Top 15 Product Categories by Order Volume")
    ax.set_ylabel("Number of Products")
    ax.set_xlabel("Category")
    ax.tick_params(axis='x', rotation=45)

    result = {
        "chart": fig_to_base64(fig),
        "data": chart_data
    }

    set_cache(cache_key, result, ttl_seconds=3600)
    return result


# ✅ Chart 3: Delivery delay ratio
def generate_delivery_delay_pie():
    cache_key = "chart_delivery_delay"
    cached = get_cache(cache_key)
    if cached:
        return cached

    df = preprocess_data()
    delay_counts = df["delivery_delay"].dropna().apply(lambda x: "Delayed" if x > 0 else "On Time").value_counts()
    chart_data = [{"status": k, "count": int(v)} for k, v in delay_counts.items()]

    fig, ax = plt.subplots()
    delay_counts.plot(kind="pie", autopct='%1.1f%%', ax=ax, startangle=90, colors=["salmon", "lightgreen"])
    ax.set_ylabel("")
    ax.set_title("Order Delivery Delay Ratio")

    result = {
        "chart": fig_to_base64(fig),
        "data": chart_data
    }

    set_cache(cache_key, result, ttl_seconds=3600)
    return result


# ✅ Chart 4: Thời gian giao hàng theo seller
def generate_shipping_duration_by_seller_chart():
    cache_key = "chart_shipping_duration_seller"
    cached = get_cache(cache_key)
    if cached:
        return cached

    df = preprocess_data()
    top_sellers = df["seller_id"].value_counts().head(15).index
    seller_duration = df[df["seller_id"].isin(top_sellers)].groupby("seller_id")["shipping_duration"].mean().sort_values()
    chart_data = [{"seller": str(k), "duration": round(v, 2)} for k, v in seller_duration.items()]

    fig, ax = plt.subplots(figsize=(8, 4))
    seller_duration.plot(kind="barh", ax=ax, color="orange")
    ax.set_xlabel("Thời gian giao hàng (ngày)")
    ax.set_title("Thời gian giao hàng trung bình (Top 15 seller)")

    result = {
        "chart": fig_to_base64(fig),
        "data": chart_data
    }

    set_cache(cache_key, result, ttl_seconds=3600)
    return result


# ✅ Chart 5: Shipping cost by category
def generate_shipping_cost_by_category_chart():
    cache_key = "chart_shipping_cost_category"
    cached = get_cache(cache_key)
    if cached:
        return cached

    df = preprocess_data()
    shipping_cost = df.groupby("product_category_name")["shipping_charges"].mean().sort_values(ascending=False).head(15)
    chart_data = [{"category": k, "cost": brl_to_vnd(round(v, 2))} for k, v in shipping_cost.items()]

    fig, ax = plt.subplots(figsize=(8, 4))
    shipping_cost.plot(kind="bar", ax=ax, color="violet")
    ax.set_ylabel("Shipping Cost (VND)")
    ax.set_title("Top 15 Categories by Shipping Cost")
    ax.tick_params(axis='x', rotation=45)

    result = {
        "chart": fig_to_base64(fig),
        "data": chart_data
    }

    set_cache(cache_key, result, ttl_seconds=3600)
    return result
