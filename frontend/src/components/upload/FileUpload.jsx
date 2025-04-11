// src/components/upload/FileUpload.jsx
import React, { useState } from 'react';
import { uploadFile } from '../../api';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';

const FileUpload = () => {
  const { setLoading, handleError, setFileUploaded } = useApp();
  const [files, setFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleUpload = async () => {
    if (!files.length) {
      return;
    }

    setLoading(true);
    setUploadStatus([]);
    setShowSuccess(false);
    
    try {
      const uploadPromises = files.map(async (file) => {
        try {
          await uploadFile(file);
          return { name: file.name, success: true };
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          return { name: file.name, success: false, error: error.response?.data?.error || error.message };
        }
      });

      const results = await Promise.all(uploadPromises);
      setUploadStatus(results);
      
      // Kiểm tra nếu tất cả các file đều upload thành công
      const allSuccess = results.every(result => result.success);
      if (allSuccess) {
        setFileUploaded(true);
        setShowSuccess(true);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    navigate('/');
  };

  const requiredFiles = [
    'df_Customers.csv', 
    'df_Orders.csv', 
    'df_OrderItems.csv',
    'df_Products.csv'
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-lg font-medium mb-6">Tải lên dữ liệu</h2>
      
      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-2">Các file cần tải lên:</p>
        <ul className="list-disc list-inside text-sm text-gray-600 mb-4">
          {requiredFiles.map(file => (
            <li key={file}>{file}</li>
          ))}
        </ul>
        <p className="text-xs text-gray-500 italic">Lưu ý: Tải lên tất cả các file để hệ thống hoạt động đúng</p>
      </div>
      
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Chọn file CSV
        </label>
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          accept=".csv"
        />
        <p className="mt-1 text-sm text-gray-500">
          Bạn có thể chọn nhiều file cùng lúc
        </p>
      </div>

      <div className="flex justify-start">
        <button
          onClick={handleUpload}
          disabled={!files.length}
          className={`btn-primary ${!files.length ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Tải lên
        </button>
      </div>

      {showSuccess && (
        <div className="mt-6 bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-green-700">
                Tải lên thành công! Bây giờ bạn có thể xem các phân tích dữ liệu.
              </p>
              <button
                onClick={handleGoToDashboard}
                className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Xem Bảng điều khiển
              </button>
            </div>
          </div>
        </div>
      )}

      {uploadStatus.length > 0 && (
        <div className="mt-6 border rounded-md overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
            Kết quả tải lên
          </div>
          <div className="divide-y divide-gray-200">
            {uploadStatus.map((status, index) => (
              <div
                key={index}
                className={`px-4 py-3 flex justify-between ${
                  status.success ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <span className="text-sm">{status.name}</span>
                <span
                  className={`text-sm font-medium ${
                    status.success ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {status.success ? 'Thành công' : 'Thất bại'}
                  {!status.success && status.error && (
                    <span className="block text-xs">{status.error}</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;