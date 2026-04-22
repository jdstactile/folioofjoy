'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface WorkItem {
  src: string;
  caption: string;
}

const WORK_ITEMS: WorkItem[] = [
  { src: '/work/carbondash-01.png', caption: 'Pitched the whole visual identity and shipped the marketing site in three weeks flat.' },
  { src: '/work/netflix-01.png', caption: 'Internal tool for content ops — made the upload queue something people stopped complaining about.' },
  { src: '/work/verizon-red.png', caption: 'Retail inventory scanner that warehouse staff actually wanted to use instead of the clipboard.' },
  { src: '/work/urbyn-banner.png', caption: 'Property analytics platform — crammed a lot of data into a map without making anyone squint.' },
  { src: '/work/dribbble-08.jpg', caption: 'Scatter plots that tell you what a neighborhood is worth before the realtor does.' },
  { src: '/work/widgets.png', caption: 'Address search that autocompletes faster than you can second-guess your zip code.' },
  { src: '/work/dribbble-04.jpg', caption: 'Schema management for game events — making backend config feel like a product, not a spreadsheet.' },
  { src: '/work/dribbble-10.jpg', caption: 'Neighborhood stats dashboard — donut charts that actually earned their keep.' },
  { src: '/work/dribbble-01.jpg', caption: 'Release changelog that tells you what broke and what got better, at a glance.' },
  { src: '/work/dribbble-06.jpg', caption: 'Feature flag cards — dark mode and light mode, because designers have opinions about both.' },
];

const PREVIEW_IMAGES = WORK_ITEMS.slice(0, 4);

