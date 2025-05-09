import pandas as pd
import numpy as np
from services.preprocess import preprocess_data, is_large_dataset
from services.forecast import forecast_demand, forecast_demand_by_category
from utils.cache import get_cache, set_cache
from utils.currency import brl_to_vnd, format_vnd
import os
from sklearn.cluster import KMeans
from services.mongodb import (
    save_reorder_strategy,
    save_reorder_recommendations,
    save_supplier_clusters,
    save_bottleneck_analysis,
)

def calculate_reorder_strategy():
    cache_key = "reorder_strategy"
    cached = get_cache(cache_key)
    if cached:
        return cached

    # Check if Spark should be used
    use_spark = is_large_dataset()
    if use_spark:
        print("📊 Using Spark to calculate reorder strategy (large dataset)")
        from services.spark_analytics import calculate_reorder_strategy_spark
        return calculate_reorder_strategy_spark()
    
    # If not using Spark, continue with current code
    df = preprocess_data()
    categories = df["product_category_name"].dropna().unique()

    forecast_cache_key = "forecast_all_categories_15"
    cached_forecasts = get_cache(forecast_cache_key)

    # 🔁 If no cache, call forecast_demand_all
    if not cached_forecasts:
        print("⚠️ Forecast cache not available, automatically calling forecast_demand_all...")
        from routes.forecast import get_forecast_for_all_categories
        response = get_forecast_for_all_categories()
        cached_forecasts = response.get_json()

    if not cached_forecasts:
        print("❌ Forecast cache still not ready after call. Stopping.")
        return []

    forecast_map = {f["category"]: f for f in cached_forecasts if f["status"] == "success"}

    z_score = 1.65
    # Convert values from BRL to VND
    holding_cost_per_unit_per_month = brl_to_vnd(2)  # Assume cost of 2 BRL/unit/month
    strategy = []

    for category in categories:
        if category not in forecast_map:
            print(f"⚠️ Skipping {category} as it's not in forecast cache.")
            continue

        try:
            forecast_result = forecast_map[category]
            forecast_df = pd.DataFrame(forecast_result["forecast_table"])
            forecast_df["predicted_orders"] = forecast_df["xgboost"].astype(int)
            avg_demand = forecast_df["predicted_orders"].mean()
            demand_std = forecast_df["predicted_orders"].std()

            cat_df = df[df["product_category_name"] == category]
            lead_time = cat_df["shipping_duration"].mean()
            lead_time_months = round(lead_time / 30, 2)

            safety_stock = int(z_score * demand_std * np.sqrt(lead_time)) if lead_time > 0 else 0
            reorder_point = int(avg_demand * lead_time + safety_stock)
            optimal_inventory = reorder_point + safety_stock
            holding_cost = int(optimal_inventory * holding_cost_per_unit_per_month * lead_time_months)

            strategy.append({
                "category": category,
                "avg_lead_time_days": round(lead_time, 2),
                "forecast_avg_demand": int(avg_demand),
                "demand_std": int(demand_std),
                "safety_stock": safety_stock,
                "reorder_point": reorder_point,
                "optimal_inventory": optimal_inventory,
                "holding_cost": holding_cost
            })
            print(f"✅ {category} | Holding cost = {format_vnd(holding_cost)}")

        except Exception as e:
            print(f"⚠️ Error processing {category}: {str(e)}")
            continue

    set_cache(cache_key, strategy, ttl_seconds=3600)
    save_reorder_strategy(strategy)
    return strategy


