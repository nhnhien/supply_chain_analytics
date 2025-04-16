# utils/currency.py

# Tỷ giá cố định để chuyển đổi từ BRL sang VND
BRL_TO_VND_RATE = 5200  # 1 BRL = 5,200 VND

def brl_to_vnd(amount_brl):
    """
    Chuyển đổi số tiền từ BRL sang VND
    
    Args:
        amount_brl (float): Số tiền BRL cần chuyển đổi
        
    Returns:
        float: Số tiền tương ứng bằng VND
    """
    if amount_brl is None:
        return None
    
    return round(amount_brl * BRL_TO_VND_RATE)

def format_vnd(amount_vnd):
    """
    Format số tiền VND theo định dạng tiền tệ Việt Nam
    
    Args:
        amount_vnd (float): Số tiền VND cần format
        
    Returns:
        str: Chuỗi tiền tệ đã được format
    """
    if amount_vnd is None:
        return "0 ₫"
    
    return f"{int(amount_vnd):,} ₫".replace(",", ".")