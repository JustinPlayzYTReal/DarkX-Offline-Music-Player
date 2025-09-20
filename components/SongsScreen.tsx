import React, { useState, useEffect, useCallback } from 'react';
import { Song } from '../types';
import { getAllSongs } from '../services/musicService';
import SongList from './SongList';

const SongsScreen: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);

  const fetchSongs = useCallback(async () => {
    const allSongs = await getAllSongs();
    setSongs(allSongs);
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchSongs, 2000); // Poll for changes
    fetchSongs(); // Initial fetch
    return () => clearInterval(interval);
  }, [fetchSongs]);

  return (
    <div className="h-full">
      <header className="p-4 border-b border-theme">
        <h1 className="text-4xl font-bold text-accent">Imported Songs</h1>
      </header>
      <SongList songs={songs} title="All Songs" />
    </div>
  );
};

export default SongsScreen;