def generate_optimization_recommendations(strategy_data, return_df=False):
    recommendations = []
    
    strategy_df = pd.DataFrame(strategy_data)

    if "holding_cost" not in strategy_df.columns:
        print("❌ No 'holding_cost' column.")
        return pd.DataFrame() if return_df else None

    strategy_df["holding_cost"] = pd.to_numeric(strategy_df["holding_cost"], errors="coerce").fillna(0).astype(int)
    high_holding_cost = strategy_df.sort_values("holding_cost", ascending=False).head(10)

    for _, row in high_holding_cost.iterrows():
        category = row["category"]
        holding_cost = row["holding_cost"]
        safety_stock = row["safety_stock"]
        reorder_point = row["reorder_point"]
        avg_lead_time_days = row.get("avg_lead_time_days", 30)
        holding_cost_per_unit = row.get("holding_cost_per_unit", brl_to_vnd(5))

        if holding_cost > 100_000:
            new_safety_stock = int(safety_stock * 0.8)
            new_reorder_point = int(reorder_point * 0.9)
            new_optimal_inventory = new_safety_stock + new_reorder_point
            new_holding_cost = int(new_optimal_inventory * holding_cost_per_unit * round(avg_lead_time_days / 30, 2))
            potential_saving = holding_cost - new_holding_cost

            recommendations.append({
                "category": category,
                "recommendation": (
                    f"Reduce Safety Stock from {safety_stock} → {new_safety_stock} "
                    f"and Reorder Point from {reorder_point} → {new_reorder_point} to save costs."
                ),
                "new_safety_stock": new_safety_stock,
                "new_reorder_point": new_reorder_point,
                "new_optimal_inventory": new_optimal_inventory,
                "new_holding_cost": new_holding_cost,
                "potential_saving": potential_saving
            })

    if not recommendations:
        print("⚠️ No recommendations meet the criteria.")
        return pd.DataFrame() if return_df else None

    save_reorder_recommendations(recommendations)

    df = pd.DataFrame(recommendations)

    # ✅ Write Excel file to support download route
    output_dir = os.path.join("charts", "reorder")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "optimization_recommendations.xlsx")
    df.to_excel(output_path, index=False)

    print(f"✅ Recommendations file created at: {output_path}")

    return df if return_df else output_path


