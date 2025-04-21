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

  const [allSongs, setAllSongs] = useState<SpotifySong[]>([]);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [roundIndex, setRoundIndex] = useState(1);

  const [timer, setTimer] = useState(state.config.timePerGuess);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [scoringComplete, setScoringComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [playerScores, setPlayerScores] = useState<Record<string, {
    artist: boolean; title: boolean; year: boolean;
  }>>({});

  const totalGuesses = state.config.rounds * state.players.length;
  const currentPlayer = state.players[playerIndex];
  const currentSongIndex = (roundIndex - 1) * state.players.length + playerIndex;
  const currentSong = allSongs[currentSongIndex];

  useEffect(() => {
    const loadSongs = async () => {
      try {
        if (!state.config.playlistId) {
          navigate('/config');
          return;
        }

        const count = state.config.rounds * state.players.length;
        const data = await getRandomSongsFromPlaylist(state.config.playlistId, count);
        setAllSongs(data);
        dispatch({ type: 'SET_CURRENT_SONG', payload: data[0] });
      } catch (err) {
        console.error(err);
        setError('Failed to load songs. Try a different playlist.');
      }
    };

    const scores: Record<string, { artist: boolean; title: boolean; year: boolean }> = {};
    state.players.forEach(p => {
      scores[p.id] = { artist: false, title: false, year: false };
    });
    setPlayerScores(scores);

    loadSongs();
  }, []);

  useEffect(() => {
    if (currentSong) {
      dispatch({ type: 'SET_CURRENT_SONG', payload: currentSong });
    }
  }, [currentSong]);

  useEffect(() => {
    if (timerRunning && timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }

    if (timer === 0) {
      setShowReveal(true);
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
    if (!currentSong) return;

    if (state.isPlaying) {
      await pauseTrack();
      setTimerRunning(false);
    } else {
      await playTrack(currentSong.uri);
      dispatch({ type: 'SET_PLAYING', payload: true });
      setTimerRunning(true);
    }
  };

  const handleReveal = async () => {
    await pauseTrack();
    setTimerRunning(false);
    setShowReveal(false);
    setShowAnswer(true);
  };

  const handleScoreChange = (field: 'artist' | 'title' | 'year') => {
    setPlayerScores(prev => ({
      ...prev,
      [currentPlayer.id]: {
        ...prev[currentPlayer.id],
        [field]: !prev[currentPlayer.id][field]
      }
    }));
  };

  const calculatePoints = (score: { artist: boolean; title: boolean; year: boolean }) => {
    const base = ['artist', 'title', 'year'].filter(k => score[k as keyof typeof score]).length;
    return base === 3 ? 4 : base;
  };

  const handleSubmitScore = () => {
    const score = playerScores[currentPlayer.id];
    const points = calculatePoints(score);

    dispatch({
      type: 'UPDATE_SCORE',
      payload: { playerId: currentPlayer.id, points }
    });

    setScoringComplete(true);
  };

  const handleNext = () => {
    setScoringComplete(false);
    setShowAnswer(false);
    setShowReveal(false);
    setTimer(state.config.timePerGuess);

    if (playerIndex + 1 < state.players.length) {
      setPlayerIndex(prev => prev + 1);
    } else if (roundIndex < state.config.rounds) {
      setPlayerIndex(0);
      setRoundIndex(prev => prev + 1);
    } else {
      dispatch({ type: 'FINISH_GAME' });
      navigate('/results');
    }
  };

  const getReleaseYear = (date: string) => date?.split('-')[0] || 'Unknown';

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

  if (!currentSong || !currentPlayer) return null;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            Round {roundIndex} / {state.config.rounds}
          </h1>
          <div className="bg-gray-800 px-4 py-2 rounded-full text-xl font-mono">
            {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
          </div>
        </div>

        <h2 className="text-lg font-semibold text-center mb-4">
          🎧 {currentPlayer.name}, it’s your turn!
        </h2>

        <div className="bg-gray-900 rounded-lg p-6 text-center">
          <div className="w-64 h-64 mb-4 mx-auto bg-gray-800 rounded-lg flex items-center justify-center">
            {showAnswer && currentSong.album?.images[0]?.url ? (
              <img
                src={currentSong.album.images[0].url}
                alt="Album Cover"
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <Music size={64} className="text-gray-600" />
            )}
          </div>

          {!showAnswer ? (
            <>
              <button
                onClick={handlePlayPause}
                className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 py-3 px-6 rounded-full font-semibold transition-colors bg-[#1DB954] hover:bg-[#1ed760] text-black"
                disabled={showReveal}
              >
                {state.isPlaying ? <Pause size={20} /> : <Play size={20} />}
                {state.isPlaying ? 'Pause Track' : 'Play Track'}
              </button>

              {showReveal && (
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
              <h2 className="text-xl font-bold">{currentSong.name}</h2>
              <p className="text-gray-400">{currentSong.artists.map(a => a.name).join(', ')}</p>
              <p className="text-gray-500 text-sm">
                {currentSong.album.name} • {getReleaseYear(currentSong.album.release_date)}
              </p>

              <div className="mt-6 flex justify-center gap-4 flex-wrap">
                {(['artist', 'title', 'year'] as const).map((key) => (
                  <button
                    key={key}
                    onClick={() => handleScoreChange(key)}
                    className={`px-4 py-2 rounded-full border ${
                      playerScores[currentPlayer.id][key]
                        ? 'bg-green-600 text-white border-green-700'
                        : 'bg-gray-700 text-gray-300 border-gray-600'
                    }`}
                  >
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                    {playerScores[currentPlayer.id][key] && (
                      <CheckCircle size={16} className="inline ml-2" />
                    )}
                  </button>
                ))}
              </div>

              {!scoringComplete ? (
                <button
                  onClick={handleSubmitScore}
                  className="mt-6 w-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold py-3 px-6 rounded-full"
                >
                  Submit Score
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="mt-6 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-full"
                >
                  {playerIndex === state.players.length - 1 && roundIndex === state.config.rounds
                    ? 'Finish Game'
                    : 'Next Player'}
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