import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useGame } from '../../contexts/GameContext';
import {
  getFeaturedPlaylists,
  getUserPlaylists,
} from '../../services/spotify';
import { SpotifyPlaylist } from '../../types';

const GameConfig: React.FC = () => {
  const navigate = useNavigate();
  const { accountTier } = useAuth();
  const { dispatch } = useGame();

  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [rounds, setRounds] = useState(5);
  const [timePerGuess, setTimePerGuess] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPlaylists = async () => {
      try {
        setLoading(true);
        let playlistData: SpotifyPlaylist[];

        if (accountTier === 'premium') {
          playlistData = await getUserPlaylists();
        } else {
          playlistData = await getFeaturedPlaylists();
        }

        setPlaylists(playlistData);
      } catch (err) {
        console.error('Failed to load playlists:', err);
        setError('Could not load playlists. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    // ✅ Only run this when accountTier is set (auth finished)
    if (accountTier) {
      loadPlaylists();
    }
  }, [accountTier]);

  const handleStartGame = () => {
    if (!selectedPlaylist) {
      setError('Please select a playlist');
      return;
    }

    const selectedPlaylistObj = playlists.find(p => p.id === selectedPlaylist);

    dispatch({
      type: 'SET_CONFIG',
      payload: {
        playlistId: selectedPlaylist!,
        playlistName: selectedPlaylistObj?.name || 'Unknown Playlist',
        rounds,
        timePerGuess,
      },
    });

    navigate('/players');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <div className="animate-spin h-12 w-12 border-4 border-[#1DB954] border-t-transparent rounded-full mx-auto"></div>
          </div>
          <p className="text-xl">Loading playlists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-3xl mx-auto bg-gray-900 rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Game Settings</h1>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="mb-6">
          <label className="block font-semibold mb-2">Select Playlist:</label>
          <select
            value={selectedPlaylist || ''}
            onChange={(e) => setSelectedPlaylist(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 p-2 rounded text-white"
          >
            <option value="" disabled>Select a playlist</option>
            {playlists.map((playlist) => (
              <option key={playlist.id} value={playlist.id}>
                {playlist.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label className="block font-semibold mb-2">Number of Rounds:</label>
          <input
            type="number"
            min={1}
            max={20}
            value={rounds}
            onChange={(e) => setRounds(Number(e.target.value))}
            className="w-full bg-gray-800 border border-gray-700 p-2 rounded text-white"
          />
        </div>

        <div className="mb-6">
          <label className="block font-semibold mb-2">Time per Guess (seconds):</label>
          <input
            type="number"
            min={5}
            max={120}
            value={timePerGuess}
            onChange={(e) => setTimePerGuess(Number(e.target.value))}
            className="w-full bg-gray-800 border border-gray-700 p-2 rounded text-white"
          />
        </div>

        <button
          onClick={handleStartGame}
          className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold py-3 px-4 rounded-full transition-colors"
        >
          Start Game
        </button>
      </div>
    </div>
  );
};

export default GameConfig;