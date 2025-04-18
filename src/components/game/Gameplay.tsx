import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Play, Pause, CheckCircle, Volume2 } from 'lucide-react';
import { useGame } from '../../contexts/GameContext';
import { getRandomSongsFromPlaylist } from '../../services/spotify';
import { playTrack } from '../../services/spotifyPlayer';
import { SpotifySong } from '../../types';

const Gameplay: React.FC = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const [loading, setLoading] = useState(true);
  const [songs, setSongs] = useState<SpotifySong[]>([]);
  const [timer, setTimer] = useState(state.config.timePerGuess);
  const [timerRunning, setTimerRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [scoringComplete, setScoringComplete] = useState(false);

  const [playerScores, setPlayerScores] = useState<Record<string, { artist: boolean; title: boolean; year: boolean }>>({});

  useEffect(() => {
    const loadSongs = async () => {
      try {
        setLoading(true);
        if (!state.config.playlistId) {
          navigate('/config');
          return;
        }

        const songsData = await getRandomSongsFromPlaylist(state.config.playlistId, state.config.rounds);
        setSongs(songsData);

        if (songsData.length > 0) {
          dispatch({ type: 'SET_CURRENT_SONG', payload: songsData[0] });
        } else {
          throw new Error('No playable songs found in this playlist');
        }
      } catch (err) {
        console.error('Failed to load songs:', err);
        setError('Failed to load songs. Please try a different playlist.');
      } finally {
        setLoading(false);
      }
    };

    const initialScores: Record<string, { artist: boolean; title: boolean; year: boolean }> = {};
    state.players.forEach(player => {
      initialScores[player.id] = { artist: false, title: false, year: false };
    });
    setPlayerScores(initialScores);

    loadSongs();
  }, []);

  useEffect(() => {
    let interval: number | undefined;

    if (timerRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer(prevTimer => prevTimer - 1);
      }, 1000);
    } else if (timer === 0) {
      handleTimerEnd();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, timer]);

  const handleTimerEnd = () => {
    setTimerRunning(false);
    setShowAnswer(true);
    handlePause();
  };

  const handlePause = async () => {
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
      await handlePause();
      setTimerRunning(false);
    } else {
      await playTrack(state.currentSong.uri);
      dispatch({ type: 'SET_PLAYING', payload: true });
      setTimerRunning(true);
    }
  };

  const handleScoreChange = (playerId: string, category: 'artist' | 'title' | 'year', value: boolean) => {
    setPlayerScores(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [category]: value
      }
    }));
  };

  const calculateTotalPoints = (playerId: string) => {
    let points = 0;
    if (playerScores[playerId]?.artist) points++;
    if (playerScores[playerId]?.title) points++;
    if (playerScores[playerId]?.year) points++;

    if (points === 3) points++;

    return points;
  };

  const submitScores = () => {
    state.players.forEach(player => {
      const points = calculateTotalPoints(player.id);
      if (points > 0) {
        dispatch({
          type: 'UPDATE_SCORE',
          payload: { playerId: player.id, points }
        });
      }
    });

    setScoringComplete(true);
  };

  const goToNextRound = () => {
    if (state.currentRound >= state.config.rounds) {
      dispatch({ type: 'FINISH_GAME' });
      navigate('/results');
      return;
    }

    dispatch({ type: 'NEXT_ROUND' });

    if (songs.length > state.currentRound) {
      dispatch({ type: 'SET_CURRENT_SONG', payload: songs[state.currentRound] });
    }

    setShowAnswer(false);
    setScoringComplete(false);
    setTimer(state.config.timePerGuess);

    const resetScores: Record<string, { artist: boolean; title: boolean; year: boolean }> = {};
    state.players.forEach(player => {
      resetScores[player.id] = { artist: false, title: false, year: false };
    });
    setPlayerScores(resetScores);
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
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-md mx-auto bg-gray-900 p-6 rounded-lg text-center">
          <div className="text-red-400 mb-4">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-4">Error</h2>
          <p className="mb-6">{error}</p>
          <button
            onClick={() => navigate('/config')}
            className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold py-2 px-4 rounded transition-colors"
          >
            Back to Setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left - Album Cover / Playback UI */}
          <div className="bg-gray-900 rounded-lg p-6 flex flex-col items-center">
            <div className="w-64 h-64 relative mb-6 flex items-center justify-center">
              {showAnswer ? (
                state.currentSong?.album.images[0] ? (
                  <img
                    src={state.currentSong.album.images[0].url}
                    alt="Album Cover"
                    className="w-full h-full object-cover rounded-lg shadow-lg transition-opacity duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-800 rounded-lg flex items-center justify-center">
                    <Music size={64} className="text-gray-600" />
                  </div>
                )
              ) : (
                <div className="w-full h-full bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className={`${state.isPlaying ? 'animate-pulse' : ''}`}>
                    <Volume2 size={64} className="text-[#1DB954]" />
                  </div>
                </div>
              )}
            </div>

            <div className="w-full max-w-md">
              <button
                onClick={handlePlayPause}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-full font-semibold mb-4 transition-colors ${
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
                <div className="text-center animate-fadeIn">
                  <h2 className="text-xl font-bold mb-1">{state.currentSong.name}</h2>
                  <p className="text-gray-400 mb-1">
                    {state.currentSong.artists.map(a => a.name).join(', ')}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {state.currentSong.album.name} • {getReleaseYear(state.currentSong.album.release_date)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right - Score UI stays unchanged */}
          {/* Keep your original score UI logic here */}
        </div>
      </div>
    </div>
  );
};

export default Gameplay;