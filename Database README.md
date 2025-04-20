# Database for Supply Chain Analytics

This document describes the database structure and usage for the Supply Chain Analytics project.

## Overview

The project uses MongoDB to store:
- Exploratory Data Analysis (EDA) results
- Demand forecasting results
- Inventory strategies
- Supplier analysis data
- Shipping bottleneck analysis

## Database Structure

### Database: `supply_chain_db`

Contains 6 main collections:

1. **eda_summaries**: Stores overall data analysis results
2. **forecast_results**: Stores demand forecasting results by category
3. **reorder_recommendations**: Stores inventory optimization recommendations
4. **reorder_strategies**: Stores inventory strategies by category
5. **shipping_bottlenecks**: Stores analysis of delivery process bottlenecks
6. **supplier_clusters**: Stores supplier clustering results

## Collection Details

### 1. eda_summaries

Stores data analysis results from CSV files.

```json
{
  "_id": ObjectId("..."),
  "orders_by_month": {
    "2022-01": 342,
    "2022-02": 389
  },
  "top_categories": {
    "electronics": 2456,
    "clothing": 1832
  },
  "delivery_delay_rate": 12.34,
  "avg_shipping_duration_by_seller": {
    "seller_123": 5.2,
    "seller_456": 6.7
  },
  "avg_shipping_cost_by_category": {
    "electronics": 25000,
    "clothing": 15000
  },
  "timestamp": ISODate("2023-05-20T08:30:00.000Z")
}
```

### 2. forecast_results

Stores demand forecasting results using XGBoost and ARIMA models.

```json
{
  "_id": ObjectId("..."),
  "category": "electronics",
  "model": "XGBoost + ARIMA",
  "status": "success",
  "forecast_table": [
    {
      "month": "2023-06",
      "xgboost": 412,
      "arima": 398
    }
  ],
  "chart_data": [
    {
      "month": "2023-01",
      "orders": 380,
      "type": "Actual"
    },
    {
      "month": "2023-06",
      "orders": 412,
      "type": "XGBoost"
    }
  ],
  "optimal_inventory": 450,
  "holding_cost": 225000,
  "mae_rmse_comparison": {
    "xgboost": {
      "mae": 25.4,
      "rmse": 32.1
    },
    "arima": {
      "mae": 28.7,
      "rmse": 35.6
    }
  },
  "timestamp": ISODate("2023-05-20T08:35:00.000Z")
}
```

### 3. reorder_recommendations

Stores inventory optimization recommendations.

```json
{
  "_id": ObjectId("..."),
  "category": "electronics",
  "recommendation": "Reduce Safety Stock from 200 → 160 and Reorder Point from 400 → 360 to save costs.",
  "new_safety_stock": 160,
  "new_reorder_point": 360,
  "new_optimal_inventory": 520,
  "new_holding_cost": 260000,
  "potential_saving": 65000,
  "timestamp": ISODate("2023-05-20T08:40:00.000Z")
}
```

### 4. reorder_strategies

Stores inventory strategies calculated based on demand forecasts.

```json
{
  "_id": ObjectId("..."),
  "category": "electronics",
  "avg_lead_time_days": 12.5,
  "forecast_avg_demand": 382,
  "demand_std": 45,
  "safety_stock": 200,
  "reorder_point": 400,
  "optimal_inventory": 600,
  "holding_cost": 325000,
  "optimization_recommendations": [
    "Warning: Holding cost too high (325000). Consider reducing optimal inventory.",
    "Long lead time (12.5 days). Consider finding suppliers with shorter delivery times."
  ],
  "timestamp": ISODate("2023-05-20T08:45:00.000Z")
}
```

### 5. shipping_bottlenecks

Stores information about delivery process bottlenecks.

```json
{
  "_id": ObjectId("..."),
  "seller_id": "seller_789",
  "total_orders": 156,
  "late_ratio": 0.42,
  "late_percentage": 42.0,
  "top_category": "electronics",
  "avg_delivery_time": 18.7,
  "severity": "Serious",
  "timestamp": ISODate("2023-05-20T08:50:00.000Z")
}
```

### 6. supplier_clusters

Stores supplier clustering results using the K-means algorithm.

```json
{
  "_id": ObjectId("..."),
  "seller_id": "seller_123",
  "total_orders": 342,
  "avg_shipping_days": 5.2,
  "avg_freight": 120000,
  "cluster": 0,
  "cluster_description": "Fast and cheap",
  "timestamp": ISODate("2023-05-20T08:55:00.000Z")
}
```

## Source Data (CSV)

The application uses 4 main CSV files:

1. **df_Customers.csv**: Customer information
2. **df_Orders.csv**: Order information
3. **df_OrderItems.csv**: Product details in orders
4. **df_Products.csv**: Product information

These files need to be uploaded through the application's "Upload" interface.

## Database Setup

### Using MongoDB Atlas (Recommended)

1. Create an account and cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Configure Database Access (create username and password)
3. Configure Network Access (allow your IP address)
4. Update connection string in backend's `.env` file

### Importing Sample Data

#### Option 1: Using MongoDB Compass
1. Download and install [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Connect to MongoDB Atlas or local MongoDB
3. Create `supply_chain_db` database
4. Import each collection from the JSON files in the `mongodb_exports/` directory

#### Option 2: Using mongorestore
```bash
# For BSON files
mongorestore --uri="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/" --db supply_chain_db mongodb_exports/

# For JSON files
mongoimport --uri="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/supply_chain_db" --collection eda_summaries --file mongodb_exports/eda_summaries.json
```

## Sample Queries

### 1. Get the latest data analysis summary
```javascript
db.eda_summaries.find().sort({timestamp: -1}).limit(1)
```

### 2. Get demand forecast for "electronics" category
```javascript
db.forecast_results.find({category: "electronics"})
```

### 3. Get top 5 categories with highest safety stock
```javascript
db.reorder_strategies.find().sort({safety_stock: -1}).limit(5)
```

### 4. Get suppliers in the "fast & cheap" cluster
```javascript
db.supplier_clusters.find({cluster_description: "Fast and cheap"})
```

### 5. Find serious bottlenecks in shipping
```javascript
db.shipping_bottlenecks.find({severity: "Serious"})
```

## Security Notes

- Change connection information in `.env` file when deploying the application
- Use a MongoDB account with minimal necessary permissions
- Configure Network Access to allow only specific IPs to connect to MongoDB