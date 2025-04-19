// spotifyPlayer.ts

declare global {
    interface Window {
      onSpotifyWebPlaybackSDKReady: () => void;
      Spotify: any;
    }
  }
  
  export const loadSpotifySDK = (): Promise<void> => {
    return new Promise((resolve) => {
      if (document.getElementById('spotify-sdk')) return resolve();
  
      const script = document.createElement('script');
      script.id = 'spotify-sdk';
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.onload = () => resolve();
      document.body.appendChild(script);
    });
  };
  
  export const initializeSpotifyPlayer = async (token: string): Promise<string> => {
    await loadSpotifySDK();
  
    return new Promise((resolve, reject) => {
      window.onSpotifyWebPlaybackSDKReady = () => {
        const player = new window.Spotify.Player({
          name: 'TuneTrivia Player',
          getOAuthToken: (cb: (t: string) => void) => cb(token),
          volume: 0.8,
        });
  
        player.addListener('ready', ({ device_id }: any) => {
          console.log('Spotify Player Ready with Device ID:', device_id);
          localStorage.setItem('spotify_device_id', device_id);
          resolve(device_id);
        });
  
        player.addListener('initialization_error', ({ message }: any) => reject(message));
        player.addListener('authentication_error', ({ message }: any) => reject(message));
        player.addListener('account_error', ({ message }: any) => reject(message));
        player.addListener('playback_error', ({ message }: any) => reject(message));
  
        player.connect();
      };
    });
  };
  
  export const playTrack = async (trackUri: string) => {
    const token = localStorage.getItem('spotify_token');
    const deviceId = localStorage.getItem('spotify_device_id');
  
    if (!token || !deviceId) return;
  
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