// src/utils/helpers.js

/**
 * Định dạng số với ngàn phân cách
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
 * Tính giá trị nhỏ nhất từ mảng đối tượng
 * @param {Array} array - Mảng đối tượng
 * @param {string} key - Khóa cần tính toán
 * @returns {Object} Đối tượng có giá trị nhỏ nhất
 */
export const getMinValueObject = (array, key) => {
  if (!array || !array.length) return null;
  return array.reduce((min, item) => item[key] < min[key] ? item : min, array[0]);
};

/**
 * Tính giá trị lớn nhất từ mảng đối tượng
 * @param {Array} array - Mảng đối tượng
 * @param {string} key - Khóa cần tính toán
 * @returns {Object} Đối tượng có giá trị lớn nhất
 */
export const getMaxValueObject = (array, key) => {
  if (!array || !array.length) return null;
  return array.reduce((max, item) => item[key] > max[key] ? item : max, array[0]);
};

/**
 * Tính giá trị trung bình từ mảng đối tượng
 * @param {Array} array - Mảng đối tượng
 * @param {string} key - Khóa cần tính toán
 * @returns {number} Giá trị trung bình
 */
export const getAvgValue = (array, key) => {
  if (!array || !array.length) return 0;
  const sum = array.reduce((acc, item) => acc + item[key], 0);
  return sum / array.length;
};

/**
 * Nhóm dữ liệu theo khóa
 * @param {Array} array - Mảng đối tượng
 * @param {string} key - Khóa nhóm
 * @returns {Object} Đối tượng được nhóm
 */
export const groupBy = (array, key) => {
  if (!array || !array.length) return {};
  return array.reduce((result, item) => {
    (result[item[key]] = result[item[key]] || []).push(item);
    return result;
  }, {});
};

/**
 * Chuyển đổi RGB sang HEX
 * @param {number} r - Giá trị đỏ
 * @param {number} g - Giá trị xanh lá
 * @param {number} b - Giá trị xanh dương
 * @returns {string} Mã HEX
 */
export const rgbToHex = (r, g, b) => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

/**
 * Tạo mảng màu gradient
 * @param {number} count - Số lượng màu
 * @returns {Array} Mảng các mã màu HEX
 */
export const generateColorScale = (count) => {
  const colors = [];
  for (let i = 0; i < count; i++) {
    const ratio = i / (count - 1);
    const r = Math.round(30 + ratio * 200);
    const g = Math.round(144 - ratio * 100);
    const b = Math.round(255 - ratio * 200);
    colors.push(rgbToHex(r, g, b));
  }
  return colors;
};

/**
 * Download dữ liệu dưới dạng file
 * @param {Object|Array} data - Dữ liệu cần download
 * @param {string} filename - Tên file
 * @param {string} type - Loại file
 */
export const downloadJSON = (data, filename, type = 'application/json') => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type });
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(href);
};

/**
 * Rút gọn chuỗi với dấu chấm lửng ở cuối
 * @param {string} text - Chuỗi cần rút gọn
 * @param {number} length - Độ dài tối đa
 * @returns {string} Chuỗi đã rút gọn
 */
export const truncateString = (text, length = 50) => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

/**
 * Trích xuất tham số từ URL
 * @param {string} param - Tên tham số cần trích xuất
 * @returns {string|null} Giá trị tham số
 */
export const getUrlParameter = (param) => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
};