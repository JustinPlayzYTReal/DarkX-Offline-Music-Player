import React, { useState, useEffect, useCallback } from 'react';
import { Song, Playlist } from '../types';
import {
  getAllPlaylists,
  addSongToPlaylist,
  createPlaylist,
} from '../services/musicService';
import { PlusIcon } from '../constants';

interface AddToPlaylistModalProps {
  song: Song | null;
  isOpen: boolean;
  onClose: () => void;
}

const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({ song, isOpen, onClose }) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [feedback, setFeedback] = useState('');

  const fetchPlaylists = useCallback(async () => {
    const fetchedPlaylists = await getAllPlaylists();
    setPlaylists(fetchedPlaylists);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchPlaylists();
      // Reset state on open
      setIsCreating(false);
      setNewPlaylistName('');
      setFeedback('');
    }
  }, [isOpen, fetchPlaylists]);

  const handleAddToExisting = async (playlistId: string) => {
    if (!song) return;
    await addSongToPlaylist(playlistId, song.id);
    setFeedback(`Added to playlist!`);
    setTimeout(onClose, 800);
  };

  const handleCreateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!song || !newPlaylistName.trim()) return;

    const newPlaylist = await createPlaylist(newPlaylistName.trim());
    await addSongToPlaylist(newPlaylist.id, song.id);
    setFeedback(`Created and added to "${newPlaylist.name}"!`);
    setTimeout(onClose, 800);
  };
  
  if (!isOpen || !song) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-surface rounded-lg shadow-2xl w-full max-w-sm p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        style={{ borderRadius: 'var(--border-radius)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-accent truncate">Add "{song.title}" to...</h2>
        
        {feedback ? (
            <p className="text-center text-green-400 font-semibold">{feedback}</p>
        ) : isCreating ? (
            <form onSubmit={handleCreateAndAdd} className="space-y-4">
                <input
                    type="text"
                    placeholder="New playlist name"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    className="input-base"
                    autoFocus
                />
                <div className="flex justify-end space-x-2">
                     <button
                        type="button"
                        onClick={() => setIsCreating(false)}
                        className="btn btn-secondary"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn btn-accent"
                    >
                        Create & Add
                    </button>
                </div>
            </form>
        ) : (
            <div className="space-y-2">
                <ul className="max-h-60 overflow-y-auto -mr-2 pr-2 divide-y divide-theme/50">
                    {playlists.map(playlist => (
                        <li 
                            key={playlist.id}
                            onClick={() => handleAddToExisting(playlist.id)}
                            className="py-3 px-2 cursor-pointer hover:bg-white/10 rounded-md transition-colors"
                        >
                            {playlist.name}
                        </li>
                    ))}
                </ul>
                <button
                    onClick={() => setIsCreating(true)}
                    className="w-full flex items-center justify-center space-x-2 py-3 px-2 text-accent hover:bg-white/10 rounded-md transition-colors font-semibold"
                >
                    <PlusIcon className="w-5 h-5"/>
                    <span>New Playlist</span>
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default AddToPlaylistModal;