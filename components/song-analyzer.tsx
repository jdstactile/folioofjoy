'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { MatrixVisualization } from './matrix-visualization';
import { FloatingPill } from './floating-pill';
import { getPopularTracks, searchTrackLyrics, type Track } from '@/lib/music';

export function SongAnalyzer() {
  const [lyrics, setLyrics] = useState('');
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSingleMatches, setShowSingleMatches] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [restartKey, setRestartKey] = useState(0);
  const [dimmed, setDimmed] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load popular tracks on mount
  useEffect(() => {
    async function loadTracks() {
      setLoading(true);
      try {
        const popularTracks = await getPopularTracks();
        setTracks(popularTracks);
        if (popularTracks.length > 0) {
          setCurrentTrack(popularTracks[0]);
        }
        setError(null);
      } catch (err) {
        console.error('Error loading tracks:', err);
        setError(null);
      } finally {
        setLoading(false);
      }
    }
    loadTracks();
  }, []);

  // Fetch lyrics when track changes
  useEffect(() => {
    async function fetchLyrics() {
      if (!currentTrack) {
        setLyrics('');
        return;
      }

      try {
        const artistName = currentTrack.artists[0]?.name || '';
        const trackName = currentTrack.name;
        const fetchedLyrics = await searchTrackLyrics(trackName, artistName);

        if (fetchedLyrics) {
          setLyrics(fetchedLyrics);
        } else {
          setLyrics('No lyrics available for this track');
        }
      } catch (err) {
        console.error('Failed to fetch lyrics:', err);
        setLyrics('Failed to load lyrics');
      }
    }

    fetchLyrics();
  }, [currentTrack]);

  // Handle audio playback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      setIsPlaying(false);
      playNext();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [tracks, currentTrack]);

  const playTrack = async (track: Track) => {
    setCurrentTrack(track);
    setCurrentTime(0);
    if (audioRef.current && track.preview_url) {
      audioRef.current.src = track.preview_url;
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    } else {
      setIsPlaying(false);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current || !currentTrack?.preview_url) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.src = currentTrack.preview_url;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const playNext = () => {
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack?.id) ?? -1;
    const nextIndex = (currentIndex + 1) % tracks.length;
    if (tracks[nextIndex]) {
      playTrack(tracks[nextIndex]);
    }
  };

  const playPrevious = () => {
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack?.id) ?? -1;
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    if (tracks[prevIndex]) {
      playTrack(tracks[prevIndex]);
    }
  };

  const handleRestart = useCallback(() => {
    setRestartKey((k) => k + 1);
  }, []);

  // Parse and normalize lyrics
  const { words, wordMap } = useMemo(() => {
    if (!lyrics) return { words: [], wordMap: new Map() };

    const normalized = lyrics
      .toLowerCase()
      .split(/[\s\n]+/)
      .map((word) => word.replace(/[^\w]/g, ''))
      .filter((word) => word.length > 0);

    const map = new Map<string, number[]>();
    normalized.forEach((word, index) => {
      if (!map.has(word)) {
        map.set(word, []);
      }
      map.get(word)!.push(index);
    });

    return {
      words: normalized,
      wordMap: map,
    };
  }, [lyrics]);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <audio ref={audioRef} crossOrigin="anonymous" muted={isMuted} />

      {/* Full-screen Matrix */}
      {words.length > 0 && (
        <MatrixVisualization
          words={words}
          wordMap={wordMap}
          showSingleMatches={showSingleMatches}
          opacity={dimmed ? 0.08 : 0.35}
          restartKey={restartKey}
        />
      )}

      {/* Floating Pill Controls */}
      <FloatingPill
        currentTrack={currentTrack}
        tracks={tracks}
        loading={loading}
        error={error}
        isPlaying={isPlaying}
        currentTime={currentTime}
        onPlayTrack={playTrack}
        onTogglePlayPause={togglePlayPause}
        onPlayNext={playNext}
        onPlayPrevious={playPrevious}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onRestart={handleRestart}
        dimmed={dimmed}
        onToggleDimmed={() => setDimmed((d) => !d)}
      />
    </div>
  );
}
