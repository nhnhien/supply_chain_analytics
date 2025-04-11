// src/components/common/Navbar.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

const Navbar = () => {
  const { fileUploaded, clearData } = useApp();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const navigate = useNavigate();

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    clearData();
    setShowResetConfirm(false);
    navigate('/upload');
  };

  const cancelReset = () => {
    setShowResetConfirm(false);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-primary-600">Dashboard Quản lý bán hàng</h1>
            </div>
          </div>
          <div className="flex items-center">
            {fileUploaded && (
              <button
                onClick={handleReset}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Reset dữ liệu
              </button>
            )}
            <span className="ml-4 text-sm text-gray-500">Phiên bản 1.0</span>
          </div>
        </div>
      </div>

      {/* Modal xác nhận reset */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Xác nhận reset dữ liệu</h3>
            <p className="text-sm text-gray-500 mb-4">
              Bạn có chắc chắn muốn xóa tất cả dữ liệu đã tải lên? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelReset}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Hủy
              </button>
              <button
                onClick={confirmReset}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Xác nhận reset
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;