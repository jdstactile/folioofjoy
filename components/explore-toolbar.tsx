'use client';

import { useState, useMemo } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, RefreshCw, Settings, ChevronDown,
} from 'lucide-react';
import type { WaveFunction, ColorMode, ShapeMode, ExploreSettings } from './matrix-visualization';
import type { Track } from '@/lib/music';

interface ExploreToolbarProps {
  active: boolean;
  settings: ExploreSettings;
  onChange: (settings: ExploreSettings) => void;
  onRestart: () => void;
  toolbarColor?: string;
  accentColor?: string;
  // Music controls
  currentTrack: Track | null;
  isPlaying: boolean;
  isMuted: boolean;
  currentTime: number;
  onTogglePlayPause: () => void;
  onPlayNext: () => void;
  onPlayPrevious: () => void;
  onToggleMute: () => void;
  // Lyrics
  lyrics: string;
  wordMap: Map<string, number[]>;
}

const WAVE_OPTIONS: { value: WaveFunction; label: string }[] = [
  { value: 'center', label: 'Center Out' },
  { value: 'sweep', label: 'Left Sweep' },
  { value: 'diagonal', label: 'Diagonal' },
  { value: 'spiral', label: 'Spiral' },
  { value: 'random', label: 'Random' },
];

const COLOR_OPTIONS: { value: ColorMode; label: string }[] = [
  { value: 'white', label: 'White' },
  { value: 'shades', label: 'Album Shades' },
  { value: 'hue-shift', label: 'Hue Shift' },
];

const SHAPE_OPTIONS: { value: ShapeMode; label: string }[] = [
  { value: 'mixed', label: 'Mixed Shapes' },
  { value: 'circles-ripple', label: 'Ripple' },
];

