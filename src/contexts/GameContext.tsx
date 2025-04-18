import React, { createContext, useContext, useReducer } from 'react';
import { GameState, GameConfig, Player, SpotifySong } from '../types';

// Actions
type GameAction =
  | { type: 'SET_CONFIG'; payload: GameConfig }
  | { type: 'ADD_PLAYER'; payload: Player }
  | { type: 'REMOVE_PLAYER'; payload: string }
  | { type: 'SET_CURRENT_SONG'; payload: SpotifySong }
  | { type: 'START_GAME' }
  | { type: 'NEXT_ROUND' }
  | { type: 'UPDATE_SCORE'; payload: { playerId: string; points: number } }
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'RESET_GAME' }
  | { type: 'FINISH_GAME' };

const initialState: GameState = {
  config: {
    rounds: 5,
    timePerGuess: 30,
    playlistId: '',
    playlistName: '',
  },
  players: [],
  currentRound: 0,
  currentSong: null,
  gameStatus: 'setup',
  isPlaying: false,
};

const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'SET_CONFIG':
      return { ...state, config: action.payload };
    case 'ADD_PLAYER':
      return { 
        ...state, 
        players: [...state.players, action.payload] 
      };
    case 'REMOVE_PLAYER':
      return { 
        ...state, 
        players: state.players.filter(player => player.id !== action.payload) 
      };
    case 'SET_CURRENT_SONG':
      return { ...state, currentSong: action.payload };
    case 'START_GAME':
      return { 
        ...state, 
        gameStatus: 'playing', 
        currentRound: 1 
      };
    case 'NEXT_ROUND':
      return { 
        ...state, 
        currentRound: state.currentRound + 1,
        gameStatus: state.currentRound >= state.config.rounds ? 'finished' : 'playing',
        isPlaying: false,
      };
    case 'UPDATE_SCORE':
      return {
        ...state,
        players: state.players.map(player => 
          player.id === action.payload.playerId 
            ? { ...player, score: player.score + action.payload.points } 
            : player
        ),
      };
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.payload };
    case 'RESET_GAME':
      return {
        ...state,
        currentRound: 0,
        players: state.players.map(player => ({ ...player, score: 0 })),
        gameStatus: 'setup',
        isPlaying: false,
        currentSong: null,
      };
    case 'FINISH_GAME':
      return { ...state, gameStatus: 'finished' };
    default:
      return state;
  }
};

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextType>({
  state: initialState,
  dispatch: () => null,
});

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);