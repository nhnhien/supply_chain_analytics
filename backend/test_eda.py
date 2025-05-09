import os
from services.preprocess import preprocess_data
import matplotlib.pyplot as plt

CHART_FOLDER = os.path.join(os.path.dirname(__file__), "charts", "eda")
os.makedirs(CHART_FOLDER, exist_ok=True)

def save_chart(fig, filename):
    path = os.path.join(CHART_FOLDER, filename)
    fig.savefig(path, bbox_inches='tight')
    plt.close(fig)
    print(f"✅ Saved: {path}")

def plot_monthly_orders(df):
    orders_by_month = df.groupby("order_month").size().sort_index()
    fig, ax = plt.subplots(figsize=(10, 4))
    orders_by_month.plot(kind="line", ax=ax, marker="o")
    ax.set_title("Số lượng đơn hàng theo tháng")
    ax.set_xlabel("Tháng")
    ax.set_ylabel("Số đơn")
    ax.tick_params(axis='x', rotation=45)
    save_chart(fig, "monthly_orders.png")

def plot_top_categories(df):
    top_categories = df["product_category_name"].value_counts().head(10)
    fig, ax = plt.subplots(figsize=(8, 4))
    top_categories.plot(kind="bar", ax=ax, color="skyblue")
    ax.set_title("Top 10 danh mục sản phẩm")
    ax.set_ylabel("Số lượng")
    ax.tick_params(axis='x', rotation=45)
    save_chart(fig, "top_categories.png")

def plot_delivery_delay(df):
    delay_counts = df["delivery_delay"].dropna().apply(lambda x: "Trễ" if x > 0 else "Đúng hạn").value_counts()
    fig, ax = plt.subplots()
    delay_counts.plot(kind="pie", ax=ax, autopct='%1.1f%%', startangle=90, colors=["salmon", "lightgreen"])
    ax.set_title("Tỷ lệ đơn hàng giao trễ")
    ax.set_ylabel("")
    save_chart(fig, "delivery_delay.png")

def plot_shipping_duration_by_seller(df):
    top_sellers = df["seller_id"].value_counts().head(10).index
    seller_duration = df[df["seller_id"].isin(top_sellers)].groupby("seller_id")["shipping_duration"].mean()
    fig, ax = plt.subplots(figsize=(8, 4))
    seller_duration.sort_values().plot(kind="barh", ax=ax, color="orange")
    ax.set_xlabel("Số ngày")
    ax.set_title("Thời gian giao hàng trung bình (Top 10 seller)")
    save_chart(fig, "shipping_duration_seller.png")

def plot_shipping_cost_by_category(df):
    shipping_cost = df.groupby("product_category_name")["shipping_charges"].mean().sort_values(ascending=False).head(10)
    fig, ax = plt.subplots(figsize=(8, 4))
    shipping_cost.plot(kind="bar", ax=ax, color="violet")
    ax.set_ylabel("VND")
    ax.set_title("Average Shipping Cost by Category")
    ax.tick_params(axis='x', rotation=45)
    save_chart(fig, "shipping_cost_category.png")

def main():
    df = preprocess_data()
    print("✅ Dữ liệu đã xử lý xong, bắt đầu sinh ảnh...")

    plot_monthly_orders(df)
    plot_top_categories(df)
    plot_delivery_delay(df)
    plot_shipping_duration_by_seller(df)
    plot_shipping_cost_by_category(df)

if __name__ == "__main__":
    main()