function OptionGroup({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">{label}</span>
      <div className="flex flex-col gap-0.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-sans text-left transition-all ${
              value === opt.value
                ? 'bg-white/15 text-white'
                : 'text-white/40 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ExploreToolbar({
  active,
  settings,
  onChange,
  onRestart,
  toolbarColor,
  accentColor,
  currentTrack,
  isPlaying,
  isMuted,
  currentTime,
  onTogglePlayPause,
  onPlayNext,
  onPlayPrevious,
  onToggleMute,
  lyrics,
  wordMap,
}: ExploreToolbarProps) {
  const bg = toolbarColor || 'rgba(10, 10, 14, 0.9)';
  const accent = accentColor || '#ffffff';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lyricsOpen, setLyricsOpen] = useState(false);

  const lyricsTokens = useMemo(() => {
    if (!lyrics) return [] as { text: string; count: number; isWord: boolean }[];
    return lyrics.split(/(\s+)/).map((tok) => {
      if (/^\s+$/.test(tok) || tok === '') return { text: tok, count: 0, isWord: false };
      const norm = tok.toLowerCase().replace(/[^\w]/g, '');
      const count = norm ? wordMap.get(norm)?.length || 0 : 0;
      return { text: tok, count, isWord: true };
    });
  }, [lyrics, wordMap]);

  const set = (patch: Partial<ExploreSettings>) => {
    onChange({ ...settings, ...patch });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toolbarContent = (
    <>
      {/* Now playing */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Now Playing</span>
        <div className="flex items-center gap-2">
          {currentTrack?.album?.images[0]?.url && (
            <img src={currentTrack.album.images[0].url} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
          )}
          <div className="min-w-0">
            <div className="text-xs text-white font-medium truncate">{currentTrack?.name || 'No track'}</div>
            <div className="text-[10px] text-white/40 truncate">{currentTrack?.artists[0]?.name || ''}</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onPlayPrevious} className="p-1.5 hover:bg-white/10 rounded-full transition-all" title="Previous">
            <SkipBack className="w-3.5 h-3.5 text-white/70" />
          </button>
          <button onClick={onTogglePlayPause} className="p-1.5 bg-white/15 hover:bg-white/20 text-white rounded-full transition-all" title={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button onClick={onPlayNext} className="p-1.5 hover:bg-white/10 rounded-full transition-all" title="Next">
            <SkipForward className="w-3.5 h-3.5 text-white/70" />
          </button>
          <button onClick={onToggleMute} className={`p-1.5 rounded-full transition-all ${isMuted ? 'text-white/40 hover:bg-white/10' : 'bg-white/15 text-white'}`} title={isMuted ? 'Unmute' : 'Mute'}>
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <span className="text-[10px] font-mono text-white/30 ml-auto">{formatTime(currentTime)}</span>
        </div>
      </div>

      <div className="h-px bg-white/10" />

      {/* Restart */}
      <button
        onClick={onRestart}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-sans text-white/50 hover:text-white hover:bg-white/5 transition-all"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Restart Pattern
      </button>

      <div className="h-px bg-white/10" />

      {/* Wave */}
      <OptionGroup
        label="Wave"
        options={WAVE_OPTIONS}
        value={settings.wave}
        onSelect={(v) => { set({ wave: v as WaveFunction }); onRestart(); }}
      />

      <div className="h-px bg-white/10" />

      {/* Color */}
      <OptionGroup
        label="Color"
        options={COLOR_OPTIONS}
        value={settings.colorMode}
        onSelect={(v) => set({ colorMode: v as ColorMode })}
      />

      <div className="h-px bg-white/10" />

      {/* Mode */}
      <OptionGroup
        label="Mode"
        options={SHAPE_OPTIONS}
        value={settings.shapeMode}
        onSelect={(v) => { set({ shapeMode: v as ShapeMode }); onRestart(); }}
      />

      <div className="h-px bg-white/10" />

      {/* Lyrics — collapsible */}
      <div className="flex flex-col gap-1.5">
        <button
          onClick={() => setLyricsOpen((o) => !o)}
          className="flex items-center justify-between text-[10px] font-mono text-white/30 hover:text-white/60 uppercase tracking-wider transition-colors"
        >
          <span>Lyrics</span>
          <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${lyricsOpen ? 'rotate-180' : ''}`} />
        </button>
        <div
          className={`overflow-hidden transition-[max-height] duration-400 ease-out ${lyricsOpen ? 'max-h-[40vh]' : 'max-h-0'}`}
        >
          <div className="overflow-y-auto max-h-[40vh] pr-1 text-[11px] leading-relaxed font-sans whitespace-pre-wrap break-words">
            {lyricsTokens.length === 0 ? (
              <span className="text-white/30 italic">No lyrics.</span>
            ) : (
              lyricsTokens.map((t, i) => {
                if (!t.isWord) return <span key={i}>{t.text}</span>;
                const recurring = t.count > 1;
                return (
                  <span
                    key={i}
                    title={recurring ? `${t.count}×` : ''}
                    className="transition-colors"
                    style={{
                      color: recurring ? accent : 'rgba(255,255,255,0.25)',
                      fontWeight: recurring ? 500 : 400,
                    }}
                  >
                    {t.text}
                  </span>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop toolbar — right side */}
      <div
        className={`hidden md:flex fixed right-6 z-50 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-4 shadow-2xl flex-col gap-4 w-56 max-h-[85vh] overflow-y-auto transition-all duration-500 ease-out ${
          active ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          backgroundColor: bg,
          top: '50%',
          transform: `translateY(-50%) translateX(${active ? '0' : '2rem'})`,
        }}
      >
        {toolbarContent}
      </div>

      {/* Mobile: collapsible button + panel */}
      {active && (
        <div className="md:hidden fixed bottom-16 right-4 z-50">
          {/* Expanded panel */}
          <div
            className={`absolute bottom-full right-0 mb-2 w-60 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-4 shadow-2xl flex flex-col gap-4 max-h-[70vh] overflow-y-auto transition-all duration-500 ease-out ${
              mobileOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
            }`}
            style={{ backgroundColor: bg }}
          >
            {toolbarContent}
          </div>

          {/* Toggle button */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="p-3 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl transition-all duration-300"
            style={{ backgroundColor: bg }}
          >
            <Settings className={`w-5 h-5 text-white/70 transition-transform duration-500 ${mobileOpen ? 'rotate-90' : ''}`} />
          </button>
        </div>
      )}
    </>
  );
}
