import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { useAuth } from '../context/AuthContext';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { getAudioSource } from '../api/audio';

const unwrap = (response) => response.data?.data ?? response.data;

const formatDuration = (seconds) => {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  return `${Math.floor(safeSeconds / 60)}:${String(Math.floor(safeSeconds % 60)).padStart(2, '0')}`;
};

const getId = (value) => (typeof value === 'object' ? value?._id : value);
export default function PlaylistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { playSong } = useAudioPlayer();
  const [playlist, setPlaylist] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', isPublic: false });
  const [songQuery, setSongQuery] = useState('');
  const [songResults, setSongResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const loadPlaylist = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/api/playlists/${id}`);
      const nextPlaylist = unwrap({ data });
      setPlaylist(nextPlaylist);
      setForm({ name: nextPlaylist.name || '', description: nextPlaylist.description || '', isPublic: Boolean(nextPlaylist.isPublic) });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load playlist.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlaylist();
  }, [id]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      if (!songQuery.trim()) {
        setSongResults([]);
        return;
      }
      setSearching(true);
      try {
        const { data } = await api.get('/api/songs/search', { params: { q: songQuery.trim(), page: 1, limit: 10 } });
        setSongResults(data.data || []);
      } catch {
        setSongResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [songQuery]);

  const isOwner = playlist && getId(playlist.owner) === (user?._id || user?.id);

  const handleUpdate = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put(`/api/playlists/${id}`, { ...form, name: form.name.trim() });
      setPlaylist(data.data);
      setToast('Playlist updated.');
    } catch (requestError) {
      setToast(requestError.response?.data?.message || 'Could not update playlist.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSong = async (songId) => {
    try {
      const { data } = await api.post(`/api/playlists/${id}/songs`, { songId });
      setPlaylist(data.data);
      setSongQuery('');
      setSongResults([]);
      setToast('Song added to playlist.');
    } catch (requestError) {
      setToast(requestError.response?.data?.message || 'Could not add song.');
    }
  };

  const handleRemoveSong = async (songId) => {
    try {
      const { data } = await api.delete(`/api/playlists/${id}/songs/${songId}`);
      setPlaylist(data.data);
      setToast('Song removed from playlist.');
    } catch (requestError) {
      setToast(requestError.response?.data?.message || 'Could not remove song.');
    }
  };

  if (loading) return <main className="songs-page"><LoadingSkeleton count={4} /></main>;
  if (!playlist) return <main className="songs-page"><div className="error-message page-message">{error || 'Playlist not found.'}</div></main>;

  return (
    <main className="playlists-page">
      <Link className="back-link" to="/playlists">Back to my playlists</Link>
      <header className="playlist-detail-header">
        <div>
          <p className="eyebrow">{playlist.isPublic ? 'Public playlist' : 'Private playlist'}</p>
          <h1>{playlist.name}</h1>
          <p>{playlist.description || 'No description'}</p>
        </div>
        <span className="playlist-owner">By {playlist.owner?.name || 'Unknown'}</span>
      </header>

      {error && <div className="error-message page-message">{error}</div>}
      {toast && <div className="toast" role="status">{toast}</div>}

      {isOwner && (
        <section className="playlist-settings">
          <h2>Playlist settings</h2>
          <form className="playlist-edit-form" onSubmit={handleUpdate}>
            <label>Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
            <label>Description<input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
            <label className="checkbox-label"><input type="checkbox" checked={form.isPublic} onChange={(event) => setForm({ ...form, isPublic: event.target.checked })} /> Public playlist</label>
            <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
          </form>
        </section>
      )}

      {isOwner && (
        <section className="add-songs-panel">
          <h2>Add songs</h2>
          <input value={songQuery} onChange={(event) => setSongQuery(event.target.value)} placeholder="Search by title, artist, or album" />
          {searching && <p className="panel-note">Searching...</p>}
          {songResults.length > 0 && (
            <div className="song-search-results">
              {songResults.map((song) => (
                <div className="song-result" key={song._id}>
                  <span><strong>{song.title}</strong> · {song.artist}</span>
                  <button type="button" onClick={() => handleAddSong(song._id)}>Add</button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="playlist-songs-section">
        <div className="section-heading"><h2>Songs</h2><span>{playlist.songs?.length || 0} total</span></div>
        {!playlist.songs?.length ? (
          <div className="songs-state">This playlist has no songs yet.</div>
        ) : (
          <div className="playlist-song-list">
            {playlist.songs.map((song) => (
              <div className="playlist-song-row" key={song._id}>
                <div><strong>{song.title}</strong><span>{song.artist} · {formatDuration(song.duration)}</span></div>
                {getAudioSource(song) && <button type="button" className="compact-play-button" onClick={() => playSong(song, playlist.songs)}>Play</button>}
                {isOwner && <button type="button" className="danger-button" onClick={() => handleRemoveSong(song._id)}>Remove</button>}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
