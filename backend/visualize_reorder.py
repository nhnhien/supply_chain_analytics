# visualize_reorder.py

import pandas as pd
import matplotlib.pyplot as plt
from services.reorder import calculate_reorder_strategy, generate_optimization_recommendations
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

# ===================== 
# 🔹 Biểu đồ 5: Holding Cost cao nhất
# Giả sử Unit Holding Cost là 10
unit_holding_cost = 10  # Điều chỉnh theo giá trị thực tế
df["holding_cost"] = df["optimal_inventory"] * unit_holding_cost

top10_holding_cost = df.sort_values("holding_cost", ascending=False).head(10)
plt.figure(figsize=(12, 6))
plt.barh(top10_holding_cost["category"], top10_holding_cost["holding_cost"], color="red")
plt.xlabel("Holding Cost")
plt.title("Top 10 danh mục có Holding Cost cao nhất")
plt.gca().invert_yaxis()
plt.grid(True)
plt.tight_layout()
plt.savefig("charts/reorder_holding_cost_top10.png")

# =====================
# ✅ Tính toán các đề xuất tối ưu hóa
recommendations_df = generate_optimization_recommendations(df)
recommendations_df.to_excel("charts/optimization_recommendations.xlsx", index=False)



# =====================
# 🔹 Biểu đồ 6: Gợi ý tối ưu hóa - Potential Saving cao nhất
top10_saving = recommendations_df.sort_values("potential_saving", ascending=False).head(10)

plt.figure(figsize=(12, 6))
bars = plt.barh(top10_saving["category"], top10_saving["potential_saving"], color="crimson")
plt.xlabel("Potential Saving (₫)")
plt.title("Top 10 danh mục có tiềm năng tiết kiệm chi phí cao nhất")
plt.gca().invert_yaxis()
plt.grid(True)

# Hiển thị nhãn giá trị
for bar in bars:
    width = bar.get_width()
    plt.text(width + 5000, bar.get_y() + bar.get_height() / 2,
             f"{int(width):,} ₫", va='center')

plt.tight_layout()
plt.savefig("charts/reorder_potential_saving_top10.png")


# ✅ Nếu cần hiển thị trực tiếp:
plt.show()
