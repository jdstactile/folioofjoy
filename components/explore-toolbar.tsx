'use client';

import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, RefreshCw,
} from 'lucide-react';
import type { WaveFunction, ColorMode, ShapeMode, ExploreSettings } from './matrix-visualization';
import type { Track } from '@/lib/music';

interface ExploreToolbarProps {
  active: boolean;
  settings: ExploreSettings;
  onChange: (settings: ExploreSettings) => void;
  onRestart: () => void;
  toolbarColor?: string;
  // Music controls
  currentTrack: Track | null;
  isPlaying: boolean;
  isMuted: boolean;
  currentTime: number;
  onTogglePlayPause: () => void;
  onPlayNext: () => void;
  onPlayPrevious: () => void;
  onToggleMute: () => void;
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
  currentTrack,
  isPlaying,
  isMuted,
  currentTime,
  onTogglePlayPause,
  onPlayNext,
  onPlayPrevious,
  onToggleMute,
}: ExploreToolbarProps) {
  const bg = toolbarColor || 'rgba(10, 10, 14, 0.9)';

  const set = (patch: Partial<ExploreSettings>) => {
    onChange({ ...settings, ...patch });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`fixed right-6 z-50 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-4 shadow-2xl flex flex-col gap-4 w-44 max-h-[80vh] overflow-y-auto transition-all duration-500 ease-out ${
        active ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      style={{
        backgroundColor: bg,
        top: '50%',
        transform: `translateY(-50%) translateX(${active ? '0' : '2rem'})`,
      }}
    >
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
    </div>
  );
}
