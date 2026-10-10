import { sepia, rng, house } from './paint';
import street from './photos/street.jpg';
import chapel from './photos/chapel.jpg';
import school from './photos/school.jpg';
import dam from './photos/dam.jpg';
import estate from './photos/estate.jpg';
import lake from './photos/lake.jpg';
import millrow from './photos/millrow.jpg';
import map from './photos/map.jpg';
import seaside from './photos/seaside.jpg';
import flat from './photos/flat.jpg';
import hills from './photos/hills.jpg';
import fete from './photos/fete.jpg';
import bridge from './photos/bridge.jpg';
import weir from './photos/weir.jpg';
import farm from './photos/farm.jpg';
import chapin from './photos/chapin.jpg';

// Photographs generated for the game. Only the unmatched scan (noise) is still drawn in code.
export const PHOTO_URLS: Record<string, string> = { street, chapel, school, dam, estate, lake, millrow, map, seaside, flat, hills, fete, bridge, weir, farm, chapin };
const PHOTOS: Record<string, HTMLImageElement> = {};

/** Load every photograph before the game starts so painting stays synchronous. */
export function preloadPhotos(): Promise<void> {
  return Promise.all(Object.entries(PHOTO_URLS).map(([k, url]) => new Promise<void>((res) => {
    const i = new Image();
    i.onload = () => { PHOTOS[k] = i; res(); };
    i.onerror = () => res();
    i.src = url;
  }))).then(() => undefined);
}
export const photoURL = (key: string): string | undefined => (PHOTOS[key] ? PHOTO_URLS[key] : undefined);
export const photoImage = (key: string): HTMLImageElement | undefined => PHOTOS[key];

/** Archive items that get the dated, scanned-print treatment. */
const SCANNED = ['street', 'chapel', 'school', 'dam', 'estate', 'lake', 'millrow', 'millrow_far', 'map', 'fete', 'bridge', 'weir', 'farm', 'chapin'];
const cache = new Map<string, string>();

/** Paint a photo into a canvas. `corrupt` (0..1) adds JPEG-style damage. */
export function paint(canvas: HTMLCanvasElement, art: string, w: number, h: number, corrupt = 0) {
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext('2d', { willReadFrequently: true });
  if (!g) return;
  const far = art === 'millrow_far';
  const img = PHOTOS[far ? 'millrow' : art];
  const scanned = SCANNED.includes(art) && !!img;
  // Prints are scanned with a paper margin; the map is a whole sheet.
  const m = scanned && art !== 'map' ? Math.round(w * 0.035) : 0;
  if (scanned) { g.fillStyle = '#e9e1cd'; g.fillRect(0, 0, w, h); }
  if (img) {
    if (far) {
      // The low-resolution scan seen before it is tidied: the people at the windows cannot be made out.
      const t = document.createElement('canvas');
      t.width = 40; t.height = 30;
      t.getContext('2d')!.drawImage(img, 0, 0, 40, 30);
      g.imageSmoothingEnabled = true;
      g.filter = 'blur(1.5px)';
      g.drawImage(t, m, m, w - 2 * m, h - 2 * m);
      g.filter = 'none';
    } else g.drawImage(img, m, m, w - 2 * m, h - 2 * m);
    if (scanned) scanLook(g, w, h, art, m);
  } else noise(g, w, h);
  if (corrupt > 0) damage(g, w, h, corrupt);
}

