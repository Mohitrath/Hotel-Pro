import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isStaff } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="navbar navbar-expand-md navbar-dark bg-hp sticky-top">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">
          <i className="bi bi-building text-accent me-2" />
          Hotel<span className="text-accent">Pro</span>
        </Link>
        <button className="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#nav">
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="nav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item"><NavLink className="nav-link" to="/rooms">Rooms</NavLink></li>
            {user && <li className="nav-item"><NavLink className="nav-link" to="/my-bookings">My Bookings</NavLink></li>}
            {isStaff && <li className="nav-item"><NavLink className="nav-link" to="/admin">Admin Panel</NavLink></li>}
          </ul>
          <ul className="navbar-nav align-items-md-center gap-md-2">
            {user ? (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/profile">
                    <i className="bi bi-person-circle me-1" />{user.name}
                    <span className="badge bg-secondary ms-2 text-capitalize">{user.role}</span>
                  </NavLink>
                </li>
                <li className="nav-item">
                  <button className="btn btn-sm btn-outline-light" onClick={() => { logout(); navigate('/'); }}>
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item"><NavLink className="nav-link" to="/login">Login</NavLink></li>
                <li className="nav-item"><Link className="btn btn-sm btn-accent" to="/register">Sign up</Link></li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
