import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const Navbar: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="app-navbar">
      <div className="app-navbar-left">
        <h2 className="app-brand" onClick={() => navigate('/')}>
          Product Sales Suite
        </h2>
        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
          Dashboard
        </NavLink>
        <NavLink to="/products" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Products
        </NavLink>
        <NavLink to="/orders" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Orders
        </NavLink>
      </div>

      <button onClick={handleLogout} className="btn btn-danger btn-sm">
        Logout
      </button>
    </nav>
  );
};

export default Navbar;
