'use client';

import { useEffect, useRef, useCallback } from 'react';

export type WaveFunction = 'center' | 'sweep' | 'diagonal' | 'spiral' | 'random';
export type ColorMode = 'white' | 'shades' | 'hue-shift';
export type ShapeMode = 'mixed' | 'circles-ripple';

export interface ExploreSettings {
  wave: WaveFunction;
  colorMode: ColorMode;
  shapeMode: ShapeMode;
  shades: string[];
  hue: number;
  saturation: number;
}

type CellShape = 'square' | 'circle' | 'triangle';
const SHAPES: CellShape[] = ['square', 'circle', 'triangle'];

interface MatrixVisualizationProps {
  words: string[];
  wordMap: Map<string, number[]>;
  showSingleMatches: boolean;
  opacity: number;
  restartKey: number;
  backgroundColor?: string;
  onCellHover?: (cell: { i: number; j: number } | null) => void;
  exploreSettings?: ExploreSettings;
}

function getWordShape(word: string): CellShape {
  const hash = word.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return SHAPES[hash % SHAPES.length];
}

function wordHash(word: string): number {
  return word.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
}

interface CellData {
  i: number;
  j: number;
  shape: CellShape;
  word: string;
}

function buildCellList(
  words: string[],
  wordMap: Map<string, number[]>,
  showSingleMatches: boolean,
  wave: WaveFunction
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

  switch (wave) {
    case 'center':
      cells.sort((a, b) => {
        const da = (a.j - cx) ** 2 + (a.i - cy) ** 2;
        const db = (b.j - cx) ** 2 + (b.i - cy) ** 2;
        return da - db;
      });
      break;
    case 'sweep':
      cells.sort((a, b) => a.j - b.j || a.i - b.i);
      break;
    case 'diagonal':
      cells.sort((a, b) => (a.i + a.j) - (b.i + b.j));
      break;
    case 'spiral': {
      cells.sort((a, b) => {
        const aa = Math.atan2(a.i - cy, a.j - cx);
        const ab = Math.atan2(b.i - cy, b.j - cx);
        const da = Math.sqrt((a.j - cx) ** 2 + (a.i - cy) ** 2);
        const db = Math.sqrt((b.j - cx) ** 2 + (b.i - cy) ** 2);
        return (da + aa * 2) - (db + ab * 2);
      });
      break;
    }
    case 'random':
      for (let i = cells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cells[i], cells[j]] = [cells[j], cells[i]];
      }
      break;
  }

  return cells.map((c) => ({
    i: c.i,
    j: c.j,
    shape: getWordShape(c.word),
    word: c.word,
  }));
}

function drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size / 2 - 0.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawCell(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, shape: CellShape) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  switch (shape) {
    case 'square':
      ctx.fillRect(x + 0.5, y + 0.5, size - 1, size - 1);
      break;
    case 'circle':
      drawCircle(ctx, x, y, size);
      break;
    case 'triangle':
      ctx.beginPath();
      ctx.moveTo(cx, y + 1);
      ctx.lineTo(x + size - 1, y + size - 1);
      ctx.lineTo(x + 1, y + size - 1);
      ctx.closePath();
      ctx.fill();
      break;
  }
}

function getCellColor(
  cell: CellData,
  idx: number,
  settings: ExploreSettings | undefined,
  opacity: number,
): string {
  if (!settings || settings.colorMode === 'white') {
    return `rgba(255, 255, 255, ${opacity})`;
  }
  if (settings.colorMode === 'shades') {
    const hash = wordHash(cell.word);
    const shade = settings.shades[hash % settings.shades.length];
    // Extract hsl values and apply opacity
    return shade.replace(')', `, ${opacity})`).replace('hsl(', 'hsla(');
  }
  if (settings.colorMode === 'hue-shift') {
    const hash = wordHash(cell.word);
    const hueOffset = (hash * 37) % 360;
    const h = (settings.hue + hueOffset) % 360;
    return `hsla(${h}, ${settings.saturation + 20}%, 60%, ${opacity})`;
  }
  return `rgba(255, 255, 255, ${opacity})`;
}

