declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: any;
  }
}

export const loadSpotifySDK = (): Promise<void> => {
  return new Promise((resolve) => {
    if (document.getElementById('spotify-sdk')) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = 'spotify-sdk';
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
};

export const initializeSpotifyPlayer = async (token: string): Promise<string> => {
  await loadSpotifySDK();

  return new Promise((resolve) => {
    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: 'Tune Trivia Player',
        getOAuthToken: (cb: (token: string) => void) => cb(token),
        volume: 0.5,
      });

      // Error handling
      player.addListener('initialization_error', ({ message }: { message: string }) =>
        console.error('Initialization error:', message)
      );
      player.addListener('authentication_error', ({ message }: { message: string }) =>
        console.error('Authentication error:', message)
      );
      player.addListener('account_error', ({ message }: { message: string }) =>
        console.error('Account error:', message)
      );
      player.addListener('playback_error', ({ message }: { message: string }) =>
        console.error('Playback error:', message)
      );

      // Playback status updates
      player.addListener('player_state_changed', (state: any) => {
        console.log('Player state changed:', state);
      });

      // Ready
      player.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('Ready with Device ID', device_id);
        localStorage.setItem('spotify_device_id', device_id); // Save for later
        resolve(device_id);
      });

      // Not Ready
      player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.log('Device ID has gone offline', device_id);
      });

      player.connect();
    };
  });
};

export const playTrack = async (trackUri: string) => {
  const token = localStorage.getItem('spotify_token');
  const deviceId = localStorage.getItem('spotify_device_id');

  if (!token || !deviceId) {
    console.warn('Missing token or device ID');
    return;
  }

  await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      uris: [trackUri],
      position_ms: 0,
    }),
  });
};