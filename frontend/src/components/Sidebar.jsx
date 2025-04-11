import { NavLink } from "react-router-dom"
import { BarChart2, TrendingUp, Package, Activity, Upload } from "react-feather"
import "./Sidebar.css"

const Sidebar = () => {
  return (
    <div className="sidebar">
      <ul className="sidebar-menu">
        <li>
          <NavLink to="/" className={({ isActive }) => (isActive ? "active" : "")}>
            <BarChart2 size={20} />
            <span>Dashboard</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/forecast" className={({ isActive }) => (isActive ? "active" : "")}>
            <TrendingUp size={20} />
            <span>Dự báo</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/reorder" className={({ isActive }) => (isActive ? "active" : "")}>
            <Package size={20} />
            <span>Tồn kho</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/analysis" className={({ isActive }) => (isActive ? "active" : "")}>
            <Activity size={20} />
            <span>Phân tích</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/upload" className={({ isActive }) => (isActive ? "active" : "")}>
            <Upload size={20} />
            <span>Upload</span>
          </NavLink>
        </li>
      </ul>
    </div>
  )
}

export default Sidebar
