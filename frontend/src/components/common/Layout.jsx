// src/components/common/Layout.jsx
import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useApp } from '../../context/AppContext';

const Layout = ({ children }) => {
  const { error, clearError } = useApp();
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mx-auto my-2 max-w-7xl" role="alert">
          <p className="font-bold">Lỗi</p>
          <p>{error}</p>
          <button 
            onClick={clearError}
            className="mt-1 text-sm text-red-700 underline"
          >
            Đóng
          </button>
        </div>
      )}
      
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;