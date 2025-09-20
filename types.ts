export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  artwork?: string; // base64 string
  url: string; // Object URL for the audio blob
}

export interface Playlist {
  id: string;
  name: string;
  songIds: string[];
}
