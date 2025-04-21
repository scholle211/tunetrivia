import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../contexts/GameContext';
import { Trophy } from 'lucide-react';

const GameResults: React.FC = () => {
  const { state, dispatch } = useGame();
  const navigate = useNavigate();

  const sortedPlayers = [...state.players].sort((a, b) => b.points - a.points);
  const topScore = sortedPlayers[0]?.points || 0;
  const winners = sortedPlayers.filter(p => p.points === topScore);

  const handleRestart = () => {
    dispatch({ type: 'RESET_GAME' });
    navigate('/config');
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center">
      <div className="bg-gray-900 rounded-lg p-8 max-w-2xl w-full text-center">
        <Trophy size={48} className="mx-auto text-yellow-400 mb-4" />
        <h1 className="text-3xl font-bold mb-2">Game Over</h1>
        <p className="text-gray-400 mb-6">Here are the final results:</p>

        <ul className="space-y-3 text-left">
          {sortedPlayers.map((player, index) => (
            <li
              key={player.id}
              className={`flex justify-between items-center p-3 rounded-lg ${
                player.points === topScore ? 'bg-yellow-900/40' : 'bg-gray-800'
              }`}
            >
              <span className="font-semibold">
                #{index + 1} {player.name}
              </span>
              <span className="font-mono text-lg">{player.points} pts</span>
            </li>
          ))}
        </ul>

        {winners.length > 0 && (
          <div className="mt-6">
            <p className="text-xl font-bold text-yellow-400">
              🏆 {winners.length > 1 ? 'Winners' : 'Winner'}:{' '}
              {winners.map(p => p.name).join(', ')}
            </p>
          </div>
        )}

        <button
          onClick={handleRestart}
          className="mt-8 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold py-3 px-6 rounded-full transition-colors"
        >
          Play Again
        </button>
      </div>
    </div>
  );
};

export default GameResults;