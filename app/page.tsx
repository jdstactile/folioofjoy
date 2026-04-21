'use client';

import { SongAnalyzer } from '@/components/song-analyzer';

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SongAnalyzer />
    </main>
  );
}
