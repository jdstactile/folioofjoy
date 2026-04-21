import { NextResponse } from 'next/server';

// Apple Music RSS feed — top 50 most played songs, updated daily, no API key needed
const APPLE_TOP_50_URL =
  'https://rss.applemarketingtools.com/api/v2/us/music/most-played/50/songs.json';

interface AppleRSSEntry {
  id: string;
  name: string;
  artistName: string;
  artworkUrl100: string;
  url: string;
}

interface ITunesResult {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName: string;
  artworkUrl100: string;
  trackViewUrl: string;
  previewUrl?: string;
  trackTimeMillis: number;
}

export async function GET() {
  try {
    // Step 1: Get the current Top 50 from Apple Music RSS
    const rssResponse = await fetch(APPLE_TOP_50_URL, {
      next: { revalidate: 3600 }, // cache for 1 hour
    });

    if (!rssResponse.ok) {
      console.error('[music] Apple RSS error:', rssResponse.status);
      return NextResponse.json({ tracks: [] });
    }

    const rssData = await rssResponse.json();
    const entries: AppleRSSEntry[] = rssData?.feed?.results || [];

    if (entries.length === 0) {
      console.log('[music] No entries in Apple RSS feed');
      return NextResponse.json({ tracks: [] });
    }

    // Step 2: Batch lookup via iTunes to get preview URLs and full metadata
    // iTunes lookup supports up to 200 comma-separated IDs
    const ids = entries.map((e) => e.id).join(',');
    const lookupResponse = await fetch(
      `https://itunes.apple.com/lookup?id=${ids}&entity=song`
    );

    // Build a map of iTunes results keyed by trackId
    const previewMap = new Map<string, ITunesResult>();
    if (lookupResponse.ok) {
      const lookupData = await lookupResponse.json();
      for (const result of lookupData.results || []) {
        if (result.wrapperType === 'track') {
          previewMap.set(String(result.trackId), result);
        }
      }
    }

    // Step 3: Merge RSS data with iTunes lookup data
    const tracks = entries.map((entry) => {
      const itunes = previewMap.get(entry.id);
      // Upscale artwork: 100x100 → 600x600
      const artworkLarge = (itunes?.artworkUrl100 || entry.artworkUrl100).replace(
        '100x100',
        '600x600'
      );

      return {
        id: entry.id,
        name: entry.name,
        artists: [{ name: entry.artistName }],
        album: {
          name: itunes?.collectionName || '',
          images: [{ url: artworkLarge }],
        },
        duration_ms: itunes?.trackTimeMillis || 0,
        external_urls: { apple_music: entry.url },
        preview_url: itunes?.previewUrl || null,
      };
    });

    const withPreview = tracks.filter((t) => t.preview_url);
    console.log(
      `[music] Returning ${tracks.length} tracks (${withPreview.length} with audio previews)`
    );

    return NextResponse.json({ tracks });
  } catch (error) {
    console.error('[music] API error:', error);
    return NextResponse.json({ tracks: [] });
  }
}
