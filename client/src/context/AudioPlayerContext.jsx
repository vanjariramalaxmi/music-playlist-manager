import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getAudioSource } from '../api/audio';

const AudioPlayerContext = createContext(null);

export function AudioPlayerProvider({ children }) {
  const audioRef = useRef(null);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const currentSong = queue[queueIndex] || null;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return undefined;

    audio.src = getAudioSource(currentSong);
    audio.load();
    setCurrentTime(0);
    setDuration(Number(currentSong.duration) || 0);

    return undefined;
  }, [currentSong]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;
    if (isPlaying) audio.play().catch(() => setIsPlaying(false));
    else audio.pause();
  }, [isPlaying, currentSong]);

  const playSong = (song, nextQueue = []) => {
    const usableQueue = (nextQueue.length ? nextQueue : [song]).filter((item) => getAudioSource(item));
    const nextIndex = usableQueue.findIndex((item) => item._id === song._id);
    if (nextIndex < 0) return;
    setQueue(usableQueue);
    setQueueIndex(nextIndex);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (!currentSong) return;
    setIsPlaying((playing) => !playing);
  };

  const skipTo = (nextIndex) => {
    if (!queue.length) return;
    const wrappedIndex = (nextIndex + queue.length) % queue.length;
    setQueueIndex(wrappedIndex);
    setIsPlaying(true);
  };

  const skipNext = () => skipTo(queueIndex + 1);
  const skipPrevious = () => {
    if (audioRef.current?.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    skipTo(queueIndex - 1);
  };

  const seek = (value) => {
    const nextTime = Number(value);
    if (audioRef.current) audioRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const value = useMemo(() => ({
    currentSong,
    queue,
    queueIndex,
    isPlaying,
    currentTime,
    duration,
    playSong,
    togglePlay,
    skipNext,
    skipPrevious,
    seek,
    setDuration,
    setCurrentTime
  }), [currentSong, queue, queueIndex, isPlaying, currentTime, duration]);

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
      <audio
        className="player-audio"
        ref={audioRef}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || Number(currentSong?.duration) || 0)}
        onEnded={skipNext}
        onError={() => setIsPlaying(false)}
      />
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) throw new Error('useAudioPlayer must be used inside AudioPlayerProvider');
  return context;
}
