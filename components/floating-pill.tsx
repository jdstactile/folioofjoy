'use client';

import { useState } from 'react';
import {
  ChevronUp,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Loader,
  Volume2,
  VolumeX,
  RefreshCw,
  HelpCircle,
  Accessibility,
  X,
} from 'lucide-react';
import type { Track } from '@/lib/music';

interface FloatingPillProps {
  currentTrack: Track | null;
  tracks: Track[];
  loading: boolean;
  error: string | null;
  isPlaying: boolean;
  currentTime: number;
  onPlayTrack: (track: Track) => void;
  onTogglePlayPause: () => void;
  onPlayNext: () => void;
  onPlayPrevious: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onRestart: () => void;
  dimmed: boolean;
  onToggleDimmed: () => void;
}

export function FloatingPill({
  currentTrack,
  tracks,
  loading,
  error,
  isPlaying,
  currentTime,
  onPlayTrack,
  onTogglePlayPause,
  onPlayNext,
  onPlayPrevious,
  isMuted,
  onToggleMute,
  onRestart,
  dimmed,
  onToggleDimmed,
}: FloatingPillProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      {/* Song Queue Panel */}
      <div
        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-[90vw] max-w-2xl transition-all duration-300 ease-out ${
          isOpen && !showHelp
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl p-4 shadow-2xl max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">
              Song Queue
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              {tracks.length} tracks
            </span>
          </div>

          {error && (
            <div className="text-sm text-destructive mb-3 p-2 bg-destructive/10 rounded">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-1">
              {tracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => {
                    onPlayTrack(track);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    currentTrack?.id === track.id
                      ? 'bg-primary/30 text-primary border border-primary/50'
                      : 'hover:bg-secondary/50 text-foreground'
                  }`}
                >
                  <div className="font-medium truncate">{track.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {track.artists.map((a) => a.name).join(', ')}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Help Panel */}
      <div
        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-[90vw] max-w-md transition-all duration-300 ease-out ${
          showHelp
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl p-5 shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-foreground">
              What&apos;s This Pattern?
            </span>
            <button
              onClick={() => setShowHelp(false)}
              className="p-1 hover:bg-secondary rounded-full transition-all"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              This is a <span className="text-foreground font-medium">song repetition matrix</span>. It takes the lyrics of a song and plots every word against every other word in a grid.
            </p>
            <p>
              When two words in the lyrics are the <span className="text-foreground font-medium">same</span>, a shape lights up at that spot. The more a word repeats, the more shapes appear.
            </p>
            <p>
              Different words get different shapes &mdash; <span className="text-foreground font-medium">squares</span>, <span className="text-foreground font-medium">circles</span>, and <span className="text-foreground font-medium">triangles</span> &mdash; so you can see which words repeat the most.
            </p>
            <p>
              The pattern spreads from the center outward. Songs with lots of repetition (like choruses) create beautiful symmetric patterns.
            </p>
            <p className="text-xs pt-2 border-t border-border/50">
              Inspired by <a href="https://github.com/colinmorris/SongSim" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80">SongSim</a> by Colin Morris.
            </p>
          </div>
        </div>
      </div>

      {/* Pill Bar */}
      <div className="bg-card/90 backdrop-blur-xl border border-border/50 rounded-full px-2 py-2 shadow-2xl flex items-center gap-1">
        {/* Album Art & Song Info */}
        <button
          onClick={() => { setIsOpen(!isOpen); setShowHelp(false); }}
          className={`flex items-center gap-2 px-2 py-2 rounded-full transition-all ${
            isOpen ? 'bg-primary/20 text-primary' : 'hover:bg-secondary'
          }`}
        >
          {currentTrack?.album?.images[0]?.url && (
            <img
              src={currentTrack.album.images[0].url}
              alt="Album art"
              className="w-8 h-8 rounded-lg object-cover"
            />
          )}
          <div className="flex flex-col text-left">
            <span className="text-xs font-semibold truncate max-w-[120px] leading-tight">
              {currentTrack?.name || 'No track'}
            </span>
            <span className="text-xs text-muted-foreground truncate max-w-[120px]">
              {currentTrack?.artists[0]?.name || 'Unknown'}
            </span>
          </div>
          <ChevronUp
            className={`w-3 h-3 transition-transform flex-shrink-0 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-border/50" />

        {/* Playback Controls */}
        <button
          onClick={onPlayPrevious}
          className="p-2 hover:bg-secondary rounded-full transition-all"
          title="Previous track"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        <button
          onClick={onTogglePlayPause}
          className="p-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-full transition-all"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </button>

        <button
          onClick={onPlayNext}
          className="p-2 hover:bg-secondary rounded-full transition-all"
          title="Next track"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        {/* Mute Toggle */}
        <button
          onClick={onToggleMute}
          className={`p-2 rounded-full transition-all ${
            isMuted
              ? 'text-muted-foreground hover:bg-secondary'
              : 'bg-primary/20 text-primary hover:bg-primary/30'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>

        {/* Time Display */}
        <div className="text-xs font-mono text-muted-foreground px-2">
          {formatTime(currentTime)}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-border/50" />

        {/* Restart Pattern */}
        <button
          onClick={onRestart}
          className="p-2 hover:bg-secondary rounded-full transition-all"
          title="Restart pattern"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Accessibility — dim pattern */}
        <button
          onClick={onToggleDimmed}
          className={`p-2 rounded-full transition-all ${
            dimmed
              ? 'bg-primary/20 text-primary'
              : 'hover:bg-secondary text-foreground'
          }`}
          title={dimmed ? 'Full brightness' : 'Dim pattern for readability'}
        >
          <Accessibility className="w-4 h-4" />
        </button>

        {/* What's This Pattern? */}
        <button
          onClick={() => { setShowHelp(!showHelp); setIsOpen(false); }}
          className={`p-2 rounded-full transition-all ${
            showHelp
              ? 'bg-primary/20 text-primary'
              : 'hover:bg-secondary text-foreground'
          }`}
          title="What's this pattern?"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
