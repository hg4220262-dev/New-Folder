import { useMemo } from 'react';
import { store } from '../../engine/state';

// Barrel distortion for the CRT look. The picture is warped with an SVG displacement map; the map
// is painted once. A point at screen position p shows the content from p + shift(p), so the drawn
// cursor is moved by the same amount to stay on top of what a click will actually hit.
export const AX = 10;
export const AY = 8;
const SCALE = 2 * Math.max(AX, AY);

/** True while the curved-glass warp is applied. */
export const warpOn = (): boolean => store.settings.crt !== false && store.settings.crtCurve !== false && store.s?.screenMode !== 'full';

function shift(x: number, y: number) {
  const ux = Math.max(-1, Math.min(1, x / 512 - 1)), uy = Math.max(-1, Math.min(1, y / 384 - 1));
  const r2 = (ux * ux + uy * uy) / 2;
  return { dx: AX * ux * r2, dy: AY * uy * r2 };
}

/** How far to move the drawn cursor so it sits on the warped picture. */
export function crtShift(x: number, y: number) { return warpOn() ? shift(x, y) : { dx: 0, dy: 0 }; }

let mapUrl = '';
function map(): string {
  if (mapUrl) return mapUrl;
  const w = 256, h = 192;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d')!;
  const img = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const { dx, dy } = shift((x / (w - 1)) * 1024, (y / (h - 1)) * 768);
    const i = (y * w + x) * 4;
    img.data[i] = Math.round(127.5 + (dx / SCALE) * 255);
    img.data[i + 1] = Math.round(127.5 + (dy / SCALE) * 255);
    img.data[i + 2] = 128; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  mapUrl = c.toDataURL('image/png');
  return mapUrl;
}

export function CrtDefs() {
  const url = useMemo(map, []);
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
      <filter id="crtwarp" filterUnits="userSpaceOnUse" x="0" y="0" width="1024" height="768" colorInterpolationFilters="sRGB">
        <feImage href={url} x="0" y="0" width="1024" height="768" preserveAspectRatio="none" result="map" />
        <feDisplacementMap in="SourceGraphic" in2="map" scale={SCALE} xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}
