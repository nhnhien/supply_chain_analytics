// src/pages/Reorder.jsx
import React, { useEffect } from 'react';
import Layout from '../components/common/Layout';
import ReorderStrategy from '../components/reorder/ReorderStrategy';
import { useApp } from '../context/AppContext';
import { getReorderStrategy } from '../api';

const Reorder = () => {
  const { loading, setLoading, handleError, fileUploaded, reorderData, setReorderData } = useApp();

  useEffect(() => {
    const fetchReorderData = async () => {
      if (!fileUploaded) return;
      
      setLoading(true);
      try {
        const response = await getReorderStrategy();
        setReorderData(response.data);
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchReorderData();
  }, [fileUploaded]);

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Kế hoạch đặt hàng</h1>
      
      {!fileUploaded ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Vui lòng tải lên dữ liệu trước khi sử dụng kế hoạch đặt hàng.
                <a href="/upload" className="font-medium underline text-yellow-700 hover:text-yellow-600 ml-1">
                  Tải lên ngay
                </a>
              </p>
            </div>
          </div>
        </div>
      ) : loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Đang tính toán kế hoạch đặt hàng...</p>
        </div>
      ) : (
        <>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Kế hoạch đặt hàng được tính toán dựa trên mô hình EOQ (Economic Order Quantity) và phân tích lead time theo danh mục sản phẩm.
                </p>
              </div>
            </div>
          </div>
          
          <ReorderStrategy reorderData={reorderData} />
        </>
      )}
    </Layout>
  );
};

export default Reorder;