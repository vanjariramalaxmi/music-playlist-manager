import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/">Playlist Manager</Link>
      </div>

      <div className="nav-links">
        {user ? (
          <>
            <NavLink to="/">Home</NavLink>
            <NavLink to="/songs">Songs</NavLink>
            <NavLink to="/playlists">Playlists</NavLink>
            <button type="button" className="link-button" onClick={logout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register">Register</NavLink>
          </>
        )}
      </div>
    </nav>
  );
}