def cluster_suppliers(n_clusters=3):
    """
    Cluster suppliers based on order volume, delivery time,
    and average shipping cost.
    """
    try:
        print("🚀 Starting supplier clustering...")
        cache_key = "supplier_clusters"
        cached = get_cache(cache_key)
        if cached:
            return cached

        # Check if Spark should be used
        use_spark = is_large_dataset()
        if use_spark:
            print("📊 Using Spark for supplier clustering (large dataset)")
            from services.spark_analytics import cluster_suppliers_spark
            clusters = cluster_suppliers_spark(n_clusters)
            
            # Cache and save results
            set_cache(cache_key, clusters, ttl_seconds=3600*24)
            save_supplier_clusters(clusters)
            
            return clusters

        # If not using Spark, continue with current code
        df = preprocess_data()

        supplier_df = df.groupby("seller_id").agg({
            "order_id": "nunique",
            "shipping_duration": "mean",
            "shipping_charges": "mean"  # ✅ use correct column name
        }).reset_index()

        supplier_df.columns = ["seller_id", "total_orders", "avg_shipping_days", "avg_freight"]
        
        # Ensure data has correct format
        supplier_df["avg_shipping_days"] = supplier_df["avg_shipping_days"].fillna(0).astype(float)
        supplier_df["avg_freight"] = supplier_df["avg_freight"].apply(lambda x: float(brl_to_vnd(x)) if pd.notnull(x) else 0)
        supplier_df["total_orders"] = supplier_df["total_orders"].fillna(0).astype(int)
        
        # Filter suppliers with at least 5 orders
        filtered_suppliers = supplier_df[supplier_df["total_orders"] >= 5].copy()
        
        if len(filtered_suppliers) < n_clusters:
            print(f"⚠️ Not enough suppliers to form {n_clusters} clusters. Only {len(filtered_suppliers)} sellers meet criteria.")
            # Reduce number of clusters if not enough data
            n_clusters = max(2, len(filtered_suppliers) // 2)
            
        print(f"ℹ️ Clustering {len(filtered_suppliers)} suppliers into {n_clusters} groups")

        # Normalize data to avoid bias
        features = filtered_suppliers[["total_orders", "avg_shipping_days", "avg_freight"]].fillna(0)
        from sklearn.preprocessing import StandardScaler
        scaler = StandardScaler()
        features_scaled = scaler.fit_transform(features)

        # Perform clustering
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        filtered_suppliers["cluster"] = kmeans.fit_predict(features_scaled)

        # Add cluster descriptions
        cluster_stats = filtered_suppliers.groupby("cluster").agg({
            "avg_shipping_days": "mean",
            "avg_freight": "mean",
            "total_orders": "mean"
        })
        
        cluster_descriptions = {}
        for cluster_id, stats in cluster_stats.iterrows():
            if stats["avg_shipping_days"] < 15 and stats["avg_freight"] < 500000:
                description = "Fast and Cheap"
            elif stats["avg_shipping_days"] < 15 and stats["avg_freight"] >= 500000:
                description = "Fast but Expensive"
            elif stats["avg_shipping_days"] >= 15 and stats["avg_freight"] < 500000:
                description = "Slow but Cheap"
            else:
                description = "Slow and Expensive"
                
            cluster_descriptions[cluster_id] = description
            
        filtered_suppliers["cluster_description"] = filtered_suppliers["cluster"].map(cluster_descriptions)

        # Convert to dict for storage and return
        clusters = filtered_suppliers.to_dict(orient="records")
        
        # Cache and save results
        set_cache(cache_key, clusters, ttl_seconds=3600*24)
        save_supplier_clusters(clusters)
        
        print(f"✅ Clustering completed: {len(clusters)} suppliers")
        return clusters

    except Exception as e:
        print(f"❌ Error during supplier clustering: {str(e)}")
        import traceback
        traceback.print_exc()
        return []


def analyze_bottlenecks(threshold_days=20):
    """
    Analyze shipping process bottlenecks, identify suppliers
    with high delivery delay rates
    """
    try:
        print("🚀 Starting shipping bottleneck analysis...")
        cache_key = "shipping_bottlenecks"
        cached = get_cache(cache_key)
        if cached:
            return cached

        # Check if Spark should be used
        use_spark = is_large_dataset()
        if use_spark:
            print("📊 Using Spark for bottleneck analysis (large dataset)")
            from services.spark_analytics import analyze_bottlenecks_spark
            bottlenecks = analyze_bottlenecks_spark(threshold_days)
            
            # Cache and save results
            set_cache(cache_key, bottlenecks, ttl_seconds=3600*24)
            save_bottleneck_analysis(bottlenecks)
            
            return bottlenecks

        # If not using Spark, continue with current code
        df = preprocess_data()

        # Identify delayed orders based on threshold
        df["is_late"] = df["shipping_duration"] > threshold_days
        
        print("📦 Shipping duration statistics:")
        print(df["shipping_duration"].describe())
        
        late_ratio_all = (df["is_late"].mean() * 100)
        print(f"⚠️ Overall order delay rate with {threshold_days} days threshold: {late_ratio_all:.2f}%")

        # Analyze by supplier
        bottlenecks = df.groupby("seller_id").agg({
            "order_id": "count",
            "is_late": "mean",
            "product_category_name": lambda x: x.mode()[0] if not x.mode().empty else "Unknown",
            "shipping_duration": "mean"
        }).reset_index()

        bottlenecks.columns = ["seller_id", "total_orders", "late_ratio", "top_category", "avg_delivery_time"]

        # Only take sellers with at least 5 orders and delay rate higher than average
        bottlenecks = bottlenecks[(bottlenecks["total_orders"] >= 5) & 
                                  (bottlenecks["late_ratio"] > late_ratio_all/100)]

        # Add percentage information
        bottlenecks["late_percentage"] = (bottlenecks["late_ratio"] * 100).round(1)
        
        # Add severity notes
        def get_severity(row):
            if row["late_percentage"] > 75:
                return "Very Severe"
            elif row["late_percentage"] > 50:
                return "Severe"
            elif row["late_percentage"] > 25:
                return "Moderate"
            else:
                return "Mild"
        
        bottlenecks["severity"] = bottlenecks.apply(get_severity, axis=1)
        
        # Get top 10 problematic sellers
        top_bottlenecks = bottlenecks.sort_values("late_percentage", ascending=False).head(10)
        
        # Prepare results
        top_bottlenecks_list = top_bottlenecks.to_dict(orient="records")
        
        # Cache and save results
        set_cache(cache_key, top_bottlenecks_list, ttl_seconds=3600*24)
        save_bottleneck_analysis(top_bottlenecks_list)
        
        print(f"✅ Bottleneck analysis completed: {len(top_bottlenecks_list)} problematic sellers")
        return top_bottlenecks_list

    except Exception as e:
        print(f"❌ Error during bottleneck analysis: {str(e)}")
        import traceback
        traceback.print_exc()
        return []