import { Link } from "react-router-dom"
import "./Navbar.css"

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Supply Chain Analytics</Link>
      </div>
      <div className="navbar-menu">
        <div className="navbar-end">
          <div className="navbar-item">
            <Link to="/upload" className="upload-btn">
              <i className="fas fa-upload"></i> Upload Data
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
