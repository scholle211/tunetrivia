import React, { createContext, useState, useEffect, useContext } from 'react';
import { UserProfile, AccountTier } from '../types';
import { getSpotifyProfile, logout } from '../services/spotify';
import { initializeSpotifyPlayer } from '../services/spotifyPlayer';

interface AuthContextType {
  user: UserProfile | null;
  accountTier: AccountTier;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  accountTier: 'normal',
  isAuthenticated: false,
  isLoading: true,
  error: null,
  login: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accountTier, setAccountTier] = useState<AccountTier>('normal');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);

        const hash = window.location.hash;
        if (hash) {
          const token = hash.substring(1).split('&').find(elem => elem.startsWith('access_token'))?.split('=')[1];
          if (token) {
            localStorage.setItem('spotify_token', token);
            window.location.hash = '';
          }
        }

        const token = localStorage.getItem('spotify_token');
        if (token) {
          const profile = await getSpotifyProfile();
          setUser(profile);
          setAccountTier(profile.product === 'premium' ? 'premium' : 'normal');
          setIsAuthenticated(true);

          if (profile.product === 'premium') {
            try {
              await initializeSpotifyPlayer(token);
              console.log('Spotify player initialized');
            } catch (e) {
              console.warn('Failed to initialize Spotify player:', e);
            }
          }
        }
      } catch (err) {
        console.error('Authentication error:', err);
        setError('Failed to authenticate with Spotify');
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = () => {
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
    const redirectUri = 'http://localhost:5173'; // ← or your deployed domain
    const scopes = encodeURIComponent(
      'user-read-private user-read-email playlist-read-private playlist-read-collaborative streaming user-modify-playback-state user-read-playback-state'
    );

    const url = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${scopes}&show_dialog=true`;

    window.location.href = url;
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setIsAuthenticated(false);
    setAccountTier('normal');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accountTier,
        isAuthenticated,
        isLoading,
        error,
        login: handleLogin,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);