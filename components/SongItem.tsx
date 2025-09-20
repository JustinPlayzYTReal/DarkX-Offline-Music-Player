import React from 'react';
import { Song } from '../types';
import { AlbumIcon, MoreVerticalIcon } from '../constants';

interface SongItemProps {
  song: Song;
  onClick: () => void;
  onMoreClick: (song: Song) => void;
}

const SongItem: React.FC<SongItemProps> = ({ song, onClick, onMoreClick }) => {
  return (
    <div
      className="flex items-center space-x-4 song-item"
    >
      <div 
        className="flex-1 min-w-0 flex items-center space-x-4 cursor-pointer"
        onClick={onClick}
      >
        {song.artwork ? (
          <img src={song.artwork} alt={song.title} className="object-cover rounded-md song-item-artwork" />
        ) : (
          <div className="bg-surface rounded-md flex items-center justify-center flex-shrink-0 song-item-artwork">
              <AlbumIcon className="w-6 h-6 text-secondary" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate text-accent">{song.title}</p>
          <p className="text-sm text-secondary truncate">{song.artist}</p>
        </div>
      </div>
       <button 
        onClick={(e) => {
            e.stopPropagation();
            onMoreClick(song);
        }}
        className="p-2 text-secondary hover:text-primary rounded-full"
        aria-label={`Options for ${song.title}`}
       >
          <MoreVerticalIcon className="w-6 h-6" />
      </button>
    </div>
  );
};

export default SongItem;