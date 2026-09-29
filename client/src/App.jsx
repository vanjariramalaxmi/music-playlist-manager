import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ThemePicker from './components/ThemePicker';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SongsPage from './pages/SongsPage';
import MyPlaylists from './pages/MyPlaylists';
import PlaylistDetail from './pages/PlaylistDetail';
import AudioPlayer from './components/AudioPlayer';
import heroArtwork from './assets/music-home.jpg';
import './App.css';

function HomePage({ theme, onThemeChange }) {
  const { user } = useAuth();

  return (
    <main className="home-dashboard">
      <header className="home-header">
        <div className="home-heading">
          <p className="eyebrow">Your music home</p>
          <h1>Welcome back,<br /><span>{user?.name || 'listener'}</span></h1>
          <p>Pick a color mood and jump back into your collection.</p>
        </div>
        <ThemePicker label="Appearance" theme={theme} onThemeChange={onThemeChange} />
      </header>

      <section className="home-feature" aria-labelledby="home-feature-title">
        <div className="home-feature-copy">
          <p className="eyebrow">A soundtrack in your colors</p>
          <h2 id="home-feature-title">What are you in the mood for?</h2>
          <p>Find a track, press play, and let the next song set the tone.</p>
          <div className="home-actions">
            <Link className="home-primary-link" to="/songs">Browse songs <span aria-hidden="true">→</span></Link>
            <Link className="home-secondary-link" to="/playlists">Open playlists <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
        <div className="home-artwork">
          <img className="home-hero-image" src={heroArtwork} alt="Colorful music-themed illustration" />
          <div className="home-art-caption"><span>Your collection</span><strong>Play it your way.</strong></div>
        </div>
      </section>

      <nav className="home-shortcuts" aria-label="Your library">
        <p className="eyebrow">Jump back in</p>
        <div className="home-shortcut-grid">
          <Link className="home-shortcut" to="/songs">
            <span>01 / Collection</span>
            <strong>Song library</strong>
            <span>Browse and edit your tracks <b aria-hidden="true">→</b></span>
          </Link>
          <Link className="home-shortcut" to="/playlists">
            <span>02 / Mixes</span>
            <strong>Your playlists</strong>
            <span>Open your saved collections <b aria-hidden="true">→</b></span>
          </Link>
        </div>
      </nav>
    </main>
  );
}

function App() {
  const { user } = useAuth();
  const [theme, setTheme] = useState(() => window.localStorage.getItem('music-library-theme') || 'prism');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('music-library-theme', theme);
  }, [theme]);

  return (
    <>
      <Navbar />

      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage theme={theme} onThemeChange={setTheme} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/songs"
          element={
            <ProtectedRoute>
              <SongsPage theme={theme} onThemeChange={setTheme} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/playlists"
          element={
            <ProtectedRoute>
              <MyPlaylists />
            </ProtectedRoute>
          }
        />

        <Route
          path="/playlists/:id"
          element={
            <ProtectedRoute>
              <PlaylistDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <LoginPage />}
        />

        <Route
          path="/register"
          element={user ? <Navigate to="/" replace /> : <RegisterPage />}
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <AudioPlayer />
    </>
  );
}

export default App;
