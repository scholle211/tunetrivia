import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';
import SpotifyLogin from './components/auth/SpotifyLogin';
import GameConfig from './components/game/GameConfig';
import PlayerSetup from './components/game/PlayerSetup';
import Gameplay from './components/game/Gameplay';
import GameResults from './components/game/GameResults';

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-[#1DB954] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<SpotifyLogin />} />
      <Route 
        path="/config" 
        element={
          <ProtectedRoute>
            <GameConfig />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/players" 
        element={
          <ProtectedRoute>
            <PlayerSetup />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/game" 
        element={
          <ProtectedRoute>
            <Gameplay />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/results" 
        element={
          <ProtectedRoute>
            <GameResults />
          </ProtectedRoute>
        } 
      />
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GameProvider>
          <div className="min-h-screen bg-black">
            <AppRoutes />
          </div>
        </GameProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;