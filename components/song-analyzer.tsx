'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { MatrixVisualization, type ExploreSettings } from './matrix-visualization';
import { FloatingPill } from './floating-pill';
import { HeroOverlay } from './hero-overlay';
import { PatternGuide } from './pattern-guide';
import { ExploreToolbar } from './explore-toolbar';
import { MobileMenu } from './mobile-menu';
import { ScrollReveal } from './scroll-reveal';
import { WorkLink } from './work-preview';
import { ExperimentsLink } from './experiments-preview';
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

  useEffect(() => {
    setExploreSettings((s) => ({
      ...s, shades: theme.shades, hue: theme.hue, saturation: theme.saturation,
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
      } catch (err) { console.error('Error loading tracks:', err); setError(null); }
      finally { setLoading(false); }
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
      } catch (err) { console.error('Failed to fetch lyrics:', err); setLyrics('Failed to load lyrics'); }
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
    return () => { audio.removeEventListener('timeupdate', handleTimeUpdate); audio.removeEventListener('ended', handleEnded); };
  }, [tracks, currentTrack]);

  const playTrack = async (track: Track) => {
    setCurrentTrack(track); setCurrentTime(0);
    if (audioRef.current && track.preview_url) {
      audioRef.current.src = track.preview_url;
      try { await audioRef.current.play(); setIsPlaying(true); } catch { setIsPlaying(false); }
    } else { setIsPlaying(false); }
  };

  const togglePlayPause = () => {
    if (!audioRef.current || !currentTrack?.preview_url) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.src = currentTrack.preview_url; audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false)); }
  };

  const toggleMute = () => { if (audioRef.current) { audioRef.current.muted = !isMuted; setIsMuted(!isMuted); } };

  const playNext = () => {
    const ci = tracks.findIndex((t) => t.id === currentTrack?.id) ?? -1;
    if (tracks[(ci + 1) % tracks.length]) playTrack(tracks[(ci + 1) % tracks.length]);
  };

  const playPrevious = () => {
    const ci = tracks.findIndex((t) => t.id === currentTrack?.id) ?? -1;
    if (tracks[(ci - 1 + tracks.length) % tracks.length]) playTrack(tracks[(ci - 1 + tracks.length) % tracks.length]);
  };

  const handleRestart = useCallback(() => { setRestartKey((k) => k + 1); }, []);

  const enterExplore = useCallback(() => {
    setExploreMode(true); setHoveredCell(null); setRestartKey((k) => k + 1);
  }, []);

  const exitExplore = useCallback(() => {
    setExploreMode(false); setHoveredCell(null);
    setExploreSettings((s) => ({ ...s, wave: 'center', colorMode: 'white', shapeMode: 'circles-ripple' }));
    setRestartKey((k) => k + 1);
  }, []);

  const { words, wordMap } = useMemo(() => {
    if (!lyrics) return { words: [], wordMap: new Map() };
    const normalized = lyrics.toLowerCase().split(/[\s\n]+/).map((w) => w.replace(/[^\w]/g, '')).filter((w) => w.length > 0);
    const map = new Map<string, number[]>();
    normalized.forEach((word, index) => { if (!map.has(word)) map.set(word, []); map.get(word)!.push(index); });
    return { words: normalized, wordMap: map };
  }, [lyrics]);

  const hoveredWord = useMemo(() => {
    if (!exploreMode || !hoveredCell) return null;
    const word = words[hoveredCell.i];
    if (word && (showSingleMatches || (wordMap.get(word)?.length || 0) > 1)) return word;
    return null;
  }, [exploreMode, hoveredCell, words, wordMap, showSingleMatches]);

  return (
    <div className={`relative w-full transition-colors duration-1000 ease-in-out${exploreMode ? ' h-screen overflow-hidden' : ''}`} style={{ backgroundColor: theme.background }}>
      <audio ref={audioRef} crossOrigin="anonymous" muted={isMuted} />

      {/* ===== FIRST FOLD — full screen ===== */}
      <div className="relative h-screen w-full overflow-hidden">
        {/* Matrix */}
        {words.length > 0 && (
          <MatrixVisualization
            words={words} wordMap={wordMap} showSingleMatches={showSingleMatches}
            opacity={exploreMode ? 1 : dimmed ? 0.08 : 0.35}
            restartKey={restartKey} backgroundColor={theme.backgroundRgb}
            onCellHover={exploreMode ? setHoveredCell : undefined}
            exploreSettings={exploreSettings}
          />
        )}

        {/* Hero Text Overlay */}
        <div className={`transition-opacity duration-500 ${exploreMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <HeroOverlay accentColor={theme.accent} toolbarColor={theme.toolbar} />
        </div>

        {/* Desktop: Social links — top left */}
        <div className={`hidden md:flex fixed top-7 left-8 z-50 items-center gap-5 transition-opacity duration-500 ${exploreMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <a href="https://www.instagram.com/joyingntravelling/" target="_blank" rel="noopener noreferrer" className="text-sm font-sans text-white/40 hover:text-white transition-colors">Instagram</a>
          <a href="https://www.threads.com/@joydeep.roni" target="_blank" rel="noopener noreferrer" className="text-sm font-sans text-white/40 hover:text-white transition-colors">Threads</a>
          <a href="https://www.linkedin.com/in/joydeeproni/" target="_blank" rel="noopener noreferrer" className="text-sm font-sans text-white/40 hover:text-white transition-colors">LinkedIn</a>
        </div>

        {/* Mobile: Menu button + overlay */}
        <div className={`transition-opacity duration-500 ${exploreMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <MobileMenu onExplore={enterExplore} toolbarColor={theme.toolbar} />
        </div>

        {/* Hovered word tooltip */}
        {hoveredWord && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-40 px-4 py-2">
            <span className="text-white font-mono font-semibold">{hoveredWord}</span>
            <span className="text-white/40 text-sm ml-2">{wordMap.get(hoveredWord)?.length || 0} matches</span>
          </div>
        )}

        {/* Pattern guide */}
        <PatternGuide active={exploreMode} restartKey={restartKey} />

        {/* Desktop: "What's this pattern?" — top right */}
        <button
          onClick={() => { if (exploreMode) exitExplore(); else enterExplore(); }}
          className={`hidden md:flex fixed top-6 right-6 z-50 items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${exploreMode ? 'text-white' : 'text-white/50 hover:text-white'}`}
        >
          {exploreMode ? (<><X className="w-4 h-4" /><span className="text-sm font-sans">Back</span></>) : (<><HelpCircle className="w-4 h-4" /><span className="text-sm font-sans">What&apos;s this pattern?</span></>)}
        </button>

        {/* Mobile: Back button in explore mode */}
        {exploreMode && (
          <button onClick={exitExplore} className="fixed top-6 right-6 z-50 md:hidden text-white text-xs font-mono uppercase tracking-widest">
            BACK
          </button>
        )}

        {/* Explore toolbar */}
        <ExploreToolbar
          active={exploreMode} settings={exploreSettings} onChange={setExploreSettings}
          onRestart={handleRestart} toolbarColor={theme.toolbar} accentColor={theme.accent}
          currentTrack={currentTrack} isPlaying={isPlaying} isMuted={isMuted} currentTime={currentTime}
          onTogglePlayPause={togglePlayPause} onPlayNext={playNext} onPlayPrevious={playPrevious} onToggleMute={toggleMute}
          lyrics={lyrics} wordMap={wordMap}
        />

        {/* Floating Pill */}
        <div className={`transition-opacity duration-500 ${exploreMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <FloatingPill
            currentTrack={currentTrack} tracks={tracks} loading={loading} error={error}
            isPlaying={isPlaying} currentTime={currentTime}
            onPlayTrack={playTrack} onTogglePlayPause={togglePlayPause}
            onPlayNext={playNext} onPlayPrevious={playPrevious}
            isMuted={isMuted} onToggleMute={toggleMute} onRestart={handleRestart}
            dimmed={dimmed} onToggleDimmed={() => setDimmed((d) => !d)} toolbarColor={theme.toolbar}
          />
        </div>
      </div>

      {/* ===== BELOW FOLD — mobile only, scrollable, hidden in explore ===== */}
      <div className={`md:hidden relative z-20 px-6 py-16 flex flex-col gap-10 ${exploreMode ? 'hidden' : ''}`} style={{ backgroundColor: theme.background }}>
        <ScrollReveal>
          <p className="text-base font-sans text-white/60 leading-relaxed">
            A dry, observant, tool-pilled in a practical way, and just self-aware enough to admit he&apos;s become the sort of product designer who can tell you exactly why your app feels slightly off, why your onboarding leaks users, why your AI feature is mostly a nervous mood board and might just look like a GPT wrapper.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={150}>
          <span className="text-base font-sans text-white/60 leading-relaxed block">
            This site is perpetually half-built — no case studies, no past-work gallery, mostly because things are moving faster than any of us can keep up with, and he&apos;s made peace with being the sort of designer who&apos;s always a quarter behind her own work. Some of it lives <WorkLink /> and some experiments are <ExperimentsLink />.
          </span>
        </ScrollReveal>

        {/* Footer */}
        <ScrollReveal delay={300}>
          <footer className="pt-10 pb-6 text-center" style={{ textWrap: 'balance' } as React.CSSProperties}>
            <p className="text-sm font-sans text-white/30 leading-relaxed">
              Folio of Joy is always work in progress because learning and building never stops
              <span className="inline-block mx-3 w-1 h-1 rounded-full bg-current align-middle" />
              Joydeep Sengupta &copy; 2077
              <span className="inline-block mx-3 w-1 h-1 rounded-full bg-current align-middle" />
              K&oslash;benhavn, Danmark
            </p>
          </footer>
        </ScrollReveal>
      </div>

      {/* ===== DESKTOP FOOTER — at bottom of viewport ===== */}
      <div className="hidden md:block fixed bottom-0 left-0 right-0 z-10 pointer-events-none pb-3">
        {/* intentionally empty on desktop — text is in the hero overlay */}
      </div>
    </div>
  );
}
