'use client';

import { useState, useEffect } from 'react';

interface AudioGateProps {
  onChoice: (muted: boolean) => void;
}

export function AudioGate({ onChoice }: AudioGateProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  // Fade in on mount
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const handleChoice = (muted: boolean) => {
    setExiting(true);
    setTimeout(() => onChoice(muted), 600);
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-black transition-opacity duration-600 ease-out"
      style={{ opacity: exiting ? 0 : visible ? 1 : 0 }}
    >
      <div
        className="flex flex-col items-center gap-10 max-w-md px-8 text-center transition-all duration-700 ease-out"
        style={{
          opacity: visible && !exiting ? 1 : 0,
          transform: visible && !exiting ? 'translateY(0)' : 'translateY(16px)',
          transitionDelay: visible ? '200ms' : '0ms',
        }}
      >
        {/* Description */}
        <p className="text-base font-sans text-white/50 leading-relaxed" style={{ textWrap: 'balance' } as React.CSSProperties}>
          An experiment to see what makes a song catchy and visualize repetition in music.
        </p>

        {/* Question */}
        <p className="text-base font-sans text-white/80">
          Do you want to play the music or keep it muted?
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={() => handleChoice(false)}
            className="px-8 py-3 rounded-full bg-white text-black text-sm font-sans font-medium hover:bg-white/90 transition-all duration-300"
          >
            Play It!
          </button>
          <button
            onClick={() => handleChoice(true)}
            className="px-8 py-3 rounded-full border border-white/20 text-white/60 text-sm font-sans hover:text-white hover:border-white/40 transition-all duration-300"
          >
            Keep It Muted
          </button>
        </div>
      </div>
    </div>
  );
}
