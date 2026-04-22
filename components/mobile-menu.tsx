'use client';

import { useState } from 'react';
interface MobileMenuProps {
  onExplore: () => void;
  toolbarColor?: string;
}

export function MobileMenu({ onExplore, toolbarColor }: MobileMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Menu button — top left, mobile only */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-6 left-6 z-50 md:hidden text-white/50 hover:text-white text-xs font-mono uppercase tracking-widest transition-colors"
      >
        MENU
      </button>

      {/* Fullscreen overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[150] md:hidden flex flex-col items-center justify-center gap-8"
          style={{ backgroundColor: toolbarColor || 'rgba(10, 10, 14, 0.98)' }}
        >
          <button
            onClick={() => setOpen(false)}
            className="absolute top-6 right-6 text-white/50 hover:text-white text-xs font-mono uppercase tracking-widest transition-colors"
          >
            CLOSE
          </button>

          <nav className="flex flex-col items-center gap-6">
            <a
              href="https://www.instagram.com/joyingntravelling/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-2xl font-sans text-white/70 hover:text-white transition-colors"
            >
              Instagram
            </a>
            <a
              href="https://www.threads.com/@joydeep.roni"
              target="_blank"
              rel="noopener noreferrer"
              className="text-2xl font-sans text-white/70 hover:text-white transition-colors"
            >
              Threads
            </a>
            <a
              href="https://www.linkedin.com/in/joydeeproni/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-2xl font-sans text-white/70 hover:text-white transition-colors"
            >
              LinkedIn
            </a>

            <div className="w-12 h-px bg-white/10 my-2" />

            <button
              onClick={() => { setOpen(false); onExplore(); }}
              className="text-2xl font-sans text-white/70 hover:text-white transition-colors"
            >
              What&apos;s this pattern?
            </button>
          </nav>
        </div>
      )}
    </>
  );
}
