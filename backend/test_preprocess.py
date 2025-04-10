from services.preprocess import preprocess_data

def main():
    df = preprocess_data()

    print("✅ Dữ liệu đã được load và xử lý thành công!")
    print("-" * 40)
    print("📊 Kích thước DataFrame:", df.shape)
    print("-" * 40)
    print("📋 Các cột có trong DataFrame:")
    print(df.columns.tolist())
    print("-" * 40)
    print("🧾 5 dòng đầu tiên:")
    print(df.head())
    print("-" * 40)
    print("ℹ️ Thông tin tổng quan:")
    print(df.info())

if __name__ == "__main__":
    main()
