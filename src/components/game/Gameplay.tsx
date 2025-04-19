import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Volume2, Music } from 'lucide-react';
import { useGame } from '../../contexts/GameContext';
import { getRandomSongsFromPlaylist } from '../../services/spotify';
import { playTrack } from '../../services/spotifyPlayer';
import { SpotifySong } from '../../types';

const Gameplay: React.FC = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const [songs, setSongs] = useState<SpotifySong[]>([]);
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(state.config.timePerGuess);
  const [timerRunning, setTimerRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    const loadSongs = async () => {
      try {
        if (!state.config.playlistId) {
          navigate('/config');
          return;
        }

        const data = await getRandomSongsFromPlaylist(state.config.playlistId, state.config.rounds);
        setSongs(data);
        dispatch({ type: 'SET_CURRENT_SONG', payload: data[0] });
      } catch (err) {
        console.error(err);
        setError('Failed to load songs. Try a different playlist.');
      } finally {
        setLoading(false);
      }
    };

    loadSongs();
  }, []);

  useEffect(() => {
    if (timerRunning && timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }

    if (timer === 0) {
      handleTimerEnd();
    }
  }, [timerRunning, timer]);

  const handleTimerEnd = () => {
    setTimerRunning(false);
    setShowAnswer(true);
    pauseTrack();
  };

  const pauseTrack = async () => {
    await fetch('https://api.spotify.com/v1/me/player/pause', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('spotify_token') || ''}`,
      },
    });
    dispatch({ type: 'SET_PLAYING', payload: false });
  };

  const handlePlayPause = async () => {
    if (state.isPlaying) {
      await pauseTrack();
      setTimerRunning(false);
    } else {
      await playTrack(state.currentSong.uri);
      dispatch({ type: 'SET_PLAYING', payload: true });
      setTimerRunning(true);
    }
  };

  const getReleaseYear = (dateString: string) => {
    return dateString ? dateString.split('-')[0] : 'Unknown';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <div className="animate-spin h-12 w-12 border-4 border-[#1DB954] border-t-transparent rounded-full mx-auto"></div>
          </div>
          <p className="text-xl">Loading songs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center bg-gray-800 p-8 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p className="mb-4">{error}</p>
          <button
            onClick={() => navigate('/config')}
            className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold py-2 px-4 rounded"
          >
            Back to Setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            Round {state.currentRound} of {state.config.rounds}
          </h1>
          <div className="bg-gray-800 px-4 py-2 rounded-full">
            <span className="text-xl font-mono">
              {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 flex flex-col items-center">
          <div className="w-64 h-64 mb-4 flex items-center justify-center bg-gray-800 rounded-lg">
            {state.currentSong?.album?.images[0]?.url ? (
              <img src={state.currentSong.album.images[0].url} alt="Album Cover" className="rounded-lg" />
            ) : (
              <Music size={64} className="text-gray-600" />
            )}
          </div>

          <button
            onClick={handlePlayPause}
            className={`w-full max-w-xs flex items-center justify-center gap-2 py-3 px-6 rounded-full font-semibold transition-colors ${
              showAnswer
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-[#1DB954] hover:bg-[#1ed760] text-black'
            }`}
            disabled={showAnswer}
          >
            {state.isPlaying ? <Pause size={20} /> : <Play size={20} />}
            {state.isPlaying ? 'Pause Track' : 'Play Track'}
          </button>

          {showAnswer && state.currentSong && (
            <div className="text-center mt-6 animate-fadeIn">
              <h2 className="text-xl font-bold mb-1">{state.currentSong.name}</h2>
              <p className="text-gray-400 mb-1">
                {state.currentSong.artists.map((a) => a.name).join(', ')}
              </p>
              <p className="text-gray-500 text-sm">
                {state.currentSong.album.name} • {getReleaseYear(state.currentSong.album.release_date)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Gameplay;