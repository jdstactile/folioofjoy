'use client';

import { useEffect, useRef, useCallback } from 'react';

type CellShape = 'square' | 'circle' | 'triangle';
const SHAPES: CellShape[] = ['square', 'circle', 'triangle'];

interface MatrixVisualizationProps {
  words: string[];
  wordMap: Map<string, number[]>;
  showSingleMatches: boolean;
  opacity: number;
  restartKey: number;
}

function getWordShape(word: string): CellShape {
  const hash = word.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return SHAPES[hash % SHAPES.length];
}

interface CellData {
  i: number;
  j: number;
  shape: CellShape;
}

function buildCellList(
  words: string[],
  wordMap: Map<string, number[]>,
  showSingleMatches: boolean
): CellData[] {
  const n = words.length;
  const cells: Array<{ i: number; j: number; word: string }> = [];

  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      if (words[i] === words[j]) {
        const count = wordMap.get(words[i])?.length ?? 0;
        if (showSingleMatches || count > 1) {
          cells.push({ i, j, word: words[i] });
          if (i !== j) cells.push({ i: j, j: i, word: words[i] });
        }
      }
    }
  }

  const cx = (n - 1) / 2;
  const cy = (n - 1) / 2;
  cells.sort((a, b) => {
    const da = (a.j - cx) ** 2 + (a.i - cy) ** 2;
    const db = (b.j - cx) ** 2 + (b.i - cy) ** 2;
    return da - db;
  });

  return cells.map((c) => ({
    i: c.i,
    j: c.j,
    shape: getWordShape(c.word),
  }));
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  shape: CellShape,
) {
  const cx = x + size / 2;
  const cy = y + size / 2;

  switch (shape) {
    case 'square':
      ctx.fillRect(x + 0.5, y + 0.5, size - 1, size - 1);
      break;
    case 'circle': {
      const r = size / 2 - 0.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'triangle': {
      ctx.beginPath();
      ctx.moveTo(cx, y + 1);
      ctx.lineTo(x + size - 1, y + size - 1);
      ctx.lineTo(x + 1, y + size - 1);
      ctx.closePath();
      ctx.fill();
      break;
    }
  }
}

export function MatrixVisualization({
  words,
  wordMap,
  showSingleMatches,
  opacity,
  restartKey,
}: MatrixVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const stateRef = useRef<{
    revealedCount: number;
    cells: CellData[];
    lastTickTime: number;
    looping: boolean;
  }>({ revealedCount: 0, cells: [], lastTickTime: 0, looping: false });

  const getCellGeometry = useCallback(() => {
    const n = words.length;
    if (!n) return null;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const cellSize = Math.max(4, Math.min(22, Math.floor(Math.min(w, h) / n)));
    const matrixW = n * cellSize;
    const matrixH = n * cellSize;
    const offsetX = (w - matrixW) / 2;
    const offsetY = (h - matrixH) / 2;
    return { n, cellSize, offsetX, offsetY, matrixW, matrixH, w, h };
  }, [words.length]);

  // Re-build cell list whenever inputs change, reset reveal counter
  useEffect(() => {
    const cells = buildCellList(words, wordMap, showSingleMatches);
    stateRef.current = {
      revealedCount: 0,
      cells,
      lastTickTime: 0,
      looping: false,
    };
  }, [words, wordMap, showSingleMatches, restartKey]);

  // Canvas setup + animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setupCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
      stateRef.current.revealedCount = 0;
      stateRef.current.lastTickTime = 0;
    };

    setupCanvas();
    window.addEventListener('resize', setupCanvas);

    const MS_PER_CELL = 80;

    const draw = (timestamp: number) => {
      const state = stateRef.current;
      const geo = getCellGeometry();
      if (!geo) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      const { cellSize, offsetX, offsetY, w, h, matrixW, matrixH } = geo;

      if (state.lastTickTime === 0) state.lastTickTime = timestamp;
      const elapsed = timestamp - state.lastTickTime;
      const toReveal = Math.floor(elapsed / MS_PER_CELL);

      if (toReveal > 0) {
        state.lastTickTime = timestamp;
        state.revealedCount = Math.min(
          state.revealedCount + toReveal,
          state.cells.length
        );
      }

      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = 'rgb(10, 10, 12)';
      ctx.fillRect(0, 0, w, h);

      // Subtle grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 0.5;
      const n = geo.n;
      for (let k = 0; k <= n; k++) {
        ctx.beginPath();
        ctx.moveTo(offsetX + k * cellSize, offsetY);
        ctx.lineTo(offsetX + k * cellSize, offsetY + matrixH);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY + k * cellSize);
        ctx.lineTo(offsetX + matrixW, offsetY + k * cellSize);
        ctx.stroke();
      }

      // Draw revealed cells — white with configurable opacity
      ctx.shadowBlur = 0;
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;

      for (let idx = 0; idx < state.revealedCount; idx++) {
        const cell = state.cells[idx];
        const px = offsetX + cell.j * cellSize;
        const py = offsetY + cell.i * cellSize;
        drawCell(ctx, px, py, cellSize, cell.shape);
      }

      // Loop
      if (state.revealedCount >= state.cells.length) {
        if (!state.looping) {
          state.looping = true;
          setTimeout(() => {
            stateRef.current.revealedCount = 0;
            stateRef.current.lastTickTime = 0;
            stateRef.current.looping = false;
          }, 2000);
        }
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', setupCanvas);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [getCellGeometry, opacity]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0"
    />
  );
}
