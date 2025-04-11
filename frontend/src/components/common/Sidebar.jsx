// src/components/common/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const menus = [
    { name: 'Tổng quan', path: '/' },
    { name: 'Phân tích', path: '/analyze' },
    { name: 'Dự báo', path: '/forecast' },
    { name: 'Đặt hàng', path: '/reorder' },
    { name: 'Tải lên dữ liệu', path: '/upload' },
  ];

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200">
      <div className="h-full px-3 py-4">
        <nav className="space-y-1">
          {menus.map((menu) => (
            <NavLink
              key={menu.path}
              to={menu.path}
              className={({ isActive }) =>
                `flex items-center px-3 py-3 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              {menu.name}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;