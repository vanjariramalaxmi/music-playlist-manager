import { useEffect, useState } from 'react';
import api from '../api/axios';
import Pagination from '../components/Pagination';
import SongCard from '../components/SongCard';
import SongForm from '../components/SongForm';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ThemePicker from '../components/ThemePicker';
import { useAuth } from '../context/AuthContext';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { getAudioSource } from '../api/audio';

const unwrap = (response) => response.data?.data ?? response.data;

export default function SongsPage({ theme, onThemeChange }) {
  const { user } = useAuth();
  const { playSong } = useAudioPlayer();
  const [songs, setSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [editingSong, setEditingSong] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const loadSongs = async (nextPage = page, search = query) => {
    setLoading(true);
    setError('');
    try {
      const endpoint = search.trim() ? '/api/songs/search' : '/api/songs';
      const { data } = await api.get(endpoint, { params: { page: nextPage, limit: 10, ...(search.trim() ? { q: search.trim() } : {}) } });
      const result = data;
      setSongs(result.data || []);
      setPage(result.page || nextPage);
      setTotalPages(result.totalPages || 1);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load songs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadSongs(1, query);
    }, query ? 300 : 0);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const loadPlaylists = async () => {
      try {
        const { data } = await api.get('/api/playlists/mine', { params: { page: 1, limit: 100 } });
        const result = unwrap({ data });
        setPlaylists(Array.isArray(result) ? result : result.data || []);
      } catch {
        setPlaylists([]);
      }
    };
    loadPlaylists();
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === 'audioFile' && value) payload.append('audioFile', value);
        else if (key !== 'audioFile' && value !== undefined && value !== '') payload.append(key, value);
      });
      if (editingSong) {
        await api.put(`/api/songs/${editingSong._id}`, payload);
        setToast('Song updated.');
      } else {
        await api.post('/api/songs', payload);
        setToast('Song added.');
      }
      setShowForm(false);
      setEditingSong(null);
      await loadSongs(editingSong ? page : 1, query);
    } catch (requestError) {
      setToast(requestError.response?.data?.message || 'Could not save song.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (songId) => {
    if (!window.confirm('Delete this song?')) return;
    try {
      await api.delete(`/api/songs/${songId}`);
      setToast('Song deleted.');
      await loadSongs(songs.length === 1 && page > 1 ? page - 1 : page, query);
    } catch (requestError) {
      setToast(requestError.response?.data?.message || 'Could not delete song.');
    }
  };

  const handleAddToPlaylist = async (playlistId, songId) => {
    try {
      await api.post(`/api/playlists/${playlistId}/songs`, { songId });
      setToast('Song added to playlist.');
    } catch (requestError) {
      setToast(requestError.response?.data?.message || 'Could not add song to playlist.');
    }
  };

  const currentUserId = user?._id || user?.id;
  const trendingSongs = !query.trim() && page === 1 ? songs.slice(0, 3) : [];

  return (
    <main className="songs-page" data-theme={theme}>
      <header className="songs-header">
        <div className="songs-heading">
          <p className="eyebrow">Your library</p>
          <h1>Song library</h1>
          <p>Browse, play, and shape your collection.</p>
        </div>
        <button type="button" className="add-song-button" onClick={() => { setEditingSong(null); setShowForm(true); }}>+ Add song</button>
      </header>

      <div className="songs-toolbar">
        <label className="search-field">
          <span>Find a track</span>
          <span className="search-input-wrap">
            <span className="search-icon" aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Title, artist, or album" />
          </span>
        </label>
        <ThemePicker label="Color theme" theme={theme} onThemeChange={onThemeChange} />
      </div>

      <div className="song-results-line" aria-live="polite">
        <span>{query ? `Matches for “${query}”` : 'All tracks'}</span>
        <span>{songs.length} {songs.length === 1 ? 'track' : 'tracks'} shown</span>
      </div>

      {error && <div className="error-message page-message">{error}</div>}
      {toast && <div className="toast" role="status">{toast}</div>}

      {!loading && trendingSongs.length > 0 && (
        <section className="trending-section" aria-labelledby="trending-title">
          <div className="trending-heading">
            <div>
              <p className="eyebrow">Freshly added</p>
              <h2 id="trending-title">Trending in your library</h2>
            </div>
            <span className="trending-note">Latest additions</span>
          </div>
          <div className="trending-grid">
            {trendingSongs.map((song, index) => {
              const hasAudio = Boolean(getAudioSource(song));
              return (
                <article className="trending-track" key={song._id}>
                  <div className={`trending-art trending-art-${index + 1}`} aria-hidden="true">
                    {song.title?.trim().charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div className="trending-copy">
                    <h3>{song.title}</h3>
                    <p>{song.artist}</p>
                    <span>Recently added</span>
                  </div>
                  <button
                    type="button"
                    className="trending-play"
                    aria-label={hasAudio ? `Play ${song.title}` : `No audio attached for ${song.title}`}
                    title={hasAudio ? 'Play track' : 'No audio attached'}
                    disabled={!hasAudio}
                    onClick={() => playSong(song, songs)}
                  >
                    <span className="play-glyph" aria-hidden="true" />
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {loading ? (
        <LoadingSkeleton count={5} />
      ) : songs.length === 0 ? (
        <div className="songs-state"><h2>No songs found</h2><p>Try another search or add the first song to your library.</p></div>
      ) : (
        <div className="songs-list">
          {songs.map((song, index) => (
            <SongCard
              key={song._id}
              song={song}
              currentUserId={currentUserId}
              playlists={playlists}
              onEdit={(selectedSong) => { setEditingSong(selectedSong); setShowForm(true); }}
              onDelete={handleDelete}
              onAddToPlaylist={handleAddToPlaylist}
              onPlay={(song) => playSong(song, songs)}
              index={index}
            />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={(nextPage) => loadSongs(nextPage, query)} />

      {showForm && <SongForm song={editingSong} onSubmit={handleSave} onCancel={() => { setShowForm(false); setEditingSong(null); }} submitting={saving} />}
    </main>
  );
}
