# visualize_reorder.py
import pandas as pd
import matplotlib.pyplot as plt
from services.reorder import calculate_reorder_strategy
import os

# Tính toán chiến lược
strategy = calculate_reorder_strategy()
df = pd.DataFrame(strategy)

# Đảm bảo thư mục charts tồn tại
os.makedirs("charts", exist_ok=True)

# Xuất bảng Excel
df.to_excel("charts/reorder_strategy.xlsx", index=False)

# =====================
# 🔹 Biểu đồ 1: Reorder Point cao nhất
top10_reorder = df.sort_values("reorder_point", ascending=False).head(10)
plt.figure(figsize=(12, 6))
plt.barh(top10_reorder["category"], top10_reorder["reorder_point"])
plt.xlabel("Reorder Point")
plt.title("Top 10 danh mục có Reorder Point cao nhất")
plt.gca().invert_yaxis()
plt.grid(True)
plt.tight_layout()
plt.savefig("charts/reorder_top10.png")

# =====================
# 🔹 Biểu đồ 2: Safety Stock cao nhất
top10_ss = df.sort_values("safety_stock", ascending=False).head(10)
plt.figure(figsize=(12, 6))
plt.barh(top10_ss["category"], top10_ss["safety_stock"], color="orange")
plt.xlabel("Safety Stock")
plt.title("Top 10 danh mục có Safety Stock cao nhất")
plt.gca().invert_yaxis()
plt.grid(True)
plt.tight_layout()
plt.savefig("charts/reorder_safety_stock_top10.png")

# =====================
# 🔹 Biểu đồ 3: Lead time dài nhất
top10_lt = df.sort_values("avg_lead_time_days", ascending=False).head(10)
plt.figure(figsize=(12, 6))
plt.barh(top10_lt["category"], top10_lt["avg_lead_time_days"], color="green")
plt.xlabel("Average Lead Time (days)")
plt.title("Top 10 danh mục có Lead Time dài nhất")
plt.gca().invert_yaxis()
plt.grid(True)
plt.tight_layout()
plt.savefig("charts/reorder_lead_time_top10.png")

# =====================
# 🔹 Biểu đồ 4: Optimal Inventory cao nhất
top10_opt = df.sort_values("optimal_inventory", ascending=False).head(10)
plt.figure(figsize=(12, 6))
plt.barh(top10_opt["category"], top10_opt["optimal_inventory"], color="purple")
plt.xlabel("Optimal Inventory")
plt.title("Top 10 danh mục có Optimal Inventory cao nhất")
plt.gca().invert_yaxis()
plt.grid(True)
plt.tight_layout()
plt.savefig("charts/reorder_optimal_inventory_top10.png")

# ✅ Nếu cần hiển thị trực tiếp:
plt.show()
