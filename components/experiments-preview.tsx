'use client';

import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { MobileGallery } from './mobile-gallery';

interface Experiment {
  src: string;
  title: string;
  url: string;
  caption: string;
}

const EXPERIMENTS: Experiment[] = [
  { src: '/experiments/deinfluence.png', title: 'De-Influence Machine', url: 'https://deinfluence.me', caption: 'An impulse purchase prevention system — type in what you want to buy and let it talk you out of it.' },
  { src: '/experiments/notesforlazy.png', title: 'Notes for Lazy', url: 'https://notesforlazy.vercel.app/', caption: 'A minimalist markdown note app for people who want to write, not configure.' },
  { src: '/experiments/sneakers.png', title: 'White Sneaker Directory', url: 'https://white-sneaker-directory.vercel.app', caption: 'A curated catalogue of white sneakers because life is too short to scroll through everything else.' },
  { src: '/experiments/reading.png', title: 'What Am I Reading', url: 'https://whatamireading.vercel.app', caption: 'A reading tracker that shows your year in books — pages, titles, and a share card for the flex.' },
];

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return mobile;
}

export function ExperimentsLink() {
  const isMobile = useIsMobile();
  const [showPreview, setShowPreview] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; angle: number; speed: number; size: number }>>([]);

  // Mobile gallery
  const [mobileOpen, setMobileOpen] = useState(false);

  // Desktop carousel
  const [currentIndex, setCurrentIndex] = useState(0);
  const [carouselMounted, setCarouselMounted] = useState(false);
  const [carouselVisible, setCarouselVisible] = useState(false);
  const [captionKey, setCaptionKey] = useState(0);

  const next = useCallback(() => { setCurrentIndex((i) => (i + 1) % EXPERIMENTS.length); setCaptionKey((k) => k + 1); }, []);
  const prev = useCallback(() => { setCurrentIndex((i) => (i - 1 + EXPERIMENTS.length) % EXPERIMENTS.length); setCaptionKey((k) => k + 1); }, []);

  const openCarousel = useCallback(() => {
    setCurrentIndex(0); setCarouselMounted(true);
    requestAnimationFrame(() => { requestAnimationFrame(() => setCarouselVisible(true)); });
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

  const handleClick = () => {
    if (isMobile) setMobileOpen(true);
    else openCarousel();
  };

  const galleryItems = EXPERIMENTS.map((e) => ({ src: e.src, caption: e.caption, title: e.title, url: e.url }));

  return (
    <>
      <span className="relative inline-block">
        <button
          onMouseEnter={() => {
            setShowPreview(true);
            const newParticles = Array.from({ length: 6 }, (_, i) => ({
              id: Date.now() + i, angle: (Math.PI * 2 * i) / 6 + (Math.random() - 0.5) * 0.5,
              speed: 20 + Math.random() * 30, size: 2 + Math.random() * 3,
            }));
            setParticles(newParticles);
            setTimeout(() => setParticles([]), 1600);
          }}
          onMouseLeave={() => setShowPreview(false)}
          onClick={handleClick}
          className="underline text-white/80 hover:text-white underline-offset-2 cursor-pointer"
        >
          here
        </button>

        {particles.map((p) => (
          <span key={p.id} className="absolute pointer-events-none rounded-full bg-white"
            style={{ width: p.size, height: p.size, left: '50%', top: '50%', opacity: 0,
              animation: 'particle-burst 1400ms ease-out forwards',
              '--px': `${Math.cos(p.angle) * p.speed}px`, '--py': `${Math.sin(p.angle) * p.speed}px`,
            } as React.CSSProperties} />
        ))}

        <span className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1 pointer-events-none transition-all duration-400 ease-out block ${showPreview ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95'}`}>
          <span className="relative block w-44 h-32">
            {EXPERIMENTS.slice(0, 3).map((item, i) => (
              <img key={item.src} src={item.src} alt=""
                className="absolute rounded-lg shadow-xl border border-white/10 object-cover w-32 h-22 transition-all duration-500 ease-out"
                style={{
                  left: showPreview ? `${i * 10}px` : '20px', top: showPreview ? `${i * -5}px` : '10px',
                  zIndex: 3 - i, transform: showPreview ? `rotate(${(i - 1) * 5}deg) scale(1)` : 'rotate(0deg) scale(0.85)',
                  opacity: showPreview ? 1 : 0, transitionDelay: showPreview ? `${i * 60}ms` : '0ms',
                }} />
            ))}
          </span>
        </span>
      </span>

      {/* Mobile: masonry gallery */}
      <MobileGallery items={galleryItems} open={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Desktop: carousel */}
      {carouselMounted && typeof document !== 'undefined' && createPortal((
        <div className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-400 ease-out ${carouselVisible ? 'opacity-100' : 'opacity-0'}`} onClick={closeCarousel}>
          <div className={`absolute inset-0 bg-black backdrop-blur-xl transition-all duration-400 ${carouselVisible ? 'opacity-100' : 'opacity-0'}`} />

          <button onClick={closeCarousel} className={`absolute top-6 left-6 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300 ${carouselVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`} style={{ transitionDelay: carouselVisible ? '200ms' : '0ms' }}>
            <X className="w-5 h-5 text-white" />
          </button>

          <button onClick={(e) => { e.stopPropagation(); prev(); }} className={`absolute left-6 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300 ${carouselVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`} style={{ transitionDelay: carouselVisible ? '150ms' : '0ms' }}>
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); next(); }} className={`absolute right-6 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300 ${carouselVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`} style={{ transitionDelay: carouselVisible ? '150ms' : '0ms' }}>
            <ChevronRight className="w-5 h-5 text-white" />
          </button>

          <div className="relative z-10 flex flex-col items-center gap-6 max-w-5xl w-full px-20" onClick={(e) => e.stopPropagation()}>
            <div className="relative w-full flex items-center justify-center" style={{ height: '60vh' }}>
              {EXPERIMENTS.map((item, idx) => {
                let offset = idx - currentIndex;
                if (offset > EXPERIMENTS.length / 2) offset -= EXPERIMENTS.length;
                if (offset < -EXPERIMENTS.length / 2) offset += EXPERIMENTS.length;
                const isCenter = offset === 0;
                const isVisible = offset >= -1 && offset <= 1;

                return (
                  <div key={idx} className="absolute cursor-pointer"
                    style={{
                      transform: carouselVisible ? `translateX(${offset * 70}%) scale(${isCenter ? 1 : 0.8})` : `translateX(${offset * 30}%) scale(0.7)`,
                      zIndex: isCenter ? 10 : isVisible ? 5 : 1,
                      opacity: carouselVisible ? (isCenter ? 1 : isVisible ? 0.4 : 0) : 0,
                      filter: isCenter ? 'none' : 'blur(2px)',
                      transition: 'all 700ms cubic-bezier(0.16, 1, 0.3, 1)',
                      pointerEvents: isVisible ? 'auto' : 'none',
                    }}
                    onClick={(e) => { e.stopPropagation(); if (offset === -1) prev(); if (offset === 1) next(); }}
                  >
                    <img src={item.src} alt={item.title} className="rounded-2xl shadow-2xl border border-white/10 object-contain max-h-[55vh] max-w-full" />
                  </div>
                );
              })}
            </div>

            <div key={captionKey} className="flex flex-col items-center gap-2 animate-caption-fade">
              <p className="text-base font-sans text-white/70 text-center max-w-lg">{EXPERIMENTS[currentIndex].caption}</p>
              <a href={EXPERIMENTS[currentIndex].url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm font-sans text-white/50 hover:text-white transition-colors"
                onClick={(e) => e.stopPropagation()}>
                Visit {EXPERIMENTS[currentIndex].title} <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      ), document.body)}
    </>
  );
}
