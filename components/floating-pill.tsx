'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Loader,
  Volume2,
  VolumeX,
  RefreshCw,
  Accessibility,
  Music,
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
  toolbarColor?: string;
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
  toolbarColor,
}: FloatingPillProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showUnmuteTip, setShowUnmuteTip] = useState(true);
  const [nowPlayingToast, setNowPlayingToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevTrackId = useRef<string | null>(null);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Show "Now Playing" toast when track changes
  useEffect(() => {
    if (!currentTrack) return;
    if (prevTrackId.current && prevTrackId.current !== currentTrack.id) {
      setNowPlayingToast(currentTrack.name);
      setExpanded(true);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => {
        setNowPlayingToast(null);
        setExpanded(false);
      }, 3000);
    }
    prevTrackId.current = currentTrack.id;
  }, [currentTrack]);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      if (!isOpen) setExpanded(false);
    }, 15000);
  }, [isOpen]);

  useEffect(() => {
    if (expanded) {
      resetInactivityTimer();
    }
    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [expanded, resetInactivityTimer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toolbarBg = toolbarColor || 'rgba(15, 15, 18, 0.9)';

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-6 z-50">
      {/* Now Playing toast */}
      <div
        className={`absolute bottom-full left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-0 mb-2 whitespace-nowrap px-4 py-2 rounded-full backdrop-blur-xl border border-white/10 transition-all duration-500 ease-out ${
          nowPlayingToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
        style={{ backgroundColor: toolbarBg }}
      >
        <span className="text-xs font-mono text-white/40 uppercase tracking-wider mr-2">Now Playing</span>
        <span className="text-xs font-sans text-white">{nowPlayingToast}</span>
      </div>

      {/* Song Queue Panel */}
      <div
        className={`absolute bottom-full right-0 mb-3 w-72 transition-all duration-300 ease-out ${
          isOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <div
          className="backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl max-h-[60vh] overflow-y-auto transition-colors duration-1000 ease-in-out"
          style={{ backgroundColor: toolbarBg }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-white/50">Song Queue</span>
            <span className="text-xs text-white/40 font-mono">{tracks.length} tracks</span>
          </div>

          {error && (
            <div className="text-sm text-red-400 mb-3 p-2 bg-red-500/10 rounded">{error}</div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-5 h-5 animate-spin text-white/50" />
            </div>
          ) : (
            <div className="space-y-1">
              {tracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => { onPlayTrack(track); setIsOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    currentTrack?.id === track.id
                      ? 'bg-white/15 text-white border border-white/20'
                      : 'hover:bg-white/5 text-white/70'
                  }`}
                >
                  <div className="font-medium truncate">{track.name}</div>
                  <div className="text-xs text-white/40 truncate">
                    {track.artists.map((a) => a.name).join(', ')}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Toolbar Pill — collapsible, expands on hover */}
      <div
        className="group relative"
        onMouseEnter={() => { setExpanded(true); resetInactivityTimer(); }}
        onMouseLeave={() => { if (!isOpen) setExpanded(false); }}
        onMouseMove={() => { if (expanded) resetInactivityTimer(); }}
      >
        <div
          className="backdrop-blur-xl border border-white/10 rounded-full shadow-2xl flex items-center overflow-hidden"
          style={{ backgroundColor: toolbarBg, transition: 'all 700ms cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
          {/* Collapsed: just album art + music icon */}
          <div className={`flex items-center px-2 py-2 ${expanded ? 'gap-1' : 'gap-0'}`} style={{ transition: 'all 700ms cubic-bezier(0.16, 1, 0.3, 1)' }}>
            {/* Album art / queue toggle — always visible */}
            <button
              onClick={() => { setIsOpen(!isOpen); }}
              className={`flex items-center gap-2 p-1.5 rounded-full transition-all flex-shrink-0 ${
                isOpen ? 'bg-white/15 hover:bg-white/20 text-white' : 'hover:bg-white/10'
              }`}
              title={currentTrack ? `${currentTrack.name} — ${currentTrack.artists[0]?.name}` : 'Song queue'}
            >
              {currentTrack?.album?.images[0]?.url ? (
                <img
                  src={currentTrack.album.images[0].url}
                  alt="Album art"
                  className="w-8 h-8 rounded-lg object-cover"
                />
              ) : (
                <Music className="w-5 h-5 text-white/60" />
              )}
            </button>

            {/* Expanded controls — only when hovered */}
            <div className={`flex items-center gap-1 ${expanded ? 'max-w-[500px] opacity-100' : 'max-w-0 opacity-0'} overflow-hidden`} style={{ transition: 'all 700ms cubic-bezier(0.16, 1, 0.3, 1)' }}>
              {/* Track info */}
              <div className="flex flex-col text-left px-1 min-w-0">
                <span className="text-xs font-medium text-white truncate max-w-[100px] leading-tight">
                  {currentTrack?.name || 'No track'}
                </span>
                <span className="text-[10px] text-white/40 truncate max-w-[100px]">
                  {currentTrack?.artists[0]?.name || ''}
                </span>
              </div>

              <div className="w-px h-6 bg-white/10 flex-shrink-0" />

              {/* Playback */}
              <button onClick={onPlayPrevious} className="p-1.5 hover:bg-white/10 rounded-full transition-all flex-shrink-0" title="Previous">
                <SkipBack className="w-3.5 h-3.5 text-white/70" />
              </button>
              <button onClick={onTogglePlayPause} className="p-1.5 bg-white/15 hover:bg-white/20 text-white rounded-full transition-all flex-shrink-0" title={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button onClick={onPlayNext} className="p-1.5 hover:bg-white/10 rounded-full transition-all flex-shrink-0" title="Next">
                <SkipForward className="w-3.5 h-3.5 text-white/70" />
              </button>

              {/* Mute */}
              <span className="relative flex-shrink-0">
                <button onClick={() => { onToggleMute(); setShowUnmuteTip(false); }} className={`p-1.5 rounded-full transition-all ${isMuted ? 'text-white/40 hover:bg-white/10' : 'bg-white/15 hover:bg-white/20 text-white'}`} title={isMuted ? 'Unmute' : 'Mute'}>
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                {showUnmuteTip && isMuted && expanded && (
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap px-3 py-1.5 rounded-lg bg-white text-black text-xs font-sans shadow-lg animate-bounce-subtle">
                    Unmute to hear the song with pattern
                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white" />
                  </span>
                )}
              </span>

              {/* Time */}
              <div className="text-[10px] font-mono text-white/40 px-1 flex-shrink-0">
                {formatTime(currentTime)}
              </div>

              <div className="w-px h-6 bg-white/10 flex-shrink-0" />

              {/* Restart */}
              <button onClick={onRestart} className="p-1.5 hover:bg-white/10 rounded-full transition-all flex-shrink-0" title="Restart pattern">
                <RefreshCw className="w-3.5 h-3.5 text-white/70" />
              </button>

              {/* Accessibility */}
              <button onClick={onToggleDimmed} className={`p-1.5 rounded-full transition-all flex-shrink-0 ${dimmed ? 'bg-white/15 hover:bg-white/20 text-white' : 'hover:bg-white/10 text-white/70'}`} title={dimmed ? 'Full brightness' : 'Dim pattern'}>
                <Accessibility className="w-3.5 h-3.5" />
              </button>


            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
