import os
import pandas as pd
import matplotlib.pyplot as plt
from services.preprocess import preprocess_data
from utils.plot import fig_to_base64
from datetime import datetime
from dateutil.relativedelta import relativedelta
import numpy as np
from utils.cache import get_cache, set_cache
from utils.currency import brl_to_vnd
import traceback
import warnings
import xgboost as xgb
from sklearn.metrics import mean_absolute_error, mean_squared_error
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tools.sm_exceptions import ValueWarning

# ⚠️ Suppress known warnings
warnings.filterwarnings("ignore", message=".*Non-stationary starting autoregressive parameters.*")
warnings.filterwarnings("ignore", message=".*Non-invertible starting MA parameters.*")
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=ValueWarning)


def forecast_demand(periods=6):
    print(f"🚀 Starting forecast_demand service with XGBoost & ARIMA ({periods} periods)...")
    try:
        df = preprocess_data()
        monthly_orders = df.groupby("order_month").size()
        monthly_orders.index = pd.to_datetime(monthly_orders.index)

        # 🧠 Ensure freq = MS
        if monthly_orders.index.freq is None:
            full_range = pd.date_range(start=monthly_orders.index.min(), end=monthly_orders.index.max(), freq="MS")
            monthly_orders = monthly_orders.reindex(full_range).interpolate("linear").fillna(0)
            monthly_orders.index.freq = "MS"

        # 🧹 Remove outliers
        if len(monthly_orders) >= 3:
            mean_val, std_val = monthly_orders.mean(), monthly_orders.std()
            cleaned = monthly_orders[(monthly_orders > mean_val - 3 * std_val) & (monthly_orders < mean_val + 3 * std_val)]
            if len(cleaned) >= 5:
                monthly_orders = cleaned

        # 🔧 Feature engineering
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

        X, y = df_features.drop("y", axis=1), df_features["y"]

        # 🚀 Train XGBoost
        model_xgb = xgb.XGBRegressor(n_estimators=100, learning_rate=0.1, max_depth=3, objective="reg:squarederror")
        model_xgb.fit(X, y)
        y_pred_xgb = model_xgb.predict(X)
        mae_xgb = mean_absolute_error(y, y_pred_xgb)
        rmse_xgb = np.sqrt(mean_squared_error(y, y_pred_xgb))

        # 📈 ARIMA
        arima_model = ARIMA(monthly_orders, order=(1, 1, 1))
        arima_fit = arima_model.fit()
        forecast_arima = arima_fit.forecast(steps=periods)
        mae_arima = mean_absolute_error(y[1:], arima_fit.fittedvalues[1:])
        rmse_arima = np.sqrt(mean_squared_error(y[1:], arima_fit.fittedvalues[1:]))

        # 🔮 Future prediction
        last_date = monthly_orders.index[-1]
        future_index = [last_date + relativedelta(months=i) for i in range(1, periods + 1)]
        forecast_xgb = []
        future_features = pd.DataFrame(index=future_index)
        future_features["month"] = [d.month for d in future_index]
        future_features["quarter"] = [d.quarter for d in future_index]
        future_features["trend"] = np.arange(len(df_features), len(df_features) + periods)
        extended_y = df_features["y"].tolist()

        for i in range(periods):
            idx = future_index[i]
            for j in range(1, 4):
                val = forecast_xgb[i - j] if i >= j else extended_y[-j]
                future_features.loc[idx, f"lag_{j}"] = val
            rolling_window = (extended_y + forecast_xgb[:i])[-3:]
            future_features.loc[idx, "rolling_mean_3"] = np.mean(rolling_window)
            future_features.loc[idx, "rolling_std_3"] = np.std(rolling_window)

            pred = model_xgb.predict(future_features.loc[idx].values.reshape(1, -1))[0]
            forecast_xgb.append(int(max(100, pred)))
            # ✅ Logging debug
            print(f"\n📅 [DEBUG] Tháng dự báo: {idx.strftime('%Y-%m')}")
            print(f"  🔹 Lag_1: {future_features.loc[idx, 'lag_1']}")
            print(f"  🔹 Lag_2: {future_features.loc[idx, 'lag_2']}")
            print(f"  🔹 Lag_3: {future_features.loc[idx, 'lag_3']}")
            print(f"  🔹 Rolling Mean 3: {future_features.loc[idx, 'rolling_mean_3']:.2f}")
            print(f"  🔹 Rolling Std 3: {future_features.loc[idx, 'rolling_std_3']:.2f}")
            print(f"  🔸 Dự báo XGBoost: {pred:.2f}")
        forecast_series_xgb = pd.Series(forecast_xgb, index=future_index)
        forecast_series_arima = pd.Series([int(val) for val in forecast_arima], index=future_index)

        # 📊 Chart & Table
        forecast_df = pd.DataFrame({
            "month": [d.strftime("%Y-%m") for d in future_index],
            "xgboost": forecast_xgb,
            "arima": forecast_series_arima.tolist(),
        })
        chart_data = [{"month": date.strftime("%Y-%m"), "orders": int(val), "type": "Thực tế"} for date, val in monthly_orders.items()]
        chart_data += [{"month": date.strftime("%Y-%m"), "orders": int(val), "type": "XGBoost"} for date, val in forecast_series_xgb.items()]
        chart_data += [{"month": date.strftime("%Y-%m"), "orders": int(val), "type": "ARIMA"} for date, val in forecast_series_arima.items()]

        fig, ax = plt.subplots(figsize=(10, 4))
        monthly_orders.plot(ax=ax, label="Thực tế", marker="o")
        forecast_series_xgb.plot(ax=ax, label="XGBoost", linestyle="--", marker="x")
        forecast_series_arima.plot(ax=ax, label="ARIMA", linestyle="--", marker="s")
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
            "chart": fig_to_base64(fig),
            "mae_rmse_comparison": {
                "xgboost": {"mae": round(mae_xgb, 2), "rmse": round(rmse_xgb, 2)},
                "arima": {"mae": round(mae_arima, 2), "rmse": round(rmse_arima, 2)}
            }
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
        monthly_orders.index = pd.to_datetime(monthly_orders.index)

        # 🧠 Ensure freq
        if monthly_orders.index.freq is None:
            full_range = pd.date_range(start=monthly_orders.index.min(), end=monthly_orders.index.max(), freq="MS")
            monthly_orders = monthly_orders.reindex(full_range).interpolate("linear").fillna(0)
            monthly_orders.index.freq = "MS"

        # 🧹 Remove outliers
        if len(monthly_orders) >= 5:
            mean, std = monthly_orders.mean(), monthly_orders.std()
            monthly_orders = monthly_orders[(monthly_orders > mean - 3 * std) & (monthly_orders < mean + 3 * std)]

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

        X, y = df_features.drop("y", axis=1), df_features["y"]
        model = xgb.XGBRegressor(n_estimators=100, learning_rate=0.1, max_depth=3, objective="reg:squarederror")
        model.fit(X, y)
        y_pred_xgb = model.predict(X)
        mae_xgb = mean_absolute_error(y, y_pred_xgb)
        rmse_xgb = np.sqrt(mean_squared_error(y, y_pred_xgb))

        last_date = monthly_orders.index[-1]
        future_index = [last_date + relativedelta(months=i) for i in range(1, periods + 1)]
        forecast_xgb = []
        future_features = pd.DataFrame(index=future_index)
        future_features["month"] = [d.month for d in future_index]
        future_features["quarter"] = [d.quarter for d in future_index]
        future_features["trend"] = np.arange(len(df_features), len(df_features) + periods)
        extended_y = df_features["y"].tolist()

        for i in range(periods):
            idx = future_index[i]
            for j in range(1, 4):
                val = forecast_xgb[i - j] if i >= j else extended_y[-j]
                future_features.loc[idx, f"lag_{j}"] = val
            rolling_window = (extended_y + forecast_xgb[:i])[-3:]
            future_features.loc[idx, "rolling_mean_3"] = np.mean(rolling_window)
            future_features.loc[idx, "rolling_std_3"] = np.std(rolling_window)

            pred = model.predict(future_features.loc[idx].values.reshape(1, -1))[0]
            forecast_xgb.append(int(max(0, pred)))

            # ✅ Debug log
            print(f"\n📅 [DEBUG] Tháng dự báo: {idx.strftime('%Y-%m')} ({category_name})")
            print(f"  🔹 Lag_1: {future_features.loc[idx, 'lag_1']}")
            print(f"  🔹 Lag_2: {future_features.loc[idx, 'lag_2']}")
            print(f"  🔹 Lag_3: {future_features.loc[idx, 'lag_3']}")
            print(f"  🔹 Rolling Mean 3: {future_features.loc[idx, 'rolling_mean_3']:.2f}")
            print(f"  🔹 Rolling Std 3: {future_features.loc[idx, 'rolling_std_3']:.2f}")
            print(f"  🔸 Dự báo XGBoost: {pred:.2f}")

        forecast_series_xgb = pd.Series(forecast_xgb, index=future_index)

        arima_model = ARIMA(monthly_orders, order=(1, 1, 1))
        arima_fit = arima_model.fit()
        forecast_arima = arima_fit.forecast(steps=periods)
        mae_arima = mean_absolute_error(y[1:], arima_fit.fittedvalues[1:])
        rmse_arima = np.sqrt(mean_squared_error(y[1:], arima_fit.fittedvalues[1:]))
        fallback_val = monthly_orders.iloc[-1]
        forecast_arima_clean = [int(val) if not np.isnan(val) else int(fallback_val) for val in forecast_arima]
        forecast_series_arima = pd.Series(forecast_arima_clean, index=future_index)

        forecast_df = pd.DataFrame({
            "month": [d.strftime("%Y-%m") for d in future_index],
            "xgboost": forecast_xgb,
            "arima": forecast_series_arima.tolist()
        })

        chart_data = [{"month": date.strftime("%Y-%m"), "orders": int(val), "type": "Thực tế", "category": category_name}
                      for date, val in monthly_orders.items()]
        chart_data += [{"month": date.strftime("%Y-%m"), "orders": int(val), "type": "XGBoost", "category": category_name}
                       for date, val in forecast_series_xgb.items()]
        chart_data += [{"month": date.strftime("%Y-%m"), "orders": int(val), "type": "ARIMA", "category": category_name}
                       for date, val in forecast_series_arima.items()]

        # ✅ Tính thêm inventory & holding cost
        optimal_inventory = int(np.max(forecast_xgb)) if forecast_xgb else 0
        # Chuyển đổi từ BRL sang VND (giả sử chi phí giữ kho 5 BRL/đơn vị)
        unit_holding_cost = brl_to_vnd(5)
        holding_cost = optimal_inventory * unit_holding_cost

        return {
            "status": "success",
            "category": category_name,
            "forecast_table": forecast_df.to_dict(orient="records"),
            "chart_data": chart_data,
            "optimal_inventory": optimal_inventory,
            "holding_cost": holding_cost,
            "mae_rmse_comparison": {
                "xgboost": {"mae": round(mae_xgb, 2), "rmse": round(rmse_xgb, 2)},
                "arima": {"mae": round(mae_arima, 2), "rmse": round(rmse_arima, 2)}
            }
        }

    except Exception as e:
        print(f"❌ Error in forecast_demand_by_category({category_name}): {str(e)}")
        print(traceback.format_exc())
        return {
            "status": "error",
            "message": f"Không thể tạo dự báo cho danh mục {category_name}: {str(e)}",
            "forecast_table": [],
            "chart_data": [],
            "mae_rmse_comparison": {}
        }