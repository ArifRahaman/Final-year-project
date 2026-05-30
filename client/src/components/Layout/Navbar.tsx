import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  GraduationCap, LogOut, Menu, X, LayoutDashboard,
  BookOpen, PlusCircle, Library, ClipboardList, Search, Cpu
} from 'lucide-react';
import { useState } from 'react';
import './Navbar.css';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  const navLinks = isAuthenticated ? (
    user?.role === 'teacher' ? [
      { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
      { to: '/create-card', label: 'Create Card', icon: <PlusCircle size={18} /> },
      { to: '/access-requests', label: 'Requests', icon: <ClipboardList size={18} /> },
      { to: '/browse', label: 'Browse', icon: <Search size={18} /> },
      { to: '/labs', label: 'Virtual Labs', icon: <Cpu size={18} /> },
    ] : [
      { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
      { to: '/browse', label: 'Browse Cards', icon: <BookOpen size={18} /> },
      { to: '/my-library', label: 'My Library', icon: <Library size={18} /> },
      { to: '/labs', label: 'Virtual Labs', icon: <Cpu size={18} /> },
    ]
  ) : [
    { to: '/labs', label: 'Virtual Labs', icon: <Cpu size={18} /> },
  ];

  return (
    <nav className="navbar glass-strong" id="main-navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand" onClick={() => setMobileOpen(false)}>
          <GraduationCap size={28} className="brand-icon" />
          <span className="brand-text">
            <span className="text-gradient">Institute</span> Card Network
          </span>
        </Link>

        <div className={`navbar-links ${mobileOpen ? 'open' : ''}`}>
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`nav-link ${
                link.to === '/labs'
                  ? location.pathname.startsWith('/labs') ? 'active' : ''
                  : location.pathname === link.to ? 'active' : ''
              }`}
              onClick={() => setMobileOpen(false)}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          ))}

          {isAuthenticated ? (
            <div className="nav-user-section">
              <div className="nav-user-info">
                <div className="nav-avatar">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="nav-user-meta">
                  <span className="nav-user-name">{user?.name}</span>
                  <span className={`badge ${user?.role === 'teacher' ? 'badge-violet' : 'badge-cyan'}`}>
                    {user?.role}
                  </span>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout} id="logout-btn">
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="nav-auth-buttons">
              <Link to="/login" className="btn btn-ghost btn-sm" onClick={() => setMobileOpen(false)}>
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm" onClick={() => setMobileOpen(false)}>
                Get Started
              </Link>
            </div>
          )}
        </div>

        <button
          className="navbar-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </nav>
  );
}
