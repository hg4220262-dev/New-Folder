import { wallpaperURL } from '../art/wallpaper';
import type { Fit } from '../Monitor';

const load = (src: string) => new Promise<HTMLImageElement>((res, rej) => {
  const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src;
});

/** Freeze the current 4:3 screen into a 1024x768 canvas (exact pixels via Electron capturePage). */
export async function snapshot(fit: Fit): Promise<HTMLCanvasElement> {
  const out = document.createElement('canvas');
  out.width = 1024; out.height = 768;
  const g = out.getContext('2d')!;
  try {
    const url = await window.host?.capture();
    if (!url) throw new Error('no capture');
    const img = await load(url);
    const k = img.width / window.innerWidth;
    g.drawImage(img, fit.ox * k, fit.oy * k, 1024 * fit.scale * k, 768 * fit.scale * k, 0, 0, 1024, 768);
  } catch {
    g.drawImage(await load(wallpaperURL()), 0, 0, 1024, 768);
  }
  return out;
}

/** Copy of an image with only one colour channel kept. */
export function channel(src: HTMLCanvasElement, keep: 0 | 2): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = src.width; c.height = src.height;
  const g = c.getContext('2d')!;
  g.drawImage(src, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height);
  for (let i = 0; i < d.data.length; i += 4) for (let ch = 0; ch < 3; ch++) if (ch !== keep) d.data[i + ch] = 0;
  g.putImageData(d, 0, 0);
  return c;
}

export interface Snap { img: HTMLCanvasElement; red: HTMLCanvasElement; blue: HTMLCanvasElement }

/** Slices of the frozen screen slide sideways past the monitor edges; colour bleeds; cracks spread. */
export function drawLeak(g: CanvasRenderingContext2D, snap: Snap, fit: Fit, t: number, soft: boolean, still: boolean) {
  const W = window.innerWidth, H = window.innerHeight;
  const sc = fit.scale, rw = 1024 * sc, rh = 768 * sc;
  const jx = still ? 0 : (Math.random() - 0.5) * 10 * t;
  const jy = still ? 0 : (Math.random() - 0.5) * 6 * t;
  g.globalCompositeOperation = 'source-over';
  g.globalAlpha = 1;
  g.fillStyle = '#000';
  g.fillRect(0, 0, W, H);
  g.drawImage(snap.img, fit.ox + jx, fit.oy + jy, rw, rh);

  const bleed = (soft ? 14 : 46) * t;
  g.globalCompositeOperation = 'lighter';
  g.globalAlpha = (soft ? 0.25 : 0.55) * t;
  g.drawImage(snap.red, fit.ox - bleed + jx, fit.oy + jy, rw, rh);
  g.drawImage(snap.blue, fit.ox + bleed + jx, fit.oy + jy, rw, rh);
  g.globalCompositeOperation = 'source-over';
  g.globalAlpha = 1;

  const n = Math.floor(4 + t * (soft ? 14 : 34));
  for (let i = 0; i < n; i++) {
    const sy = Math.random() * 768, sh = 3 + Math.random() * (10 + t * 50);
    const reach = fit.ox + 200 + t * W * 0.6;
    const dx = (Math.random() - 0.5) * 2 * reach * (0.25 + t);
    g.drawImage(snap.img, 0, sy, 1024, sh, fit.ox + dx, fit.oy + sy * sc, rw, sh * sc);
  }

  g.strokeStyle = `rgba(255,255,255,${0.15 + 0.5 * t})`;
  g.lineWidth = 1;
  const cracks = Math.floor(t * 10);
  for (let i = 0; i < cracks; i++) {
    const left = Math.random() < 0.5;
    let x = left ? fit.ox : fit.ox + rw;
    let y = fit.oy + Math.random() * rh;
    g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 6; k++) { x += (left ? -1 : 1) * (10 + Math.random() * 60 * t); y += (Math.random() - 0.5) * 50; g.lineTo(x, y); }
    g.stroke();
  }
  if (!soft && Math.random() < 0.06 * t) { g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(0, 0, W, H); }
}
