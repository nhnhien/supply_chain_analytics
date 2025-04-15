# helpers/safe_forecast.py

from services.forecast import forecast_demand_by_category

def safe_forecast(category_name):
    try:
        result = forecast_demand_by_category(category_name)
        result["category"] = category_name
        return result
    except Exception as e:
        print(f"⚠️ Skipping category {category_name} due to error: {str(e)}")
        return {
            "category": category_name,
            "forecast_table": [],
            "chart_data": [],
            "status": "error",
            "message": str(e)
        }
