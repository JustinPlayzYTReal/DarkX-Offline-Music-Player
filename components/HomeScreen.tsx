import React, { useState, useEffect, useCallback } from 'react';
import { Song } from '../types';
import { getRecentlyPlayed } from '../services/musicService';
import SongList from './SongList';

const HomeScreen: React.FC = () => {
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>([]);

  const fetchSongs = useCallback(async () => {
    const songs = await getRecentlyPlayed();
    setRecentlyPlayed(songs);
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchSongs, 2000); // Poll for changes
    fetchSongs(); // Initial fetch
    return () => clearInterval(interval);
  }, [fetchSongs]);

  return (
    <div className="h-full">
      <header className="p-4 border-b border-theme">
        <h1 className="text-4xl font-bold text-accent">Home</h1>
      </header>
      <SongList songs={recentlyPlayed} title="Recently Played" />
    </div>
  );
};

export default HomeScreen;