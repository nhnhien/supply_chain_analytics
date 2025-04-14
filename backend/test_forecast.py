import os 
from services.forecast import forecast_demand
import pandas as pd
import base64

result = forecast_demand(periods=6)

if result.get("status") == "fail":
    print("❌ Forecast thất bại:")
    print(result.get("message", "Không rõ lỗi"))
else:
    # Hiển thị bảng dự báo
    df = pd.DataFrame(result["forecast_table"])
    print("📋 Bảng dự báo đơn hàng:")
    print(df)

    # Đường dẫn lưu ảnh vào thư mục charts/forecast/
    charts_dir = os.path.join(os.path.dirname(__file__), "charts", "forecast")
    os.makedirs(charts_dir, exist_ok=True)

    img_path = os.path.join(charts_dir, "forecast_chart.png")
    with open(img_path, "wb") as f:
        f.write(base64.b64decode(result["chart"]))

    print(f"✅ Biểu đồ đã lưu tại: {img_path}")

