import React, { useState, useEffect, useCallback } from 'react';
import { Playlist, Song } from '../types';
import {
  getAllPlaylists,
  getSongsForPlaylist,
  createPlaylist,
} from '../services/musicService';
import SongList from './SongList';
import CreatePlaylistModal from './CreatePlaylistModal';
import { PlusIcon, PlaylistIcon } from '../constants';

const PlaylistsScreen: React.FC = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [songsInPlaylist, setSongsInPlaylist] = useState<Song[]>([]);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  
  const fetchPlaylists = useCallback(async () => {
    const fetchedPlaylists = await getAllPlaylists();
    setPlaylists(fetchedPlaylists);
  }, []);

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  const handleSelectPlaylist = async (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    const songs = await getSongsForPlaylist(playlist.id);
    setSongsInPlaylist(songs);
  };

  const handleCreatePlaylist = async (name: string) => {
    if (name.trim()) {
      await createPlaylist(name);
      fetchPlaylists(); // Refresh the list
      setCreateModalOpen(false);
    }
  };

  if (selectedPlaylist) {
    return (
      <div className="h-full">
        <header className="p-4 border-b border-theme flex items-center space-x-4">
            <button 
                onClick={() => setSelectedPlaylist(null)}
                className="text-accent font-bold hover:underline"
            >
                &larr; Back
            </button>
            <h1 className="text-4xl font-bold text-accent truncate">{selectedPlaylist.name}</h1>
        </header>
        <SongList songs={songsInPlaylist} title="Songs" />
      </div>
    );
  }

  return (
    <>
      <div className="h-full">
        <header className="p-4 border-b border-theme flex justify-between items-center">
          <h1 className="text-4xl font-bold text-accent">Playlists</h1>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="btn btn-accent flex items-center space-x-2"
            aria-label="Create new playlist"
          >
            <PlusIcon className="w-5 h-5" />
            <span>New Playlist</span>
          </button>
        </header>

        <div className="p-4">
          {playlists.length > 0 ? (
            <div className="divide-y divide-theme border-t border-b border-theme">
              {playlists.map((playlist) => (
                <div
                  key={playlist.id}
                  onClick={() => handleSelectPlaylist(playlist)}
                  className="flex items-center p-4 space-x-4 cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <PlaylistIcon className="w-8 h-8 text-accent"/>
                  <div className="flex-1">
                    <p className="text-lg font-semibold">{playlist.name}</p>
                    <p className="text-sm text-secondary">{playlist.songIds.length} song(s)</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-secondary">You haven't created any playlists yet.</p>
            </div>
          )}
        </div>
      </div>
      <CreatePlaylistModal
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreatePlaylist}
      />
    </>
  );
};

export default PlaylistsScreen;