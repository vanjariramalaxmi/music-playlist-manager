import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function MyPlaylists() {
  const [playlists, setPlaylists] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', isPublic: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const loadPlaylists = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/api/playlists/mine', { params: { page: 1, limit: 100 } });
      const result = data;
      setPlaylists(result.data || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load playlists.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlaylists();
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const { data } = await api.post('/api/playlists', { ...form, name: form.name.trim() });
      setPlaylists((previous) => [data.data, ...previous]);
      setForm({ name: '', description: '', isPublic: false });
      setToast('Playlist created.');
    } catch (requestError) {
      setToast(requestError.response?.data?.message || 'Could not create playlist.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (playlistId) => {
    if (!window.confirm('Delete this playlist?')) return;
    try {
      await api.delete(`/api/playlists/${playlistId}`);
      setPlaylists((previous) => previous.filter((playlist) => playlist._id !== playlistId));
      setToast('Playlist deleted.');
    } catch (requestError) {
      setToast(requestError.response?.data?.message || 'Could not delete playlist.');
    }
  };

  return (
    <main className="playlists-page">
      <header className="songs-header">
        <div>
          <p className="eyebrow">Your collection</p>
          <h1>My playlists</h1>
          <p>Create focused spaces for every listening mood.</p>
        </div>
      </header>

      <form className="playlist-create-form" onSubmit={handleSubmit}>
        <div className="playlist-form-fields">
          <label>Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Late night drive" required /></label>
          <label>Description<input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Optional description" /></label>
        </div>
        <label className="checkbox-label"><input type="checkbox" checked={form.isPublic} onChange={(event) => setForm({ ...form, isPublic: event.target.checked })} /> Public playlist</label>
        <button type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create playlist'}</button>
      </form>

      {error && <div className="error-message page-message">{error}</div>}
      {toast && <div className="toast" role="status">{toast}</div>}

      {loading ? (
        <LoadingSkeleton count={4} variant="card" />
      ) : playlists.length === 0 ? (
        <div className="songs-state"><h2>No playlists yet</h2><p>Create one above, then add songs from the Songs page.</p></div>
      ) : (
        <div className="playlist-grid">
          {playlists.map((playlist) => (
            <article className="playlist-card" key={playlist._id}>
              <div>
                <div className="playlist-card-heading">
                  <h2>{playlist.name}</h2>
                  <span className="visibility-badge">{playlist.isPublic ? 'Public' : 'Private'}</span>
                </div>
                <p>{playlist.description || 'No description'}</p>
                <small>{playlist.songs?.length || 0} songs</small>
              </div>
              <div className="playlist-card-actions">
                <Link className="button-link" to={`/playlists/${playlist._id}`}>Open playlist</Link>
                <button type="button" className="danger-button" onClick={() => handleDelete(playlist._id)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
