import React, { createContext, useState, useEffect, useContext } from 'react';
import { UserProfile, AccountTier } from '../types';
import { getSpotifyProfile, logout } from '../services/spotify';
import { initializeSpotifyPlayer } from '../services/spotifyPlayer';
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

  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
  const redirectUri = window.location.origin;

  // 🔁 Handle redirect back from Spotify
  useEffect(() => {
    const authenticateWithCode = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const storedVerifier = localStorage.getItem('spotify_code_verifier');

      if (code && storedVerifier) {
        try {
          setIsLoading(true);

          const body = new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            client_id: clientId,
            code_verifier: storedVerifier,
          });

          const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString(),
          });

          const data = await response.json();
          const token = data.access_token;
          localStorage.setItem('spotify_token', token);
          window.history.replaceState({}, document.title, '/'); // Remove ?code=... from URL

          const profile = await getSpotifyProfile();
          setUser(profile);
          setAccountTier(profile.product === 'premium' ? 'premium' : 'normal');
          setIsAuthenticated(true);

          if (profile.product === 'premium') {
            await initializeSpotifyPlayer(token);
          }
        } catch (err) {
          console.error('Error exchanging code:', err);
          setError('Spotify login failed.');
        } finally {
          setIsLoading(false);
        }
      } else {
        const token = localStorage.getItem('spotify_token');
        if (token) {
          try {
            const profile = await getSpotifyProfile();
            setUser(profile);
            setAccountTier(profile.product === 'premium' ? 'premium' : 'normal');
            setIsAuthenticated(true);

            if (profile.product === 'premium') {
              await initializeSpotifyPlayer(token);
            }
          } catch (err) {
            console.error('Token invalid or expired:', err);
            logout();
          }
        }
        setIsLoading(false);
      }
    };

    authenticateWithCode();
  }, []);

  const handleLogin = async () => {
    const codeVerifier = generateRandomString(128);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    localStorage.setItem('spotify_code_verifier', codeVerifier);

    const scopes =
      'user-read-private user-read-email playlist-read-private playlist-read-collaborative streaming user-modify-playback-state user-read-playback-state';

    const url =
      `https://accounts.spotify.com/authorize` +
      `?response_type=code` +
      `&client_id=${clientId}` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
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