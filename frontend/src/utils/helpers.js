// src/utils/helpers.js

/**
 * Định dạng số với ngàn phân cách bởi dấu chấm
 * @param {number} num - Số cần định dạng
 * @param {number} digits - Số chữ số thập phân
 * @returns {string} Chuỗi định dạng
 */
export const formatNumber = (num, digits = 0) => {
    if (num === null || num === undefined) return '-';
    return num.toLocaleString('vi-VN', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  };
  
  /**
   * Định dạng tiền tệ VND
   * @param {number} amount - Số tiền cần định dạng
   * @returns {string} Chuỗi định dạng tiền tệ
   */
  export const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount);
  };
  
  /**
   * Định dạng ngày tháng
   * @param {string|Date} date - Ngày cần định dạng
   * @param {string} format - Định dạng mong muốn (default: 'dd/MM/yyyy')
   * @returns {string} Chuỗi ngày tháng đã định dạng
   */
  export const formatDate = (date, format = 'dd/MM/yyyy') => {
    if (!date) return '-';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    if (format === 'dd/MM/yyyy') {
      return `${day}/${month}/${year}`;
    } else if (format === 'yyyy-MM-dd') {
      return `${year}-${month}-${day}`;
    } else if (format === 'MM/yyyy') {
      return `${month}/${year}`;
    }
    
    return `${day}/${month}/${year}`;
  };
  
  /**
   * Tạo mã ngẫu nhiên
   * @returns {string} Mã ngẫu nhiên
   */
  export const generateRandomId = () => {
    return Math.random().toString(36).substring(2, 15);
  };
  
  /**
   * Làm tròn số đến n chữ số thập phân
   * @param {number} num - Số cần làm tròn
   * @param {number} decimals - Số chữ số thập phân
   * @returns {number} Số đã được làm tròn
   */
  export const roundNumber = (num, decimals = 0) => {
    if (num === null || num === undefined) return null;
    const factor = Math.pow(10, decimals);
    return Math.round(num * factor) / factor;
  };
  
  /**
   * Chuyển đổi base64 thành Blob
   * @param {string} base64 - Chuỗi base64
   * @param {string} mimeType - Kiểu MIME
   * @returns {Blob} Đối tượng Blob
   */
  export const base64ToBlob = (base64, mimeType) => {
    const byteString = atob(base64);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    
    return new Blob([ab], { type: mimeType });
  };
  
  /**
   * Tạo URL cho ảnh base64
   * @param {string} base64 - Chuỗi base64
   * @param {string} mimeType - Kiểu MIME
   * @returns {string} URL cho ảnh
   */
  export const createImageUrl = (base64, mimeType = 'image/png') => {
    const blob = base64ToBlob(base64, mimeType);
    return URL.createObjectURL(blob);
  };
  
  /**
   * Tạo URL tải xuống cho dữ liệu
   * @param {*} data - Dữ liệu cần tải xuống
   * @param {string} fileName - Tên file
   * @param {string} fileType - Kiểu file
   */
  export const downloadFile = (data, fileName, fileType = 'application/json') => {
    const blob = new Blob([data], { type: fileType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };