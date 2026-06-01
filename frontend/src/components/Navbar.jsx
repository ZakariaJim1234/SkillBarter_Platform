import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">⚡</span>
          <span className="brand-name">SkillBarter</span>
        </Link>

        <div className="navbar-links">
          <Link to="/marketplace">Marketplace</Link>
          <Link to="/requests">Requests</Link>
        </div>

        <div className="navbar-actions">
          {user ? (
            <>
              <div className="credit-pill">
                <span className="credit-icon">◈</span>
                <span>{user.skillCreditBalance ?? '—'}</span>
              </div>
              <Link to="/dashboard" className="btn btn-secondary btn-sm">Dashboard</Link>
              <button className="btn btn-primary btn-sm" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Join Free</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
