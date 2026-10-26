// Painted portraits in the manner of Koei's Three Kingdoms games (Path of the Hegemon): a bust in dramatic light — a
// warm key light from the upper left, a cool rim on the right, deep shadow — weathered faces, heavy beards drawn hair
// by hair, lamellar armour and helmets with plumes, robes with crossed collars, all on a smoky dark ground and
// finished with brushwork. Each of the five hundred is drawn from their look, their side and their strength and wit.
import { rng, hash } from './util.js';

const W = 160, H = 200, CACHE = new Map();
const hex = (c) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const rgb = (r, g, b, a = 1) => `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a})`;
const sh = (c, k, a = 1) => { const [r, g, b] = hex(c), f = (v) => (k > 1 ? v + (255 - v) * (k - 1) : v * k); return rgb(f(r), f(g), f(b), a); };
const toHex = (r, g, b) => '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mixHex = (a, b, t) => { const A = hex(a), B = hex(b); return toHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); };
const mix = (a, b, t, al = 1) => { const A = hex(a), B = hex(b); return rgb(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t, al); };
const SKIN = { y: '#d8a27a', w: '#e8bc98', r: '#c0644a', d: '#a8714c', b: '#5e3c2a', g: '#d8a27a' };
const HAIR = { red: '#8a3018', gold: '#b88a3a', white: '#d8d4cc', purple: '#5a3048' };
const SIDEC = { ls: '#2a4a8a', song: '#8a2a22', bandit: '#5a4a32', zhu: '#7a5a22', zeng: '#4a5a4a', liao: '#4a3a5a', tian: '#6a4a22', wang: '#3a5a3a', fang: '#a85a1a', jin: '#2a3a3a', xia: '#6a5a2a', wander: '#3a5a6a', beast: '#3a3a3a' };

