import { rng } from './paint';
import { photoURL, photoImage } from './render';

let cached: string | null = null;

/** Desktop wallpaper: the hills photograph, or the original "green hill, blue sky" scene painted procedurally at 1024x768 if the photo failed to load. */
export function wallpaperURL(): string {
  const photo = photoURL('hills');
  if (photo) return photo;
  if (cached) return cached;
  const w = 1024, h = 768;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d')!;
  const r = rng(2001);
  // Deep blue overhead, hazy near the horizon.
  const sky = g.createLinearGradient(0, 0, 0, h * 0.72);
  sky.addColorStop(0, '#1d4fb8');
  sky.addColorStop(0.35, '#3474d9');
  sky.addColorStop(0.7, '#6aa6ec');
  sky.addColorStop(1, '#c3dcf5');
  g.fillStyle = sky; g.fillRect(0, 0, w, h);
  // Faint high streaks.
  g.globalAlpha = 0.18;
  for (let i = 0; i < 6; i++) {
    const y = 30 + r() * 160, x = r() * w;
    const sg = g.createRadialGradient(x, y, 0, x, y, 260);
    sg.addColorStop(0, '#fff'); sg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = sg; g.beginPath(); g.ellipse(x, y, 320, 18, -0.05, 0, Math.PI * 2); g.fill();
  }
  g.globalAlpha = 1;
  // Cumulus: clusters of puffs, bright on top, shaded underneath.
  // Soft, wind-stretched cumulus: many faint puffs, flattened, shaded on the underside.
  const cloud = (cx: number, cy: number, s: number) => {
    const puffs = 26 + Math.floor(r() * 12);
    for (let p = 0; p < puffs; p++) {
      const px = cx + (r() - 0.5) * 300 * s, py = cy + (r() - 0.55) * 40 * s, pr = (18 + r() * 40) * s;
      g.save(); g.translate(px, py); g.scale(1.7, 0.75);
      const sh = g.createRadialGradient(0, pr * 0.45, 0, 0, pr * 0.45, pr);
      sh.addColorStop(0, 'rgba(140,165,210,0.16)'); sh.addColorStop(1, 'rgba(140,165,210,0)');
      g.fillStyle = sh; g.beginPath(); g.arc(0, pr * 0.45, pr, 0, Math.PI * 2); g.fill();
      const hi = g.createRadialGradient(-pr * 0.2, -pr * 0.35, 0, 0, 0, pr);
      hi.addColorStop(0, 'rgba(255,255,255,0.5)'); hi.addColorStop(0.55, 'rgba(250,252,255,0.28)'); hi.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = hi; g.beginPath(); g.arc(0, 0, pr, 0, Math.PI * 2); g.fill();
      g.restore();
    }
  };
  cloud(190, 110, 0.9); cloud(600, 80, 0.75); cloud(860, 190, 1.0); cloud(420, 250, 0.55); cloud(1000, 70, 0.6); cloud(70, 290, 0.5);
  // Distant ridge, blued by haze.
  const far = g.createLinearGradient(0, h * 0.55, 0, h * 0.75);
  far.addColorStop(0, '#6f9e64'); far.addColorStop(1, '#4b8a3a');
  g.fillStyle = far;
  g.beginPath(); g.moveTo(0, h * 0.67);
  g.bezierCurveTo(w * 0.22, h * 0.6, w * 0.48, h * 0.63, w * 0.72, h * 0.69);
  g.bezierCurveTo(w * 0.86, h * 0.72, w * 0.95, h * 0.69, w, h * 0.66);
  g.lineTo(w, h); g.lineTo(0, h); g.fill();
  // Main hill: lit from the upper left.
  const hill = new Path2D();
  hill.moveTo(0, h * 0.8);
  hill.bezierCurveTo(w * 0.16, h * 0.6, w * 0.4, h * 0.49, w * 0.6, h * 0.57);
  hill.bezierCurveTo(w * 0.8, h * 0.66, w * 0.92, h * 0.82, w, h * 0.86);
  hill.lineTo(w, h); hill.lineTo(0, h); hill.closePath();
  const front = g.createLinearGradient(w * 0.3, h * 0.48, w * 0.55, h);
  front.addColorStop(0, '#9be24f'); front.addColorStop(0.3, '#6dbb31'); front.addColorStop(0.7, '#3f8b1d'); front.addColorStop(1, '#255f0f');
  g.fillStyle = front; g.fill(hill);
  g.save(); g.clip(hill);
  // Sunlit crown and shadowed flank.
  const sun = g.createRadialGradient(w * 0.42, h * 0.52, 0, w * 0.42, h * 0.52, w * 0.42);
  sun.addColorStop(0, 'rgba(225,255,150,0.45)'); sun.addColorStop(1, 'rgba(225,255,150,0)');
  g.fillStyle = sun; g.fillRect(0, 0, w, h);
  const shade = g.createLinearGradient(w * 0.6, 0, w, 0);
  shade.addColorStop(0, 'rgba(0,30,0,0)'); shade.addColorStop(1, 'rgba(0,30,0,0.28)');
  g.fillStyle = shade; g.fillRect(0, 0, w, h);
  // Grass texture: short strokes that follow the slope.
  for (let i = 0; i < 16000; i++) {
    const x = r() * w, y = h * 0.48 + r() * h * 0.52;
    g.fillStyle = r() > 0.5 ? 'rgba(255,255,170,0.06)' : 'rgba(0,40,0,0.07)';
    g.fillRect(x, y, 1, 2 + r() * 2);
  }
  g.restore();
  cached = c.toDataURL('image/jpeg', 0.93);
  return cached;
}

/** The same wallpaper, faded and flooded, used in the recovery desktop. */
export function floodedWallpaperURL(): string {
  const w = 1024, h = 768;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d')!;
  const img = photoImage('hills') ?? new Image();
  if (!img.src) img.src = wallpaperURL();
  g.fillStyle = '#1c2a3a'; g.fillRect(0, 0, w, h);
  g.globalAlpha = 0.35;
  try { g.drawImage(img, 0, 0, w, h); } catch { /* not decoded yet */ }
  g.globalAlpha = 1;
  const wat = g.createLinearGradient(0, h * 0.55, 0, h);
  wat.addColorStop(0, 'rgba(60,90,110,0.75)'); wat.addColorStop(1, 'rgba(20,35,50,0.95)');
  g.fillStyle = wat; g.fillRect(0, h * 0.58, w, h * 0.42);
  return c.toDataURL('image/jpeg', 0.9);
}
