export interface Track {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string }>;
  };
  duration_ms: number;
  external_urls: { apple_music: string };
  preview_url: string | null;
}

export type PlaylistType = 'favorites' | 'top50';

export async function getTracks(playlist: PlaylistType = 'favorites'): Promise<Track[]> {
  try {
    const response = await fetch(`/api/music/tracks?playlist=${playlist}`);

    if (!response.ok) {
      console.warn('Failed to fetch tracks from API');
      return [];
    }

    const data = await response.json();
    return data.tracks || [];
  } catch (error) {
    console.error('Failed to fetch tracks:', error);
    return [];
  }
}

// Search for lyrics using lyrics.ovh API
export async function searchTrackLyrics(
  trackName: string,
  artistName: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.lyrics.ovh/v1/${encodeURIComponent(artistName)}/${encodeURIComponent(trackName)}`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.lyrics || null;
  } catch (error) {
    console.error('Failed to search lyrics:', error);
    return null;
  }
}
