import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, RefreshCw, Home } from 'lucide-react';
import { useGame } from '../../contexts/GameContext';

const GameResults: React.FC = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useGame();

  // Sort players by score (highest first)
  const sortedPlayers = [...state.players].sort((a, b) => b.score - a.score);
  
  // Find winners (could be multiple with same score)
  const highestScore = sortedPlayers.length > 0 ? sortedPlayers[0].score : 0;
  const winners = sortedPlayers.filter(player => player.score === highestScore);

  const handlePlayAgain = () => {
    dispatch({ type: 'RESET_GAME' });
    navigate('/config');
  };

  const handleNewGame = () => {
    dispatch({ type: 'RESET_GAME' });
    navigate('/');
  };

  // Calculate medals for top 3 players
  const getMedalEmoji = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return '';
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Trophy size={48} className="text-[#FFD700] mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-2">Game Over!</h1>
          <p className="text-gray-400">
            {winners.length === 1 
              ? `${winners[0].name} wins with ${winners[0].score} points!` 
              : `It's a tie! ${winners.map(w => w.name).join(' and ')} win with ${highestScore} points!`}
          </p>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-center">Final Scores</h2>
          
          <div className="space-y-4">
            {sortedPlayers.map((player, index) => (
              <div 
                key={player.id} 
                className={`flex items-center p-4 rounded-lg ${
                  winners.includes(player) ? 'bg-gradient-to-r from-purple-900/40 to-[#1DB954]/20' : 'bg-gray-800'
                }`}
              >
                <div className="w-8 text-center font-bold">
                  {getMedalEmoji(index) || (index + 1)}
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${player.avatar} ml-2`}>
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <div className="ml-3">
                  <p className="font-semibold">{player.name}</p>
                </div>
                <div className="ml-auto text-2xl font-bold">
                  {player.score}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-5 mb-8">
          <h2 className="text-lg font-semibold mb-2">Game Summary</h2>
          <div className="text-gray-300 text-sm">
            <p><span className="text-gray-500">Playlist:</span> {state.config.playlistName}</p>
            <p><span className="text-gray-500">Rounds played:</span> {state.config.rounds}</p>
            <p><span className="text-gray-500">Players:</span> {state.players.length}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handlePlayAgain}
            className="flex-1 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold py-3 px-4 rounded-full transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            Play Again
          </button>
          <button
            onClick={handleNewGame}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-full transition-colors flex items-center justify-center gap-2"
          >
            <Home size={18} />
            New Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameResults;