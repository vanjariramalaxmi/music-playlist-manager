const formatDuration = (seconds) => {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = String(Math.floor(safeSeconds % 60)).padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
};

import { getAudioSource } from '../api/audio';

const getId = (value) => (typeof value === 'object' ? value?._id : value);

export default function SongCard({ song, currentUserId, playlists, onEdit, onDelete, onAddToPlaylist, onPlay }) {
  const isCreator = getId(song.createdBy) === currentUserId;
  const audioSource = getAudioSource(song);

  return (
    <article className="song-card">
      <div className="song-card-main">
        <div>
          <p className="song-artist">{song.artist}</p>
          <h2>{song.title}</h2>
          <p className="song-meta">{song.album || 'Single'} {song.genre ? `· ${song.genre}` : ''}</p>
        </div>
        <span className="song-duration">{formatDuration(song.duration)}</span>
      </div>

      <div className="song-play-row">
        <button
          type="button"
          className="play-song-button"
          onClick={() => (audioSource ? onPlay(song) : onEdit(song))}
          disabled={!audioSource && !isCreator}
        >
          {audioSource ? 'Play song' : isCreator ? 'Add audio' : 'No audio attached'}
        </button>
        {audioSource && <span className="audio-ready-label">Ready to play</span>}
        {!audioSource && isCreator && <span className="audio-ready-label">Upload an MP3 to play</span>}
      </div>

      <div className="song-card-actions">
        <label className="playlist-select-label">
          <span>Add to playlist</span>
          <select
            value=""
            onChange={(event) => {
              if (event.target.value) {
                onAddToPlaylist(event.target.value, song._id);
              }
            }}
            disabled={!playlists.length}
          >
            <option value="">{playlists.length ? 'Choose playlist' : 'No playlists yet'}</option>
            {playlists.map((playlist) => (
              <option key={playlist._id} value={playlist._id}>{playlist.name}</option>
            ))}
          </select>
        </label>

        {isCreator && (
          <div className="owner-actions">
            <button type="button" className="secondary-button" onClick={() => onEdit(song)}>Edit</button>
            <button type="button" className="danger-button" onClick={() => onDelete(song._id)}>Delete</button>
          </div>
        )}
      </div>
    </article>
  );
}
