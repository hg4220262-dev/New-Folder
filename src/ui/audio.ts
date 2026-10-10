// Procedural sound: every effect is synthesised with WebAudio at runtime (no sound files).
import { setSfx, type SfxName } from '../engine/bus';
import { store } from '../engine/state';

let ac: AudioContext | null = null;
let master: GainNode | null = null;
let hum: { osc: OscillatorNode[]; gain: GainNode; filt: BiquadFilterNode; noise: AudioBufferSourceNode } | null = null;

function ctx(): AudioContext | null {
  if (!ac) {
    try {
      ac = new AudioContext();
      master = ac.createGain();
      master.gain.value = store.settings.volume;
      master.connect(ac.destination);
    } catch { return null; }
  }
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  return ac;
}

export function setVolume(v: number) { if (master) master.gain.value = v; }

function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.2, at = 0, slide?: number) {
  const a = ctx(); if (!a || !master) return;
  const t = a.currentTime + at;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + dur + 0.05);
}

function noiseBuf(a: AudioContext, secs: number) {
  const b = a.createBuffer(1, a.sampleRate * secs, a.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

function burst(dur: number, vol = 0.2, freq = 1200, q = 0.8, at = 0) {
  const a = ctx(); if (!a || !master) return;
  const t = a.currentTime + at;
  const src = a.createBufferSource(); src.buffer = noiseBuf(a, dur + 0.1);
  const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
  const g = a.createGain();
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(master);
  src.start(t); src.stop(t + dur + 0.1);
}

/** Simple bell-like chord, used for start-up and log-on. Original melodies. */
function chord(notes: number[], step: number, dur: number, vol = 0.09) {
  notes.forEach((n, i) => { tone(n, dur, 'triangle', vol, i * step); tone(n * 2, dur * 0.6, 'sine', vol * 0.3, i * step); });
}

const PLAY: Record<SfxName, () => void> = {
  click: () => burst(0.03, 0.08, 3000, 2),
  ding: () => { tone(880, 0.5, 'triangle', 0.12); tone(1320, 0.4, 'sine', 0.05, 0.02); },
  error: () => { tone(330, 0.32, 'square', 0.05); tone(247, 0.4, 'triangle', 0.1, 0.05); },
  balloon: () => { tone(1046, 0.18, 'sine', 0.06); tone(1568, 0.25, 'sine', 0.05, 0.07); },
  startup: () => chord([392, 523, 659, 784, 1046], 0.32, 2.4, 0.08),
  logon: () => chord([523, 659, 784], 0.18, 1.4, 0.07),
  logoff: () => chord([784, 659, 523, 392], 0.22, 1.4, 0.07),
  recycle: () => burst(0.35, 0.12, 900, 0.5),
  glitch: () => { burst(0.12, 0.25, 200 + Math.random() * 3000, 6); tone(60 + Math.random() * 90, 0.15, 'sawtooth', 0.08); },
  crash: () => { burst(1.2, 0.45, 400, 0.3); tone(50, 1.4, 'sawtooth', 0.25, 0, 30); },
  type: () => burst(0.02, 0.04, 2400, 3),
  hddseek: () => { for (let i = 0; i < 6; i++) burst(0.025, 0.07, 1800 + Math.random() * 1200, 4, i * (0.04 + Math.random() * 0.08)); },
  beep: () => tone(1000, 0.12, 'square', 0.06),
};

export function initAudio() {
  setSfx((n) => {
    if (store.ui.pause && n !== 'click') return;
    try { PLAY[n](); } catch { /* audio unavailable */ }
  });
}

/** Laptop fan/hard-disk hum. Distorts as the glitch level rises. */
export function updateHum(level: number, on: boolean) {
  const a = ctx(); if (!a || !master) return;
  if (!on) { if (hum) { hum.gain.gain.setTargetAtTime(0, a.currentTime, 0.3); } return; }
  if (!hum) {
    const gain = a.createGain(); gain.gain.value = 0;
    const filt = a.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 320;
    const osc = [55, 110.4, 165.2].map((f) => { const o = a.createOscillator(); o.type = 'sine'; o.frequency.value = f; o.connect(filt); o.start(); return o; });
    const noise = a.createBufferSource(); noise.buffer = noiseBuf(a, 4); noise.loop = true;
    const ng = a.createGain(); ng.gain.value = 0.25; noise.connect(ng); ng.connect(filt); noise.start();
    filt.connect(gain); gain.connect(master);
    hum = { osc, gain, filt, noise };
  }
  const t = a.currentTime;
  hum.gain.gain.setTargetAtTime(0.03 + level * 0.018, t, 0.8);
  hum.filt.frequency.setTargetAtTime(320 + level * 380, t, 1);
  hum.osc[1].frequency.setTargetAtTime(110.4 + level * (Math.random() * 4 - 2), t, 0.5);
  hum.osc[2].type = level >= 3 ? 'sawtooth' : 'sine';
}