export function painted(p) {
  if (CACHE.has(p.id)) return CACHE.get(p.id);
  const c = document.createElement('canvas'); c.width = W * 2; c.height = H * 2; const g = c.getContext('2d'); g.scale(2, 2);
  const L = p.look || {}, R = rng(hash(p.id) ^ 0x9e37), female = !!L.female, side = SIDEC[p.side] || '#3a3a4a';
  const old = L.hair === 'white' || (p.lv >= 48 && (L.beard === 'long' || L.beard === 'goatee') && R() < 0.45);
  const menace = !female && p.side === 'bandit', fierce = menace || p.wu - p.zhi > 28, burly = p.wu >= 86 && !female, wise = !menace && p.zhi - p.wu > 25;
  const skin0 = SKIN[L.face] || SKIN.y, skin = mixHex(mixHex(skin0, R() < 0.5 ? '#c8906a' : '#e0b090', R() * 0.25), '#7a4428', menace ? 0.28 : 0), hairC = old ? '#cfcac0' : HAIR[L.hair] || ['#1e1814', '#2a201a', '#18140f'][R.int(0, 2)];
  const armour = L.hat === 'helm' || L.hat === 'fur' || ((p.troop === '騎' || p.wu > 80) && !wise && L.hat !== 'monk' && L.hat !== 'taoist' && L.hat !== 'scholar' && L.hat !== 'official' && !female && R() < 0.6);
  // proportions, slightly different for everyone
  const cx = 80 + R.int(-2, 2), jaw = (female ? 22 : burly ? 31 : 27) + R.int(-3, 3), eyeY = 90 + R.int(-3, 3), chin = (female ? 132 : burly ? 143 : 138) + R.int(-4, 5), top = 46 + R.int(-2, 2), noseL = R.int(-3, 3), mouthW = R.int(-1, 2);
  const eyeGap = 13 + R.int(-1, 1), eyeW = female ? 8 : 7.5, scarK = menace ? R.int(0, 3) : 0, patch = menace && R() < 0.15;
  const beardK = menace && (!L.beard || L.beard === 'none') ? (R() < 0.6 ? 'stub' : 'full') : L.beard;
  // ---- the ground: smoke in the side's colour, darkening outward
  const bg = g.createRadialGradient(60, 70, 10, 80, 100, 150); bg.addColorStop(0, sh(side, 0.95)); bg.addColorStop(0.55, sh(side, 0.42)); bg.addColorStop(1, '#07070b'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 26; i++) { const x = R() * W, y = R() * H, r = 12 + R() * 36, sg = g.createRadialGradient(x, y, 0, x, y, r); sg.addColorStop(0, `rgba(255,240,220,${0.03 + R() * 0.05})`); sg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sg; g.fillRect(x - r, y - r, r * 2, r * 2); }
  g.save(); g.translate(80, 120); g.scale(1.22, 1.22); g.translate(-80, -112);
  // ---- hair falling behind (women, wild hair, long-haired sorcerers)
  if (female || L.hat === 'hair' || L.hat === 'taoist' && R() < 0.5) { const hg = g.createLinearGradient(cx - jaw - 18, 0, cx + jaw + 18, 0); hg.addColorStop(0, sh(hairC, 1.1)); hg.addColorStop(1, sh(hairC, 0.45)); g.fillStyle = hg; g.beginPath(); g.moveTo(cx - jaw + 2, top + 8); g.bezierCurveTo(cx - jaw - 22, top + 30, cx - jaw - 20, 150, cx - jaw - 4, 178); g.quadraticCurveTo(cx, 186, cx + jaw + 4, 178); g.bezierCurveTo(cx + jaw + 20, 150, cx + jaw + 22, top + 30, cx + jaw - 2, top + 8); g.closePath(); g.fill(); strands(g, R, hairC, cx - jaw - 14, top + 30, cx + jaw + 14, 172, 60, 0.35); }
  // ---- the body
  body(g, R, p, L, { cx, side, armour, female, burly, skin });
  // ---- neck, in the shadow of the jaw
  const ng = g.createLinearGradient(cx - 14, 0, cx + 14, 0); ng.addColorStop(0, sh(skin, 0.8)); ng.addColorStop(0.5, sh(skin, 0.7)); ng.addColorStop(1, sh(skin, 0.45));
  { const nw0 = (female ? 10 : burly ? 16 : 13); g.fillStyle = ng; g.beginPath(); g.moveTo(cx - nw0, chin - 18); g.quadraticCurveTo(cx - nw0 - 1, chin + 6, cx - nw0 - 6, 158); g.lineTo(cx + nw0 + 6, 158); g.quadraticCurveTo(cx + nw0 + 1, chin + 6, cx + nw0, chin - 18); g.closePath(); g.fill(); if (!female) { g.strokeStyle = sh(skin, 0.55, 0.5); g.lineWidth = 1; g.beginPath(); g.moveTo(cx - 5, chin + 8); g.quadraticCurveTo(cx - 3, chin + 14, cx - 6, 156); g.moveTo(cx + 6, chin + 8); g.quadraticCurveTo(cx + 4, chin + 14, cx + 7, 156); g.stroke(); } }
  g.fillStyle = 'rgba(30,15,10,0.45)'; g.beginPath(); g.ellipse(cx, chin + 2, jaw * 0.8, 9, 0, 0, Math.PI * 2); g.fill();
  // ---- ears
  for (const sd of [-1, 1]) { g.fillStyle = sd < 0 ? sh(skin, 0.92) : sh(skin, 0.62); g.beginPath(); g.ellipse(cx + sd * (jaw + 1), eyeY + 6, 4.5, 9, sd * 0.15, 0, Math.PI * 2); g.fill(); g.strokeStyle = sh(skin, 0.5, 0.6); g.lineWidth = 0.8; g.beginPath(); g.arc(cx + sd * (jaw + 1.5), eyeY + 6, 2.5, 0, Math.PI * 2); g.stroke(); }
  if (female) for (const sd of [-1, 1]) { g.fillStyle = '#e8c060'; g.beginPath(); g.arc(cx + sd * (jaw + 1), eyeY + 17, 1.6, 0, 7); g.fill(); g.fillStyle = '#c83a3a'; g.beginPath(); g.arc(cx + sd * (jaw + 1), eyeY + 21, 1.8, 0, 7); g.fill(); }
  // ---- the face, turned a little to our left: the near side wider, the features shifted, the far side in shadow
  const fo = -3, jl = jaw + 2, jr = jaw - 2, fx = cx + fo;
  const facePath = () => { g.beginPath(); g.moveTo(cx - jl, top + 34); g.bezierCurveTo(cx - jl - 1, eyeY + 16, cx - jl + (female ? 7 : 3), chin - 20, fx - (female ? 9 : burly ? 15 : 12), chin - 4); g.quadraticCurveTo(fx, chin + 3, fx + (female ? 8 : burly ? 13 : 10), chin - 5); g.bezierCurveTo(cx + jr - (female ? 6 : 2), chin - 18, cx + jr + 1, eyeY + 18, cx + jr, top + 34); g.bezierCurveTo(cx + jr, top - 4, cx - jl, top - 4, cx - jl, top + 34); g.closePath(); };
  facePath(); g.fillStyle = skin; g.fill();
  g.save(); facePath(); g.clip();
  const shadowC = mixHex(skin, '#3a1208', 0.62), lightC = mixHex(skin, '#fff0d8', 0.45);
  // the round form of the head: lit at the upper left, falling into shadow toward the lower right
  { const fg = g.createRadialGradient(fx - jl * 0.45, eyeY - 14, 4, fx - jl * 0.2, eyeY, jl * 2.1); fg.addColorStop(0, mixHex(skin, '#fff4e0', 0.25)); fg.addColorStop(0.45, skin); fg.addColorStop(0.8, mixHex(skin, '#3a1208', 0.35)); fg.addColorStop(1, shadowC); g.fillStyle = fg; g.fillRect(0, 0, W, H); }
  // the far side: a soft-edged core shadow
  { const tg = g.createLinearGradient(fx + jr * 0.2, 0, cx + jr, 0); tg.addColorStop(0, 'rgba(40,12,6,0)'); tg.addColorStop(0.55, 'rgba(40,12,6,0.38)'); tg.addColorStop(1, 'rgba(30,8,4,0.6)'); g.fillStyle = tg; g.fillRect(0, 0, W, H); }
  const soft = (x, y, rx, ry, col, a, op = 'source-over') => { const r = Math.max(rx, ry), gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col.replace(/[\d.]+\)$/, a + ')')); gr.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); g.save(); g.globalCompositeOperation = op; g.translate(x, y); g.scale(rx / r, ry / r); g.translate(-x, -y); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore(); };
  // planes of the face: the brow ridge and eye sockets deep, hollows under the cheekbones, the chin and jaw
  soft(fx, eyeY - 4, jl, 6, 'rgba(60,20,10,1)', 0.32);
  for (const sd of [-1, 1]) { soft(fx + sd * eyeGap, eyeY + 1, 11, 7, 'rgba(45,15,10,1)', sd < 0 ? 0.42 : 0.55); soft(fx + sd * (jaw - 7), eyeY + 24, 7, 13, 'rgba(50,18,10,1)', sd < 0 ? 0.25 : 0.45); }
  soft(fx, chin - 5, jl * 0.6, 9, 'rgba(45,15,10,1)', 0.32); soft(fx, eyeY + 44, 10, 4, 'rgba(45,15,10,1)', 0.28);
  // the lit planes: forehead, the near cheekbone, the bridge and tip of the nose, the chin
  soft(fx - 8, top + 22, 16, 9, 'rgba(255,238,210,1)', 0.38); soft(fx - 15, eyeY + 13, 9, 6, 'rgba(255,225,190,1)', 0.42); soft(fx - 2, chin - 9, 7, 4, 'rgba(255,225,190,1)', 0.25);
  soft(fx - 4, eyeY + 12, 10, 7, 'rgba(200,70,50,1)', fierce ? 0.18 : 0.12); // warm blood in the cheeks
  if (L.face === 'g') { soft(fx + 13, eyeY + 14, 12, 16, 'rgba(40,90,130,1)', 0.55); soft(fx + 10, eyeY + 20, 6, 8, 'rgba(30,70,110,1)', 0.35); }
  if (L.face === 'r') soft(fx, eyeY + 8, jl, 22, 'rgba(170,30,20,1)', 0.3);
  // the skin's grain
  for (let i = 0; i < 260; i++) { g.fillStyle = R() < 0.5 ? 'rgba(255,230,200,0.06)' : 'rgba(60,20,10,0.07)'; g.fillRect(cx - jl + R() * jl * 2, top + R() * (chin - top), 1.2, 1.2); }
  // the rim of cool light down the far edge
  g.strokeStyle = 'rgba(170,200,255,0.32)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(cx + jr - 1, top + 30); g.bezierCurveTo(cx + jr, eyeY + 18, cx + jr - 4, chin - 18, fx + 9, chin - 3); g.stroke();
  // age and hardship
  if (old || p.lv > 55 && !female) { g.strokeStyle = mixHex(skin, '#3a1208', 0.5); g.globalAlpha = 0.5; g.lineWidth = 0.7; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(fx - 12, top + 18 + i * 4); g.quadraticCurveTo(fx, top + 16 + i * 4, fx + 12, top + 18 + i * 4); g.stroke(); } for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(fx + sd * 7, eyeY + 19); g.quadraticCurveTo(fx + sd * 12, eyeY + 29, fx + sd * 11, eyeY + 37); g.stroke(); for (let i = 0; i < 2; i++) { g.beginPath(); g.moveTo(fx + sd * (eyeGap + 8), eyeY - 1 + i * 3); g.lineTo(fx + sd * (eyeGap + 12), eyeY + 1 + i * 4); g.stroke(); } } g.globalAlpha = 1; }
  if (menace) { // the frown knotted between the brows, a creased forehead, deep folds from nose to mouth
    g.strokeStyle = mixHex(skin, '#2a0c04', 0.6); g.lineWidth = 0.9; g.globalAlpha = 0.65; for (const dx of [-2.5, 2.5]) { g.beginPath(); g.moveTo(fx + dx, eyeY - 12); g.lineTo(fx + dx * 0.6, eyeY - 4); g.stroke(); } for (let i = 0; i < 2; i++) { g.beginPath(); g.moveTo(fx - 11, top + 20 + i * 5); g.quadraticCurveTo(fx, top + 17 + i * 5, fx + 11, top + 20 + i * 5); g.stroke(); } g.lineWidth = 1.3; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(fx + sd * 6, eyeY + 18); g.quadraticCurveTo(fx + sd * 13, eyeY + 28, fx + sd * 12, eyeY + 38); g.stroke(); } g.globalAlpha = 1;
    // scars: across the cheek, through the brow, along the jaw — a raised pale line with the stitch marks
    g.lineCap = 'round'; for (let k = 0; k < scarK; k++) { const [x0, y0, x1, y1] = [[fx - 20, eyeY + 4, fx - 8, eyeY + 24], [fx + 8, eyeY - 14, fx + 16, eyeY + 6], [fx - 16, chin - 18, fx + 2, chin - 6]][k]; g.strokeStyle = 'rgba(120,40,30,0.75)'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.strokeStyle = 'rgba(255,200,180,0.45)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x0 + 0.6, y0); g.lineTo(x1 + 0.6, y1); g.stroke(); for (let t = 0.2; t < 1; t += 0.25) { const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; g.strokeStyle = 'rgba(110,40,30,0.6)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x - 2, y + 1.5); g.lineTo(x + 2, y - 1.5); g.stroke(); } } }
  if (['楊志', '史進', '雷橫'].includes(p.id) || (R() < 0.08 && fierce && !menace)) { g.strokeStyle = 'rgba(110,35,25,0.55)'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(fx - 19, eyeY + 6); g.lineTo(fx - 10, eyeY + 21); g.stroke(); }
  g.restore();
  // ---- the eyes: deep in their sockets, dark irises, a glint, heavy lids; the brows set by temper
  for (const sd of [-1, 1]) {
    const ex = fx + sd * eyeGap, ey = eyeY, far = sd > 0, w = (female ? 8.5 : 8) * (far ? 0.9 : 1), h = menace ? 2.3 : (fierce ? 2.8 : female ? 4 : 3.3);
    if (patch && far) { g.fillStyle = '#16100c'; g.beginPath(); g.ellipse(ex, ey, w + 1.5, 6, 0.1, 0, 7); g.fill(); g.strokeStyle = '#16100c'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(ex - w, ey - 3); g.lineTo(fx - 22, eyeY - 16); g.moveTo(ex + w, ey - 2); g.lineTo(cx + jaw, eyeY - 4); g.stroke(); g.strokeStyle = 'rgba(255,255,255,0.15)'; g.lineWidth = 1; g.beginPath(); g.arc(ex - 1, ey - 1, 3.5, 3.6, 5); g.stroke(); continue; }
    g.fillStyle = menace ? '#d4c2a0' : '#ddd0bf'; g.beginPath(); g.moveTo(ex - w, ey + 0.5); g.quadraticCurveTo(ex - 1, ey - h * 1.5, ex + w, ey + (fierce ? -sd * 1 : 0)); g.quadraticCurveTo(ex, ey + h * 1.05, ex - w, ey + 0.5); g.fill();
    g.save(); g.clip(); const ig = g.createRadialGradient(ex - 0.5, ey - 1, 0.3, ex + 0.5, ey, 3.8); ig.addColorStop(0, female ? '#6a4228' : '#4a2c18'); ig.addColorStop(0.7, female ? '#2e1a10' : '#1e120a'); ig.addColorStop(1, '#0a0604'); g.fillStyle = ig; const ir = menace ? 2.9 : 3.6; g.beginPath(); g.arc(ex + 0.5 - (far ? 0.5 : 0), ey, ir, 0, 7); g.fill(); g.strokeStyle = female ? 'rgba(150,100,60,0.6)' : 'rgba(120,80,50,0.5)'; g.lineWidth = 0.5; g.beginPath(); g.arc(ex + 0.5 - (far ? 0.5 : 0), ey + 0.4, ir * 0.62, 0.2, 2.9); g.stroke(); g.fillStyle = '#040206'; g.beginPath(); g.arc(ex + 0.5, ey, menace ? 1.1 : 1.5, 0, 7); g.fill(); if (menace) { g.strokeStyle = 'rgba(170,40,30,0.35)'; g.lineWidth = 0.4; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(ex + sd * w * 0.9, ey + k * 0.6 - 0.5); g.lineTo(ex + sd * w * 0.45, ey); g.stroke(); } } g.fillStyle = 'rgba(30,10,5,0.55)'; g.fillRect(ex - w, ey - h * 1.6, w * 2, h * 0.95); g.restore();
    g.fillStyle = '#fffaf0'; g.beginPath(); g.arc(ex - 0.8, ey - 1.2, menace ? 0.7 : 0.95, 0, 7); g.fill(); g.fillStyle = 'rgba(255,250,240,0.55)'; g.beginPath(); g.arc(ex + 1.4, ey + 1, 0.45, 0, 7); g.fill();
    g.strokeStyle = '#140a06'; g.lineWidth = 0.6; for (let k = 0; k < (female ? 7 : 5); k++) { const t = 0.35 + k / 9, x = ex - w + t * w * 2, y = ey - h * 1.45 * Math.sin(t * Math.PI) + 0.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + sd * 0.6 + (t - 0.5) * 2, y - (female ? 2.4 : 1.4)); g.stroke(); }
    g.strokeStyle = '#140a06'; g.lineWidth = female ? 1.8 : 1.6; g.beginPath(); g.moveTo(ex - w - 0.5, ey + 0.8); g.quadraticCurveTo(ex - 1, ey - h * 1.6, ex + w + 0.6, ey + (fierce ? -sd * 1.2 : 0.3)); g.stroke();
    if (female) { g.lineWidth = 1.2; g.beginPath(); g.moveTo(ex + sd * w, ey); g.lineTo(ex + sd * (w + 3), ey - 1.6); g.stroke(); }
    g.strokeStyle = mixHex(skin, '#3a1208', 0.45); g.globalAlpha = 0.75; g.lineWidth = 0.7; g.beginPath(); g.moveTo(ex - w + 1, ey + 2); g.quadraticCurveTo(ex, ey + h + 1.5, ex + w - 1, ey + 2); g.stroke();
    g.lineWidth = 0.9; g.beginPath(); g.moveTo(ex - w + 0.5, ey - h - 2.8); g.quadraticCurveTo(ex - 1, ey - h * 1.9 - 2.2, ex + w, ey - h - 1.6); g.stroke(); g.globalAlpha = 1;
    const bc = old ? '#bcb8b0' : sh(hairC, 1.05), inner = fx + sd * 4, outer = fx + sd * (eyeGap + w + 3), by = ey - h - 6.5, tilt = menace ? 7 : fierce ? 4.5 : wise ? -1 : 1.5, thick = female ? 1.2 : menace ? 4.4 : burly || fierce ? 3.4 : 2.4;
    const nB = female ? 16 : menace ? 44 : 30; for (let i = 0; i < nB; i++) { const t = i / (nB - 1), x = inner + (outer - inner) * t, y = by + tilt * (1 - t) - Math.sin(t * Math.PI) * (female ? 2.6 : 1.8) + (R() - 0.5) * thick; g.strokeStyle = sh(bc, 0.7 + R() * 0.5, 0.92); g.lineWidth = female ? 0.9 : 1.15; g.beginPath(); g.moveTo(x, y); g.lineTo(x + sd * 2.8, y - 0.9 - R()); g.stroke(); }
  }
  // ---- the nose: a short lit bridge, a rounded tip, the far side in shade, the wings of the nostrils
  const nb = eyeY + 22 + (burly ? 2 : 0) + noseL, nw = (burly ? 7 : female ? 4.5 : 6) + (noseL > 1 ? 0.8 : 0), nx = fx - 1;
  g.strokeStyle = 'rgba(255,228,196,0.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(nx - 1, eyeY + 6); g.lineTo(nx - 1.5, nb - 6); g.stroke();
  g.fillStyle = 'rgba(40,12,6,0.32)'; g.beginPath(); g.moveTo(nx + 2.5, eyeY + 4); g.quadraticCurveTo(nx + 6, nb - 5, nx + nw + 1, nb + 1); g.lineTo(nx + 2, nb + 2); g.closePath(); g.fill();
  { const tg = g.createRadialGradient(nx - 1.5, nb - 2, 0.5, nx, nb, 6); tg.addColorStop(0, 'rgba(255,225,195,0.55)'); tg.addColorStop(1, 'rgba(255,225,195,0)'); g.fillStyle = tg; g.beginPath(); g.arc(nx, nb - 1, 6, 0, 7); g.fill(); }
  g.fillStyle = 'rgba(30,8,4,0.75)'; for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(nx + sd * (nw - 3.2), nb + 1.5, 2, 1.1, sd * 0.3, 0, 7); g.fill(); }
  g.strokeStyle = 'rgba(40,12,6,0.55)'; g.lineWidth = 1; g.beginPath(); g.moveTo(nx - nw, nb - 2); g.quadraticCurveTo(nx - nw - 2.5, nb + 3, nx - nw + 2, nb + 3.5); g.moveTo(nx + nw, nb - 2); g.quadraticCurveTo(nx + nw + 2.5, nb + 3, nx + nw - 2, nb + 3.5); g.stroke();
  // ---- the mouth: an upper lip in shadow, a lit lower lip, the line between set by temper
  const my = nb + (female ? 11 : 12.5) - noseL * 0.3, mw = (female ? 7.5 : 9) + mouthW, mx = fx - 0.5;
  g.fillStyle = female ? '#9a3038' : mixHex(skin, '#5a1a10', 0.45); g.beginPath(); g.moveTo(mx - mw, my); g.quadraticCurveTo(mx - 3, my - 3.2, mx, my - 2); g.quadraticCurveTo(mx + 3, my - 3.2, mx + mw, my); g.closePath(); g.fill();
  g.fillStyle = female ? '#c04a52' : mixHex(skin, '#8a3a2a', 0.35); g.beginPath(); g.moveTo(mx - mw + 1.5, my + 0.5); g.quadraticCurveTo(mx, my + (female ? 5.5 : 4.2), mx + mw - 1.5, my + 0.5); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,220,200,0.35)'; g.beginPath(); g.ellipse(mx - 1, my + 2.4, 3, 0.9, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,225,205,0.22)'; g.beginPath(); g.ellipse(mx - 3, my - 1.6, 2, 0.5, -0.2, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,225,200,0.25)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(mx - 1.2, my - 2.4); g.lineTo(mx - 1.6, nb + 4); g.moveTo(mx + 1.2, my - 2.4); g.lineTo(mx + 1, nb + 4); g.stroke();
  g.strokeStyle = '#220c08'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(mx - mw, my + (fierce ? 1.2 : 0)); g.quadraticCurveTo(mx, my - (fierce ? 0 : 0.8), mx + mw, my + (fierce ? 1.2 : 0)); g.stroke();
  if (menace) { // a snarl: the lip curled up at one side over bared teeth
    g.fillStyle = '#1a0806'; g.beginPath(); g.moveTo(mx - mw + 2, my + 0.5); g.quadraticCurveTo(mx, my - 1.2, mx + mw - 1, my - 1.5); g.quadraticCurveTo(mx + 2, my + 3.5, mx - mw + 2, my + 0.5); g.fill(); g.fillStyle = '#e8dcc0'; for (let k = 0; k < 5; k++) { const x = mx - mw + 4 + k * 2.6; g.fillRect(x, my - 0.6 + (k > 3 ? -0.6 : 0), 2, 1.6); } g.fillStyle = '#f0e8d0'; g.beginPath(); g.moveTo(mx + mw - 3.5, my - 1); g.lineTo(mx + mw - 2.5, my + 1.8); g.lineTo(mx + mw - 1.5, my - 1.2); g.fill(); g.strokeStyle = '#220c08'; g.lineWidth = 1; g.beginPath(); g.moveTo(mx + mw - 1, my - 1.5); g.lineTo(mx + mw + 1.5, my - 3.5); g.stroke(); }
  soft2(g, mx, my + 7, 8, 3, 'rgba(40,12,6,1)', 0.3);
  if (female) { g.fillStyle = 'rgba(220,100,100,0.18)'; for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(fx + sd * 15, eyeY + 15, 7, 4, 0, 0, 7); g.fill(); } }
  // ---- the beard, hair by hair
  beard(g, R, beardK, old ? '#d0ccc4' : hairC, { cx: fx, my, nb, chin, jaw, eyeY, burly });
  // ---- hair and what is worn on the head
  headwear(g, R, p, L, { cx: cx - 1, top, jaw: jaw + 1, eyeY, hairC, skin, side, female });
  if (L.hat !== 'monk' && L.hat !== 'helm') for (const sd of [-1, 1]) for (let k = 0; k < (female ? 8 : 14); k++) { const x = cx + sd * (jaw - 1 - R() * 3), y = top + 26 + R() * 6; g.strokeStyle = sh(hairC, 0.7 + R() * 0.7, 0.8); g.lineWidth = 0.6; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + sd * 1.5, y + 10, x - sd * 0.5 + (R() - 0.5) * 2, y + (female ? 26 : 14) + R() * 8); g.stroke(); }
  if (L.hat === 'helm') { g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.ellipse(cx - 12, top - 4, 3, 1.4, -0.6, 0, 7); g.fill(); }
  g.restore();
  // ---- finish: a vignette, a little warmth, brushwork over the whole
  const vg = g.createRadialGradient(W * 0.45, H * 0.42, 40, W / 2, H / 2, 125); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'soft-light'; g.fillStyle = 'rgba(255,170,90,0.18)'; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over';
  brush(c, R);
  g.strokeStyle = 'rgba(200,170,110,0.85)'; g.lineWidth = 1.5; g.strokeRect(0.75, 0.75, W - 1.5, H - 1.5); g.strokeStyle = 'rgba(0,0,0,0.8)'; g.lineWidth = 1; g.strokeRect(2.5, 2.5, W - 5, H - 5);
  CACHE.set(p.id, c); return c;
}
function soft2(g, x, y, rx, ry, col, a) { const r = Math.max(rx, ry), gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col.replace(/[\d.]+\)$/, a + ')')); gr.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); g.save(); g.translate(x, y); g.scale(rx / r, ry / r); g.translate(-x, -y); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore(); }
function path(g, pts) { g.beginPath(); g.moveTo(...pts[0]); for (const q of pts.slice(1)) q.length === 4 ? g.quadraticCurveTo(...q) : g.lineTo(...q); g.closePath(); }
// many fine hairs between two corners, falling downward
function strands(g, R, col, x0, y0, x1, y1, n, a) { for (let i = 0; i < n; i++) { const x = x0 + R() * (x1 - x0), y = y0 + R() * (y1 - y0) * 0.4; g.strokeStyle = sh(col, 0.6 + R() * 0.9, a); g.lineWidth = 0.6 + R() * 0.8; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + (R() - 0.5) * 8, (y + y1) / 2, x + (R() - 0.5) * 14, y1 - R() * 20); g.stroke(); } }
// ---------------------------------------------------------------- armour, robes, a monk's robe
function body(g, R, p, L, o) {
  const { cx, side, armour, female, burly } = o, sw = burly ? 70 : female ? 52 : 62;
  const shoulders = () => { g.beginPath(); g.moveTo(cx - sw - 12, 200); g.bezierCurveTo(cx - sw - 8, 168, cx - sw + 6, 154, cx - 18, 150); g.lineTo(cx + 18, 150); g.bezierCurveTo(cx + sw - 6, 154, cx + sw + 8, 168, cx + sw + 12, 200); g.closePath(); };
  if (L.hat === 'monk') {
    shoulders(); const rg = g.createLinearGradient(cx - sw, 150, cx + sw, 200); rg.addColorStop(0, '#9a5a2a'); rg.addColorStop(1, '#4a2410'); g.fillStyle = rg; g.fill();
    g.fillStyle = '#b8862a'; g.beginPath(); g.moveTo(cx - sw, 165); g.lineTo(cx + 20, 150); g.lineTo(cx + 40, 156); g.lineTo(cx - sw + 18, 200); g.lineTo(cx - sw - 6, 200); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(60,30,10,0.6)'; g.lineWidth = 1; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(cx - sw + 6 + i * 8, 172 + i * 3); g.lineTo(cx - sw + 14 + i * 8, 200); g.stroke(); }
    for (let i = 0; i < 14; i++) { const t = i / 13, x = cx - 30 + t * 60, y = 158 + Math.sin(t * Math.PI) * 16; const bg = g.createRadialGradient(x - 1, y - 1, 0.5, x, y, 4); bg.addColorStop(0, '#d8b080'); bg.addColorStop(1, '#4a2a14'); g.fillStyle = bg; g.beginPath(); g.arc(x, y, 3.6, 0, 7); g.fill(); }
    return;
  }
  if (armour) {
    // a cape in the side's colour behind the shoulders
    g.fillStyle = sh(side, 0.7); g.beginPath(); g.moveTo(cx - sw - 16, 200); g.lineTo(cx - sw + 4, 158); g.lineTo(cx + sw - 4, 158); g.lineTo(cx + sw + 16, 200); g.fill();
    shoulders(); const ag = g.createLinearGradient(cx - sw, 150, cx + sw, 200); const metal = L.hat === 'fur' ? '#6a5a4a' : p.side === 'fang' ? '#8a6a3a' : '#7a7e88'; ag.addColorStop(0, sh(metal, 1.25)); ag.addColorStop(0.5, metal); ag.addColorStop(1, sh(metal, 0.35)); g.fillStyle = ag; g.fill();
    g.save(); shoulders(); g.clip();
    // lamellar plates: rows of small rounded scales, lit from above-left
    for (let row = 0, y = 156; y < 204; y += 6.5, row++) for (let x = cx - sw - 10 + (row % 2) * 4.5; x < cx + sw + 10; x += 9) {
      const lit = 1.2 - (x - (cx - sw)) / (sw * 2) * 0.8 - (y - 156) / 140, pg = g.createLinearGradient(0, y, 0, y + 6); pg.addColorStop(0, sh(metal, Math.max(0.3, lit + 0.25))); pg.addColorStop(1, sh(metal, Math.max(0.15, lit - 0.35)));
      g.fillStyle = pg; g.beginPath(); g.roundRect(x, y, 8, 6.5, [1, 1, 3, 3]); g.fill(); g.strokeStyle = 'rgba(10,8,8,0.6)'; g.lineWidth = 0.6; g.stroke(); }
    g.restore();
    // pauldrons with a gold trim, a collar of dark leather, a gold-trimmed breast plate
    for (const sd of [-1, 1]) { const x = cx + sd * (sw - 10), pg = g.createRadialGradient(x - sd * 6, 158, 2, x, 166, 26); pg.addColorStop(0, sh(metal, 1.5)); pg.addColorStop(0.6, metal); pg.addColorStop(1, sh(metal, 0.3)); g.fillStyle = pg;
      for (let k = 2; k >= 0; k--) { g.beginPath(); g.ellipse(x + sd * k * 3, 162 + k * 7, 24 - k * 2, 11, sd * 0.35, Math.PI, 0); g.fill(); g.strokeStyle = '#c8a040'; g.lineWidth = 1.2; g.stroke(); } }
    g.fillStyle = '#2a1e18'; g.beginPath(); g.moveTo(cx - 20, 150); g.quadraticCurveTo(cx, 168, cx + 20, 150); g.lineTo(cx + 16, 146); g.quadraticCurveTo(cx, 160, cx - 16, 146); g.fill();
    const bp = g.createLinearGradient(cx - 18, 165, cx + 18, 200); bp.addColorStop(0, sh(metal, 1.4)); bp.addColorStop(1, sh(metal, 0.4)); g.fillStyle = bp; g.beginPath(); g.moveTo(cx - 20, 170); g.quadraticCurveTo(cx, 162, cx + 20, 170); g.lineTo(cx + 18, 200); g.lineTo(cx - 18, 200); g.fill(); g.strokeStyle = '#d8b050'; g.lineWidth = 1.4; g.stroke();
    g.fillStyle = '#d8b050'; g.beginPath(); g.arc(cx, 182, 5, 0, 7); g.fill(); g.fillStyle = sh(side, 1.1); g.beginPath(); g.arc(cx, 182, 3, 0, 7); g.fill();
    if (L.hat === 'fur') { g.fillStyle = '#8a6a4a'; for (let i = 0; i < 40; i++) { const x = cx - sw + R() * sw * 2, y = 150 + R() * 14; g.fillStyle = sh('#8a6a4a', 0.7 + R() * 0.7); g.fillRect(x, y, 2, 5); } }
    return;
  }
  // a robe: outer cloth in the side's colour (or plain for scholars), an inner collar crossed right over left
  const cloth = female ? (R() < 0.5 ? '#8a2a4a' : '#3a5a7a') : L.hat === 'scholar' || L.hat === 'taoist' ? (L.hat === 'taoist' ? '#3a3a5a' : '#4a5a6a') : L.hat === 'official' ? '#5a1a22' : sh(side, 1.05).replace('rgba', 'rgb').replace(/,1\)$/, ')');
  const clothHex = cloth.startsWith('#') ? cloth : '#' + cloth.match(/\d+/g).slice(0, 3).map((v) => (+v).toString(16).padStart(2, '0')).join('');
  shoulders(); const rg = g.createLinearGradient(cx - sw, 150, cx + sw, 200); rg.addColorStop(0, sh(clothHex, 1.35)); rg.addColorStop(0.5, clothHex); rg.addColorStop(1, sh(clothHex, 0.35)); g.fillStyle = rg; g.fill();
  g.save(); shoulders(); g.clip(); g.strokeStyle = sh(clothHex, 0.45, 0.6); g.lineWidth = 1.2; for (let i = 0; i < 9; i++) { const x = cx - sw + 8 + i * (sw * 2 - 16) / 8; g.beginPath(); g.moveTo(x, 160 + R() * 6); g.quadraticCurveTo(x + (R() - 0.5) * 10, 182, x + (R() - 0.5) * 6, 202); g.stroke(); } g.restore();
  g.fillStyle = '#ece4d4'; g.beginPath(); g.moveTo(cx - 16, 150); g.lineTo(cx + 14, 186); g.lineTo(cx + 6, 190); g.lineTo(cx - 20, 154); g.fill(); g.beginPath(); g.moveTo(cx + 16, 150); g.lineTo(cx - 8, 190); g.lineTo(cx - 14, 186); g.lineTo(cx + 20, 154); g.fill();
  g.strokeStyle = sh(clothHex, 0.6); g.lineWidth = 3; g.beginPath(); g.moveTo(cx + 18, 152); g.lineTo(cx - 10, 194); g.stroke();
  if (female) { g.fillStyle = '#e8c060'; g.beginPath(); g.moveTo(cx - 24, 188); g.lineTo(cx + 24, 188); g.lineTo(cx + 22, 196); g.lineTo(cx - 22, 196); g.fill(); }
}
// ---------------------------------------------------------------- beards
function beard(g, R, kind, col, o) {
  const { cx, my, nb, chin, jaw, eyeY, burly } = o; if (!kind || kind === 'none') return;
  const hair = (x, y, x2, y2, w = 0.9, a = 0.85) => { const k = R(); g.strokeStyle = k < 0.7 ? sh(col, 0.55 + k * 0.7, a) : mix(col, '#9a7a5a', (k - 0.7) * 1.6, a); g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo((x + x2) / 2 + (R() - 0.5) * 3, (y + y2) / 2, x2, y2); g.stroke(); };
  if (kind === 'stub') { g.fillStyle = sh(col, 1, 0.22); g.beginPath(); g.moveTo(cx - jaw + 4, eyeY + 18); g.quadraticCurveTo(cx - jaw + 6, chin - 6, cx, chin + 1); g.quadraticCurveTo(cx + jaw - 6, chin - 6, cx + jaw - 4, eyeY + 18); g.lineTo(cx + 12, my - 3); g.lineTo(cx - 12, my - 3); g.fill(); for (let i = 0; i < 140; i++) { const a = R() * Math.PI, r = R(), x = cx + Math.cos(a) * (jaw - 4) * (0.4 + r * 0.6), y = my - 4 + Math.sin(a) * (chin - my + 2) * (0.3 + r * 0.7); g.fillStyle = sh(col, 0.8, 0.5); g.fillRect(x, y, 0.8, 0.8); } return; }
  // the moustache: two wings from under the nose, drooping
  const mo = () => { for (const sd of [-1, 1]) { const mg = g.createLinearGradient(cx, nb + 3, cx + sd * 16, my + 8); mg.addColorStop(0, mix(col, '#6a4a36', 0.25, 0.95)); mg.addColorStop(1, sh(col, 0.6, 0.85)); g.fillStyle = mg; g.beginPath(); g.moveTo(cx + sd * 0.5, nb + 3.5); g.quadraticCurveTo(cx + sd * 10, nb + 2, cx + sd * 14, my + (kind === 'long' ? 9 : 4)); g.quadraticCurveTo(cx + sd * 17, my + 10, cx + sd * 15, my + (kind === 'long' ? 16 : 10)); g.quadraticCurveTo(cx + sd * 10, my + 2, cx + sd * 4, my - 1); g.quadraticCurveTo(cx + sd * 1, my - 2, cx + sd * 0.5, nb + 9); g.closePath(); g.fill(); }
    for (const sd of [-1, 1]) for (let i = 0; i < 40; i++) { const t = R(), x = cx + sd * (1 + t * 3), y = nb + 4 + R() * 3; hair(x, y, cx + sd * (10 + t * 6 + R() * 3), my + 2 + t * 6 + (kind === 'long' ? 4 : 0), 1, 0.9); } };
  if (kind === 'mous') { mo(); return; }
  if (kind === 'goatee') { mo(); for (let i = 0; i < 46; i++) { const x = cx + (R() - 0.5) * 10; hair(x, my + 4, x + (R() - 0.5) * 6, chin + 12 + R() * 10, 1); } return; }
  if (kind === 'long') { // a long, fine beard reaching the chest — the 美髯
    { const bg = g.createLinearGradient(cx - 14, my, cx + 14, 196); bg.addColorStop(0, mix(col, '#7a5a44', 0.3, 0.9)); bg.addColorStop(1, sh(col, 0.45, 0.92)); g.fillStyle = bg; g.beginPath(); g.moveTo(cx - jaw + 6, my - 2); g.quadraticCurveTo(cx - 18, 170, cx - 6, 198); g.lineTo(cx + 6, 198); g.quadraticCurveTo(cx + 16, 170, cx + jaw - 6, my - 2); g.quadraticCurveTo(cx, my + 6, cx - jaw + 6, my - 2); g.fill(); }
    mo(); for (let i = 0; i < 120; i++) { const t = R(), x = cx + (t - 0.5) * jaw * 1.6, y = my + 2 + Math.abs(t - 0.5) * 18; hair(x, y, cx + (t - 0.5) * 22 + (R() - 0.5) * 6, 186 + R() * 14 - Math.abs(t - 0.5) * 20, 0.9, 0.8); }
    return; }
  if (kind === 'full') { // a bushy beard round the whole jaw — the 虯髯
    { const bg = g.createLinearGradient(cx - jaw, eyeY + 10, cx + jaw, chin + 26); bg.addColorStop(0, mix(col, '#7a5a44', 0.35, 0.95)); bg.addColorStop(0.5, sh(col, 0.95, 0.96)); bg.addColorStop(1, sh(col, 0.4, 0.98)); g.fillStyle = bg; } g.beginPath(); g.moveTo(cx - jaw - 2, eyeY + 10); g.quadraticCurveTo(cx - jaw - 6, chin + 6, cx - 12, chin + 18 + (burly ? 6 : 0)); g.quadraticCurveTo(cx, chin + 26 + (burly ? 6 : 0), cx + 12, chin + 18 + (burly ? 6 : 0)); g.quadraticCurveTo(cx + jaw + 6, chin + 6, cx + jaw + 2, eyeY + 10); g.lineTo(cx + jaw - 6, eyeY + 16); g.quadraticCurveTo(cx + 12, my - 8, cx, my - 7); g.quadraticCurveTo(cx - 12, my - 8, cx - jaw + 6, eyeY + 16); g.closePath(); g.fill();
    for (let i = 0; i < 260; i++) { const a = R() * Math.PI, r = 0.35 + R() * 0.65, x = cx + Math.cos(a) * (jaw + 3) * r, y = my - 6 + Math.sin(a) * (chin - my + 22) * r; hair(x, y, x + (R() - 0.5) * 6 + Math.cos(a) * 4, y + 5 + R() * 6, 0.9, 0.85); }
    mo(); g.fillStyle = '#2a120e'; g.beginPath(); g.ellipse(cx, my + 1, 6, 1.6, 0, 0, 7); g.fill(); }
}
// ---------------------------------------------------------------- what they wear on their heads
function headwear(g, R, p, L, o) {
  const { cx, top, jaw, eyeY, hairC, skin, side, female } = o, hat = L.hat;
  const hairTop = (lowY = top + 30) => { // hair swept back over the crown, a hairline at the temples
    const hg = g.createLinearGradient(cx - jaw, top - 10, cx + jaw, lowY); hg.addColorStop(0, sh(hairC, 1.5)); hg.addColorStop(0.4, hairC); hg.addColorStop(1, sh(hairC, 0.5)); g.fillStyle = hg;
    g.beginPath(); g.moveTo(cx - jaw - 2, lowY + 8); g.bezierCurveTo(cx - jaw - 4, top - 10, cx + jaw + 4, top - 10, cx + jaw + 2, lowY + 8); g.quadraticCurveTo(cx + jaw - 6, lowY - 6, cx, lowY - 10); g.quadraticCurveTo(cx - jaw + 6, lowY - 6, cx - jaw - 2, lowY + 8); g.fill();
    for (let i = 0; i < 50; i++) { const t = R(), x = cx - jaw + t * jaw * 2; g.strokeStyle = sh(hairC, 0.6 + R() * 1.1, 0.6); g.lineWidth = 0.7; g.beginPath(); g.moveTo(cx + (t - 0.5) * 10, top - 4); g.quadraticCurveTo(x, top + 4, x + (t - 0.5) * 8, lowY - 2 + Math.abs(t - 0.5) * 18); g.stroke(); }
  };
  const knot = (y = top - 12) => { const kg = g.createRadialGradient(cx - 3, y - 3, 1, cx, y, 10); kg.addColorStop(0, sh(hairC, 1.6)); kg.addColorStop(1, sh(hairC, 0.5)); g.fillStyle = kg; g.beginPath(); g.ellipse(cx, y, 9, 8, 0, 0, 7); g.fill(); };
  const metal = (x0, y0, x1, y1, base) => { const mg = g.createLinearGradient(x0, y0, x1, y1); mg.addColorStop(0, sh(base, 1.7)); mg.addColorStop(0.35, sh(base, 1.15)); mg.addColorStop(0.7, base); mg.addColorStop(1, sh(base, 0.35)); return mg; };
  if (hat === 'helm') {
    const hh = hash(p.id), base = p.side === 'liao' ? '#7a6a5a' : p.side === 'fang' ? '#9a7a3a' : ['#8a8e98', '#6a6e7a', '#9a8a6a', '#4a4c56', '#a8a090'][hh % 5], plume = ['#c83a2a', '#c83a2a', '#e8e0d0', '#2a2a30', '#d8a830'][(hh >>> 3) % 5], trim = (hh >>> 6) % 3 ? ['#f0d070', '#8a6018'] : ['#e0e4ec', '#6a6e78'];
    // neck guard flaps, the bowl, a gilded brow band, a spike with a red tassel
    g.fillStyle = metal(cx - jaw - 10, top, cx + jaw + 10, top + 70, base); for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(cx + sd * (jaw - 2), top + 26); g.quadraticCurveTo(cx + sd * (jaw + 14), top + 46, cx + sd * (jaw + 10), top + 74); g.lineTo(cx + sd * (jaw + 2), top + 70); g.quadraticCurveTo(cx + sd * (jaw + 4), top + 46, cx + sd * (jaw - 6), top + 30); g.fill(); g.strokeStyle = 'rgba(20,15,10,0.6)'; g.lineWidth = 0.8; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(cx + sd * (jaw + 1), top + 40 + k * 8); g.lineTo(cx + sd * (jaw + 11), top + 44 + k * 8); g.stroke(); } }
    g.fillStyle = metal(cx - jaw, top - 22, cx + jaw, top + 30, base); g.beginPath(); g.moveTo(cx - jaw - 5, top + 28); g.bezierCurveTo(cx - jaw - 6, top - 24, cx + jaw + 6, top - 24, cx + jaw + 5, top + 28); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 2; g.beginPath(); g.arc(cx - 8, top + 6, jaw * 0.7, Math.PI * 1.1, Math.PI * 1.45); g.stroke();
    for (let k = -2; k <= 2; k++) { g.strokeStyle = 'rgba(20,15,10,0.45)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(cx + k * 9, top - 14 + Math.abs(k) * 3); g.quadraticCurveTo(cx + k * 11, top + 8, cx + k * 12, top + 26); g.stroke(); }
    const bg = g.createLinearGradient(0, top + 20, 0, top + 32); bg.addColorStop(0, trim[0]); bg.addColorStop(1, trim[1]); g.fillStyle = bg; g.beginPath(); g.moveTo(cx - jaw - 6, top + 22); g.quadraticCurveTo(cx, top + 14, cx + jaw + 6, top + 22); g.lineTo(cx + jaw + 5, top + 31); g.quadraticCurveTo(cx, top + 23, cx - jaw - 5, top + 31); g.fill();
    g.fillStyle = '#c83a2a'; g.beginPath(); g.arc(cx, top + 22, 3, 0, 7); g.fill();
    g.fillStyle = metal(cx - 3, top - 40, cx + 3, top - 18, '#c8a040'); g.beginPath(); g.moveTo(cx - 3, top - 18); g.lineTo(cx, top - 42); g.lineTo(cx + 3, top - 18); g.fill();
    const [pr, pg2, pb] = hex(plume); for (let i = 0; i < 40; i++) { const k = 0.7 + R() * 0.5; g.strokeStyle = `rgba(${pr * k},${pg2 * k},${pb * k},0.85)`; g.lineWidth = 1; g.beginPath(); g.moveTo(cx, top - 30); g.quadraticCurveTo(cx - 10 - R() * 10, top - 32 + R() * 6, cx - 18 - R() * 16, top - 14 + R() * 18); g.stroke(); }
    return;
  }
  if (hat === 'fur') { hairTop(); const fg = g.createLinearGradient(0, top - 22, 0, top + 30); fg.addColorStop(0, '#a88a6a'); fg.addColorStop(1, '#4a3424'); g.fillStyle = fg; g.beginPath(); g.moveTo(cx - jaw - 8, top + 30); g.bezierCurveTo(cx - jaw - 8, top - 26, cx + jaw + 8, top - 26, cx + jaw + 8, top + 30); g.closePath(); g.fill(); for (let i = 0; i < 160; i++) { const a = Math.PI + R() * Math.PI, r = jaw + 6 + R() * 4, x = cx + Math.cos(a) * r, y = top + 14 + Math.sin(a) * (r + 8); g.strokeStyle = sh('#a88a6a', 0.5 + R() * 1.2, 0.8); g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - 0.5) * 3, y + 4); g.stroke(); } g.fillStyle = '#e8dcc4'; g.fillRect(cx - jaw - 8, top + 24, jaw * 2 + 16, 8); for (const sd of [-1, 1]) { g.fillStyle = '#5a4030'; g.beginPath(); g.ellipse(cx + sd * (jaw + 6), top + 46, 7, 18, 0, 0, 7); g.fill(); } return; }
  if (hat === 'monk') { // the shaved head, with the burn marks of ordination
    const sg = g.createRadialGradient(cx - 10, top - 4, 2, cx, top + 14, jaw + 10); sg.addColorStop(0, sh(skin, 1.35)); sg.addColorStop(0.6, skin); sg.addColorStop(1, sh(skin, 0.5)); g.fillStyle = sg; g.beginPath(); g.moveTo(cx - jaw - 1, top + 32); g.bezierCurveTo(cx - jaw - 3, top - 14, cx + jaw + 3, top - 14, cx + jaw + 1, top + 32); g.closePath(); g.fill();
    g.fillStyle = 'rgba(40,40,50,0.25)'; g.beginPath(); g.moveTo(cx - jaw - 1, top + 30); g.bezierCurveTo(cx - jaw - 2, top - 8, cx + jaw + 2, top - 8, cx + jaw + 1, top + 30); g.fill();
    for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(140,60,50,0.7)'; g.beginPath(); g.arc(cx - 10 + (i % 3) * 10, top + (i < 3 ? 2 : 10), 1.5, 0, 7); g.fill(); } return; }
  if (hat === 'hair') { // wild hair, standing and falling loose
    hairTop(top + 34); for (let i = 0; i < 140; i++) { const a = Math.PI * (0.9 + R() * 1.2), r = jaw + 4 + R() * 14, x = cx + Math.cos(a) * r * 0.9, y = top + 20 + Math.sin(a) * r; g.strokeStyle = sh(hairC, 0.6 + R() * 1, 0.85); g.lineWidth = 1 + R(); g.beginPath(); g.moveTo(cx + Math.cos(a) * jaw * 0.6, top + 18 + Math.sin(a) * jaw * 0.6); g.quadraticCurveTo(x, y, x + Math.cos(a) * 8 + (R() - 0.5) * 6, y + Math.sin(a) * 8 + 10); g.stroke(); }
    if (p.id === '武松') { g.fillStyle = '#b89a50'; g.fillRect(cx - jaw - 4, top + 22, jaw * 2 + 8, 6); g.fillStyle = '#e8d080'; g.beginPath(); g.arc(cx, top + 25, 4, 0, 7); g.fill(); } return; }
  if (hat === 'female') { // centre parting, side locks, a high knot with pins and a flower
    hairTop(top + 36); for (const sd of [-1, 1]) { g.fillStyle = hairC; g.beginPath(); g.moveTo(cx + sd * (jaw - 2), top + 24); g.quadraticCurveTo(cx + sd * (jaw + 10), eyeY + 20, cx + sd * (jaw + 4), eyeY + 56); g.lineTo(cx + sd * (jaw - 2), eyeY + 50); g.quadraticCurveTo(cx + sd * (jaw + 3), eyeY + 10, cx + sd * (jaw - 6), top + 30); g.fill(); }
    knot(top - 14); g.beginPath(); g.ellipse(cx, top - 4, 16, 9, 0, 0, 7); g.fill();
    g.strokeStyle = '#e8c060'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(cx - 20, top - 14); g.lineTo(cx + 22, top - 4); g.stroke(); g.fillStyle = '#e8c060'; g.beginPath(); g.arc(cx + 22, top - 4, 2.5, 0, 7); g.fill();
    for (let i = 0; i < 5; i++) { g.fillStyle = i % 2 ? '#f0a0b8' : '#d84a6a'; g.beginPath(); g.arc(cx - 14 + Math.cos(i * 1.26) * 4, top - 10 + Math.sin(i * 1.26) * 4, 2.6, 0, 7); g.fill(); } return; }
  if (hat === 'scarf' || hat === 'band') {
    hairTop(); knot();
    if (hat === 'band') { g.fillStyle = '#a82a22'; g.beginPath(); g.moveTo(cx - jaw - 3, top + 22); g.quadraticCurveTo(cx, top + 15, cx + jaw + 3, top + 22); g.lineTo(cx + jaw + 3, top + 29); g.quadraticCurveTo(cx, top + 22, cx - jaw - 3, top + 29); g.fill(); g.strokeStyle = '#a82a22'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx + jaw + 2, top + 24); g.quadraticCurveTo(cx + jaw + 16, top + 30, cx + jaw + 14, top + 52); g.stroke(); return; }
    // a cloth wrapped over the knot, its two tails hanging behind
    const sc = ['#3a3a4a', '#4a2a22', '#2a3a4a', '#3a4a2a', '#5a4a3a'][hash(p.id) % 5], cg = g.createLinearGradient(cx - jaw, top - 24, cx + jaw, top + 26); cg.addColorStop(0, sh(sc, 1.6)); cg.addColorStop(0.5, sc); cg.addColorStop(1, sh(sc, 0.4));
    g.fillStyle = cg; g.beginPath(); g.moveTo(cx - jaw - 4, top + 26); g.bezierCurveTo(cx - jaw - 6, top - 26, cx + jaw + 6, top - 26, cx + jaw + 4, top + 26); g.quadraticCurveTo(cx, top + 16, cx - jaw - 4, top + 26); g.fill();
    g.strokeStyle = sh(sc, 0.35, 0.7); g.lineWidth = 1; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(cx - jaw + k * 6, top + 22 - k); g.quadraticCurveTo(cx - 4 + k * 4, top - 14, cx + jaw - 2, top - 2 + k * 4); g.stroke(); }
    for (const sd of [1]) { g.fillStyle = sh(sc, 0.7); g.beginPath(); g.moveTo(cx + sd * (jaw - 4), top); g.quadraticCurveTo(cx + sd * (jaw + 18), top + 10, cx + sd * (jaw + 14), top + 46); g.lineTo(cx + sd * (jaw + 8), top + 44); g.quadraticCurveTo(cx + sd * (jaw + 10), top + 14, cx + sd * (jaw - 6), top + 6); g.fill(); }
    return;
  }
  if (hat === 'taoist') { hairTop(); knot(top - 10); const tg = metal(cx - 10, top - 26, cx + 10, top - 6, '#c8a040'); g.fillStyle = tg; g.beginPath(); g.moveTo(cx - 9, top - 6); g.lineTo(cx - 7, top - 22); g.lineTo(cx, top - 28); g.lineTo(cx + 7, top - 22); g.lineTo(cx + 9, top - 6); g.fill(); g.strokeStyle = '#e8e0d0'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(cx - 18, top - 12); g.lineTo(cx + 18, top - 14); g.stroke(); return; }
  if (hat === 'scholar') { hairTop(); g.fillStyle = metal(cx - jaw, top - 24, cx + jaw, top + 24, '#2a2e38'); g.beginPath(); g.moveTo(cx - jaw - 3, top + 24); g.lineTo(cx - jaw + 2, top - 18); g.quadraticCurveTo(cx, top - 26, cx + jaw - 2, top - 18); g.lineTo(cx + jaw + 3, top + 24); g.quadraticCurveTo(cx, top + 14, cx - jaw - 3, top + 24); g.fill(); g.strokeStyle = 'rgba(200,200,220,0.25)'; g.lineWidth = 1; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(cx + k * 7, top - 18); g.lineTo(cx + k * 8, top + 18); g.stroke(); } for (const sd of [-1, 1]) { g.fillStyle = '#3a3e48'; g.beginPath(); g.moveTo(cx + sd * jaw, top + 10); g.quadraticCurveTo(cx + sd * (jaw + 14), top + 30, cx + sd * (jaw + 10), top + 70); g.lineTo(cx + sd * (jaw + 5), top + 68); g.quadraticCurveTo(cx + sd * (jaw + 8), top + 30, cx + sd * (jaw - 4), top + 14); g.fill(); } return; }
  if (hat === 'official') { hairTop(); g.fillStyle = metal(cx - jaw, top - 22, cx + jaw, top + 24, '#1a1a20'); g.beginPath(); g.moveTo(cx - jaw - 3, top + 24); g.bezierCurveTo(cx - jaw - 4, top - 24, cx + jaw + 4, top - 24, cx + jaw + 3, top + 24); g.closePath(); g.fill(); g.fillRect(cx - jaw + 4, top - 30, jaw * 2 - 8, 14); for (const sd of [-1, 1]) { g.fillStyle = '#121216'; g.beginPath(); g.moveTo(cx + sd * jaw, top + 2); g.lineTo(cx + sd * (jaw + 40), top - 4); g.lineTo(cx + sd * (jaw + 40), top + 4); g.lineTo(cx + sd * jaw, top + 10); g.fill(); g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(Math.min(cx + sd * jaw, cx + sd * (jaw + 40)), top - 2, 40, 1); } g.fillStyle = '#c8a040'; g.fillRect(cx - jaw + 2, top + 16, jaw * 2 - 4, 3); return; }
  if (hat === 'turban') { hairTop(); for (let k = 0; k < 6; k++) { const y = top - 16 + k * 7, tg = g.createLinearGradient(cx - jaw, y, cx + jaw, y + 8); tg.addColorStop(0, '#e8604a'); tg.addColorStop(0.5, '#b8302a'); tg.addColorStop(1, '#5a1210'); g.fillStyle = tg; g.beginPath(); g.ellipse(cx, y + 4, jaw + 6 - Math.abs(k - 3) * 2, 6, (k % 2 ? 0.08 : -0.08), 0, 7); g.fill(); } g.fillStyle = '#e8c040'; g.beginPath(); g.arc(cx, top + 6, 4, 0, 7); g.fill(); return; }
  if (hat === 'crown') { hairTop(); knot(top - 8); const cg = metal(cx - 22, top - 30, cx + 22, top, '#d8a830'); g.fillStyle = cg; g.beginPath(); g.moveTo(cx - 22, top + 4); g.lineTo(cx - 24, top - 14); g.lineTo(cx - 12, top - 6); g.lineTo(cx - 6, top - 26); g.lineTo(cx, top - 10); g.lineTo(cx + 6, top - 26); g.lineTo(cx + 12, top - 6); g.lineTo(cx + 24, top - 14); g.lineTo(cx + 22, top + 4); g.fill(); for (const [x, c] of [[-12, '#3a6ac8'], [0, '#c83a3a'], [12, '#3a6ac8']]) { g.fillStyle = c; g.beginPath(); g.arc(cx + x, top - 2, 2.6, 0, 7); g.fill(); } for (let i = 0; i < 9; i++) { g.strokeStyle = '#e8e0c8'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(cx - 20 + i * 5, top + 4); g.lineTo(cx - 20 + i * 5, top + 14); g.stroke(); } return; }
  hairTop(); knot();
}
// ---------------------------------------------------------------- brushwork: short strokes of the picture's own colours along its edges
function brush(c, R) {
  const g = c.getContext('2d'), w = c.width, h = c.height, d = g.getImageData(0, 0, w, h).data, lum = (x, y) => { const i = (y * w + x) * 4; return d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11; };
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  for (let k = 0; k < 9000; k++) {
    const x = 3 + Math.floor(R() * (w - 6)), y = 3 + Math.floor(R() * (h - 6)), i = (y * w + x) * 4, gx = lum(x + 3, y) - lum(x - 3, y), gy = lum(x, y + 3) - lum(x, y - 3), m = Math.hypot(gx, gy);
    if (m > 70) continue; // keep the sharp edges — eyes, lips, the lines of the armour — crisp
    const a = m > 8 ? Math.atan2(gy, gx) + Math.PI / 2 : Math.PI / 2 + (R() - 0.5) * 0.8, L = m > 30 ? 4 : 9, ca = Math.cos(a) * L / 2, sa = Math.sin(a) * L / 2;
    g.strokeStyle = `rgba(${d[i]},${d[i + 1]},${d[i + 2]},0.3)`; g.lineWidth = 1.8; g.beginPath(); g.moveTo(x - ca, y - sa); g.lineTo(x + ca, y + sa); g.stroke();
  }
  // a fine grain
  const img = g.getImageData(0, 0, w, h), q = img.data; for (let i = 0; i < q.length; i += 4) { const v = (R() - 0.5) * 9; q[i] += v; q[i + 1] += v; q[i + 2] += v; } g.putImageData(img, 0, 0);
  g.restore();
}
