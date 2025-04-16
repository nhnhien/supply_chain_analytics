/**
 * Định dạng số tiền theo định dạng tiền tệ Việt Nam (VND)
 * @param {number} amount - Số tiền cần định dạng
 * @returns {string} Chuỗi đã định dạng theo tiền VND
 */
export const formatVND = (amount) => {
    if (amount === null || amount === undefined) {
      return "0 ₫";
    }
    
    // Định dạng số theo chuẩn Việt Nam: dấu chấm phân cách hàng nghìn
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  /**
   * Chuyển đổi từ BRL sang VND (chỉ sử dụng nếu API chưa chuyển đổi)
   * @param {number} amountBRL - Số tiền BRL cần chuyển đổi
   * @returns {number} Số tiền tương ứng bằng VND
   */
  export const convertBRLtoVND = (amountBRL) => {
    if (amountBRL === null || amountBRL === undefined) {
      return 0;
    }
    
    const EXCHANGE_RATE = 5200; // 1 BRL = 5,200 VND
    return Math.round(amountBRL * EXCHANGE_RATE);
  };