export function MatrixVisualization({
  words,
  wordMap,
  showSingleMatches,
  opacity,
  restartKey,
  backgroundColor = 'rgb(10, 10, 12)',
  onCellHover,
  exploreSettings,
}: MatrixVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const stateRef = useRef<{
    revealedCount: number;
    cells: CellData[];
    lastTickTime: number;
    looping: boolean;
    ripples: Map<string, number>; // "i,j" -> reveal timestamp
  }>({ revealedCount: 0, cells: [], lastTickTime: 0, looping: false, ripples: new Map() });

  const wave = exploreSettings?.wave || 'center';
  const shapeMode = exploreSettings?.shapeMode || 'mixed';
  const isRipple = shapeMode === 'circles-ripple';

  const getCellGeometry = useCallback(() => {
    const n = words.length;
    if (!n) return null;
    const w = window.innerWidth;
    const h = window.innerHeight;
    // Fill the entire viewport — use the larger dimension to cover everything
    const cellSize = Math.max(1, Math.ceil(Math.max(w, h) / n));
    const matrixW = n * cellSize;
    const matrixH = n * cellSize;
    const offsetX = (w - matrixW) / 2;
    const offsetY = (h - matrixH) / 2;
    return { n, cellSize, offsetX, offsetY, matrixW, matrixH, w, h };
  }, [words.length]);

  useEffect(() => {
    const cells = buildCellList(words, wordMap, showSingleMatches, wave);
    stateRef.current = {
      revealedCount: 0,
      cells,
      lastTickTime: 0,
      looping: false,
      ripples: new Map(),
    };
  }, [words, wordMap, showSingleMatches, restartKey, wave]);

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

      const { cellSize, offsetX, offsetY, w, h, matrixW, matrixH, n } = geo;

      if (state.lastTickTime === 0) state.lastTickTime = timestamp;
      const elapsed = timestamp - state.lastTickTime;
      const toReveal = Math.floor(elapsed / MS_PER_CELL);

      if (toReveal > 0) {
        state.lastTickTime = timestamp;
        const prevCount = state.revealedCount;
        state.revealedCount = Math.min(
          state.revealedCount + toReveal,
          state.cells.length
        );
        // Track new reveals for ripple
        if (isRipple) {
          for (let k = prevCount; k < state.revealedCount; k++) {
            const c = state.cells[k];
            state.ripples.set(`${c.i},${c.j}`, timestamp);
          }
        }
      }

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, w, h);

      // Subtle grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 0.5;
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

      ctx.shadowBlur = 0;

      if (isRipple) {
        // Ripple mode: draw circles + neighbors with fading colors
        const rippleSet = new Set<string>();
        const neighborColors = new Map<string, { opacity: number; colorIdx: number }>();

        for (let idx = 0; idx < state.revealedCount; idx++) {
          const cell = state.cells[idx];
          const key = `${cell.i},${cell.j}`;
          rippleSet.add(key);
          const revealTime = state.ripples.get(key) || timestamp;
          const age = timestamp - revealTime;

          // Spread to neighbors with decay
          const offsets = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
          for (let oi = 0; oi < offsets.length; oi++) {
            const ni = cell.i + offsets[oi][0];
            const nj = cell.j + offsets[oi][1];
            if (ni >= 0 && ni < n && nj >= 0 && nj < n) {
              const nk = `${ni},${nj}`;
              if (!rippleSet.has(nk)) {
                const rippleOpacity = Math.max(0, 0.4 - age / 3000);
                if (rippleOpacity > 0) {
                  const existing = neighborColors.get(nk);
                  if (!existing || existing.opacity < rippleOpacity) {
                    neighborColors.set(nk, { opacity: rippleOpacity, colorIdx: wordHash(cell.word) % 6 });
                  }
                }
              }
            }
          }
        }

        // Draw neighbor ripples
        const settings = exploreSettings;
        neighborColors.forEach((val, key) => {
          const [ri, rj] = key.split(',').map(Number);
          const px = offsetX + rj * cellSize;
          const py = offsetY + ri * cellSize;
          if (settings && settings.colorMode !== 'white') {
            const shade = settings.shades[val.colorIdx % settings.shades.length];
            ctx.fillStyle = shade.replace(')', `, ${val.opacity * opacity})`).replace('hsl(', 'hsla(');
          } else {
            ctx.fillStyle = `rgba(255, 255, 255, ${val.opacity * opacity * 0.5})`;
          }
          drawCircle(ctx, px, py, cellSize);
        });

        // Draw main cells as circles
        for (let idx = 0; idx < state.revealedCount; idx++) {
          const cell = state.cells[idx];
          ctx.fillStyle = getCellColor(cell, idx, exploreSettings, opacity);
          const px = offsetX + cell.j * cellSize;
          const py = offsetY + cell.i * cellSize;
          drawCircle(ctx, px, py, cellSize);
        }
      } else {
        // Standard mode
        for (let idx = 0; idx < state.revealedCount; idx++) {
          const cell = state.cells[idx];
          ctx.fillStyle = getCellColor(cell, idx, exploreSettings, opacity);
          const px = offsetX + cell.j * cellSize;
          const py = offsetY + cell.i * cellSize;
          drawCell(ctx, px, py, cellSize, cell.shape);
        }
      }

      // Loop
      if (state.revealedCount >= state.cells.length) {
        if (!state.looping) {
          state.looping = true;
          setTimeout(() => {
            stateRef.current.revealedCount = 0;
            stateRef.current.lastTickTime = 0;
            stateRef.current.looping = false;
            stateRef.current.ripples = new Map();
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
  }, [getCellGeometry, opacity, backgroundColor, isRipple, exploreSettings]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!onCellHover) return;
      const geo = getCellGeometry();
      if (!geo) return;
      const { cellSize, offsetX, offsetY, n } = geo;
      const x = e.clientX - offsetX;
      const y = e.clientY - offsetY;
      const i = Math.floor(y / cellSize);
      const j = Math.floor(x / cellSize);
      if (i >= 0 && i < n && j >= 0 && j < n) {
        onCellHover({ i, j });
        return;
      }
      onCellHover(null);
    },
    [getCellGeometry, onCellHover]
  );

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => onCellHover?.(null)}
      className={`fixed inset-0 ${onCellHover ? 'cursor-crosshair' : ''}`}
    />
  );
}
