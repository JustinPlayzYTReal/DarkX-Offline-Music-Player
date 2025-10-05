import React, { useState } from 'react';
import { PlayerProvider } from './context/PlayerContext';
import HomeScreen from './components/HomeScreen';
import SongsScreen from './components/SongsScreen';
import ImportScreen from './components/ImportScreen';
import SettingsScreen from './SettingsScreen';
import BottomNav from './components/BottomNav';
import PlayerBar from './components/PlayerBar';
import { useTheme } from './hooks/useTheme';
import PlaylistsScreen from './components/PlaylistsScreen';

export type Screen = 'home' | 'songs' | 'playlists' | 'import' | 'settings';

const App: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<Screen>('home');
  useTheme(); // Initialize and apply the theme

  const renderScreen = () => {
    switch (activeScreen) {
      case 'home':
        return <HomeScreen />;
      case 'songs':
        return <SongsScreen />;
      case 'playlists':
        return <PlaylistsScreen />;
      case 'import':
        return <ImportScreen setActiveScreen={setActiveScreen} />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <PlayerProvider>
      <div className="bg-background text-primary min-h-screen font-sans flex flex-col antialiased">
        <main className="flex-grow pb-32">
          {renderScreen()}
        </main>
        <PlayerBar />
        <BottomNav activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
      </div>
    {/* FIX: Corrected a malformed closing tag for PlayerProvider which was causing a syntax error. */}
    </PlayerProvider>
  );
};

export default App;
