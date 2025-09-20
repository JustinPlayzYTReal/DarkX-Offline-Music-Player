import React, { useState, useRef, useCallback } from 'react';
import { addSongToDB } from '../services/musicService';
import { Song } from '../types';
import { FolderIcon, LinkIcon } from '../constants';
import EditSongModal from './EditSongModal';
import { Screen } from '../App';

declare const jsmediatags: any;

interface ImportScreenProps {
  setActiveScreen: (screen: Screen) => void;
}

const ImportScreen: React.FC<ImportScreenProps> = ({ setActiveScreen }) => {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [url, setUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filesRef = useRef<File[]>([]);
  const currentIndexRef = useRef(0);
  
  const [songToEdit, setSongToEdit] = useState<Song | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const processNextFile = useCallback(async () => {
    if (currentIndexRef.current >= filesRef.current.length) {
      setImporting(false);
      setMessage(`${filesRef.current.length} song(s) imported successfully!`);
      setProgress(100);
      setTimeout(() => {
        setMessage('');
        setActiveScreen('songs');
      }, 1500);
      return;
    }

    const file = filesRef.current[currentIndexRef.current];
    setMessage(`Processing ${currentIndexRef.current + 1} of ${filesRef.current.length}: ${file.name}`);

    try {
      const tags = await new Promise<any>((resolve, reject) => {
        jsmediatags.read(file, { onSuccess: resolve, onError: reject });
      });

      const { title, artist, album, picture } = tags.tags;
      let artwork;
      if (picture) {
        const { data, format } = picture;
        const base64String = data.reduce((acc: string, byte: number) => acc + String.fromCharCode(byte), '');
        artwork = `data:${format};base64,${window.btoa(base64String)}`;
      }

      const audio = new Audio(URL.createObjectURL(file));
      const duration = await new Promise<number>(resolve => {
        audio.onloadedmetadata = () => {
          if (audio.duration === Infinity) {
             audio.currentTime = 1e101;
             audio.ontimeupdate = () => {
               audio.ontimeupdate = null;
               audio.currentTime = 0;
               resolve(audio.duration);
             };
          } else {
             resolve(audio.duration);
          }
        };
      });

      const song: Song = {
        id: `${title || file.name}-${artist || 'Unknown'}-${file.size}-${Math.random()}`,
        title: title || file.name.replace(/\.[^/.]+$/, ""),
        artist: artist || 'Unknown Artist',
        album: album || 'Unknown Album',
        duration,
        artwork,
        url: '',
      };

      setSongToEdit(song);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error reading tags for', file.name, error);
      setMessage(`Skipping ${file.name} (metadata error)`);
      moveToNextFile();
    }
  }, [setActiveScreen]);

  const moveToNextFile = () => {
      currentIndexRef.current++;
      setProgress((currentIndexRef.current / filesRef.current.length) * 100);
      setTimeout(processNextFile, 100); // short delay for UI update
  };

  const startImportProcess = (files: File[]) => {
    if (!files || files.length === 0) return;

    filesRef.current = Array.from(files);
    currentIndexRef.current = 0;
    
    setImporting(true);
    setProgress(0);
    setMessage('Starting import...');
    processNextFile();
  }

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    startImportProcess(event.target.files ? Array.from(event.target.files) : []);
  };

  const handleUrlImport = async () => {
    if (!url) {
        setMessage("Please enter a URL.");
        setTimeout(() => setMessage(''), 2000);
        return;
    }

    setImporting(true);
    setProgress(0);
    setMessage(`Downloading from URL...`);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }
        const blob = await response.blob();
        
        let fileName = url.substring(url.lastIndexOf('/') + 1);
        // Clean up query parameters from filename
        fileName = fileName.split('?')[0];
        if (!fileName) {
            fileName = `downloaded_song_${Date.now()}`;
        }

        const file = new File([blob], fileName, { type: blob.type });
        startImportProcess([file]);

    } catch (error) {
        console.error("Error importing from URL:", error);
        setMessage("Download failed. Check the URL and server permissions (CORS).");
        setImporting(false);
        setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleSaveSong = async (updatedSong: Song) => {
    const currentFile = filesRef.current[currentIndexRef.current];
    if (!currentFile) return;

    setIsModalOpen(false);
    setSongToEdit(null);
    setMessage(`Saving ${updatedSong.title}...`);

    try {
        const audioBlob = new Blob([currentFile], { type: currentFile.type });
        await addSongToDB(updatedSong, audioBlob);
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
                <div className="bg-accent h-2 rounded-full" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="text-secondary mt-2 truncate">{message}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 pb-16">
            <div className="bg-surface p-4 rounded-lg shadow-md border border-theme">
              <div className="flex items-center space-x-3 mb-3">
                <FolderIcon className="w-8 h-8 text-accent" />
                <h2 className="text-xl font-bold">Import from Device</h2>
              </div>
              <p className="text-secondary mb-4">Select one or more audio files from your device to add to your library.</p>
              <button onClick={() => fileInputRef.current?.click()} className="btn btn-accent w-full">
                Select Files
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileImport}
                className="hidden"
                multiple
                accept="audio/*"
              />
            </div>

            <div className="bg-surface p-4 rounded-lg shadow-md border border-theme">
              <div className="flex items-center space-x-3 mb-3">
                <LinkIcon className="w-8 h-8 text-accent" />
                <h2 className="text-xl font-bold">Import from URL</h2>
              </div>
              <p className="text-secondary mb-4">Enter a direct URL to an audio file. Note: This may not work for all links due to server restrictions (CORS).</p>
              <div className="flex space-x-2">
                  <input
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com/song.mp3"
                      className="input-base flex-grow"
                  />
                  <button onClick={handleUrlImport} className="btn btn-secondary">
                      Fetch
                  </button>
              </div>
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