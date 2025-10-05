import { openDB, IDBPDatabase } from 'idb';
import { Song, Playlist } from '../types';

const DB_NAME = 'offline-music-player';
const SONGS_STORE = 'songs';
const RECENT_STORE = 'recentlyPlayed';
const PLAYLISTS_STORE = 'playlists';

let dbPromise: Promise<IDBPDatabase>;

// --- Event Emitter System ---
const songListeners = new Set<() => void>();
const recentListeners = new Set<() => void>();

export const onSongsUpdate = (callback: () => void) => {
    songListeners.add(callback);
    return () => songListeners.delete(callback); // Return an unsubscribe function
};

const notifySongsUpdate = () => {
    songListeners.forEach(cb => cb());
};

export const onRecentUpdate = (callback: () => void) => {
    recentListeners.add(callback);
    return () => recentListeners.delete(callback); // Return an unsubscribe function
};

const notifyRecentUpdate = () => {
    recentListeners.forEach(cb => cb());
};
// --- End Event Emitter System ---


const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 3, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains(SONGS_STORE)) {
          db.createObjectStore(SONGS_STORE, { keyPath: 'id' });
        }
        if (oldVersion < 2 && !db.objectStoreNames.contains(RECENT_STORE)) {
            const store = db.createObjectStore(RECENT_STORE, { keyPath: 'id' });
            store.createIndex('playedAt', 'playedAt');
        }
        if (oldVersion < 3 && !db.objectStoreNames.contains(PLAYLISTS_STORE)) {
            db.createObjectStore(PLAYLISTS_STORE, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
};

export const addSongToDB = async (song: Song, audioBlob: Blob): Promise<void> => {
  const db = await initDB();
  const tx = db.transaction(SONGS_STORE, 'readwrite');
  // Destructure the temporary URL out, as we don't need to store it.
  const { url, ...songData } = song;
  // Store a flat object so the keyPath ('id') is at the top level.
  await tx.store.put({ ...songData, audioBlob });
  await tx.done;
  notifySongsUpdate(); // Notify that the song list has changed
};

export const updateSongInDB = async (updatedSong: Song): Promise<void> => {
  const db = await initDB();
  const tx = db.transaction(SONGS_STORE, 'readwrite');
  const store = tx.objectStore(SONGS_STORE);
  
  const existingRecord = await store.get(updatedSong.id);
  if (!existingRecord) {
    console.error("Song not found in DB for updating:", updatedSong.id);
    return;
  }
  
  // Exclude the transient URL from the object to be saved.
  const { url, ...metadataToSave } = updatedSong;

  const updatedRecord = {
    ...metadataToSave, // This has id, title, artist, album, duration, artwork
    audioBlob: existingRecord.audioBlob, // Preserve the original audio data
  };

  await store.put(updatedRecord);
  await tx.done;
  notifySongsUpdate();
};

export const getAllSongs = async (): Promise<Song[]> => {
  const db = await initDB();
  const items = await db.getAll(SONGS_STORE);
  // Filter out any malformed items that might be missing the audio data.
  const validItems = items.filter(item => item && item.audioBlob);

  return validItems.map(item => {
    // Reconstruct the song object from the flat DB structure
    const { audioBlob, ...songData } = item;
    return {
      ...(songData as Omit<Song, 'url'>),
      url: URL.createObjectURL(audioBlob),
    };
  });
};

export const getSongById = async (id: string): Promise<Song | null> => {
    const db = await initDB();
    const item = await db.get(SONGS_STORE, id);
    if (!item || !item.audioBlob) return null;
    
    // Reconstruct the song object from the flat DB structure
    const { audioBlob, ...songData } = item;
    return {
        ...(songData as Omit<Song, 'url'>),
        // FIX: Use the destructured 'audioBlob' variable which holds the data.
        // The previous code used `item.audioBlob`, which while valid, is less clean
        // than using the already-destructured variable.
        url: URL.createObjectURL(audioBlob),
    };
};

export const addRecentlyPlayed = async (song: Song): Promise<void> => {
    const db = await initDB();
    const tx = db.transaction(RECENT_STORE, 'readwrite');
    // Don't store the temporary object URL in the recently played list.
    const { url, ...songData } = song;
    await tx.store.put({ ...songData, playedAt: new Date() });
    
    // Limit to 20 recent songs
    let cursor = await tx.store.index('playedAt').openCursor(null, 'prev');
    let count = 0;
    while(cursor) {
        count++;
        if (count > 20) {
           await cursor.delete();
        }
        cursor = await cursor.continue();
    }
    await tx.done;
    notifyRecentUpdate(); // Notify that the recently played list has changed
};

export const getRecentlyPlayed = async (): Promise<Song[]> => {
    const db = await initDB();
    // Get metadata of recent songs, sorted by playedAt
    const recentMetadatas = await db.getAllFromIndex(RECENT_STORE, 'playedAt');
    const sortedMetadatas = recentMetadatas.reverse();

    // Fetch the full song object for each recent song to get a valid URL
    const recentSongsPromises = sortedMetadatas.map(meta => getSongById(meta.id));
    const recentSongs = await Promise.all(recentSongsPromises);

    // Filter out any songs that might have been deleted from the main library
    return recentSongs.filter((song): song is Song => song !== null);
};

// Playlist Functions
export const createPlaylist = async (name: string): Promise<Playlist> => {
    const db = await initDB();
    const newPlaylist: Playlist = {
        id: `playlist-${Date.now()}-${Math.random()}`,
        name,
        songIds: [],
    };
    await db.put(PLAYLISTS_STORE, newPlaylist);
    return newPlaylist;
};

export const getAllPlaylists = async (): Promise<Playlist[]> => {
    const db = await initDB();
    return await db.getAll(PLAYLISTS_STORE);
};

export const getPlaylistById = async (id: string): Promise<Playlist | null> => {
    const db = await initDB();
    return await db.get(PLAYLISTS_STORE, id);
};

export const addSongToPlaylist = async (playlistId: string, songId: string): Promise<void> => {
    const db = await initDB();
    const playlist = await db.get(PLAYLISTS_STORE, playlistId);
    if (playlist && !playlist.songIds.includes(songId)) {
        playlist.songIds.push(songId);
        await db.put(PLAYLISTS_STORE, playlist);
    }
};

export const getSongsForPlaylist = async (playlistId: string): Promise<Song[]> => {
    const playlist = await getPlaylistById(playlistId);
    if (!playlist) return [];

    const songPromises = playlist.songIds.map(id => getSongById(id));
    const songs = await Promise.all(songPromises);

    return songs.filter((song): song is Song => song !== null);
};