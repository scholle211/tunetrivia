import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, Music, ArrowRight } from 'lucide-react';
import { useGame } from '../../contexts/GameContext';
import { useAuth } from '../../contexts/AuthContext';
import { getFeaturedPlaylists, getUserPlaylists, searchPlaylists } from '../../services/spotify';
import { SpotifyPlaylist } from '../../types';

const GameConfig: React.FC = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const { accountTier } = useAuth();
  
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SpotifyPlaylist[]>([]);
  const [rounds, setRounds] = useState(5);
  const [timePerGuess, setTimePerGuess] = useState(30);
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null);
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
        setError('Failed to load playlists. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadPlaylists();
  }, [accountTier]);

  useEffect(() => {
    const delaySearch = setTimeout(async () => {
      if (searchQuery && accountTier === 'premium') {
        try {
          const results = await searchPlaylists(searchQuery);
          setSearchResults(results);
        } catch (err) {
          console.error('Search error:', err);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);
    
    return () => clearTimeout(delaySearch);
  }, [searchQuery, accountTier]);

  const handlePlaylistSelect = (playlist: SpotifyPlaylist) => {
    setSelectedPlaylist(playlist);
  };

  const handleContinue = () => {
    if (!selectedPlaylist) {
      setError('Please select a playlist to continue');
      return;
    }
    
    dispatch({
      type: 'SET_CONFIG',
      payload: {
        rounds,
        timePerGuess,
        playlistId: selectedPlaylist.id,
        playlistName: selectedPlaylist.name
      }
    });
    
    navigate('/players');
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Game Setup</h1>
        
        {error && (
          <div className="bg-red-900/50 text-red-200 p-4 rounded-md mb-6">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-900 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Music size={20} className="text-[#1DB954]" />
              Playlist Selection
            </h2>
            
            {accountTier === 'premium' && (
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Search for playlists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-md py-2 px-10 focus:outline-none focus:ring-2 focus:ring-[#1DB954]"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              </div>
            )}
            
            {loading ? (
              <div className="py-20 flex justify-center">
                <div className="animate-spin h-8 w-8 border-2 border-[#1DB954] border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="h-64 overflow-y-auto pr-2 custom-scrollbar">
                {(searchQuery && searchResults.length > 0 ? searchResults : playlists).map((playlist) => (
                  <div
                    key={playlist.id}
                    onClick={() => handlePlaylistSelect(playlist)}
                    className={`flex items-center gap-3 p-3 rounded-md mb-2 cursor-pointer transition-colors ${
                      selectedPlaylist?.id === playlist.id
                        ? 'bg-[#1DB954] text-black'
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    {playlist.images && playlist.images[0]?.url ? (
                      <img
                        src={playlist.images[0].url}
                        alt={playlist.name}
                        className="w-12 h-12 rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-gray-700 flex items-center justify-center">
                        <Music size={20} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{playlist.name}</h3>
                      <p className="text-xs text-gray-400 truncate">
                        {playlist.tracks.total} tracks
                      </p>
                    </div>
                  </div>
                ))}
                
                {(searchQuery && searchResults.length === 0) && (
                  <div className="py-8 text-center text-gray-400">
                    No playlists found matching "{searchQuery}"
                  </div>
                )}
                
                {(!searchQuery && playlists.length === 0) && (
                  <div className="py-8 text-center text-gray-400">
                    No playlists available
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="bg-gray-900 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Clock size={20} className="text-[#1DB954]" />
              Game Settings
            </h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Number of Rounds
              </label>
              <div className="flex items-center">
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={rounds}
                  onChange={(e) => setRounds(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#1DB954]"
                />
                <span className="ml-3 font-medium text-lg min-w-[30px] text-right">
                  {rounds}
                </span>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Time per Guess (seconds)
              </label>
              <div className="flex items-center">
                <input
                  type="range"
                  min="10"
                  max="60"
                  step="5"
                  value={timePerGuess}
                  onChange={(e) => setTimePerGuess(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#1DB954]"
                />
                <span className="ml-3 font-medium text-lg min-w-[30px] text-right">
                  {timePerGuess}
                </span>
              </div>
            </div>
            
            {selectedPlaylist && (
              <div className="mt-8 p-4 bg-gray-800 rounded-md">
                <h3 className="font-medium mb-1">Selected Playlist:</h3>
                <div className="flex items-center gap-3">
                  {selectedPlaylist.images && selectedPlaylist.images[0]?.url ? (
                    <img
                      src={selectedPlaylist.images[0].url}
                      alt={selectedPlaylist.name}
                      className="w-10 h-10 rounded"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-gray-700 flex items-center justify-center">
                      <Music size={16} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{selectedPlaylist.name}</p>
                    <p className="text-xs text-gray-400">
                      {selectedPlaylist.tracks.total} tracks
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={handleContinue}
            disabled={!selectedPlaylist}
            className={`flex items-center gap-2 py-3 px-6 rounded-full font-semibold transition-colors ${
              selectedPlaylist
                ? 'bg-[#1DB954] hover:bg-[#1ed760] text-black' 
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            Continue to Player Setup
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameConfig;