import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Music } from 'lucide-react';

const SpotifyLogin: React.FC = () => {
  const { login, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // 🔁 Redirect to game config once authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/config');
    }
  }, [isAuthenticated, navigate]);

  // ⏳ Optional loading spinner while waiting
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-[#1DB954] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6">
      <div className="max-w-md w-full mx-auto text-center">
        <div className="mb-8 animate-pulse">
          <Music size={64} className="mx-auto text-[#1DB954]" />
        </div>

        <h1 className="text-4xl font-bold mb-2">Tune Trivia</h1>
        <p className="text-gray-400 mb-8">Test your music knowledge with friends!</p>

        <div className="bg-gray-900 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">How to Play:</h2>
          <ul className="text-left text-gray-300 space-y-2 mb-6">
            <li className="flex items-start gap-2">
              <span className="text-[#1DB954]">1.</span> Log in with Spotify
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#1DB954]">2.</span> Select a playlist and game settings
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#1DB954]">3.</span> Add players for your party
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#1DB954]">4.</span> Listen to song previews and guess!
            </li>
          </ul>
        </div>

        <button
          onClick={login}
          disabled={isLoading}
          className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold py-3 px-4 rounded-full transition-all duration-300 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M8 14.5a5 5 0 0 1 8 0"></path>
                <path d="M8 9.5a8 8 0 0 1 8 0"></path>
                <path d="M8 5a12 12 0 0 1 8 0"></path>
              </svg>
              Continue with Spotify
            </>
          )}
        </button>

        <p className="text-xs text-gray-500 mt-4">
          By continuing, you agree to allow Tune Trivia to access your Spotify account data in accordance with our Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default SpotifyLogin;