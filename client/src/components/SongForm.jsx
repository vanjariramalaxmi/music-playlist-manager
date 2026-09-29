import { useEffect, useState } from 'react';

const emptyForm = {
  title: '',
  artist: '',
  album: '',
  genre: '',
  duration: '',
  releaseYear: '',
  audioUrl: '',
  audioFile: null
};

export default function SongForm({ song, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm(song ? {
      title: song.title || '',
      artist: song.artist || '',
      album: song.album || '',
      genre: song.genre || '',
      duration: song.duration ?? '',
      releaseYear: song.releaseYear ?? '',
      audioUrl: song.audioUrl || '',
      audioFile: null
    } : emptyForm);
    setError('');
  }, [song]);

  const handleChange = (event) => {
    setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.artist.trim()) {
      setError('Title and artist are required.');
      return;
    }
    if (form.duration !== '' && Number(form.duration) < 0) {
      setError('Duration cannot be negative.');
      return;
    }
    if (form.audioUrl && form.audioFile) {
      setError('Choose an MP3 file or an audio URL, not both.');
      return;
    }

    setError('');
    await onSubmit({
      ...form,
      title: form.title.trim(),
      artist: form.artist.trim(),
      duration: form.duration === '' ? undefined : Number(form.duration),
      releaseYear: form.releaseYear === '' ? undefined : Number(form.releaseYear)
    });
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="song-form-modal" role="dialog" aria-modal="true" aria-labelledby="song-form-title">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Library</p>
            <h2 id="song-form-title">{song ? 'Edit song' : 'Add a song'}</h2>
          </div>
          <button type="button" className="close-button" onClick={onCancel} aria-label="Close">×</button>
        </div>

        <form className="song-form" onSubmit={handleSubmit}>
          <label>Title<input name="title" value={form.title} onChange={handleChange} required /></label>
          <label>Artist<input name="artist" value={form.artist} onChange={handleChange} required /></label>
          <label>Album<input name="album" value={form.album} onChange={handleChange} /></label>
          <div className="form-row">
            <label>Genre<input name="genre" value={form.genre} onChange={handleChange} /></label>
            <label>Duration (seconds)<input name="duration" type="number" min="0" step="1" value={form.duration} onChange={handleChange} /></label>
          </div>
          <label>Release year<input name="releaseYear" type="number" min="1800" max="2100" value={form.releaseYear} onChange={handleChange} /></label>
          <fieldset className="audio-source-fieldset">
            <legend>Audio source <span>optional</span></legend>
            <label className="file-field">
              MP3 file
              <input name="audioFile" type="file" accept="audio/mpeg,.mp3" onChange={(event) => setForm((previous) => ({ ...previous, audioFile: event.target.files?.[0] || null, audioUrl: '' }))} />
            </label>
            <label>Online audio URL<input name="audioUrl" type="url" value={form.audioUrl} onChange={(event) => setForm((previous) => ({ ...previous, audioUrl: event.target.value, audioFile: null }))} placeholder="https://example.com/track.mp3" /></label>
            <p className="form-help">Use an audio file you own or a direct, legal MP3 URL.</p>
          </fieldset>
          {error && <div className="error-message">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onCancel}>Cancel</button>
            <button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save song'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
