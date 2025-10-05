import React, { useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import {
  PlayIcon,
  PauseIcon,
  SkipBackIcon,
  SkipForwardIcon,
  AlbumIcon,
  ChevronDownIcon,
  RepeatIcon,
  RepeatOneIcon,
} from '../constants';

const PlayerBar: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    progress,
    duration,
    togglePlay,
    seek,
    playNext,
    playPrev,
    repeatMode,
    toggleRepeatMode,
  } = usePlayer();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!currentSong) {
    return null;
  }
  
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    seek(parseFloat(event.target.value));
  };

  const handleCloseExpanded = () => {
    setIsExpanded(false);
  };
  
  const MiniPlayer = () => (
    <div
      className="rounded-lg overflow-hidden border-2 border-theme backdrop-blur-md cursor-pointer"
      style={{ 
        backgroundColor: `rgba(var(--color-surface), 0.8)`,
        borderRadius: 'var(--border-radius)' 
      }}
      onClick={() => setIsExpanded(true)}
    >
      <div className="flex items-center p-3 space-x-3">
        {currentSong.artwork ? (
            <img src={currentSong.artwork} alt={currentSong.title} className="w-12 h-12 object-cover rounded-md" />
        ) : (
            <div className="w-12 h-12 bg-surface rounded-md flex items-center justify-center">
                <AlbumIcon className="w-6 h-6 text-secondary" />
            </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate text-accent">{currentSong.title}</p>
          <p className="text-sm text-secondary truncate">{currentSong.artist}</p>
        </div>
        <div className="flex items-center space-x-3 text-accent">
          <button onClick={(e) => { e.stopPropagation(); playPrev();}} className="p-1"><SkipBackIcon className="w-7 h-7" /></button>
          <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="p-1">
            {isPlaying ? <PauseIcon className="w-9 h-9" /> : <PlayIcon className="w-9 h-9" />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); playNext(); }} className="p-1"><SkipForwardIcon className="w-7 h-7" /></button>
        </div>
      </div>
      <div className="w-full bg-black/20 h-1">
        <div 
            className="bg-accent h-1" 
            style={{ width: `${(progress / duration) * 100 || 0}%` }}
        />
      </div>
    </div>
  );

  const ExpandedPlayer = () => (
    <div className="h-full flex flex-col p-6 space-y-4">
        <div className="relative flex justify-center items-center">
            <button onClick={handleCloseExpanded} className="absolute left-0 text-secondary hover:text-primary transition-colors p-2 -m-2">
                <ChevronDownIcon className="w-8 h-8" />
            </button>
            <p className="text-lg font-bold uppercase tracking-wider">Now Playing</p>
        </div>
  
        <div className="flex-grow flex items-center justify-center py-4">
            <div className="aspect-square w-full max-w-sm rounded-xl shadow-2xl overflow-hidden" style={{ borderRadius: 'var(--border-radius)' }}>
             {currentSong.artwork ? (
                <img src={currentSong.artwork} alt={currentSong.title} className="w-full h-full object-cover" />
             ) : (
                <div className="w-full h-full bg-surface flex items-center justify-center">
                    <AlbumIcon className="w-24 h-24 text-secondary" />
                </div>
            )}
            </div>
        </div>
        
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-accent truncate">{currentSong.title}</h2>
                <p className="text-lg text-secondary mt-1">{currentSong.artist}</p>
            </div>
            
            <div className="space-y-1">
                <input
                    type="range"
                    value={progress}
                    max={duration || 0}
                    onChange={handleSeek}
                    aria-label="Seek slider"
                />
                <div className="flex justify-between text-xs font-mono text-secondary">
                    <span>{formatTime(progress)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>
            
            <div className="flex items-center justify-around text-accent">
                <button
                    onClick={toggleRepeatMode}
                    className={`p-2 transition-colors ${repeatMode === 'off' ? 'text-secondary' : 'text-accent'}`}
                    aria-label={`Repeat mode: ${repeatMode}`}
                >
                    {repeatMode === 'one' ? (
                        <RepeatOneIcon className="w-8 h-8" />
                    ) : (
                        <RepeatIcon className="w-8 h-8" />
                    )}
                </button>
                <button onClick={playPrev} className="p-2"><SkipBackIcon className="w-10 h-10" /></button>
                <button onClick={togglePlay} className="p-2">
                    {isPlaying ? <PauseIcon className="w-16 h-16" /> : <PlayIcon className="w-16 h-16" />}
                </button>
                <button onClick={playNext} className="p-2"><SkipForwardIcon className="w-10 h-10" /></button>
                <div className="w-8 h-8 p-2" /> {/* Placeholder for shuffle button */}
            </div>
        </div>
    </div>
  );

  return (
    <div
      className={`fixed left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
        isExpanded ? 'bottom-0 top-0 bg-background' : 'bottom-16 p-2'
      }`}
    >
        {isExpanded ? <ExpandedPlayer/> : <MiniPlayer/>}
    </div>
  );
};

export default PlayerBar;