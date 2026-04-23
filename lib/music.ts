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

// Generate title variants to improve lyrics.ovh match rate.
// iTunes titles often include parentheticals ("(feat. X)", "(Remastered)"),
// abbreviated forms ("Y.M.C.A."), and punctuation ("CAN'T STOP THE FEELING!")
// that lyrics.ovh's exact-match endpoint doesn't tolerate.
export function lyricsTitleVariants(title: string): string[] {
  const variants = new Set<string>();
  const add = (s: string) => { const t = s.trim(); if (t) variants.add(t); };
  add(title);
  // Strip parentheticals and brackets: "Happy (From ...)" → "Happy"
  const noParens = title.replace(/\s*[\(\[][^\)\]]*[\)\]]/g, '').trim();
  add(noParens);
  // Strip " - Remastered"-style suffix
  add(noParens.split(/\s+[-–]\s+/)[0]);
  // Collapse letter-dot-letter abbreviations: "Y.M.C.A." → "YMCA"
  add(noParens.replace(/\b(?:[A-Za-z]\.){2,}[A-Za-z]?\b/g, (m) => m.replace(/\./g, '')));
  // Drop trailing punctuation like "!" or "..."
  add(noParens.replace(/[!?.…]+$/g, ''));
  return [...variants];
}

// Search for lyrics using lyrics.ovh API. Tries several title variants; returns
// the first non-empty match. Returns null if no variant resolves.
export async function searchTrackLyrics(
  trackName: string,
  artistName: string
): Promise<string | null> {
  const variants = lyricsTitleVariants(trackName);
  for (const v of variants) {
    try {
      const response = await fetch(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(artistName)}/${encodeURIComponent(v)}`
      );
      if (!response.ok) continue;
      const data = await response.json();
      const lyrics = (data.lyrics || '').trim();
      if (lyrics.length > 30) return lyrics;
    } catch {
      // try next variant
    }
  }
  return null;
}