/** Dated, scanned look: faded warm tone, grain, scanner banding, dust, hairline scratches and edge wear. */
function scanLook(g: CanvasRenderingContext2D, w: number, h: number, art: string, m: number) {
  const r = rng(art.length * 977 + w);
  sepia(g, w, h, art === 'map' ? 0.18 : 0.42, 14, art.length * 31);
  // Faded, slightly lifted blacks, as on an old print.
  g.fillStyle = 'rgba(214,196,150,0.12)'; g.fillRect(0, 0, w, h);
  // Faint horizontal scanner banding.
  for (let y = 0; y < h; y += 3) { g.fillStyle = `rgba(0,0,0,${0.012 + (r() * 0.012)})`; g.fillRect(0, y, w, 1); }
  // Dust specks, light and dark.
  const specks = Math.round((w * h) / 2600);
  for (let i = 0; i < specks; i++) {
    const x = r() * w, y = r() * h, s = 0.5 + r() * 1.6;
    g.fillStyle = r() < 0.6 ? 'rgba(255,252,240,0.55)' : 'rgba(40,30,20,0.4)';
    g.beginPath(); g.arc(x, y, s, 0, Math.PI * 2); g.fill();
  }
  // A few hairline scratches and fibres.
  g.lineWidth = 0.7;
  for (let i = 0; i < 5; i++) {
    const x = r() * w, y = r() * h * 0.7, len = 10 + r() * h * 0.25;
    g.strokeStyle = r() < 0.5 ? 'rgba(255,250,235,0.45)' : 'rgba(60,45,30,0.3)';
    g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 3, y + len / 3, x - 3, y + (2 * len) / 3, x + 1, y + len); g.stroke();
  }
  if (art === 'map') {
    // Folded sheet: a vertical and a horizontal crease.
    for (const [x1, y1, x2, y2] of [[w * 0.5, 0, w * 0.5, h], [0, h * 0.5, w, h * 0.5]]) {
      g.strokeStyle = 'rgba(60,45,30,0.22)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
      g.strokeStyle = 'rgba(255,250,235,0.35)'; g.beginPath(); g.moveTo(x1 + 1, y1 + 1); g.lineTo(x2 + 1, y2 + 1); g.stroke();
    }
  } else if (m > 0) {
    // Edge of the print: a thin shadow where the photograph meets its paper margin.
    g.strokeStyle = 'rgba(40,30,20,0.35)'; g.lineWidth = 1; g.strokeRect(m - 0.5, m - 0.5, w - 2 * m + 1, h - 2 * m + 1);
  }
  // Scanner light falloff and yellowed corners.
  const v = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.45, w / 2, h / 2, Math.max(w, h) * 0.78);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(90,60,20,0.28)');
  g.fillStyle = v; g.fillRect(0, 0, w, h);
}

/** The unmatched scan: banded noise with a faint ghost of rooftops underneath. */
function noise(g: CanvasRenderingContext2D, w: number, h: number) {
  const img = g.createImageData(w, h);
  const r = rng(412);
  for (let y = 0; y < h; y++) {
    const band = r() * 60;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const v = (r() * 120 + band) | 0;
      img.data[i] = v; img.data[i + 1] = v * 0.95; img.data[i + 2] = v * 0.9; img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  g.globalAlpha = 0.12;
  for (let i = 0; i < 6; i++) house(g, 18 + i * ((w - 36) / 6), h * 0.6 - 52, (w - 36) / 6 - 3, 52, '#888', '#333', 2);
  g.globalAlpha = 1;
}

/** JPEG-like block corruption: shifted rows and smeared macroblocks. */
export function damage(g: CanvasRenderingContext2D, w: number, h: number, amt: number) {
  const blocks = Math.floor(amt * 40);
  for (let i = 0; i < blocks; i++) {
    const y = Math.floor(Math.random() * h);
    const bh = 8 + Math.floor(Math.random() * 24);
    const dx = Math.floor((Math.random() - 0.5) * 80 * amt);
    try {
      const slice = g.getImageData(0, y, w, Math.min(bh, h - y));
      g.putImageData(slice, dx, y);
    } catch { /* out of bounds */ }
    if (Math.random() < amt * 0.5) {
      g.fillStyle = `rgba(${Math.random() * 255 | 0},${Math.random() * 80 | 0},${Math.random() * 255 | 0},0.35)`;
      g.fillRect(Math.random() * w, y, 16 + Math.random() * 64, 8);
    }
  }
  if (amt > 0.6) {
    // Lower part of the image goes grey, like a truncated JPEG.
    const cut = h * (1 - (amt - 0.6));
    g.fillStyle = '#808080';
    g.fillRect(0, cut, w, h - cut);
  }
}

/** Data URL of a thumbnail (cached). */
export function thumb(art: string, w = 96, h = 72): string {
  const key = `${art}:${w}x${h}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  paint(c, art, w, h);
  const url = c.toDataURL('image/jpeg', 0.85);
  cache.set(key, url);
  return url;
}
