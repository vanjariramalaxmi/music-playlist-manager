import { getAudioSource } from '../api/audio';
import { useAudioPlayer } from '../context/AudioPlayerContext';

const formatTime = (seconds) => {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  return `${Math.floor(safeSeconds / 60)}:${String(safeSeconds % 60).padStart(2, '0')}`;
};

export default function AudioPlayer() {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    skipNext,
    skipPrevious,
    seek
  } = useAudioPlayer();

  if (!currentSong) return null;

  const progressMax = Math.max(duration, 1);

  return (
    <aside className="global-player" aria-label="Music player">
      <div className="player-track">
        <div className="player-art">{currentSong.title?.[0]?.toUpperCase() || '♪'}</div>
        <div className="player-copy">
          <strong>{currentSong.title}</strong>
          <span>{currentSong.artist}</span>
        </div>
      </div>
      <div className="player-controls">
        <div className="player-buttons">
          <button type="button" className="player-skip" onClick={skipPrevious} aria-label="Previous song">|&lt;</button>
          <button type="button" className="player-play" onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>{isPlaying ? '||' : '▶'}</button>
          <button type="button" className="player-skip" onClick={skipNext} aria-label="Next song">&gt;|</button>
        </div>
        <div className="player-progress">
          <span>{formatTime(currentTime)}</span>
          <input type="range" min="0" max={progressMax} step="0.1" value={Math.min(currentTime, progressMax)} onChange={(event) => seek(event.target.value)} aria-label="Song progress" />
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      <a className="player-source" href={getAudioSource(currentSong)} target="_blank" rel="noreferrer">Open audio</a>
    </aside>
  );
}
