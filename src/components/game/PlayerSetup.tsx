import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Trash2, Play, ArrowLeft } from 'lucide-react';
import { useGame } from '../../contexts/GameContext';
import { Player } from '../../types';
import { v4 as uuidv4 } from 'uuid';

// Predefined avatar colors
const avatarColors = [
  'bg-purple-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-red-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-teal-500',
];

const PlayerSetup: React.FC = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const addPlayer = () => {
    if (!playerName.trim()) {
      setError('Please enter a player name');
      return;
    }

    if (state.players.some(p => p.name.toLowerCase() === playerName.trim().toLowerCase())) {
      setError('A player with this name already exists');
      return;
    }

    const colorIndex = state.players.length % avatarColors.length;

    const newPlayer: Player = {
      id: uuidv4(),
      name: playerName.trim(),
      avatar: avatarColors[colorIndex],
      score: 0,
    };

    dispatch({ type: 'ADD_PLAYER', payload: newPlayer });
    setPlayerName('');
    setError(null);
  };

  const removePlayer = (playerId: string) => {
    dispatch({ type: 'REMOVE_PLAYER', payload: playerId });
  };

  const handleStartGame = () => {
    if (state.players.length < 2) {
      setError('You need at least 2 players to start the game');
      return;
    }

    dispatch({ type: 'START_GAME' });
    navigate('/game');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addPlayer();
    }
  };

  const handleBackToConfig = () => {
    navigate('/config');
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <Users className="text-[#1DB954]" />
          Player Setup
        </h1>

        {error && (
          <div className="bg-red-900/50 text-red-200 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        <div className="bg-gray-900 p-6 rounded-lg mb-8">
          <div className="flex items-center mb-6">
            <input
              type="text"
              placeholder="Enter player name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-gray-800 text-white border border-gray-700 rounded-l-md py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#1DB954]"
            />
            <button
              onClick={addPlayer}
              className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-medium py-3 px-4 rounded-r-md transition-colors flex items-center"
            >
              <UserPlus size={20} />
              <span className="ml-2 hidden sm:inline">Add Player</span>
            </button>
          </div>

          {state.players.length > 0 ? (
            <div className="space-y-3 mb-4">
              {state.players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between bg-gray-800 p-3 rounded-md transition-all hover:bg-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${player.avatar}`}>
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{player.name}</span>
                  </div>
                  <button
                    onClick={() => removePlayer(player.id)}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400">
              <Users size={32} className="mx-auto mb-2 opacity-50" />
              <p>No players added yet</p>
            </div>
          )}
        </div>

        <div className="bg-gray-900 p-5 rounded-lg mb-8">
          <h2 className="text-lg font-semibold mb-2">Game Details</h2>
          <div className="text-gray-300 text-sm">
            <p><span className="text-gray-500">Playlist:</span> {state.config.playlistName}</p>
            <p><span className="text-gray-500">Rounds:</span> {state.config.rounds}</p>
            <p><span className="text-gray-500">Time per guess:</span> {state.config.timePerGuess} seconds</p>
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={handleBackToConfig}
            className="flex items-center gap-2 py-2 px-4 rounded-full border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <button
            onClick={handleStartGame}
            disabled={state.players.length < 2}
            className={`flex items-center gap-2 py-3 px-6 rounded-full font-semibold transition-colors ${
              state.players.length >= 2
                ? 'bg-[#1DB954] hover:bg-[#1ed760] text-black'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Play size={18} />
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerSetup;