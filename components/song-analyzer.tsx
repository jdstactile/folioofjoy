'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { MatrixVisualization, type ExploreSettings } from './matrix-visualization';
import { FloatingPill } from './floating-pill';
import { HeroOverlay } from './hero-overlay';
import { PatternGuide } from './pattern-guide';
import { ExploreToolbar } from './explore-toolbar';
import { getTracks, searchTrackLyrics, type Track, type PlaylistType } from '@/lib/music';
import { extractDominantColor, DEFAULT_THEME, type ThemeColors } from '@/lib/color';

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
  const [theme, setTheme] = useState<ThemeColors>(DEFAULT_THEME);
  const [exploreMode, setExploreMode] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{ i: number; j: number } | null>(null);
  const [playlist] = useState<PlaylistType>('top50');
  const [exploreSettings, setExploreSettings] = useState<ExploreSettings>({
    wave: 'center',
    colorMode: 'white',
    shapeMode: 'circles-ripple',
    shades: DEFAULT_THEME.shades,
    hue: DEFAULT_THEME.hue,
    saturation: DEFAULT_THEME.saturation,
  });
  const audioRef = useRef<HTMLAudioElement>(null);

  // Sync explore settings shades with theme
  useEffect(() => {
    setExploreSettings((s) => ({
      ...s,
      shades: theme.shades,
      hue: theme.hue,
      saturation: theme.saturation,
    }));
  }, [theme]);

  useEffect(() => {
    async function loadTracks() {
      setLoading(true);
      try {
        const fetchedTracks = await getTracks(playlist);
        setTracks(fetchedTracks);
        if (fetchedTracks.length > 0) setCurrentTrack(fetchedTracks[0]);
        setError(null);
      } catch (err) {
        console.error('Error loading tracks:', err);
        setError(null);
      } finally {
        setLoading(false);
      }
    }
    loadTracks();
  }, [playlist]);

  useEffect(() => {
    const imageUrl = currentTrack?.album?.images[0]?.url;
    if (!imageUrl) return;
    extractDominantColor(imageUrl).then(setTheme);
  }, [currentTrack]);

  useEffect(() => {
    async function fetchLyrics() {
      if (!currentTrack) { setLyrics(''); return; }
      try {
        const artistName = currentTrack.artists[0]?.name || '';
        const trackName = currentTrack.name;
        const fetchedLyrics = await searchTrackLyrics(trackName, artistName);
        setLyrics(fetchedLyrics || 'No lyrics available for this track');
      } catch (err) {
        console.error('Failed to fetch lyrics:', err);
        setLyrics('Failed to load lyrics');
      }
    }
    fetchLyrics();
  }, [currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => { setIsPlaying(false); playNext(); };
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
      try { await audioRef.current.play(); setIsPlaying(true); }
      catch { setIsPlaying(false); }
    } else { setIsPlaying(false); }
  };

  const togglePlayPause = () => {
    if (!audioRef.current || !currentTrack?.preview_url) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else {
      audioRef.current.src = currentTrack.preview_url;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const toggleMute = () => {
    if (audioRef.current) { audioRef.current.muted = !isMuted; setIsMuted(!isMuted); }
  };

  const playNext = () => {
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack?.id) ?? -1;
    const nextIndex = (currentIndex + 1) % tracks.length;
    if (tracks[nextIndex]) playTrack(tracks[nextIndex]);
  };

  const playPrevious = () => {
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack?.id) ?? -1;
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    if (tracks[prevIndex]) playTrack(tracks[prevIndex]);
  };

  const handleRestart = useCallback(() => { setRestartKey((k) => k + 1); }, []);

  const enterExplore = useCallback(() => {
    setExploreMode(true);
    setHoveredCell(null);
    setRestartKey((k) => k + 1);
  }, []);

  const exitExplore = useCallback(() => {
    setExploreMode(false);
    setHoveredCell(null);
    // Reset to defaults
    setExploreSettings((s) => ({ ...s, wave: 'center', colorMode: 'white', shapeMode: 'circles-ripple' }));
    setRestartKey((k) => k + 1);
  }, []);

  const { words, wordMap } = useMemo(() => {
    if (!lyrics) return { words: [], wordMap: new Map() };
    const normalized = lyrics.toLowerCase().split(/[\s\n]+/)
      .map((word) => word.replace(/[^\w]/g, '')).filter((word) => word.length > 0);
    const map = new Map<string, number[]>();
    normalized.forEach((word, index) => {
      if (!map.has(word)) map.set(word, []);
      map.get(word)!.push(index);
    });
    return { words: normalized, wordMap: map };
  }, [lyrics]);

  const hoveredWord = useMemo(() => {
    if (!exploreMode || !hoveredCell) return null;
    const word = words[hoveredCell.i];
    if (word && (showSingleMatches || (wordMap.get(word)?.length || 0) > 1)) return word;
    return null;
  }, [exploreMode, hoveredCell, words, wordMap, showSingleMatches]);

  return (
    <div
      className="relative w-full h-screen overflow-hidden transition-colors duration-1000 ease-in-out"
      style={{ backgroundColor: theme.background }}
    >
      <audio ref={audioRef} crossOrigin="anonymous" muted={isMuted} />

      {/* Full-screen Matrix */}
      {words.length > 0 && (
        <MatrixVisualization
          words={words}
          wordMap={wordMap}
          showSingleMatches={showSingleMatches}
          opacity={exploreMode ? 1 : dimmed ? 0.08 : 0.35}
          restartKey={restartKey}
          backgroundColor={theme.backgroundRgb}
          onCellHover={exploreMode ? setHoveredCell : undefined}
          exploreSettings={exploreSettings}
        />
      )}

      {/* Hero Text Overlay — hidden in explore mode */}
      <div className={`transition-opacity duration-500 ${exploreMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <HeroOverlay accentColor={theme.accent} toolbarColor={theme.toolbar} />
      </div>

      {/* Social links — top left */}
      <div className={`fixed top-7 left-8 z-50 flex items-center gap-5 transition-opacity duration-500 ${exploreMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <a href="https://www.instagram.com/joyingntravelling/" target="_blank" rel="noopener noreferrer" className="text-sm font-sans text-white/40 hover:text-white transition-colors">
          Instagram
        </a>
        <a href="https://www.threads.com/@joydeep.roni" target="_blank" rel="noopener noreferrer" className="text-sm font-sans text-white/40 hover:text-white transition-colors">
          Threads
        </a>
        <a href="https://www.linkedin.com/in/joydeeproni/" target="_blank" rel="noopener noreferrer" className="text-sm font-sans text-white/40 hover:text-white transition-colors">
          LinkedIn
        </a>
      </div>

      {/* Hovered word tooltip — explore mode only */}
      {hoveredWord && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-40 px-4 py-2">
          <span className="text-white font-mono font-semibold">{hoveredWord}</span>
          <span className="text-white/40 text-sm ml-2">
            {wordMap.get(hoveredWord)?.length || 0} matches
          </span>
        </div>
      )}

      {/* Pattern guide — explore mode, left side */}
      <PatternGuide active={exploreMode} restartKey={restartKey} />

      {/* "What's this pattern?" — top right */}
      <button
        onClick={() => { if (exploreMode) exitExplore(); else enterExplore(); }}
        className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
          exploreMode ? 'text-white' : 'text-white/50 hover:text-white'
        }`}
      >
        {exploreMode ? (
          <>
            <X className="w-4 h-4" />
            <span className="text-sm font-sans">Back</span>
          </>
        ) : (
          <>
            <HelpCircle className="w-4 h-4" />
            <span className="text-sm font-sans">What&apos;s this pattern?</span>
          </>
        )}
      </button>

      {/* Explore toolbar — right side, only in explore mode */}
      <ExploreToolbar
        active={exploreMode}
        settings={exploreSettings}
        onChange={setExploreSettings}
        onRestart={handleRestart}
        toolbarColor={theme.toolbar}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        isMuted={isMuted}
        currentTime={currentTime}
        onTogglePlayPause={togglePlayPause}
        onPlayNext={playNext}
        onPlayPrevious={playPrevious}
        onToggleMute={toggleMute}
      />

      {/* Floating Pill Controls — hidden in explore mode */}
      <div className={`transition-opacity duration-500 ${exploreMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
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
          toolbarColor={theme.toolbar}
        />
      </div>
    </div>
  );
}
