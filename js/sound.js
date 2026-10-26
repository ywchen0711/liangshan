// Sound: short square-wave effects and a gentle pentatonic tune for the road and a faster one for battle, made with
// the Web Audio API (nothing to download). Off until the first key or tap, as browsers require.
let A = null, on = true, cur = null, timer = null, master = null;
const ctx = () => { if (!A) { try { A = new (window.AudioContext || window.webkitAudioContext)(); master = A.createGain(); master.gain.value = 0.18; master.connect(A.destination); } catch (e) { A = null; } } if (A && A.state === 'suspended') A.resume(); return A; };
addEventListener('keydown', () => ctx(), { once: true }); addEventListener('pointerdown', () => ctx(), { once: true });
function tone(f, t0, dur, type = 'square', vol = 0.5, slide) { const a = ctx(); if (!a || !on) return; const o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.setValueAtTime(f, t0); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + dur); g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur); o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.02); }
function noise(t0, dur, vol = 0.4) { const a = ctx(); if (!a || !on) return; const b = a.createBuffer(1, a.sampleRate * dur, a.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length); const s = a.createBufferSource(), g = a.createGain(); s.buffer = b; g.gain.value = vol; s.connect(g); g.connect(master); s.start(t0); }
export function sfx(name) {
  const a = ctx(); if (!a || !on) return; const t = a.currentTime;
  if (name === 'ok') tone(880, t, 0.06, 'square', 0.25);
  else if (name === 'hit') { noise(t, 0.12, 0.5); tone(160, t, 0.12, 'square', 0.3, 60); }
  else if (name === 'crit') { noise(t, 0.2, 0.7); tone(300, t, 0.2, 'sawtooth', 0.4, 80); }
  else if (name === 'miss') tone(600, t, 0.12, 'triangle', 0.3, 900);
  else if (name === 'fire') { noise(t, 0.5, 0.5); tone(200, t, 0.5, 'sawtooth', 0.2, 500); }
  else if (name === 'water') { for (let i = 0; i < 5; i++) tone(300 + i * 60, t + i * 0.05, 0.15, 'triangle', 0.25); }
  else if (name === 'thunder') { noise(t, 0.7, 0.9); tone(80, t, 0.6, 'square', 0.4, 40); }
  else if (name === 'heal' || name === 'buff' || name === 'revive') { [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.06, 0.18, 'triangle', 0.3)); }
  else if (name === 'win') { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, t + i * 0.11, 0.2, 'square', 0.25)); }
  else if (name === 'battle') { [220, 220, 330, 294].forEach((f, i) => tone(f, t + i * 0.09, 0.12, 'square', 0.3)); }
  else if (name === 'step') tone(110, t, 0.03, 'triangle', 0.08);
  else if (name === 'coin') { tone(988, t, 0.06, 'square', 0.25); tone(1318, t + 0.06, 0.12, 'square', 0.25); }
  else { noise(t, 0.2, 0.3); }
}
// tunes: a pentatonic melody over a drone, looped
const TUNES = {
  road: { bpm: 84, notes: [0, 2, 4, 7, 4, 2, 0, -3, 0, 2, 4, 2, 0, -3, -5, -3, 0, 4, 7, 9, 7, 4, 2, 4, 2, 0, -3, 0, 2, 0, -3, -5], root: 293.66, wave: 'triangle' },
  battle: { bpm: 150, notes: [0, 0, 7, 5, 3, 5, 7, 10, 7, 5, 3, 0, 3, 5, 3, 0, -2, 0, 3, 5, 7, 10, 12, 10, 7, 5, 7, 3, 5, 3, 0, 0], root: 220, wave: 'square' },
  town: { bpm: 96, notes: [7, 9, 12, 9, 7, 4, 2, 4, 7, 4, 2, 0, 2, 4, 2, -3, 0, 2, 4, 7, 9, 7, 4, 2, 0, 2, 0, -3, 0, -3, -5, 0], root: 329.63, wave: 'triangle' },
};
const PENTA = (n) => { const steps = [0, 2, 4, 7, 9], oct = Math.floor(n / 12), r = ((n % 12) + 12) % 12; return n; };
export function music(name) {
  if (cur === name) return; cur = name; clearInterval(timer); timer = null; if (!name || !on) return;
  const T = TUNES[name]; let i = 0; const step = 60 / T.bpm / 2;
  timer = setInterval(() => { const a = ctx(); if (!a || !on) return; const t = a.currentTime + 0.05, n = T.notes[i % T.notes.length]; tone(T.root * Math.pow(2, PENTA(n) / 12), t, step * 1.6, T.wave, name === 'battle' ? 0.16 : 0.13); if (i % 4 === 0) tone(T.root / 2, t, step * 3.5, 'triangle', 0.12); if (name === 'battle' && i % 2 === 0) noise(t, 0.05, 0.12); i++; }, step * 1000);
}
export function setSound(v) { on = v; if (!on) { clearInterval(timer); timer = null; const c = cur; cur = null; if (c) cur = null; } }
export const soundOn = () => on;
