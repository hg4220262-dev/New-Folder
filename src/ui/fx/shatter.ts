// WebGL shatter: the frozen 4:3 screenshot cracks like glass from one impact point, holds for
// a beat, then the shards drop away under gravity and spill past the old monitor edges.

const VS = `
attribute vec2 aPos;      // rest position in monitor px (0..1024, 0..768)
attribute vec2 aCenter;   // shard centroid (monitor px)
attribute vec3 aRand;     // per-shard random: x, y, delay
attribute float aEdge;    // 1 at the shard centre, 0 on its outline (for the bright rim)
uniform float uT;         // 0..1 progress
uniform vec2 uView;       // viewport px
uniform vec3 uFit;        // scale, ox, oy
uniform vec2 uHit;        // impact point (monitor px)
varying vec2 vUV;
varying float vFade;
varying float vEdge;
varying float vTilt;
const float CRACK = 0.16;
void main() {
  vec2 rel = aCenter - uHit;
  float d = length(rel);
  vec2 dir = d > 0.001 ? rel / d : vec2(0.0, 1.0);
  // Cracks first: shards sit almost still, nudged apart along the crack lines.
  float crack = smoothstep(0.0, CRACK, uT);
  vec2 nudge = dir * crack * (1.5 + aRand.x * 3.0) * (1.0 - clamp(d / 900.0, 0.0, 1.0));
  // Then they fall: nearest the impact first.
  float delay = CRACK + clamp(d / 1100.0, 0.0, 1.0) * 0.38 + aRand.z * 0.14;
  float k = clamp((uT - delay) / (1.0 - delay), 0.0, 1.0);
  float ang = (aRand.y - 0.5) * 2.6 * k;
  vec2 p = aPos - aCenter;
  float s = 1.0 - 0.18 * k;
  p = vec2(p.x * cos(ang) - p.y * sin(ang), p.x * sin(ang) + p.y * cos(ang)) * s;
  vec2 drift = dir * k * (60.0 + aRand.x * 140.0);
  vec2 fall = vec2((aRand.x - 0.5) * 120.0 * k, k * k * (700.0 + aRand.y * 900.0));
  vec2 m = aCenter + p + nudge + drift + fall;
  vec2 px = vec2(uFit.y, uFit.z) + m * uFit.x;
  vec2 clip = (px / uView) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  vUV = aPos / vec2(1024.0, 768.0);
  vFade = 1.0 - smoothstep(0.7, 1.0, k);
  vEdge = aEdge;
  vTilt = ang + crack;
}`;

// The fragment shader uses its own progress uniform (uTf): sharing `uT` with the vertex
// shader fails to link, because the precisions differ (highp vs mediump).
const FS = `
precision mediump float;
uniform sampler2D uTex;
uniform float uTf;
uniform float uSplit;
uniform float uFlash;
varying vec2 vUV;
varying float vFade;
varying float vEdge;
varying float vTilt;
void main() {
  float o = uSplit * (0.002 + uTf * 0.01);
  vec3 c = vec3(texture2D(uTex, vUV + vec2(o, 0.0)).r, texture2D(uTex, vUV).g, texture2D(uTex, vUV - vec2(o, 0.0)).b);
  // Glass rim: bright on the outline, shimmering as the shard turns.
  float rim = smoothstep(0.07, 0.0, vEdge);
  float glint = 0.55 + 0.45 * sin(vTilt * 3.0 + vUV.x * 9.0);
  c = mix(c, vec3(0.86, 0.92, 1.0), rim * 0.75 * glint);
  // Shards darken a little as they fall away from the light.
  c *= 1.0 - 0.25 * (1.0 - vFade);
  c += uFlash;
  gl_FragColor = vec4(c, vFade);
}`;

function shader(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
  return s;
}

type Pt = [number, number];

/** Clip a polygon to the 1024x768 screen (Sutherland-Hodgman). */
function clipRect(poly: Pt[], W: number, H: number): Pt[] {
  const edges: [(p: Pt) => boolean, (a: Pt, b: Pt) => Pt][] = [
    [(p) => p[0] >= 0, (a, b) => { const t = (0 - a[0]) / (b[0] - a[0]); return [0, a[1] + t * (b[1] - a[1])]; }],
    [(p) => p[0] <= W, (a, b) => { const t = (W - a[0]) / (b[0] - a[0]); return [W, a[1] + t * (b[1] - a[1])]; }],
    [(p) => p[1] >= 0, (a, b) => { const t = (0 - a[1]) / (b[1] - a[1]); return [a[0] + t * (b[0] - a[0]), 0]; }],
    [(p) => p[1] <= H, (a, b) => { const t = (H - a[1]) / (b[1] - a[1]); return [a[0] + t * (b[0] - a[0]), H]; }],
  ];
  let out = poly;
  for (const [inside, cut] of edges) {
    const src = out; out = [];
    for (let i = 0; i < src.length; i++) {
      const a = src[i], b = src[(i + 1) % src.length];
      const ia = inside(a), ib = inside(b);
      if (ia) out.push(a);
      if (ia !== ib) out.push(cut(a, b));
    }
    if (!out.length) break;
  }
  return out;
}

