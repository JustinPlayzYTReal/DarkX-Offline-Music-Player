import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { Song } from '../types';
import { addRecentlyPlayed } from '../services/musicService';

interface PlayerContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  playSong: (song: Song, playlist?: Song[]) => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  playNext: () => void;
  playPrev: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement>(new Audio());

  const playSong = useCallback(async (song: Song, newPlaylist: Song[] = []) => {
    setCurrentSong(song);
    if (newPlaylist.length > 0) {
      setPlaylist(newPlaylist);
    } else {
      setPlaylist([song]);
    }
    audioRef.current.src = song.url;
    
    try {
      await audioRef.current.play();
      setIsPlaying(true);
      addRecentlyPlayed(song);
    } catch (e) {
      console.error("Error playing audio:", e);
      setIsPlaying(false);
    }
  }, []);

  const togglePlay = useCallback(async () => {
    if (!currentSong) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (e) {
        console.error("Error resuming audio:", e);
        setIsPlaying(false);
      }
    }
  }, [isPlaying, currentSong]);

  const playNext = useCallback(() => {
    if (!currentSong) return;
    const currentIndex = playlist.findIndex(s => s.id === currentSong.id);
    if (currentIndex !== -1 && currentIndex < playlist.length - 1) {
      playSong(playlist[currentIndex + 1], playlist);
    }
  }, [currentSong, playlist, playSong]);

  const playPrev = useCallback(() => {
    if (!currentSong) return;
    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    const currentIndex = playlist.findIndex(s => s.id === currentSong.id);
    if (currentIndex > 0) {
      playSong(playlist[currentIndex - 1], playlist);
    }
  }, [currentSong, playlist, playSong]);


  const seek = (time: number) => {
    audioRef.current.currentTime = time;
    setProgress(time);
  };

  useEffect(() => {
    const audio = audioRef.current;
    
    const handleTimeUpdate = () => setProgress(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => playNext();

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [playNext]);

  // Media Session API for background playback and OS controls
  useEffect(() => {
    if (!('mediaSession' in navigator)) {
      return;
    }

    if (!currentSong) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
      return;
    }
    
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentSong.title,
      artist: currentSong.artist,
      album: currentSong.album,
      artwork: currentSong.artwork ? [{ src: currentSong.artwork }] : [],
    });

    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

    navigator.mediaSession.setActionHandler('play', () => togglePlay());
    navigator.mediaSession.setActionHandler('pause', () => togglePlay());
    navigator.mediaSession.setActionHandler('previoustrack', () => playPrev());
    navigator.mediaSession.setActionHandler('nexttrack', () => playNext());

  }, [currentSong, isPlaying, togglePlay, playPrev, playNext]);


  const value = {
    currentSong,
    isPlaying,
    progress,
    duration,
    playSong,
    togglePlay,
    seek,
    playNext,
    playPrev,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
};

export const usePlayer = (): PlayerContextType => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};