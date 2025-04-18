import { SpotifyPlaylist, SpotifySong, UserProfile } from '../types';

// Get access token from localStorage
export const getAccessToken = (): string | null => {
  return localStorage.getItem('spotify_token');
};

// Basic fetch with authorization
const fetchFromSpotify = async (endpoint: string, options = {}) => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('No access token available');
  }

  const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired, clear it
      logout();
      throw new Error('Session expired. Please log in again.');
    }
    throw new Error(`Spotify API error: ${response.statusText}`);
  }

  return response.json();
};

// Get user profile
export const getSpotifyProfile = async (): Promise<UserProfile> => {
  return fetchFromSpotify('/me');
};

// Get featured playlists (for normal users)
export const getFeaturedPlaylists = async (): Promise<SpotifyPlaylist[]> => {
  const response = await fetchFromSpotify('/browse/featured-playlists?limit=50');
  return response.playlists.items;
};

// Get user's playlists (for premium users)
export const getUserPlaylists = async (): Promise<SpotifyPlaylist[]> => {
  const response = await fetchFromSpotify('/me/playlists?limit=50');
  return response.items;
};

// Search for playlists (for premium users)
export const searchPlaylists = async (query: string): Promise<SpotifyPlaylist[]> => {
  if (!query.trim()) return [];
  const response = await fetchFromSpotify(`/search?q=${encodeURIComponent(query)}&type=playlist&limit=20`);
  return response.playlists.items;
};

// Get tracks from a playlist
export const getPlaylistTracks = async (playlistId: string): Promise<SpotifySong[]> => {
  const response = await fetchFromSpotify(`/playlists/${playlistId}/tracks?limit=100`);
  
  // Filter out tracks without preview URLs
  return response.items
    .map(item => item.track)
    .filter(track => track && track.preview_url);
};

// Get random songs from a playlist
export const getRandomSongsFromPlaylist = async (playlistId: string, count: number): Promise<SpotifySong[]> => {
  const allTracks = await getPlaylistTracks(playlistId);
  const tracksWithPreview = allTracks.filter(track => track.preview_url);
  
  if (tracksWithPreview.length === 0) {
    throw new Error('No playable tracks found in this playlist');
  }
  
  // Shuffle array and take the requested number of songs
  const shuffled = [...tracksWithPreview].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

// Logout and clear session
export const logout = (): void => {
  localStorage.removeItem('spotify_token');
};