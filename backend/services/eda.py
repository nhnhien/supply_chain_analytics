from collections import defaultdict
from services.preprocess import preprocess_data
from utils.plot import fig_to_base64
import matplotlib.pyplot as plt

def generate_eda_summary():
    df = preprocess_data()

    result = defaultdict(dict)

    # 1️⃣ Tổng đơn hàng theo tháng
    orders_by_month = df.groupby("order_month").size().sort_index()
    result["orders_by_month"] = orders_by_month.to_dict()

    # 2️⃣ Top 10 danh mục sản phẩm
    top_categories = df["product_category_name"].value_counts().head(10)
    result["top_categories"] = top_categories.to_dict()

    # 3️⃣ Tỷ lệ đơn giao trễ
    delay_counts = df["delivery_delay"].dropna().apply(lambda x: x > 0).value_counts()
    total_delays = delay_counts.sum()
    delay_rate = (delay_counts.get(True, 0) / total_delays) * 100
    result["delivery_delay_rate"] = round(delay_rate, 2)  # %

    # 4️⃣ Thời gian giao hàng trung bình theo seller
    seller_duration = df.groupby("seller_id")["shipping_duration"].mean().sort_values().head(10)
    result["avg_shipping_duration_by_seller"] = seller_duration.to_dict()

    # 5️⃣ Chi phí vận chuyển trung bình theo danh mục sản phẩm
    shipping_cost = df.groupby("product_category_name")["shipping_charges"].mean().sort_values(ascending=False).head(10)
    result["avg_shipping_cost_by_category"] = shipping_cost.to_dict()

    return result


def generate_monthly_orders_chart():
    df = preprocess_data()
    orders_by_month = df.groupby("order_month").size().sort_index()

    fig, ax = plt.subplots(figsize=(10, 4))
    orders_by_month.plot(kind="line", ax=ax, marker="o")
    ax.set_title("Số lượng đơn hàng theo tháng")
    ax.set_xlabel("Tháng")
    ax.set_ylabel("Số đơn hàng")
    ax.tick_params(axis='x', rotation=45)

    return fig_to_base64(fig)

# 1️⃣ Top 10 danh mục sản phẩm
def generate_top_categories_chart():
    df = preprocess_data()
    top_categories = df["product_category_name"].value_counts().head(10)

    fig, ax = plt.subplots(figsize=(8, 4))
    top_categories.plot(kind="bar", ax=ax, color="skyblue")
    ax.set_title("Top 10 danh mục sản phẩm phổ biến")
    ax.set_ylabel("Số lượng sản phẩm")
    ax.set_xlabel("Danh mục")
    ax.tick_params(axis='x', rotation=45)

    return fig_to_base64(fig)

# 2️⃣ Biểu đồ pie: Tỷ lệ giao trễ
def generate_delivery_delay_pie():
    df = preprocess_data()
    delay_counts = df["delivery_delay"].dropna().apply(lambda x: "Trễ" if x > 0 else "Đúng hạn").value_counts()

    fig, ax = plt.subplots()
    delay_counts.plot(kind="pie", autopct='%1.1f%%', ax=ax, startangle=90, colors=["salmon", "lightgreen"])
    ax.set_ylabel("")
    ax.set_title("Tỷ lệ đơn hàng giao trễ")

    return fig_to_base64(fig)

# 3️⃣ Thời gian giao hàng trung bình theo seller
def generate_shipping_duration_by_seller_chart():
    df = preprocess_data()
    top_sellers = df["seller_id"].value_counts().head(10).index
    seller_duration = df[df["seller_id"].isin(top_sellers)].groupby("seller_id")["shipping_duration"].mean()

    fig, ax = plt.subplots(figsize=(8, 4))
    seller_duration.sort_values().plot(kind="barh", ax=ax, color="orange")
    ax.set_xlabel("Thời gian giao hàng (ngày)")
    ax.set_title("Thời gian giao hàng trung bình (Top 10 seller)")

    return fig_to_base64(fig)

# 4️⃣ Chi phí vận chuyển trung bình theo danh mục
def generate_shipping_cost_by_category_chart():
    df = preprocess_data()
    shipping_cost = df.groupby("product_category_name")["shipping_charges"].mean().sort_values(ascending=False).head(10)

    fig, ax = plt.subplots(figsize=(8, 4))
    shipping_cost.plot(kind="bar", ax=ax, color="violet")
    ax.set_ylabel("Chi phí vận chuyển (VND)")
    ax.set_title("Chi phí vận chuyển trung bình theo danh mục")
    ax.tick_params(axis='x', rotation=45)

    return fig_to_base64(fig)