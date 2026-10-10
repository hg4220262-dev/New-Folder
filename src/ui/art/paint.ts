// Painting helpers for the drawn scan and the old-print treatment. All original, generated in code.
export type G = CanvasRenderingContext2D;

export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; };
}

/** Old-photo treatment: sepia, grain and vignette. */
export function sepia(g: G, w: number, h: number, amt = 1, grain = 18, seed = 7) {
  const img = g.getImageData(0, 0, w, h);
  const d = img.data;
  const r = rng(seed);
  for (let i = 0; i < d.length; i += 4) {
    const R = d[i], Gr = d[i + 1], B = d[i + 2];
    const tr = 0.393 * R + 0.769 * Gr + 0.189 * B;
    const tg = 0.349 * R + 0.686 * Gr + 0.168 * B;
    const tb = 0.272 * R + 0.534 * Gr + 0.131 * B;
    const n = (r() - 0.5) * grain;
    d[i] = Math.min(255, R + (tr - R) * amt + n);
    d[i + 1] = Math.min(255, Gr + (tg - Gr) * amt + n);
    d[i + 2] = Math.min(255, B + (tb - B) * amt + n);
  }
  g.putImageData(img, 0, 0);
  const v = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(30,15,0,0.55)');
  g.fillStyle = v;
  g.fillRect(0, 0, w, h);
}

/** A simple terraced house. `faces` lists window indexes with a figure in them. */
export function house(g: G, x: number, y: number, w: number, h: number, wall: string, roof: string, windows = 2, faces: number[] = []) {
  g.fillStyle = wall;
  g.fillRect(x, y, w, h);
  g.fillStyle = roof;
  g.beginPath();
  g.moveTo(x - 3, y);
  g.lineTo(x + w / 2, y - h * 0.55);
  g.lineTo(x + w + 3, y);
  g.fill();
  g.fillStyle = '#3a3a35';
  g.fillRect(x + w * 0.42, y + h * 0.5, w * 0.16, h * 0.5);
  for (let i = 0; i < windows; i++) {
    const wx = x + (w / (windows + 1)) * (i + 1) - 4;
    const wy = y + h * 0.14;
    g.fillStyle = '#2a2c30';
    g.fillRect(wx, wy, 8, 9);
    if (faces.includes(i)) {
      g.fillStyle = '#cfc8b4';
      g.beginPath(); g.arc(wx + 4, wy + 3.5, 1.8, 0, Math.PI * 2); g.fill();
      g.fillRect(wx + 2.4, wy + 5, 3.2, 4);
    }
  }
  g.fillStyle = '#5c5a52';
  g.fillRect(x + w * 0.7, y - h * 0.5, 5, 10);
}
