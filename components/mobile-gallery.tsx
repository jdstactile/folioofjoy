'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink } from 'lucide-react';

interface GalleryItem {
  src: string;
  caption: string;
  title?: string;
  url?: string;
}

interface MobileGalleryProps {
  items: GalleryItem[];
  open: boolean;
  onClose: () => void;
}

function GalleryContent({ items, onClose }: { items: GalleryItem[]; onClose: () => void }) {
  // Split into 2 columns for masonry
  const col1: (GalleryItem & { idx: number })[] = [];
  const col2: (GalleryItem & { idx: number })[] = [];
  items.forEach((item, idx) => {
    (idx % 2 === 0 ? col1 : col2).push({ ...item, idx });
  });

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000', overflowY: 'auto', overscrollBehavior: 'contain' }}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-black/80 backdrop-blur-sm">
        <span className="text-xs font-mono text-white/40 uppercase tracking-widest">
          {items.length} projects
        </span>
        <button
          onClick={onClose}
          className="text-xs font-mono text-white/50 hover:text-white uppercase tracking-widest transition-colors"
        >
          CLOSE
        </button>
      </div>

      {/* Masonry grid */}
      <div className="px-3 pb-20 flex gap-3">
        {[col1, col2].map((col, colIdx) => (
          <div key={colIdx} className="flex-1 flex flex-col gap-3">
            {col.map((item) => (
              <div key={item.idx}>
                <div className="rounded-xl overflow-hidden border border-white/10">
                  <img
                    src={item.src}
                    alt={item.caption}
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-sans text-white/30 hover:text-white/60 transition-colors px-1 pt-1 pb-1"
                  >
                    {item.title || 'Visit'} <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function MobileGallery({ items, open, onClose }: MobileGalleryProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <GalleryContent items={items} onClose={onClose} />,
    document.body
  );
}
