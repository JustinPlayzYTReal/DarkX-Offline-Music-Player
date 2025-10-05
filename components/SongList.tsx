import React, { useState } from 'react';
import { Song } from '../types';
import { usePlayer } from '../context/PlayerContext';
import { useTheme } from '../hooks/useTheme';
import SongItem from './SongItem';
import SongGridItem from './SongGridItem';
import AddToPlaylistModal from './AddToPlaylistModal';

interface SongListProps {
  songs: Song[];
  title: string;
  isEditing?: boolean;
  onEditClick?: (song: Song) => void;
}

// FIX: Updated the default value for `onEditClick` to a function that accepts an argument.
// This resolves the type error where `onEditClick(song)` was called but the default
// prop `() => {}` did not accept any arguments.
const SongList: React.FC<SongListProps> = ({ songs, title, isEditing = false, onEditClick = (song) => {} }) => {
  const { playSong } = usePlayer();
  const { layout } = useTheme();
  const [songToAddToPlaylist, setSongToAddToPlaylist] = useState<Song | null>(null);

  const handleOpenAddToPlaylistModal = (song: Song) => {
    setSongToAddToPlaylist(song);
  };

  const handleItemClick = (song: Song) => {
    if (isEditing) {
      onEditClick(song);
    } else {
      playSong(song, songs);
    }
  };

  if (songs.length === 0) {
    return (
        <div className="px-4 py-6">
            <h2 className="text-2xl font-bold mb-4 text-accent">{title}</h2>
            <p className="text-secondary">No songs here. Try importing some music!</p>
        </div>
    );
  }

  return (
    <>
      <div className="px-4 py-6">
        <h2 className="text-2xl font-bold mb-4 text-accent">{title}</h2>
        {layout === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {songs.map((song) => (
              <SongGridItem 
                key={song.id} 
                song={song} 
                onClick={() => handleItemClick(song)}
                onMoreClick={handleOpenAddToPlaylistModal}
                isEditing={isEditing}
              />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-theme border-t border-b border-theme">
            {songs.map((song) => (
              <SongItem 
                key={song.id} 
                song={song} 
                onClick={() => handleItemClick(song)}
                onMoreClick={handleOpenAddToPlaylistModal}
                isEditing={isEditing}
              />
            ))}
          </div>
        )}
      </div>
      <AddToPlaylistModal
        isOpen={!!songToAddToPlaylist}
        song={songToAddToPlaylist}
        onClose={() => setSongToAddToPlaylist(null)}
      />
    </>
  );
};

export default SongList;