import React, { useState, useEffect, useCallback } from 'react';
import { Song } from '../types';
import { getRecentlyPlayed, onRecentUpdate } from '../services/musicService';
import SongList from './SongList';

const HomeScreen: React.FC = () => {
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>([]);

  const fetchSongs = useCallback(async () => {
    try {
        const songs = await getRecentlyPlayed();
        setRecentlyPlayed(songs);
    } catch (error) {
        console.error("Failed to fetch recently played songs:", error);
    }
  }, []);

  useEffect(() => {
    fetchSongs(); // Initial fetch
    const unsubscribe = onRecentUpdate(fetchSongs); // Subscribe to updates
    return unsubscribe; // Unsubscribe on unmount
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