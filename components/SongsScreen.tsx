import React, { useState, useEffect, useCallback } from 'react';
import { Song } from '../types';
import { getAllSongs, onSongsUpdate, updateSongInDB } from '../services/musicService';
import SongList from './SongList';
import EditSongModal from './EditSongModal';

const SongsScreen: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [songToEdit, setSongToEdit] = useState<Song | null>(null);

  const fetchSongs = useCallback(async () => {
    try {
        const allSongs = await getAllSongs();
        setSongs(allSongs);
    } catch (error) {
        console.error("Failed to fetch songs:", error);
    }
  }, []);

  useEffect(() => {
    fetchSongs(); // Initial fetch
    const unsubscribe = onSongsUpdate(fetchSongs); // Subscribe to updates from the music service
    return unsubscribe; // Unsubscribe when the component unmounts
  }, [fetchSongs]);

  const handleEditClick = (song: Song) => {
    setSongToEdit(song);
  };

  const handleSaveSong = async (updatedSong: Song) => {
    try {
      await updateSongInDB(updatedSong);
    } catch (error) {
      console.error("Failed to save song:", error);
    } finally {
      setSongToEdit(null); // Close the modal
    }
  };


  return (
    <>
      <div className="h-full">
        <header className="p-4 border-b border-theme flex justify-between items-center">
          <h1 className="text-4xl font-bold text-accent">Imported Songs</h1>
          {songs.length > 0 && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn btn-accent"
            >
              {isEditing ? 'Done' : 'Edit'}
            </button>
          )}
        </header>
        <SongList
          songs={songs}
          title="All Songs"
          isEditing={isEditing}
          onEditClick={handleEditClick}
        />
      </div>
      <EditSongModal
        isOpen={!!songToEdit}
        song={songToEdit}
        onSave={handleSaveSong}
        onCancel={() => setSongToEdit(null)}
      />
    </>
  );
};

export default SongsScreen;