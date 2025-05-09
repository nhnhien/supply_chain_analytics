# services/preprocess.py
import os
import pandas as pd
from utils.currency import brl_to_vnd

UPLOAD_FOLDER = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))

def load_csv(filename):
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    return pd.read_csv(file_path)

def preprocess_data(use_spark=False):
    """
    Process input data, with the option to use Spark for large datasets
    or Pandas for small datasets
    """
    if use_spark:
        return preprocess_data_spark()
    else:
        return preprocess_data_pandas()

def preprocess_data_pandas():
    # Current code
    customers = load_csv("df_Customers.csv")
    orders = load_csv("df_Orders.csv")
    order_items = load_csv("df_OrderItems.csv")
    products = load_csv("df_Products.csv")
    
    # Process data as before...
    orders["order_purchase_timestamp"] = pd.to_datetime(orders["order_purchase_timestamp"])
    orders["order_delivered_timestamp"] = pd.to_datetime(orders["order_delivered_timestamp"])
    orders["order_estimated_delivery_date"] = pd.to_datetime(orders["order_estimated_delivery_date"])
    
    # Currency conversion...
    if "price" in order_items.columns:
        order_items["price"] = order_items["price"].apply(brl_to_vnd)
    
    # Merge data...
    df = pd.merge(order_items, orders, on="order_id", how="inner")
    df = pd.merge(df, products, on="product_id", how="left")
    df = pd.merge(df, customers, on="customer_id", how="left")
    
    # Feature engineering...
    df["shipping_duration"] = (df["order_delivered_timestamp"] - df["order_purchase_timestamp"]).dt.days
    df["delivery_delay"] = (df["order_delivered_timestamp"] - df["order_estimated_delivery_date"]).dt.days
    df["order_month"] = df["order_purchase_timestamp"].dt.to_period("M").astype(str)
    
    # Rename columns...
    if "freight_value" in df.columns and "shipping_charges" not in df.columns:
        df["shipping_charges"] = df["freight_value"]
    
    return df

def preprocess_data_spark():
    """
    Process data using Apache Spark for large datasets
    """
    from pyspark.sql import SparkSession
    from pyspark.sql.functions import col, datediff, to_date, lit, when

    # Initialize Spark session
    spark = SparkSession.builder \
        .appName("SupplyChainPreprocessing") \
        .config("spark.executor.memory", "2g") \
        .getOrCreate()
    
    # Load data
    customers = spark.read.csv(os.path.join(UPLOAD_FOLDER, "df_Customers.csv"), 
                             header=True, inferSchema=True)
    orders = spark.read.csv(os.path.join(UPLOAD_FOLDER, "df_Orders.csv"), 
                          header=True, inferSchema=True)
    order_items = spark.read.csv(os.path.join(UPLOAD_FOLDER, "df_OrderItems.csv"), 
                               header=True, inferSchema=True)
    products = spark.read.csv(os.path.join(UPLOAD_FOLDER, "df_Products.csv"), 
                            header=True, inferSchema=True)
    
    # Convert timestamp data types
    orders = orders.withColumn("order_purchase_timestamp", 
                             to_date(col("order_purchase_timestamp")))
    orders = orders.withColumn("order_delivered_timestamp", 
                             to_date(col("order_delivered_timestamp")))
    orders = orders.withColumn("order_estimated_delivery_date", 
                             to_date(col("order_estimated_delivery_date")))
    
    # Currency conversion (e.g., price -> VND)
    BRL_TO_VND_RATE = 5200
    if "price" in order_items.columns:
        order_items = order_items.withColumn("price", 
                                          col("price") * lit(BRL_TO_VND_RATE))
    
    # Join data
    df = order_items.join(orders, "order_id", "inner") \
                  .join(products, "product_id", "left") \
                  .join(customers, "customer_id", "left")
    
    # Feature engineering
    df = df.withColumn("shipping_duration", 
                     datediff(col("order_delivered_timestamp"), 
                              col("order_purchase_timestamp")))
    df = df.withColumn("delivery_delay", 
                     datediff(col("order_delivered_timestamp"), 
                              col("order_estimated_delivery_date")))
    df = df.withColumn("order_month", 
                     date_format(col("order_purchase_timestamp"), "yyyy-MM"))
    
    # Rename columns
    if "freight_value" in df.columns and "shipping_charges" not in df.columns:
        df = df.withColumnRenamed("freight_value", "shipping_charges")
    
    # Convert to pandas for compatibility with current code
    df_pandas = df.toPandas()
    
    # Close Spark session
    spark.stop()
    
    return df_pandas

def is_large_dataset():
    """
    Check if dataset is large to decide whether to use Spark or Pandas
    """
    total_size = 0
    for filename in ["df_Customers.csv", "df_Orders.csv", "df_OrderItems.csv", "df_Products.csv"]:
        path = os.path.join(UPLOAD_FOLDER, filename)
        if os.path.exists(path):
            total_size += os.path.getsize(path)
    
    # If total size > 500MB, use Spark
    return total_size > 500 * 1024 * 1024