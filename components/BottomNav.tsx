import React from 'react';
import { HomeIcon, MusicIcon, UploadIcon, SettingsIcon, PlaylistIcon } from '../constants';
import { Screen } from '../App';

interface BottomNavProps {
  activeScreen: Screen;
  setActiveScreen: (screen: Screen) => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-1/5 pt-2 pb-1 transition-colors duration-200 ${
      isActive ? 'text-accent' : 'text-secondary hover:text-primary'
    }`}
  >
    {icon}
    <span className="text-xs mt-1">{label}</span>
  </button>
);

const BottomNav: React.FC<BottomNavProps> = ({ activeScreen, setActiveScreen }) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: <HomeIcon className="w-6 h-6" /> },
    { id: 'songs', label: 'Songs', icon: <MusicIcon className="w-6 h-6" /> },
    { id: 'playlists', label: 'Playlists', icon: <PlaylistIcon className="w-6 h-6" /> },
    { id: 'import', label: 'Import', icon: <UploadIcon className="w-6 h-6" /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon className="w-6 h-6" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t-2 border-theme flex z-50">
      {navItems.map(item => (
        <NavItem
          key={item.id}
          icon={item.icon}
          label={item.label}
          isActive={activeScreen === item.id}
          onClick={() => setActiveScreen(item.id as Screen)}
        />
      ))}
    </nav>
  );
};

export default BottomNav;