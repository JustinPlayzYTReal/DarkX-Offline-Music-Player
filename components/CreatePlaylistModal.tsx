import React, { useState } from 'react';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(name);
    setName('');
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-surface rounded-lg shadow-2xl w-full max-w-sm p-6 space-y-4"
        style={{ borderRadius: 'var(--border-radius)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-accent">Create New Playlist</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="playlist-name" className="sr-only">Playlist Name</label>
              <input
                id="playlist-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Awesome Mix"
                className="mt-1 block input-base"
                autoFocus
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="btn btn-accent"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePlaylistModal;