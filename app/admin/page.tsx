'use client';

import { useEffect, useRef } from 'react';
import { scrambleReveal } from '@/lib/scramble';

const HEADING_TEXT = 'VISIT JOYDEEPRONI.COM';

export default function AdminPage() {
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current || !headingRef.current) return;
    hasAnimated.current = true;
    scrambleReveal(headingRef.current, HEADING_TEXT, 1.8, 0.2);
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-8">
      <h1
        ref={headingRef}
        className="font-mono uppercase text-white text-4xl md:text-6xl lg:text-7xl font-light tracking-wide text-center"
        suppressHydrationWarning
      >
        {HEADING_TEXT}
      </h1>
    </div>
  );
}
