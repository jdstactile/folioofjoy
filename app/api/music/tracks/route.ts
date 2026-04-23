import { NextResponse } from 'next/server';

const APPLE_TOP_50_URL =
  'https://rss.applemarketingtools.com/api/v2/us/music/most-played/50/songs.json';

// Joy's favorite songs — iTunes track IDs.
//
// MANDATE: Every ID listed here must have lyrics retrievable via
// lib/music.ts::searchTrackLyrics (lyrics.ovh). The pattern visualiser
// is meaningless without lyrics, so tracks that resolve to `null` are
// excluded at the source rather than handled downstream.
//
// Before adding a new ID, verify with scripts/check-lyrics.py — only
// commit IDs that come back OK.
const FAVORITES_IDS = [
  '1488408568', '277989727', '266025462', '1377827086', '1571330212',
  '1811175544', '1193701436', '1770062049', '1836226732', '945569025',
  '1704856219', '1770524325', '1441552785', '518869935', '590431790',
  '1739659142',
  // Earworms — sing-along, repetition-crime, party-staple additions
  '1441133277', '713773457', '723351644', '1443758761', '257425447',
  '1322068804', '255961201', '1440825374', '1440651216', '1264976429',
  '1440874008', '1440933651', '863835363', '943946671', '1055074640',
  '1193701392', '1468166468', '1704956549', '1577631231', '715891658',
  '1440818897', '303171368', '267954487', '251948354', '1440769310',
  '690233856', '258647542',
];

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

function itunesResultToTrack(r: ITunesResult) {
  return {
    id: String(r.trackId),
    name: r.trackName,
    artists: [{ name: r.artistName }],
    album: {
      name: r.collectionName || '',
      images: [{ url: (r.artworkUrl100 || '').replace('100x100', '600x600') }],
    },
    duration_ms: r.trackTimeMillis || 0,
    external_urls: { apple_music: r.trackViewUrl || '' },
    preview_url: r.previewUrl || null,
  };
}

async function fetchFavorites() {
  const ids = FAVORITES_IDS.join(',');
  const res = await fetch(`https://itunes.apple.com/lookup?id=${ids}&entity=song`);
  if (!res.ok) return [];
  const data = await res.json();
  const trackMap = new Map<string, ITunesResult>();
  for (const r of data.results || []) {
    if (r.wrapperType === 'track') trackMap.set(String(r.trackId), r);
  }
  // Preserve original order
  return FAVORITES_IDS
    .map((id) => trackMap.get(id))
    .filter((r): r is ITunesResult => !!r)
    .map(itunesResultToTrack);
}

async function fetchTopChart() {
  const rssResponse = await fetch(APPLE_TOP_50_URL, {
    next: { revalidate: 3600 },
  });
  if (!rssResponse.ok) return [];

  const rssData = await rssResponse.json();
  const entries: AppleRSSEntry[] = rssData?.feed?.results || [];
  if (entries.length === 0) return [];

  const ids = entries.map((e) => e.id).join(',');
  const lookupResponse = await fetch(`https://itunes.apple.com/lookup?id=${ids}&entity=song`);
  const previewMap = new Map<string, ITunesResult>();
  if (lookupResponse.ok) {
    const lookupData = await lookupResponse.json();
    for (const result of lookupData.results || []) {
      if (result.wrapperType === 'track') previewMap.set(String(result.trackId), result);
    }
  }

  return entries.map((entry) => {
    const itunes = previewMap.get(entry.id);
    const artworkLarge = (itunes?.artworkUrl100 || entry.artworkUrl100).replace('100x100', '600x600');
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
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const playlist = searchParams.get('playlist') || 'favorites';

  try {
    const tracks = playlist === 'favorites'
      ? await fetchFavorites()
      : await fetchTopChart();

    console.log(`[music] Returning ${tracks.length} tracks (${playlist})`);
    return NextResponse.json({ tracks });
  } catch (error) {
    console.error('[music] API error:', error);
    return NextResponse.json({ tracks: [] });
  }
}
