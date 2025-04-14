import os
import pandas as pd
import matplotlib.pyplot as plt
from services.preprocess import preprocess_data
from utils.plot import fig_to_base64
from datetime import datetime
from dateutil.relativedelta import relativedelta
import numpy as np
from utils.cache import get_cache, set_cache
import traceback

# Thêm imports cho XGBoost
import xgboost as xgb
from sklearn.metrics import mean_absolute_error

import os
import traceback
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from dateutil.relativedelta import relativedelta
import xgboost as xgb
from services.preprocess import preprocess_data
from utils.plot import fig_to_base64

from sklearn.metrics import mean_absolute_error


import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from datetime import datetime
from dateutil.relativedelta import relativedelta
import xgboost as xgb
from statsmodels.tsa.arima.model import ARIMA
from sklearn.metrics import mean_absolute_error
from services.preprocess import preprocess_data
from utils.plot import fig_to_base64
import traceback


def forecast_demand(periods=6):
    print(f"🚀 Starting forecast_demand service with XGBoost & ARIMA ({periods} periods)...")

    try:
        # 1. Load & clean data
        df = preprocess_data()
        monthly_orders = df.groupby("order_month").size()

        try:
            monthly_orders.index = pd.to_datetime(monthly_orders.index)
        except:
            monthly_orders.index = pd.date_range(start="2018-01-01", periods=len(monthly_orders), freq="MS")

        monthly_orders = monthly_orders.sort_index().ffill().fillna(0)

        expected_months = (monthly_orders.index.max().to_period("M") - monthly_orders.index.min().to_period("M")).n + 1
        if len(monthly_orders) < expected_months:
            print("🔄 Filling missing months...")
            full_range = pd.date_range(start=monthly_orders.index.min(), end=monthly_orders.index.max(), freq="MS")
            monthly_orders = monthly_orders.reindex(full_range).interpolate(method="linear")

        if len(monthly_orders) >= 3:
            mean_val, std_val = monthly_orders.mean(), monthly_orders.std()
            cleaned = monthly_orders[(monthly_orders > mean_val - 3 * std_val) & (monthly_orders < mean_val + 3 * std_val)]
            if len(cleaned) >= 5:
                monthly_orders = cleaned

        # 2. Feature engineering for XGBoost
        df_features = pd.DataFrame(index=monthly_orders.index)
        df_features["y"] = monthly_orders
        for i in range(1, 4):
            df_features[f"lag_{i}"] = df_features["y"].shift(i)
        df_features["month"] = df_features.index.month
        df_features["quarter"] = df_features.index.quarter
        df_features["trend"] = np.arange(len(df_features))
        df_features["rolling_mean_3"] = df_features["y"].rolling(3).mean().shift(1)
        df_features["rolling_std_3"] = df_features["y"].rolling(3).std().shift(1)
        df_features = df_features.bfill().fillna(0)

        X = df_features.drop("y", axis=1)
        y = df_features["y"]

        # 3. Train XGBoost
        model_xgb = xgb.XGBRegressor(n_estimators=100, learning_rate=0.1, max_depth=3, objective="reg:squarederror")
        model_xgb.fit(X, y)

        last_date = monthly_orders.index[-1]
        future_index = [last_date + relativedelta(months=i) for i in range(1, periods + 1)]

        forecast_xgb = []
        future_features = pd.DataFrame(index=future_index)
        future_features["month"] = [d.month for d in future_index]
        future_features["quarter"] = [d.quarter for d in future_index]
        future_features["trend"] = np.arange(len(df_features), len(df_features) + periods)

        for i in range(periods):
            for j in range(1, 4):
                future_features.loc[future_index[i], f"lag_{j}"] = forecast_xgb[i - j] if i >= j else monthly_orders.iloc[-j]
            future_features.loc[future_index[i], "rolling_mean_3"] = df_features["y"].iloc[-3:].mean()
            future_features.loc[future_index[i], "rolling_std_3"] = df_features["y"].iloc[-3:].std()

            pred = model_xgb.predict(future_features.loc[future_index[i]].values.reshape(1, -1))[0]
            forecast_xgb.append(int(max(100, pred)))

        forecast_series_xgb = pd.Series(forecast_xgb, index=future_index)

        # 4. Train ARIMA
        arima_model = ARIMA(monthly_orders, order=(1, 1, 1))
        arima_fit = arima_model.fit()
        forecast_arima = arima_fit.forecast(steps=periods)
        forecast_series_arima = pd.Series(forecast_arima, index=future_index)

        # 5. Forecast table
        forecast_df = pd.DataFrame({
            "month": [d.strftime("%Y-%m") for d in future_index],
            "xgboost": forecast_xgb,
            "arima": list(map(int, forecast_arima))
        })

        # 6. Chart data (to support frontend filtering)
        chart_data = []

        # ✅ Dữ liệu thực tế
        for date, value in monthly_orders.items():
            chart_data.append({
                "month": date.strftime("%Y-%m"),
                "orders": int(value),
                "type": "Thực tế"  
            })

        # ✅ Dự báo bằng XGBoost
        for date, value in forecast_series_xgb.items():
            chart_data.append({
                "month": date.strftime("%Y-%m"),
                "orders": int(value),
                "type": "XGBoost" 
            })

        # ✅ Dự báo bằng ARIMA
        for date, value in forecast_series_arima.items():
            chart_data.append({
                "month": date.strftime("%Y-%m"),
                "orders": int(value),
                "type": "ARIMA"  
            })


        # 7. Plot chart
        fig, ax = plt.subplots(figsize=(10, 4))
        monthly_orders.plot(ax=ax, label="Thực tế", marker="o")
        forecast_series_xgb.plot(ax=ax, label="XGBoost", linestyle="--", marker="x", color="orange")
        forecast_series_arima.plot(ax=ax, label="ARIMA", linestyle="--", marker="s", color="green")
        ax.set_title("So sánh dự báo đơn hàng: XGBoost vs ARIMA")
        ax.set_ylabel("Số đơn")
        ax.set_xlabel("Tháng")
        ax.legend()
        ax.grid(True)

        charts_dir = os.path.join(os.path.dirname(__file__), "../charts/forecast")
        os.makedirs(charts_dir, exist_ok=True)
        fig.savefig(os.path.join(charts_dir, "forecast_chart.png"), bbox_inches="tight")

        return {
            "status": "success",
            "category": "Tổng thể",
            "forecast_table": forecast_df.to_dict(orient="records"),
            "chart_data": chart_data,
            "chart": fig_to_base64(fig)
        }

    except Exception as e:
        print(f"❌ Error in forecast_demand: {str(e)}")
        print(traceback.format_exc())
        return {
            "status": "error",
            "message": f"Lỗi nội bộ khi dự báo: {str(e)}",
            "forecast_table": [],
            "chart_data": [],
            "chart": ""
        }

