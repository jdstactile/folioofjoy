export interface ThemeColors {
  background: string;
  accent: string;
  toolbar: string;
  backgroundRgb: string;
  hue: number;
  saturation: number;
  shades: string[];        // 6 shades from album art hue at different lightness
}

function generateShades(hue: number, sat: number): string[] {
  return [25, 35, 45, 55, 65, 75].map(
    (l) => `hsl(${hue}, ${sat}%, ${l}%)`
  );
}

const DEFAULT_THEME: ThemeColors = {
  background: 'hsl(210, 30%, 10%)',
  accent: 'hsl(170, 70%, 50%)',
  toolbar: 'hsl(210, 30%, 5%)',
  backgroundRgb: 'rgb(18, 23, 29)',
  hue: 210,
  saturation: 30,
  shades: generateShades(210, 30),
};

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToRgb(h: number, s: number, l: number): string {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}

export function extractDominantColor(imageUrl: string): Promise<ThemeColors> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 50; // sample at 50x50
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(DEFAULT_THEME); return; }

        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;

        // Collect hue buckets (ignore very dark/light pixels)
        const hueBuckets = new Array(36).fill(0); // 10-degree buckets
        let totalSat = 0;
        let satCount = 0;

        for (let i = 0; i < data.length; i += 4) {
          const [h, s, l] = rgbToHsl(data[i], data[i+1], data[i+2]);
          if (l > 10 && l < 90 && s > 15) {
            hueBuckets[Math.floor(h / 10)] += s; // weight by saturation
            totalSat += s;
            satCount++;
          }
        }

        // Find dominant hue bucket
        let maxBucket = 0;
        let maxVal = 0;
        for (let i = 0; i < 36; i++) {
          if (hueBuckets[i] > maxVal) {
            maxVal = hueBuckets[i];
            maxBucket = i;
          }
        }

        const dominantHue = maxBucket * 10 + 5;
        const avgSat = satCount > 0 ? Math.round(totalSat / satCount) : 30;
        const sat = Math.max(20, Math.min(70, avgSat));
        const analogousHue = (dominantHue + 30) % 360;

        resolve({
          background: `hsl(${dominantHue}, ${sat}%, 10%)`,
          accent: `hsl(${analogousHue}, 70%, 50%)`,
          toolbar: `hsl(${dominantHue}, ${sat}%, 5%)`,
          backgroundRgb: hslToRgb(dominantHue, sat, 10),
          hue: dominantHue,
          saturation: sat,
          shades: generateShades(dominantHue, sat),
        });
      } catch {
        resolve(DEFAULT_THEME);
      }
    };
    img.onerror = () => resolve(DEFAULT_THEME);
    img.src = imageUrl;
  });
}

export { DEFAULT_THEME };
