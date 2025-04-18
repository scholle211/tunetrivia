import React, { createContext, useState, useEffect, useContext } from 'react';
import { UserProfile, AccountTier } from '../types';
import { getSpotifyProfile, logout } from '../services/spotify';
import { generateCodeChallenge, generateRandomString } from '../services/pkce';

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

        const code = new URLSearchParams(window.location.search).get('code');
        if (code) {
          const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
          const redirectUri = 'https://tunetrivia.netlify.app';
          const codeVerifier = localStorage.getItem('spotify_code_verifier');

          const body = new URLSearchParams({
            client_id: clientId,
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            code_verifier: codeVerifier || '',
          });

          const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body,
          });

          const data = await response.json();

          if (data.access_token) {
            localStorage.setItem('spotify_token', data.access_token);
            // Clean the URL
            window.history.replaceState({}, document.title, '/');
          } else {
            throw new Error(data.error_description || 'Token exchange failed');
          }
        }

        const token = localStorage.getItem('spotify_token');
        if (token) {
          const profile = await getSpotifyProfile();
          setUser(profile);
          setAccountTier(profile.product === 'premium' ? 'premium' : 'normal');
          setIsAuthenticated(true);
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

  const handleLogin = async () => {
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
    const redirectUri = 'https://tunetrivia.netlify.app';
    const codeVerifier = generateRandomString(128);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    localStorage.setItem('spotify_code_verifier', codeVerifier);

    const scopes = 'user-read-private user-read-email playlist-read-private playlist-read-collaborative';

    const url = `https://accounts.spotify.com/authorize?` +
      `client_id=${clientId}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&code_challenge_method=S256` +
      `&code_challenge=${codeChallenge}`;

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