def forecast_demand_by_category(category_name, periods=6):
    print(f"🚀 Forecasting for category: {category_name}")

    try:
        df = preprocess_data()
        df_cat = df[df["product_category_name"] == category_name]
        if df_cat.empty or len(df_cat) < 10:
            raise ValueError("Not enough data for category: " + category_name)

        monthly_orders = df_cat.groupby("order_month").size()
        try:
            monthly_orders.index = pd.to_datetime(monthly_orders.index)
        except:
            monthly_orders.index = pd.date_range(start="2018-01-01", periods=len(monthly_orders), freq="MS")

        monthly_orders = monthly_orders.sort_index().ffill().fillna(0)
        full_range = pd.date_range(start=monthly_orders.index.min(), end=monthly_orders.index.max(), freq="MS")
        monthly_orders = monthly_orders.reindex(full_range).interpolate(method="linear").fillna(0)

        if len(monthly_orders) >= 5:
            mean, std = monthly_orders.mean(), monthly_orders.std()
            monthly_orders = monthly_orders[(monthly_orders > mean - 3*std) & (monthly_orders < mean + 3*std)]

        df_features = pd.DataFrame(index=monthly_orders.index)
        df_features["y"] = monthly_orders
        for i in range(1, 4):
            df_features[f"lag_{i}"] = df_features["y"].shift(i)
        df_features["month"] = df_features.index.month
        df_features["quarter"] = df_features.index.quarter
        df_features["trend"] = np.arange(len(df_features))
        df_features["rolling_mean_3"] = df_features["y"].rolling(3).mean().shift(1)
        df_features["rolling_std_3"] = df_features["y"].rolling(3).std().shift(1)
        df_features = df_features.bfill().fillna(0)

        X = df_features.drop("y", axis=1)
        y = df_features["y"]

        model = xgb.XGBRegressor(n_estimators=100, learning_rate=0.1, max_depth=3, objective="reg:squarederror")
        model.fit(X, y)

        last_date = monthly_orders.index[-1]
        future_index = [last_date + relativedelta(months=i) for i in range(1, periods+1)]
        future_features = pd.DataFrame(index=future_index)
        future_features["month"] = [d.month for d in future_index]
        future_features["quarter"] = [d.quarter for d in future_index]
        future_features["trend"] = np.arange(len(df_features), len(df_features)+periods)

        forecast_xgb = []
        for i in range(periods):
            for j in range(1, 4):
                fallback = (
                    forecast_xgb[i-j] if i >= j else monthly_orders.iloc[-j]
                )
                future_features.loc[future_index[i], f"lag_{j}"] = fallback

            future_features.loc[future_index[i], "rolling_mean_3"] = df_features["y"].iloc[-3:].mean()
            future_features.loc[future_index[i], "rolling_std_3"] = df_features["y"].iloc[-3:].std()

            pred = model.predict(future_features.loc[future_index[i]].values.reshape(1, -1))[0]
            fallback = max(0, pred) if not np.isnan(pred) else monthly_orders.iloc[-1]
            forecast_xgb.append(int(fallback))

        forecast_series_xgb = pd.Series(forecast_xgb, index=future_index)

        arima_model = ARIMA(monthly_orders, order=(1, 1, 1))
        arima_fit = arima_model.fit()
        forecast_arima = arima_fit.forecast(steps=periods)

        # Fallback cho NaN trong ARIMA
        fallback_val = monthly_orders.iloc[-1] if len(monthly_orders) > 0 else monthly_orders.mean() if not monthly_orders.empty else 0
        forecast_arima_clean = [int(val) if not np.isnan(val) else int(fallback_val) for val in forecast_arima]

        forecast_series_arima = pd.Series(forecast_arima_clean, index=future_index)
        print("🔎 ARIMA forecast:", forecast_arima.tolist())
        print("🔎 XGBoost forecast:", forecast_xgb)

        forecast_df = pd.DataFrame({
            "month": [d.strftime("%Y-%m") for d in future_index],
            "xgboost": forecast_xgb,
            "arima": forecast_arima_clean
        })

        chart_data = []
        for date, val in monthly_orders.items():
            chart_data.append({
                "month": date.strftime("%Y-%m"),
                "orders": int(val),
                "type": "Thực tế",
                "category": category_name
            })
        for date, val in forecast_series_xgb.items():
            chart_data.append({
                "month": date.strftime("%Y-%m"),
                "orders": int(val),
                "type": "XGBoost",
                "category": category_name
            })
        for date, val in forecast_series_arima.items():
            chart_data.append({
                "month": date.strftime("%Y-%m"),
                "orders": int(val),
                "type": "ARIMA",
                "category": category_name
            })

        return {
            "status": "success",
            "category": category_name,
            "forecast_table": forecast_df.to_dict(orient="records"),
            "chart_data": chart_data
        }

    except Exception as e:
        print(f"❌ Error in forecast_demand_by_category({category_name}): {str(e)}")
        print(traceback.format_exc())
        return {
            "status": "error",
            "message": f"Không thể tạo dự báo cho danh mục {category_name}: {str(e)}",
            "forecast_table": [],
            "chart_data": []
        }
