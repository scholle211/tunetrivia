import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Music, CheckCircle } from 'lucide-react';
import { useGame } from '../../contexts/GameContext';
import { getRandomSongsFromPlaylist } from '../../services/spotify';
import { playTrack } from '../../services/spotifyPlayer';
import { SpotifySong } from '../../types';

const Gameplay: React.FC = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const [songs, setSongs] = useState<SpotifySong[]>([]);
  const [timer, setTimer] = useState(state.config.timePerGuess);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showRevealButton, setShowRevealButton] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [scoringComplete, setScoringComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Per-player scoring state
  const [playerScores, setPlayerScores] = useState<Record<string, {
    artist: boolean; title: boolean; year: boolean;
  }>>({});

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
      }
    };

    // Init player scores
    const scores: Record<string, { artist: boolean; title: boolean; year: boolean }> = {};
    state.players.forEach((p) => {
      scores[p.id] = { artist: false, title: false, year: false };
    });
    setPlayerScores(scores);

    loadSongs();
  }, []);

  useEffect(() => {
    if (timerRunning && timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
    if (timer === 0 && !showRevealButton) {
      setShowRevealButton(true);
    }
  }, [timerRunning, timer]);

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
    if (!state.currentSong) return;

    if (state.isPlaying) {
      await pauseTrack();
      setTimerRunning(false);
    } else {
      await playTrack(state.currentSong.uri);
      dispatch({ type: 'SET_PLAYING', payload: true });
      setTimerRunning(true);
    }
  };

  const handleReveal = async () => {
    await pauseTrack();
    setTimerRunning(false);
    setShowRevealButton(false);
    setShowAnswer(true);
  };

  const handleScoreChange = (playerId: string, field: 'artist' | 'title' | 'year') => {
    setPlayerScores(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [field]: !prev[playerId][field]
      }
    }));
  };

  const calculatePoints = (score: { artist: boolean; title: boolean; year: boolean }) => {
    const base = ['artist', 'title', 'year'].filter(key => score[key as keyof typeof score]).length;
    return base === 3 ? 4 : base;
  };

  const handleSubmitScores = () => {
    state.players.forEach(p => {
      const score = playerScores[p.id];
      const points = calculatePoints(score);
      dispatch({ type: 'UPDATE_SCORE', payload: { playerId: p.id, points } });
    });
    setScoringComplete(true);
  };

  const handleNextRound = () => {
    const nextRound = state.currentRound + 1;

    if (nextRound > state.config.rounds) {
      dispatch({ type: 'FINISH_GAME' });
      navigate('/results');
    } else {
      dispatch({ type: 'NEXT_ROUND' });
      dispatch({ type: 'SET_CURRENT_SONG', payload: songs[nextRound - 1] });

      setTimer(state.config.timePerGuess);
      setTimerRunning(false);
      setShowRevealButton(false);
      setShowAnswer(false);
      setScoringComplete(false);

      const resetScores: typeof playerScores = {};
      state.players.forEach(p => {
        resetScores[p.id] = { artist: false, title: false, year: false };
      });
      setPlayerScores(resetScores);
    }
  };

  const getReleaseYear = (dateString: string) => dateString?.split('-')[0] || 'Unknown';

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

  if (!state.currentSong) return null;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Round {state.currentRound} of {state.config.rounds}</h1>
          <div className="bg-gray-800 px-4 py-2 rounded-full text-xl font-mono">
            {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 text-center">
          {!showAnswer ? (
            <>
              <div className="w-64 h-64 mb-4 mx-auto flex items-center justify-center bg-gray-800 rounded-lg">
                <Music size={64} className="text-gray-600" />
              </div>

              <button
                onClick={handlePlayPause}
                className={`w-full max-w-xs mx-auto flex items-center justify-center gap-2 py-3 px-6 rounded-full font-semibold transition-colors ${
                  showRevealButton
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-[#1DB954] hover:bg-[#1ed760] text-black'
                }`}
                disabled={showRevealButton}
              >
                {state.isPlaying ? <Pause size={20} /> : <Play size={20} />}
                {state.isPlaying ? 'Pause Track' : 'Play Track'}
              </button>

              {showRevealButton && (
                <button
                  onClick={handleReveal}
                  className="mt-6 bg-white text-black py-2 px-6 rounded-full font-semibold"
                >
                  Reveal Answer
                </button>
              )}
            </>
          ) : (
            <>
              <div className="w-64 h-64 mb-4 mx-auto">
                {state.currentSong.album?.images[0]?.url ? (
                  <img src={state.currentSong.album.images[0].url} alt="Album Cover" className="rounded-lg" />
                ) : (
                  <Music size={64} className="text-gray-600" />
                )}
              </div>

              <h2 className="text-xl font-bold">{state.currentSong.name}</h2>
              <p className="text-gray-400">
                {state.currentSong.artists.map(a => a.name).join(', ')}
              </p>
              <p className="text-gray-500 text-sm">
                {state.currentSong.album.name} • {getReleaseYear(state.currentSong.album.release_date)}
              </p>

              {/* Scoring UI */}
              <div className="mt-6 text-left">
                {state.players.map(player => (
                  <div key={player.id} className="mb-4">
                    <h3 className="font-bold mb-2">{player.name}</h3>
                    <div className="flex gap-4">
                      {['artist', 'title', 'year'].map(field => (
                        <button
                          key={field}
                          onClick={() => handleScoreChange(player.id, field as 'artist' | 'title' | 'year')}
                          className={`px-4 py-2 rounded-full border ${
                            playerScores[player.id][field as 'artist' | 'title' | 'year']
                              ? 'bg-green-600 text-white border-green-700'
                              : 'bg-gray-700 text-gray-300 border-gray-600'
                          }`}
                        >
                          {field.charAt(0).toUpperCase() + field.slice(1)}
                          {playerScores[player.id][field as 'artist' | 'title' | 'year'] && (
                            <CheckCircle size={16} className="inline ml-2" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {!scoringComplete ? (
                <button
                  onClick={handleSubmitScores}
                  className="mt-6 w-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold py-3 px-6 rounded-full"
                >
                  Submit Scores
                </button>
              ) : (
                <button
                  onClick={handleNextRound}
                  className="mt-6 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-full"
                >
                  {state.currentRound >= state.config.rounds ? 'Finish Game' : 'Next Round'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Gameplay;