export interface ShatterHandle { draw: (t: number) => void; dispose: () => void }

export function createShatter(canvas: HTMLCanvasElement, image: HTMLImageElement, fit: { scale: number; ox: number; oy: number }, softer: boolean): ShatterHandle | null {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: false, alpha: true });
  if (!gl) return null;
  const prog = gl.createProgram()!;
  gl.attachShader(prog, shader(gl, gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, shader(gl, gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'link');
  gl.useProgram(prog);

  // Radial fracture: rings of jittered points around the impact, spokes between them.
  // Shards are small near the impact and large at the edges, like real broken glass.
  const W = 1024, H = 768;
  const hit: Pt = [604, 318];
  let seed = 435;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const spokes = 26;
  const radii = [0, 22, 52, 92, 146, 214, 300, 404, 530, 690, 900, 1200];
  const base = Array.from({ length: spokes }, (_, i) => (i / spokes) * Math.PI * 2 + (rnd() - 0.5) * 0.16);
  const ring: Pt[][] = radii.map((r, ri) => base.map((a) => {
    if (ri === 0) return hit;
    const aj = a + (rnd() - 0.5) * (0.9 / spokes) * Math.PI * 2;
    const rj = r * (1 + (rnd() - 0.5) * (ri === radii.length - 1 ? 0 : 0.28));
    return [hit[0] + Math.cos(aj) * rj, hit[1] + Math.sin(aj) * rj] as Pt;
  }));

  const data: number[] = [];
  const shard = (poly: Pt[]) => {
    const c = clipRect(poly, W, H);
    if (c.length < 3) return;
    let cx = 0, cy = 0;
    for (const p of c) { cx += p[0]; cy += p[1]; }
    cx /= c.length; cy /= c.length;
    const r = [rnd(), rnd(), rnd()];
    const v = (p: Pt, e: number) => data.push(p[0], p[1], cx, cy, r[0], r[1], r[2], e);
    for (let i = 0; i < c.length; i++) { v([cx, cy], 1); v(c[i], 0); v(c[(i + 1) % c.length], 0); }
  };
  for (let ri = 0; ri < radii.length - 1; ri++) {
    for (let si = 0; si < spokes; si++) {
      const sj = (si + 1) % spokes;
      const a = ring[ri][si], b = ring[ri][sj], c = ring[ri + 1][sj], d = ring[ri + 1][si];
      // Outer shards are sometimes split once more along a random diagonal.
      if (ri >= 3 && rnd() < 0.45) {
        const m: Pt = [(c[0] + d[0]) / 2 + (rnd() - 0.5) * 20, (c[1] + d[1]) / 2 + (rnd() - 0.5) * 20];
        shard([a, b, c, m]);
        shard([a, m, d]);
      } else shard(ri === 0 ? [a, c, d] : [a, b, c, d]);
    }
  }

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
  const stride = 8 * 4;
  const attr = (name: string, size: number, off: number) => {
    const loc = gl.getAttribLocation(prog, name);
    if (loc < 0) return;
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, off * 4);
  };
  attr('aPos', 2, 0); attr('aCenter', 2, 2); attr('aRand', 3, 4); attr('aEdge', 1, 7);

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  const u = (n: string) => gl.getUniformLocation(prog, n);
  const uT = u('uT'), uTf = u('uTf'), uView = u('uView'), uFit = u('uFit'), uSplit = u('uSplit'), uHit = u('uHit'), uFlash = u('uFlash');
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  const count = data.length / 8;

  return {
    draw: (t: number) => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth * dpr, h = canvas.clientHeight * dpr;
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uT, t);
      gl.uniform1f(uTf, t);
      gl.uniform2f(uView, canvas.clientWidth, canvas.clientHeight);
      gl.uniform3f(uFit, fit.scale, fit.ox, fit.oy);
      gl.uniform2f(uHit, hit[0], hit[1]);
      gl.uniform1f(uSplit, softer ? 0.3 : 1);
      // A brief flash on impact (none with reduced flashing).
      gl.uniform1f(uFlash, softer ? 0 : Math.max(0, 1 - t / 0.05) * 0.22);
      gl.drawArrays(gl.TRIANGLES, 0, count);
    },
    dispose: () => { gl.deleteBuffer(buf); gl.deleteTexture(tex); gl.deleteProgram(prog); },
  };
}