export function WorkLink() {
  const [showCarousel, setShowCarousel] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [carouselMounted, setCarouselMounted] = useState(false);
  const [carouselVisible, setCarouselVisible] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; angle: number; speed: number; size: number }>>([]);
  const [captionKey, setCaptionKey] = useState(0);
  const [zoomedIdx, setZoomedIdx] = useState<number | null>(null);

  const next = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % WORK_ITEMS.length);
    setCaptionKey((k) => k + 1);
  }, []);

  const prev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + WORK_ITEMS.length) % WORK_ITEMS.length);
    setCaptionKey((k) => k + 1);
  }, []);

  // Animate carousel in/out
  const openCarousel = useCallback(() => {
    setCurrentIndex(0);
    setCarouselMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setCarouselVisible(true));
    });
  }, []);

  const closeCarousel = useCallback(() => {
    setCarouselVisible(false);
    setTimeout(() => setCarouselMounted(false), 400);
  }, []);

  useEffect(() => {
    if (!carouselMounted) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCarousel();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [carouselMounted, next, prev, closeCarousel]);

  return (
    <>
      {/* Inline link with hover preview */}
      <span className="relative inline-block">
        <button
          onMouseEnter={() => {
            setShowPreview(true);
            // Spawn particles
            const newParticles = Array.from({ length: 6 }, (_, i) => ({
              id: Date.now() + i,
              x: 0,
              y: 0,
              angle: (Math.PI * 2 * i) / 6 + (Math.random() - 0.5) * 0.5,
              speed: 20 + Math.random() * 30,
              size: 2 + Math.random() * 3,
            }));
            setParticles(newParticles);
            setTimeout(() => setParticles([]), 1600);
          }}
          onMouseLeave={() => setShowPreview(false)}
          onClick={openCarousel}
          className="underline text-white/80 hover:text-white underline-offset-2 cursor-pointer"
        >
          here
        </button>

        {/* Particles — dots that spread out and fade */}
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute pointer-events-none rounded-full bg-white"
            style={{
              width: p.size,
              height: p.size,
              left: '50%',
              top: '50%',
              opacity: 0,
              animation: 'particle-burst 1400ms ease-out forwards',
              '--px': `${Math.cos(p.angle) * p.speed}px`,
              '--py': `${Math.sin(p.angle) * p.speed}px`,
            } as React.CSSProperties}
          />
        ))}

        {/* Hover preview — stacked floating cards with staggered entrance */}
        <span
          className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1 pointer-events-none transition-all duration-400 ease-out block ${
            showPreview ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95'
          }`}
        >
          <span className="relative block w-52 h-40">
            {PREVIEW_IMAGES.map((item, i) => (
              <img
                key={item.src}
                src={item.src}
                alt=""
                className="absolute rounded-lg shadow-xl border border-white/10 object-cover w-36 h-26 transition-all duration-500 ease-out"
                style={{
                  left: showPreview ? `${i * 12}px` : '24px',
                  top: showPreview ? `${i * -6}px` : '12px',
                  zIndex: PREVIEW_IMAGES.length - i,
                  transform: showPreview
                    ? `rotate(${(i - 1.5) * 5}deg) scale(1)`
                    : `rotate(0deg) scale(0.85)`,
                  opacity: showPreview ? 1 : 0,
                  transitionDelay: showPreview ? `${i * 60}ms` : '0ms',
                }}
              />
            ))}
          </span>
        </span>
      </span>

      {/* Fullscreen carousel */}
      {carouselMounted && (
        <div
          className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-400 ease-out ${
            carouselVisible ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={closeCarousel}
        >
          {/* Backdrop — fully opaque on mobile */}
          <div className={`absolute inset-0 bg-black md:bg-black/90 backdrop-blur-sm transition-all duration-400 ${
            carouselVisible ? 'opacity-100' : 'opacity-0'
          }`} />

          {/* Close */}
          <button
            onClick={closeCarousel}
            className={`absolute top-6 left-6 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300 ${
              carouselVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
            }`}
            style={{ transitionDelay: carouselVisible ? '200ms' : '0ms' }}
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Navigation */}
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className={`absolute left-6 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300 ${
              carouselVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
            }`}
            style={{ transitionDelay: carouselVisible ? '150ms' : '0ms' }}
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className={`absolute right-6 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300 ${
              carouselVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
            }`}
            style={{ transitionDelay: carouselVisible ? '150ms' : '0ms' }}
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>

          {/* Carousel content */}
          <div
            className="relative z-10 flex flex-col items-center gap-6 max-w-5xl w-full px-4 md:px-20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 3-card stack — render each item, position by offset from current */}
            <div className="relative w-full flex items-center justify-center" style={{ height: '65vh' }}>
              {WORK_ITEMS.map((item, idx) => {
                let offset = idx - currentIndex;
                // Wrap around
                if (offset > WORK_ITEMS.length / 2) offset -= WORK_ITEMS.length;
                if (offset < -WORK_ITEMS.length / 2) offset += WORK_ITEMS.length;

                const isCenter = offset === 0;
                const isVisible = offset >= -1 && offset <= 1;

                return (
                  <div
                    key={idx}
                    className="absolute cursor-pointer overflow-hidden rounded-2xl"
                    style={{
                      transform: carouselVisible
                        ? `translateX(${offset * 70}%) scale(${isCenter ? 1 : 0.8})`
                        : `translateX(${offset * 30}%) scale(0.7)`,
                      zIndex: isCenter ? (zoomedIdx === idx ? 20 : 10) : isVisible ? 5 : 1,
                      opacity: carouselVisible ? (isCenter ? 1 : isVisible ? 0.4 : 0) : 0,
                      filter: isCenter ? 'none' : 'blur(2px)',
                      transition: 'all 700ms cubic-bezier(0.16, 1, 0.3, 1)',
                      pointerEvents: isVisible ? 'auto' : 'none',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (offset === -1) prev();
                      else if (offset === 1) next();
                      else setZoomedIdx(zoomedIdx === idx ? null : idx);
                    }}
                    onMouseEnter={() => { if (isCenter) setZoomedIdx(idx); }}
                    onMouseLeave={() => { if (zoomedIdx === idx) setZoomedIdx(null); }}
                  >
                    <img
                      src={item.src}
                      alt={item.caption}
                      className="shadow-2xl border border-white/10 object-contain max-h-[60vh] max-w-full transition-transform duration-500 ease-out"
                      style={{
                        transform: zoomedIdx === idx ? 'scale(1.5)' : 'scale(1)',
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Caption with crossfade on slide */}
            <p
              key={captionKey}
              className="text-base font-sans text-white/70 text-center max-w-lg animate-caption-fade"
            >
              {WORK_ITEMS[currentIndex].caption}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
