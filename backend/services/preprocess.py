import os
import pandas as pd

UPLOAD_FOLDER = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))

def load_csv(filename):
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    return pd.read_csv(file_path)

def preprocess_data():
    # Load files
    customers = load_csv("df_Customers.csv")
    orders = load_csv("df_Orders.csv")
    order_items = load_csv("df_OrderItems.csv")
    products = load_csv("df_Products.csv")

    # Convert timestamp
    orders["order_purchase_timestamp"] = pd.to_datetime(orders["order_purchase_timestamp"])
    orders["order_delivered_timestamp"] = pd.to_datetime(orders["order_delivered_timestamp"])
    orders["order_estimated_delivery_date"] = pd.to_datetime(orders["order_estimated_delivery_date"])

    # Merge data
    df = pd.merge(order_items, orders, on="order_id", how="inner")
    df = pd.merge(df, products, on="product_id", how="left")
    df = pd.merge(df, customers, on="customer_id", how="left")

    # Feature engineering
    df["shipping_duration"] = (df["order_delivered_timestamp"] - df["order_purchase_timestamp"]).dt.days
    df["delivery_delay"] = (df["order_delivered_timestamp"] - df["order_estimated_delivery_date"]).dt.days
    df["order_month"] = df["order_purchase_timestamp"].dt.to_period("M").astype(str)

    return df
