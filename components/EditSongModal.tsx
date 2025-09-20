import React, { useState, useEffect, useRef } from 'react';
import { Song } from '../types';
import { AlbumIcon } from '../constants';

interface EditSongModalProps {
  song: Song | null;
  isOpen: boolean;
  onSave: (updatedSong: Song) => void;
  onCancel: () => void;
}

const EditSongModal: React.FC<EditSongModalProps> = ({ song, isOpen, onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [artwork, setArtwork] = useState<string | undefined>(undefined);
  const artworkInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (song) {
      setTitle(song.title);
      setArtist(song.artist);
      setAlbum(song.album);
      setArtwork(song.artwork);
    }
  }, [song]);

  const handleArtworkChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setArtwork(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!song) return;
    const updatedSong: Song = {
      ...song,
      title,
      artist,
      album,
      artwork,
    };
    onSave(updatedSong);
  };

  if (!isOpen || !song) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div 
        className="bg-surface rounded-lg shadow-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        style={{ borderRadius: 'var(--border-radius)' }}
      >
        <h2 className="text-2xl font-bold text-accent">Edit Song Details</h2>
        
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-48 h-48 rounded-md overflow-hidden group" style={{ borderRadius: 'var(--border-radius)' }}>
            {artwork ? (
              <img src={artwork} alt="Album Art" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-background flex items-center justify-center">
                <AlbumIcon className="w-16 h-16 text-secondary" />
              </div>
            )}
            <button
              onClick={() => artworkInputRef.current?.click()}
              className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Change Cover
            </button>
          </div>
          <input
            type="file"
            accept="image/*"
            ref={artworkInputRef}
            onChange={handleArtworkChange}
            className="hidden"
          />
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-secondary">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block input-base"
            />
          </div>
          <div>
            <label htmlFor="artist" className="block text-sm font-medium text-secondary">Artist</label>
            <input
              id="artist"
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="mt-1 block input-base"
            />
          </div>
          <div>
            <label htmlFor="album" className="block text-sm font-medium text-secondary">Album</label>
            <input
              id="album"
              type="text"
              value={album}
              onChange={(e) => setAlbum(e.target.value)}
              className="mt-1 block input-base"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <button
            onClick={onCancel}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn btn-accent"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditSongModal;