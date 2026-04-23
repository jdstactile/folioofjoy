'use client';

import { useState, useEffect } from 'react';

const GUIDE_STEPS = [
  { delay: 0, text: 'Every word in the song gets a position along both axes of this grid.' },
  { delay: 3000, text: 'The pattern starts from the center and spreads outward.' },
  { delay: 6000, text: 'When two words at different positions are the same, a shape lights up where their row and column meet.' },
  { delay: 10000, text: 'Each word gets its own shape — squares, circles, or triangles — based on the word itself.' },
  { delay: 14000, text: 'The diagonal line you see is every word matching itself. That one is free.' },
  { delay: 18000, text: 'The off-diagonal clusters are the interesting part — those are the choruses, the hooks, the repeated phrases.' },
  { delay: 23000, text: 'More repetition means denser patterns. A song that repeats a lot will fill the grid. One that doesn\'t will stay sparse.' },
  { delay: 28000, text: 'Hover over any shape to see which word it represents and how many times it appears.' },
];

interface PatternGuideProps {
  active: boolean;
  restartKey: number;
}

export function PatternGuide({ active, restartKey }: PatternGuideProps) {
  const [visibleSteps, setVisibleSteps] = useState<number[]>([]);

  useEffect(() => {
    if (!active) { setVisibleSteps([]); return; }
    setVisibleSteps([]);
    const timers: ReturnType<typeof setTimeout>[] = [];
    GUIDE_STEPS.forEach((step, i) => {
      timers.push(setTimeout(() => setVisibleSteps((prev) => [...prev, i]), step.delay));
    });
    return () => timers.forEach(clearTimeout);
  }, [active, restartKey]);

  if (!active) return null;

  const allVisible = visibleSteps.length === GUIDE_STEPS.length;

  return (
    <>
      {/* Desktop: left side, vertically centered */}
      <div className="hidden md:flex fixed left-8 top-1/2 -translate-y-1/2 z-40 max-w-xs flex-col gap-4 pointer-events-none">
        {GUIDE_STEPS.map((step, i) => (
          <div
            key={i}
            className="transition-all duration-700 ease-out"
            style={{
              opacity: visibleSteps.includes(i) ? 1 : 0,
              transform: visibleSteps.includes(i) ? 'translateX(0)' : 'translateX(20px)',
            }}
          >
            <p className="text-base font-sans text-white/60 leading-relaxed">{step.text}</p>
          </div>
        ))}
        <div
          className="transition-opacity duration-700 ease-out pt-2"
          style={{ opacity: allVisible ? 1 : 0 }}
        >
          <p className="text-sm font-sans text-white/40 italic leading-relaxed">
            Inspired by Colin Morris'{' '}
            <a
              href="https://github.com/colinmorris/SongSim"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-white/70 pointer-events-auto"
            >
              SongSim
            </a>
            {' '}project.
          </p>
        </div>
      </div>

      {/* Mobile: bottom, all visible immediately */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 max-h-[45vh] overflow-y-auto pointer-events-none">
        <div className="px-6 pb-20 pt-4 flex flex-col gap-3">
          {GUIDE_STEPS.map((step, i) => (
            <div key={i}>
              <p className="text-sm font-sans text-white/60 leading-relaxed">{step.text}</p>
            </div>
          ))}

          <div className="mt-2">
            <p className="text-sm font-sans text-white/40 italic leading-relaxed">
              Inspired by Colin Morris'{' '}
              <a
                href="https://github.com/colinmorris/SongSim"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-white/70 pointer-events-auto"
              >
                SongSim
              </a>
              {' '}project.
            </p>
          </div>

          {/* Mobile-only note */}
          <div className="mt-4">
            <p className="text-xs font-sans text-white/30 leading-relaxed italic">
              The experience is better on desktop, but am working on the mobile version.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
