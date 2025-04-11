// src/components/common/Navbar.jsx
import React from 'react';

const Navbar = () => {
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
            <span className="text-sm text-gray-500">Phiên bản 1.0</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;