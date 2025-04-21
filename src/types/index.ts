// Player type
export interface Player {
  id: string;
  name: string;
  avatar?: string;
  points: number;
}

// Game Configuration
export interface GameConfig {
  rounds: number;
  timePerGuess: number;
  playlistId: string;
  playlistName: string;
}

// Song type from Spotify API
export interface SpotifySong {
  name: string;
  uri: string; // ✅ add this line
  artists: { name: string }[];
  album: {
    name: string;
    release_date: string;
    images: { url: string }[];
  };
}

// Playlist type from Spotify API
export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: {
    url: string;
    height: number;
    width: number;
  }[];
  tracks: {
    total: number;
  };
}

// Current game state
export interface GameState {
  config: GameConfig;
  players: Player[];
  currentRound: number;
  currentSong: SpotifySong | null;
  gameStatus: 'setup' | 'playing' | 'scoring' | 'finished';
  isPlaying: boolean;
}

// Account tier
export type AccountTier = 'normal' | 'premium';

// User profile from Spotify
export interface UserProfile {
  id: string;
  display_name: string;
  images: {
    url: string;
  }[];
  product: string; // 'premium' or 'free'
}