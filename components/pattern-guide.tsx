'use client';

import { useState, useEffect } from 'react';

const GUIDE_STEPS = [
  {
    delay: 0,
    text: 'Every word in the song gets a position along both axes of this grid.',
  },
  {
    delay: 3000,
    text: 'The pattern starts from the center and spreads outward.',
  },
  {
    delay: 6000,
    text: 'When two words at different positions are the same, a shape lights up where their row and column meet.',
  },
  {
    delay: 10000,
    text: 'Each word gets its own shape — squares, circles, or triangles — based on the word itself.',
  },
  {
    delay: 14000,
    text: 'The diagonal line you see is every word matching itself. That one is free.',
  },
  {
    delay: 18000,
    text: 'The off-diagonal clusters are the interesting part — those are the choruses, the hooks, the repeated phrases.',
  },
  {
    delay: 23000,
    text: 'More repetition means denser patterns. A song that repeats a lot will fill the grid. One that doesn\'t will stay sparse.',
  },
  {
    delay: 28000,
    text: 'Hover over any shape to see which word it represents and how many times it appears.',
  },
];

interface PatternGuideProps {
  active: boolean;
  restartKey: number;
}

export function PatternGuide({ active, restartKey }: PatternGuideProps) {
  const [visibleSteps, setVisibleSteps] = useState<number[]>([]);

  useEffect(() => {
    if (!active) {
      setVisibleSteps([]);
      return;
    }

    setVisibleSteps([]);
    const timers: ReturnType<typeof setTimeout>[] = [];

    GUIDE_STEPS.forEach((step, i) => {
      const timer = setTimeout(() => {
        setVisibleSteps((prev) => [...prev, i]);
      }, step.delay);
      timers.push(timer);
    });

    return () => timers.forEach(clearTimeout);
  }, [active, restartKey]);

  if (!active) return null;

  return (
    <div className="fixed left-8 top-1/2 -translate-y-1/2 z-40 max-w-xs flex flex-col gap-4 pointer-events-none">
      {GUIDE_STEPS.map((step, i) => (
        <div
          key={i}
          className="transition-all duration-700 ease-out"
          style={{
            opacity: visibleSteps.includes(i) ? 1 : 0,
            transform: visibleSteps.includes(i) ? 'translateX(0)' : 'translateX(20px)',
          }}
        >
          <p className="text-base font-sans text-white/60 leading-relaxed">
            {step.text}
          </p>
        </div>
      ))}
    </div>
  );
}
