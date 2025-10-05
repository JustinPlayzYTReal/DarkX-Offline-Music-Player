import React from 'react';
import { Song } from '../types';
import { AlbumIcon, MoreVerticalIcon } from '../constants';

interface SongGridItemProps {
  song: Song;
  onClick: () => void;
  onMoreClick: (song: Song) => void;
  isEditing?: boolean;
}

const SongGridItem: React.FC<SongGridItemProps> = ({ song, onClick, onMoreClick, isEditing = false }) => {
  return (
    <div
      className="flex flex-col text-left group"
      role="button"
    >
      <div 
        className="aspect-square w-full rounded-md overflow-hidden mb-2 shadow-lg relative cursor-pointer"
        onClick={onClick}
        aria-label={isEditing ? `Edit ${song.title}` : `Play ${song.title} by ${song.artist}`}
        style={{ borderRadius: 'var(--border-radius)' }}
      >
        {song.artwork ? (
          <img src={song.artwork} alt={song.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-surface flex items-center justify-center">
            <AlbumIcon className="w-1/2 h-1/2 text-secondary" />
          </div>
        )}
        {!isEditing && (
         <button 
            onClick={(e) => {
                e.stopPropagation();
                onMoreClick(song);
            }}
            className="absolute top-1 right-1 p-1.5 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label={`Options for ${song.title}`}
        >
            <MoreVerticalIcon className="w-5 h-5" />
        </button>
        )}
      </div>
      <div className="w-full">
        <p className="font-semibold truncate text-accent text-sm">{song.title}</p>
        <p className="text-xs text-secondary truncate">{song.artist}</p>
      </div>
    </div>
  );
};

export default SongGridItem;