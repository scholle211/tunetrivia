import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Play, Pause, CheckCircle, Volume2 } from 'lucide-react';
import { useGame } from '../../contexts/GameContext';
import { getRandomSongsFromPlaylist } from '../../services/spotify';
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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Keep track of scoring for each player
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
        
        // Preload the first song
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
    
    // Initialize player scores
    const initialScores: Record<string, { artist: boolean; title: boolean; year: boolean }> = {};
    state.players.forEach(player => {
      initialScores[player.id] = { artist: false, title: false, year: false };
    });
    setPlayerScores(initialScores);

    loadSongs();
  }, []);

  useEffect(() => {
    if (state.currentSong && audioRef.current) {
      audioRef.current.src = state.currentSong.preview_url || '';
      audioRef.current.load();
    }
  }, [state.currentSong]);

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
    if (audioRef.current) {
      audioRef.current.pause();
      dispatch({ type: 'SET_PLAYING', payload: false });
    }
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (state.isPlaying) {
        audioRef.current.pause();
        dispatch({ type: 'SET_PLAYING', payload: false });
        setTimerRunning(false);
      } else {
        audioRef.current.play();
        dispatch({ type: 'SET_PLAYING', payload: true });
        setTimerRunning(true);
      }
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
    
    // Bonus point for all three correct
    if (points === 3) points++;
    
    return points;
  };

  const submitScores = () => {
    // Update points for all players
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
    // Reset for next round
    if (state.currentRound >= state.config.rounds) {
      dispatch({ type: 'FINISH_GAME' });
      navigate('/results');
      return;
    }
    
    // Move to next round
    dispatch({ type: 'NEXT_ROUND' });
    
    // Set the next song
    if (songs.length > state.currentRound) {
      dispatch({ type: 'SET_CURRENT_SONG', payload: songs[state.currentRound] });
    }
    
    // Reset state
    setShowAnswer(false);
    setScoringComplete(false);
    setTimer(state.config.timePerGuess);
    
    // Reset player scores for the round
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
          {/* Left side - Song Player */}
          <div className="bg-gray-900 rounded-lg p-6 flex flex-col items-center">
            <div className="w-64 h-64 relative mb-6 flex items-center justify-center">
              {showAnswer ? (
                state.currentSong && state.currentSong.album.images[0] ? (
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

            {/* Audio controls */}
            <audio ref={audioRef} className="hidden"></audio>
            
            <div className="w-full max-w-md">
              <button
                onClick={handlePlayPause}
                disabled={showAnswer || !state.currentSong?.preview_url}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-full font-semibold mb-4 transition-colors ${
                  showAnswer || !state.currentSong?.preview_url
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-[#1DB954] hover:bg-[#1ed760] text-black'
                }`}
              >
                {state.isPlaying ? <Pause size={20} /> : <Play size={20} />}
                {state.isPlaying ? 'Pause Preview' : 'Play Preview'}
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

          {/* Right side - Scoreboard and Controls */}
          <div className="bg-gray-900 rounded-lg p-6">
            {!showAnswer ? (
              <div className="text-center py-8">
                <h2 className="text-2xl font-bold mb-6">Listen and Guess!</h2>
                <p className="text-gray-400 mb-4">
                  Players should write down or remember their guesses for:
                </p>
                <div className="flex justify-center gap-8 mb-8">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-purple-900/50 flex items-center justify-center mx-auto mb-2">
                      <span className="text-xl">🎤</span>
                    </div>
                    <p className="text-sm">Artist</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-blue-900/50 flex items-center justify-center mx-auto mb-2">
                      <span className="text-xl">🎶</span>
                    </div>
                    <p className="text-sm">Title</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-yellow-900/50 flex items-center justify-center mx-auto mb-2">
                      <span className="text-xl">📅</span>
                    </div>
                    <p className="text-sm">Year</p>
                  </div>
                </div>
                <button
                  onClick={handleTimerEnd}
                  className="bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded-full transition-colors"
                >
                  Reveal Answer
                </button>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-bold mb-4">Score Players</h2>
                <div className="space-y-4 mb-6">
                  {state.players.map((player) => (
                    <div key={player.id} className="bg-gray-800 p-4 rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${player.avatar}`}>
                          {player.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{player.name}</span>
                        <span className="ml-auto text-gray-400">
                          Points: {calculateTotalPoints(player.id)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleScoreChange(player.id, 'artist', !playerScores[player.id]?.artist)}
                          className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                            playerScores[player.id]?.artist
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-700 text-gray-300'
                          }`}
                        >
                          <span className="text-xs">🎤</span>
                          Artist
                          {playerScores[player.id]?.artist && <CheckCircle size={14} className="ml-1" />}
                        </button>
                        <button
                          onClick={() => handleScoreChange(player.id, 'title', !playerScores[player.id]?.title)}
                          className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                            playerScores[player.id]?.title
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-700 text-gray-300'
                          }`}
                        >
                          <span className="text-xs">🎶</span>
                          Title
                          {playerScores[player.id]?.title && <CheckCircle size={14} className="ml-1" />}
                        </button>
                        <button
                          onClick={() => handleScoreChange(player.id, 'year', !playerScores[player.id]?.year)}
                          className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                            playerScores[player.id]?.year
                              ? 'bg-yellow-600 text-white'
                              : 'bg-gray-700 text-gray-300'
                          }`}
                        >
                          <span className="text-xs">📅</span>
                          Year
                          {playerScores[player.id]?.year && <CheckCircle size={14} className="ml-1" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {!scoringComplete ? (
                  <button
                    onClick={submitScores}
                    className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold py-3 px-4 rounded-full transition-colors mb-4"
                  >
                    Submit Scores
                  </button>
                ) : (
                  <button
                    onClick={goToNextRound}
                    className="w-full bg-[#8E44AD] hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-full transition-colors mb-4"
                  >
                    {state.currentRound >= state.config.rounds ? 'View Final Results' : 'Next Round'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Gameplay;