declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: any;
  }
}

// ✅ Dynamically load the SDK and define the callback BEFORE it loads
export const loadSpotifySDK = (): Promise<void> => {
  return new Promise((resolve) => {
    if (document.getElementById('spotify-sdk')) {
      resolve();
      return;
    }

    // ✅ define callback BEFORE script loads
    window.onSpotifyWebPlaybackSDKReady = () => {
      console.log('Spotify SDK is ready');
      resolve();
    };

    const script = document.createElement('script');
    script.id = 'spotify-sdk';
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    document.body.appendChild(script);
  });
};

export const initializeSpotifyPlayer = async (token: string): Promise<string> => {
  await loadSpotifySDK();

  return new Promise((resolve) => {
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

    // Player ready
    player.addListener('ready', ({ device_id }: { device_id: string }) => {
      console.log('Ready with Device ID', device_id);
      localStorage.setItem('spotify_device_id', device_id);
      alert(
        'Your Spotify Web Player is ready!\n\nMake sure to open Spotify on your phone or desktop and select "Tune Trivia Player" as your active device.'
      );
      resolve(device_id);
    });

    // Player not ready
    player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
      console.log('Device ID has gone offline', device_id);
    });

    player.connect();
  });
};

export const playTrack = async (trackUri: string) => {
  const token = localStorage.getItem('spotify_token');
  const deviceId = localStorage.getItem('spotify_device_id');

  if (!token || !deviceId) {
    console.warn('Missing token or device ID');
    alert('Spotify token or device ID missing. Please re-login and ensure Spotify is open.');
    return;
  }

  const res = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
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

  if (!res.ok) {
    const msg = await res.text();
    console.error('Failed to start playback:', msg);
    alert(
      'Playback failed.\n\nMake sure you:\n- Have Spotify Premium\n- Have the Spotify app open\n- Selected "Tune Trivia Player" as the active device.'
    );
  }
};