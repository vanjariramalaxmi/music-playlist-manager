const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const getAudioSource = (song) => {
  if (!song) return '';
  if (song.audioUrl) return song.audioUrl;
  if (song.audioPath) return new URL(song.audioPath, `${apiBaseUrl}/`).toString();
  return '';
};
