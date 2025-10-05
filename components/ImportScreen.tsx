import React, { useState, useRef, useCallback } from 'react';
import { addSongToDB } from '../services/musicService';
import { Song } from '../types';
import { FolderIcon, UploadIcon } from '../constants';
import EditSongModal from './EditSongModal';
import { Screen } from '../App';

// It's safer to access jsmediatags via the window object to avoid ReferenceError
// if the script fails to load.
declare global {
  interface Window {
    jsmediatags: any;
  }
}

interface ImportScreenProps {
  setActiveScreen: (screen: Screen) => void;
}

const getAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(audio.src);
      resolve(audio.duration);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(audio.src);
      console.warn(`Could not determine duration for ${file.name}`);
      resolve(0); // Resolve with 0 if it fails, allowing import to continue.
    };
    audio.src = URL.createObjectURL(file);
  });
};

const readId3Tags = (file: File): Promise<any> => {
  return new Promise((resolve) => {
    if (typeof window.jsmediatags === 'undefined') {
      console.error('jsmediatags library not loaded.');
      resolve({}); // Resolve with empty object if library is missing
      return;
    }
    window.jsmediatags.read(file, {
      onSuccess: (tag: any) => resolve(tag.tags || {}),
      onError: (error: any) => {
        console.log('No ID3 tags found or error reading tags for', file.name, error);
        resolve({}); // Resolve with empty object on error
      },
    });
  });
};


const ImportScreen: React.FC<ImportScreenProps> = ({ setActiveScreen }) => {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  
  const filesRef = useRef<File[]>([]);
  const currentIndexRef = useRef(0);
  const successfulImportsRef = useRef(0);
  
  const [songToEdit, setSongToEdit] = useState<Song | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processNextFile = useCallback(async () => {
    if (currentIndexRef.current >= filesRef.current.length) {
      setImporting(false);
      const successCount = successfulImportsRef.current;
      const totalCount = filesRef.current.length;
      
      if (totalCount > 0) {
           setMessage(`${successCount} of ${totalCount} song(s) imported successfully!`);
      }

      setProgress(100);
      setTimeout(() => {
        setMessage('');
        if (successCount > 0) {
          setActiveScreen('songs');
        }
      }, 2000);
      return;
    }

    const file = filesRef.current[currentIndexRef.current];
    setMessage(`Processing ${currentIndexRef.current + 1} of ${filesRef.current.length}: ${file.name}`);
    
    try {
        const [duration, tags] = await Promise.all([
            getAudioDuration(file),
            readId3Tags(file)
        ]);
        
        const { title, artist, album, picture } = tags;
        let artwork;
        if (picture) {
            const { data, format } = picture;
            const base64String = data.reduce((acc: string, byte: number) => acc + String.fromCharCode(byte), '');
            artwork = `data:${format};base64,${window.btoa(base64String)}`;
        }

        const song: Song = {
            id: `${title || file.name}-${artist || 'Unknown'}-${file.size}-${Math.random()}`,
            title: title || file.name.replace(/\.[^/.]+$/, ""),
            artist: artist || 'Unknown Artist',
            album: album || 'Unknown Album',
            duration,
            artwork,
            url: '', // Will be created from the blob upon playback
        };

        setSongToEdit(song);
        setIsModalOpen(true);

    } catch (error) {
        console.error(`Critical error processing ${file.name}:`, error);
        setMessage(`Error with ${file.name}. Skipping.`);
        // Ensure we move to the next file even on unexpected errors
        setTimeout(moveToNextFile, 1500);
    }
  }, [setActiveScreen]);

  const moveToNextFile = useCallback(() => {
      currentIndexRef.current++;
      setProgress((currentIndexRef.current / filesRef.current.length) * 100);
      // Use setTimeout to allow UI to update before processing next file
      setTimeout(processNextFile, 100);
  }, [processNextFile]);

  const startImportProcess = (files: File[]) => {
    if (!files || files.length === 0) return;

    filesRef.current = Array.from(files);
    currentIndexRef.current = 0;
    successfulImportsRef.current = 0;
    
    setImporting(true);
    setProgress(0);
    setMessage('Starting import...');
    processNextFile();
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      startImportProcess(Array.from(event.target.files));
    }
  };

  const handleSaveSong = async (updatedSong: Song) => {
    const currentFile = filesRef.current[currentIndexRef.current];
    if (!currentFile) return;

    setIsModalOpen(false);
    setSongToEdit(null);
    setMessage(`Saving ${updatedSong.title}...`);

    try {
        await addSongToDB(updatedSong, currentFile);
        successfulImportsRef.current++;
    } catch (dbError) {
        console.error("Error saving song to DB:", dbError);
        setMessage(`Error saving ${updatedSong.title}`);
    }
    
    moveToNextFile();
  };

  const handleCancelEdit = () => {
    setIsModalOpen(false);
    setSongToEdit(null);
    setMessage(`Skipped ${filesRef.current[currentIndexRef.current].name}`);
    moveToNextFile();
  };
  
  return (
    <>
      <div className="h-full p-4">
        <header className="border-b border-theme mb-6">
          <h1 className="text-4xl font-bold text-accent">Import Music</h1>
        </header>

        {importing ? (
          <div className="flex flex-col items-center justify-center h-full -mt-20">
            <div className="w-full max-w-md text-center">
              <h2 className="text-2xl font-semibold text-accent mb-4">Importing...</h2>
              <div className="w-full bg-surface rounded-full h-2.5 border border-theme">
                <div className="bg-accent h-2 rounded-full transition-width duration-300" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="text-secondary mt-2 truncate">{message}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 pb-16">
            <div className="bg-surface p-4 rounded-lg shadow-md border border-theme">
              <div className="flex items-center space-x-3 mb-3">
                <FolderIcon className="w-8 h-8 text-accent" />
                <h2 className="text-xl font-bold">Import MP3 Files</h2>
              </div>
              <p className="text-secondary mb-4">Select one or more MP3 audio files from your device to add to your offline library.</p>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                multiple
                accept=".mp3,audio/mpeg"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-accent w-full flex items-center justify-center space-x-2"
              >
                <UploadIcon className="w-5 h-5" />
                <span>Choose MP3 Files</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <EditSongModal
        song={songToEdit}
        isOpen={isModalOpen}
        onSave={handleSaveSong}
        onCancel={handleCancelEdit}
      />
    </>
  );
};

export default ImportScreen;