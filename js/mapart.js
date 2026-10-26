// The map, drawn finely: 48-pixel tiles (one map square at full screen resolution) with grass, fields, sand and
// snow that blend at their edges, water with foam along the shore, roads that join their neighbours, bridges and
// ferries; and the things that stand up from the ground — clumps of trees, hills, mountain peaks — drawn taller than
// a square so they overlap the row behind. Towns, strongholds and temples get detailed icons; the army walks as a
// little general.
import { rng, hash } from './util.js';
const T = 48;
const C = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
const hx = (c) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const sh = (c, k, a = 1) => { const [r, g, b] = hx(c), f = (v) => Math.round(Math.max(0, Math.min(255, k > 1 ? v + (255 - v) * (k - 1) : v * k))); return `rgba(${f(r)},${f(g)},${f(b)},${a})`; };
const GROUND = { grass: '#5e9a3e', field: '#8ea64c', sand: '#e0cc92', snow: '#e8eef6', dirt: '#b8955a' };
// speckled ground in a colour, with blades or grains
function ground(g, R, col, kind) {
  g.fillStyle = col; g.fillRect(0, 0, T, T);
  for (let i = 0; i < 90; i++) { g.fillStyle = sh(col, 0.82 + R() * 0.36, 0.7); g.fillRect(R() * T, R() * T, 2, 2); }
  if (kind === 'grass') { for (let i = 0; i < 26; i++) { const x = R() * T, y = 3 + R() * (T - 3); g.strokeStyle = sh(col, R() < 0.5 ? 1.35 : 0.72, 0.85); g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - 0.5) * 3, y - 3 - R() * 3); g.stroke(); } if (R() < 0.25) for (let i = 0; i < 3; i++) { g.fillStyle = ['#f0e070', '#f0f0f0', '#e88aa0'][i % 3]; g.fillRect(R() * 44 + 2, R() * 44 + 2, 2, 2); } }
  if (kind === 'field') { for (let r = 4; r < T; r += 8) { g.fillStyle = sh(col, 0.75); g.fillRect(0, r + 4, T, 2); for (let x = 2; x < T; x += 4) { g.fillStyle = sh('#6a9a30', 0.9 + R() * 0.3); g.fillRect(x + R() * 2, r, 2, 4); } } }
  if (kind === 'snow') for (let i = 0; i < 10; i++) { g.fillStyle = 'rgba(160,180,210,0.35)'; g.beginPath(); g.ellipse(R() * T, R() * T, 4 + R() * 5, 1.5, 0, 0, 7); g.fill(); }
  if (kind === 'sand') for (let i = 0; i < 20; i++) { g.fillStyle = sh(col, 0.78, 0.8); g.fillRect(R() * T, R() * T, 1, 1); }
}
function water(g, R, frame, deep, x0, y0) {
  const grd = g.createLinearGradient(0, 0, 0, T); grd.addColorStop(0, deep ? '#2a5aa6' : '#3470bc'); grd.addColorStop(1, deep ? '#234e94' : '#2c62aa'); g.fillStyle = grd; g.fillRect(0, 0, T, T);
  for (let i = 0; i < 7; i++) { const x = ((R() * T + frame * 6 + (x0 * 17 + y0 * 7)) % (T + 10)) - 6, y = R() * T; g.strokeStyle = 'rgba(160,205,250,0.55)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 4, y - 2, x + 8, y); g.stroke(); }
  if (R() < 0.4) { g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(R() * T, R() * T, 2, 1); }
}
const TC = new Map();
// a ground tile: n e s w say what touches each side, for shores and blends
export function groundTile(c, x, y, frame, nb) {
  const water0 = '~r:'.includes(c), key = c + (water0 || 'FbL'.includes(c) ? frame : '') + nb + ((x * 7 + y * 13) & 3);
  if (TC.has(key)) return TC.get(key);
  const [cv, g] = C(T, T), R = rng(hash(key)), [n, e, s, w] = nb.split('');
  const base = c === ',' ? 'field' : c === 's' ? 'sand' : c === 'n' ? 'snow' : 'grass';
  if (!water0 && !'FbL'.includes(c)) {
    ground(g, R, GROUND[base], base);
    // blends: a dithered edge where a different ground meets this one
    const blend = (side, col) => { const gr = side === 'n' ? g.createLinearGradient(0, 0, 0, 10) : side === 's' ? g.createLinearGradient(0, T, 0, T - 10) : side === 'w' ? g.createLinearGradient(0, 0, 10, 0) : g.createLinearGradient(T, 0, T - 10, 0); gr.addColorStop(0, sh(col, 1, 0.85)); gr.addColorStop(1, sh(col, 1, 0)); g.fillStyle = gr; g.fillRect(0, 0, T, T); for (let i = 0; i < 26; i++) { const d = Math.pow(R(), 1.6) * 13, t = R() * T; const [px, py] = side === 'n' ? [t, d] : side === 's' ? [t, T - d] : side === 'w' ? [d, t] : [T - d, t]; g.fillStyle = sh(col, 0.95 + R() * 0.1, 0.8); g.beginPath(); g.ellipse(px, py, 2.5, 1.5, 0, 0, 7); g.fill(); } };
    for (const [side, k] of [['n', n], ['e', e], ['s', s], ['w', w]]) { if (k === 'S' && base !== 'sand') blend(side, GROUND.sand); if (k === 'N' && base !== 'snow') blend(side, GROUND.snow); if (k === 'G' && base === 'snow') blend(side, GROUND.grass); }
    // shore: wet sand where land meets water
    for (const [side, k] of [['n', n], ['e', e], ['s', s], ['w', w]]) if (k === 'W') { const gr = side === 'n' ? g.createLinearGradient(0, 0, 0, 8) : side === 's' ? g.createLinearGradient(0, T, 0, T - 8) : side === 'w' ? g.createLinearGradient(0, 0, 8, 0) : g.createLinearGradient(T, 0, T - 8, 0); gr.addColorStop(0, 'rgba(214,196,140,1)'); gr.addColorStop(1, 'rgba(214,196,140,0)'); g.fillStyle = gr; g.fillRect(0, 0, T, T); }
  } else {
    water(g, R, frame, c === '~', x, y);
    // foam and a pale shallows where the water meets land
    for (const [side, k] of [['n', n], ['e', e], ['s', s], ['w', w]]) if (k !== 'W') { const gr = side === 'n' ? g.createLinearGradient(0, 0, 0, 9) : side === 's' ? g.createLinearGradient(0, T, 0, T - 9) : side === 'w' ? g.createLinearGradient(0, 0, 9, 0) : g.createLinearGradient(T, 0, T - 9, 0); gr.addColorStop(0, 'rgba(225,240,255,0.9)'); gr.addColorStop(0.35, 'rgba(150,200,240,0.6)'); gr.addColorStop(1, 'rgba(150,200,240,0)'); g.fillStyle = gr; g.fillRect(0, 0, T, T); for (let i = 0; i < 6; i++) { const t = R() * T, [px, py] = side === 'n' ? [t, 2 + (frame + i) % 3] : side === 's' ? [t, T - 3 - (frame + i) % 3] : side === 'w' ? [2 + (frame + i) % 3, t] : [T - 3 - (frame + i) % 3, t]; g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillRect(px, py, 3, 1); } }
    if (c === ':') for (let i = 0; i < 22; i++) { const x0 = R() * T, y0 = 10 + R() * (T - 10), hgt = 8 + R() * 10; g.strokeStyle = sh('#8a9a4a', 0.8 + R() * 0.5); g.lineWidth = 1.2; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x0 + 2, y0 - hgt / 2, x0 + (R() - 0.3) * 4, y0 - hgt); g.stroke(); if (R() < 0.4) { g.fillStyle = '#c8b060'; g.fillRect(x0 + 1, y0 - hgt - 2, 2, 4); } }
  }
  if (c === 'b' || c === 'L') { // planks on posts with rails
    const along = n === 'R' || s === 'R' ? 'v' : 'h';
    g.save(); if (along === 'h') { g.translate(T, 0); g.rotate(Math.PI / 2); }
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(9, 0, 32, T);
    for (let yy = 0; yy < T; yy += 6) { const pg = g.createLinearGradient(0, yy, 0, yy + 5); pg.addColorStop(0, '#b07a42'); pg.addColorStop(1, '#7a4e26'); g.fillStyle = pg; g.fillRect(8, yy, 32, 5); g.fillStyle = '#4a2e14'; g.fillRect(8, yy + 5, 32, 1); }
    g.fillStyle = '#5a3a1a'; g.fillRect(6, 0, 3, T); g.fillRect(39, 0, 3, T); for (const yy of [6, 30]) { g.fillStyle = '#3a2410'; g.fillRect(5, yy, 5, 6); g.fillRect(38, yy, 5, 6); }
    g.restore();
  }
  if (c === 'F') { // a ferry boat tied at the crossing
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(24, 30, 18, 6, 0, 0, 7); g.fill();
    const bg = g.createLinearGradient(0, 22, 0, 32); bg.addColorStop(0, '#a8703a'); bg.addColorStop(1, '#5a3a1a'); g.fillStyle = bg; g.beginPath(); g.moveTo(6, 24); g.quadraticCurveTo(24, 36, 42, 24); g.lineTo(38, 22); g.lineTo(10, 22); g.closePath(); g.fill();
    g.fillStyle = '#4a2e14'; g.fillRect(23, 4, 2, 19); g.fillStyle = '#ece0c0'; g.beginPath(); g.moveTo(25, 5); g.lineTo(36, 16); g.lineTo(25, 19); g.fill(); g.strokeStyle = 'rgba(80,60,30,0.6)'; g.beginPath(); g.moveTo(25, 9); g.lineTo(33, 15); g.stroke();
  }
  TC.set(key, cv); return cv;
}
// a road drawn over the ground, joined toward its neighbours (n e s w as 1/0)
const RC = new Map();
export function roadTile(conn, v) {
  const key = conn + v; if (RC.has(key)) return RC.get(key);
  const [cv, g] = C(T, T), R = rng(hash(key)), [n, e, s, w] = conn.split('').map((k) => k === '1');
  const arm = (x0, y0, x1, y1) => { g.fillRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0) || 16, Math.abs(y1 - y0) || 16); };
  for (const [col, pad] of [['rgba(90,70,40,0.35)', 2], ['#b8955a', 0], ['#c8a868', -3]]) { g.fillStyle = col; const a = 16 - pad, b = 32 + pad; g.fillRect(a, a, b - a, b - a); if (n) g.fillRect(a, 0, b - a, b); if (s) g.fillRect(a, a, b - a, T - a); if (w) g.fillRect(0, a, b, b - a); if (e) g.fillRect(a, a, T - a, b - a); }
  for (let i = 0; i < 26; i++) { const x = 14 + R() * 20, y = 14 + R() * 20; g.fillStyle = R() < 0.5 ? 'rgba(120,90,50,0.6)' : 'rgba(230,210,160,0.6)'; g.fillRect(x + (e ? R() * 14 : 0) - (w ? R() * 14 : 0), y + (s ? R() * 14 : 0) - (n ? R() * 14 : 0), 2, 1); }
  // wheel ruts along the road
  g.strokeStyle = 'rgba(120,90,50,0.35)'; g.lineWidth = 1; g.beginPath(); if (n || s) { g.moveTo(20, n ? 0 : 20); g.lineTo(20, s ? T : 28); g.moveTo(28, n ? 0 : 20); g.lineTo(28, s ? T : 28); } if (e || w) { g.moveTo(w ? 0 : 20, 20); g.lineTo(e ? T : 28, 20); g.moveTo(w ? 0 : 20, 28); g.lineTo(e ? T : 28, 28); } g.stroke();
  RC.set(key, cv); return cv;
}
// ---------------------------------------------------------------- things standing up from the ground (drawn T wide, taller than T)
const OC = new Map();
export function standing(c, x, y, snowy) {
  const v = (x * 7 + y * 13) & 3, key = c + v + (snowy ? 'n' : ''); if (OC.has(key)) return OC.get(key);
  const R = rng(hash(key) ^ 77);
  if (c === 'f') { // a clump of trees: broadleaf or pine, each with a lit side, a shadow side and a shadow on the ground
    const [cv, g] = C(T, 66);
    const trees = [[12, 52, 11], [34, 50, 12], [23, 62, 12], [40, 64, 9], [8, 64, 9]].slice(0, 3 + v % 3);
    for (const [tx, ty, r] of trees.sort((a, b) => a[1] - b[1])) {
      g.fillStyle = 'rgba(20,40,10,0.35)'; g.beginPath(); g.ellipse(tx + 3, ty, r * 0.9, r * 0.3, 0, 0, 7); g.fill();
      const pine = snowy || R() < 0.35;
      if (pine) { g.fillStyle = '#4a2e18'; g.fillRect(tx - 1.5, ty - 6, 3, 6); for (let k = 0; k < 3; k++) { const yy = ty - 6 - k * 7, ww = r - k * 2.5; const pg = g.createLinearGradient(tx - ww, 0, tx + ww, 0); pg.addColorStop(0, '#3e7a32'); pg.addColorStop(1, '#1c4a1c'); g.fillStyle = pg; g.beginPath(); g.moveTo(tx - ww, yy); g.lineTo(tx, yy - 12); g.lineTo(tx + ww, yy); g.closePath(); g.fill(); if (snowy) { g.fillStyle = 'rgba(240,245,255,0.85)'; g.beginPath(); g.moveTo(tx - ww * 0.5, yy - 6); g.lineTo(tx, yy - 12); g.lineTo(tx + ww * 0.3, yy - 7); g.fill(); } } }
      else { g.fillStyle = '#5a3a1e'; g.fillRect(tx - 2, ty - 8, 4, 8); const cy = ty - 8 - r * 0.8; const cg = g.createRadialGradient(tx - r * 0.35, cy - r * 0.35, 1, tx, cy, r * 1.15); cg.addColorStop(0, '#7ab84e'); cg.addColorStop(0.55, '#3e7e2e'); cg.addColorStop(1, '#1e4a1a'); g.fillStyle = cg; for (const [dx, dy, rr] of [[0, 0, 1], [-0.5, 0.25, 0.7], [0.5, 0.2, 0.72], [0, -0.45, 0.65]]) { g.beginPath(); g.arc(tx + dx * r, cy + dy * r, r * rr, 0, 7); g.fill(); } for (let i = 0; i < 10; i++) { g.fillStyle = R() < 0.5 ? 'rgba(150,210,110,0.55)' : 'rgba(20,50,20,0.4)'; g.beginPath(); g.arc(tx + (R() - 0.6) * r * 1.4, cy + (R() - 0.6) * r * 1.2, 1.5 + R() * 2, 0, 7); g.fill(); } }
    }
    OC.set(key, cv); return cv;
  }
  if (c === 'h') { // a rounded hill with grass on it
    const [cv, g] = C(T, 56); const hg = g.createRadialGradient(18, 26, 2, 24, 40, 30); hg.addColorStop(0, snowy ? '#f4f8ff' : '#94c060'); hg.addColorStop(0.6, snowy ? '#d8e0ee' : '#6a9a40'); hg.addColorStop(1, snowy ? '#a8b4c8' : '#3e6a26');
    g.fillStyle = 'rgba(20,40,10,0.3)'; g.beginPath(); g.ellipse(27, 52, 22, 5, 0, 0, 7); g.fill();
    g.fillStyle = hg; g.beginPath(); g.moveTo(2, 52); g.bezierCurveTo(6, 24 + v * 2, 40, 18 + v, 46, 52); g.closePath(); g.fill();
    if (v % 2) { g.beginPath(); g.moveTo(26, 52); g.bezierCurveTo(30, 36, 44, 34, 48, 52); g.closePath(); g.fill(); }
    for (let i = 0; i < 14; i++) { const x = 8 + R() * 32, y = 32 + R() * 18; g.strokeStyle = snowy ? 'rgba(170,185,210,0.6)' : 'rgba(40,80,20,0.55)'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 1, y - 3); g.stroke(); }
    OC.set(key, cv); return cv;
  }
  if (c === 'M') { // a craggy peak: a lit face and a shadowed face, ledges, snow on the top
    const [cv, g] = C(T, 76); const peaks = [[24, 8 + v * 2, 24], ...(v % 2 ? [[8, 30, 14], [40, 26, 15]] : [[38, 22, 16]])];
    g.fillStyle = 'rgba(20,20,10,0.35)'; g.beginPath(); g.ellipse(26, 72, 24, 5, 0, 0, 7); g.fill();
    for (const [px, py, w] of peaks.sort((a, b) => a[1] - b[1]).reverse()) {
      const base = 72;
      g.fillStyle = '#8a8274'; g.beginPath(); g.moveTo(px - w, base); g.lineTo(px - 2, py); g.lineTo(px, base); g.closePath(); g.fill();
      g.fillStyle = '#5a5448'; g.beginPath(); g.moveTo(px, base); g.lineTo(px - 2, py); g.lineTo(px + w, base); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(40,36,30,0.55)'; g.lineWidth = 1; for (let k = 0; k < 5; k++) { const t = 0.3 + k * 0.13, y1 = py + (base - py) * t; g.beginPath(); g.moveTo(px - w * t * 0.9, y1); g.lineTo(px - w * t * 0.4, y1 + 3); g.stroke(); g.beginPath(); g.moveTo(px + w * t * 0.5, y1 + 2); g.lineTo(px + w * t * 0.9, y1 + 5); g.stroke(); }
      const sn = (base - py) * 0.3; g.fillStyle = '#f2f4fa'; g.beginPath(); g.moveTo(px - 2, py); g.lineTo(px - w * 0.3, py + sn); g.lineTo(px - w * 0.12, py + sn * 0.8); g.lineTo(px, py + sn * 1.1); g.lineTo(px + w * 0.15, py + sn * 0.75); g.lineTo(px + w * 0.3, py + sn); g.closePath(); g.fill(); g.fillStyle = 'rgba(160,175,205,0.7)'; g.beginPath(); g.moveTo(px - 2, py); g.lineTo(px, py + sn * 1.1); g.lineTo(px + w * 0.15, py + sn * 0.75); g.lineTo(px + w * 0.3, py + sn); g.closePath(); g.fill();
    }
    OC.set(key, cv); return cv;
  }
  return null;
}
// ---------------------------------------------------------------- places (72×72, drawn over a 24-unit square)
const PC = new Map();
export function placeArt(p) {
  if (PC.has(p.id)) return PC.get(p.id);
  const [cv, g] = C(72, 72), R = rng(hash(p.id));
  const roof = (x, y, w, h, col) => { const rg = g.createLinearGradient(0, y, 0, y + h); rg.addColorStop(0, sh(col, 1.3)); rg.addColorStop(1, sh(col, 0.6)); g.fillStyle = rg; g.beginPath(); g.moveTo(x - 4, y + h); g.quadraticCurveTo(x + w * 0.25, y + h * 0.75, x + w * 0.2, y); g.lineTo(x + w * 0.8, y); g.quadraticCurveTo(x + w * 0.75, y + h * 0.75, x + w + 4, y + h); g.closePath(); g.fill(); g.fillStyle = sh(col, 0.4); g.fillRect(x - 4, y + h, w + 8, 2); };
  const shadow = (w = 30) => { g.fillStyle = 'rgba(20,20,10,0.35)'; g.beginPath(); g.ellipse(36, 66, w, 6, 0, 0, 7); g.fill(); };
  const flag = (x, y, col) => { g.fillStyle = '#3a2410'; g.fillRect(x, y, 1.5, 18); g.fillStyle = col; g.beginPath(); g.moveTo(x + 1.5, y); g.quadraticCurveTo(x + 8, y + 2, x + 13, y + 1); g.lineTo(x + 12, y + 8); g.quadraticCurveTo(x + 8, y + 9, x + 1.5, y + 8); g.fill(); };
  if (p.kind === 'city' || p.kind === 'capital') {
    const big = p.kind === 'capital'; shadow(34);
    const wg = g.createLinearGradient(0, 30, 0, 66); wg.addColorStop(0, '#b8b0a0'); wg.addColorStop(1, '#6a6458'); g.fillStyle = wg; g.fillRect(4, 34, 64, 30);
    g.fillStyle = 'rgba(40,36,30,0.35)'; for (let y = 38; y < 64; y += 5) for (let x = 4 + ((y / 5) % 2) * 4; x < 68; x += 8) g.fillRect(x, y, 7, 1);
    for (let x = 4; x < 68; x += 6) { g.fillStyle = '#c8c0b0'; g.fillRect(x, 30, 4, 5); }
    g.fillStyle = '#2a1e14'; g.beginPath(); g.moveTo(29, 64); g.lineTo(29, 50); g.quadraticCurveTo(36, 43, 43, 50); g.lineTo(43, 64); g.fill(); g.fillStyle = '#7a4a22'; g.fillRect(30, 52, 5.5, 12); g.fillRect(36.5, 52, 5.5, 12);
    // the gate tower with its eaves, and halls rising behind the wall
    if (big) { roof(18, 2, 36, 10, '#c8a030'); g.fillStyle = '#a82a22'; g.fillRect(22, 12, 28, 8); roof(14, 18, 44, 8, '#c8a030'); }
    g.fillStyle = '#8a3a22'; g.fillRect(24, 24, 24, 8); for (let x = 26; x < 48; x += 5) { g.fillStyle = '#e8d8b0'; g.fillRect(x, 26, 3, 4); } roof(20, big ? 26 : 14, 32, big ? 6 : 10, big ? '#c8a030' : '#5a6a7a');
    if (!big) { roof(4, 22, 14, 8, '#5a6a7a'); roof(54, 22, 14, 8, '#5a6a7a'); }
    flag(6, 12, '#c83a2a'); flag(62, 12, '#c83a2a');
  } else if (p.kind === 'village' || p.kind === 'town') {
    shadow(30);
    for (const [x, y, w] of [[6, 34, 22], [38, 28, 24], [20, 46, 26]].sort((a, b) => a[1] - b[1])) {
      const hg = g.createLinearGradient(0, y + 8, 0, y + 22); hg.addColorStop(0, '#ece0c4'); hg.addColorStop(1, '#b8a888'); g.fillStyle = hg; g.fillRect(x, y + 8, w, 14);
      g.fillStyle = '#4a3220'; g.fillRect(x + w / 2 - 3, y + 13, 6, 9); g.fillStyle = '#6a8ab0'; g.fillRect(x + 3, y + 12, 4, 4);
      const tg = g.createLinearGradient(0, y, 0, y + 10); tg.addColorStop(0, '#d8b060'); tg.addColorStop(1, '#8a6a30'); g.fillStyle = tg; g.beginPath(); g.moveTo(x - 3, y + 9); g.lineTo(x + w / 2, y - 2); g.lineTo(x + w + 3, y + 9); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(90,60,20,0.5)'; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(x + k * w / 5, y + 9); g.lineTo(x + w / 2, y - 1); g.stroke(); }
    }
    g.strokeStyle = '#7a5a32'; g.lineWidth = 1.5; for (let x = 2; x < 70; x += 5) { g.beginPath(); g.moveTo(x, 70); g.lineTo(x, 64); g.stroke(); } g.beginPath(); g.moveTo(2, 66); g.lineTo(70, 66); g.stroke();
    g.fillStyle = '#3e7a2e'; g.beginPath(); g.arc(64, 30, 7, 0, 7); g.fill(); g.fillStyle = '#5a3a1e'; g.fillRect(63, 35, 2, 8);
    if (p.kind === 'town') { g.fillStyle = '#c83a2a'; g.fillRect(44, 18, 3, 12); g.fillStyle = '#f0e8c8'; g.fillRect(47, 18, 7, 9); g.fillStyle = '#c83a2a'; g.font = 'bold 7px serif'; g.fillText('酒', 47.5, 25.5); }
  } else if (p.kind === 'fort') {
    const hg = g.createRadialGradient(30, 40, 4, 36, 60, 40); hg.addColorStop(0, '#8ab05a'); hg.addColorStop(1, '#3e6026'); g.fillStyle = hg; g.beginPath(); g.moveTo(0, 70); g.bezierCurveTo(10, 32, 60, 28, 72, 70); g.fill();
    // a palisade round the top, a watchtower, the stronghold's banner
    for (let x = 10; x < 64; x += 3.5) { const yb = 52 - Math.sin((x - 10) / 54 * Math.PI) * 8; g.fillStyle = '#7a4a22'; g.fillRect(x, yb - 14, 3, 14); g.fillStyle = '#a8703a'; g.beginPath(); g.moveTo(x, yb - 14); g.lineTo(x + 1.5, yb - 17); g.lineTo(x + 3, yb - 14); g.fill(); }
    g.fillStyle = '#5a3a1a'; g.fillRect(14, 20, 2, 22); g.fillRect(24, 20, 2, 22); g.fillStyle = '#8a5a2a'; g.fillRect(12, 18, 16, 6); roof(12, 10, 16, 8, '#6a4a2a');
    flag(46, 10, p.id === '梁山' ? '#e8c020' : '#c83a2a'); g.fillStyle = 'rgba(255,230,180,0.5)'; g.fillRect(32, 40, 10, 6);
  } else if (p.kind === 'temple') {
    shadow(22);
    for (let i = 0; i < 5; i++) { const y = 10 + i * 10, w = 14 + i * 6; roof(36 - w / 2, y, w, 6, '#4a5a6a'); g.fillStyle = '#e8d8b8'; g.fillRect(36 - w / 2 + 3, y + 6, w - 6, 4); g.fillStyle = '#a82a22'; g.fillRect(34, y + 6, 4, 4); }
    g.fillStyle = '#d8a020'; g.fillRect(35, 2, 2, 9); g.beginPath(); g.arc(36, 2, 2, 0, 7); g.fill();
    g.fillStyle = '#3e7a2e'; for (const x of [10, 62]) { g.beginPath(); g.moveTo(x - 7, 62); g.lineTo(x, 34); g.lineTo(x + 7, 62); g.fill(); }
  } else if (p.kind === 'base') {
    const hg = g.createRadialGradient(30, 40, 4, 36, 60, 44); hg.addColorStop(0, '#7aa04a'); hg.addColorStop(1, '#2e5020'); g.fillStyle = hg; g.beginPath(); g.moveTo(0, 72); g.bezierCurveTo(8, 26, 64, 22, 72, 72); g.fill();
    const wg = g.createLinearGradient(0, 36, 0, 60); wg.addColorStop(0, '#c8c0b0'); wg.addColorStop(1, '#7a7468'); g.fillStyle = wg; g.fillRect(8, 38, 56, 22); for (let x = 8; x < 64; x += 6) { g.fillStyle = '#d8d0c0'; g.fillRect(x, 34, 4, 5); }
    g.fillStyle = '#2a1e14'; g.beginPath(); g.moveTo(30, 60); g.lineTo(30, 48); g.quadraticCurveTo(36, 42, 42, 48); g.lineTo(42, 60); g.fill();
    g.fillStyle = '#8a2a1a'; g.fillRect(20, 26, 32, 10); roof(16, 14, 40, 12, '#a83a2a'); roof(22, 4, 28, 9, '#a83a2a');
    g.fillStyle = '#3a2410'; g.fillRect(62, 0, 2, 34); g.fillStyle = '#f0c830'; g.beginPath(); g.moveTo(64, 1); g.lineTo(72, 3); g.lineTo(71, 22); g.lineTo(64, 20); g.fill(); g.fillStyle = '#8a2a1a'; g.font = 'bold 5px serif'; for (const [i, ch] of [...'替天行道'].entries()) g.fillText(ch, 65.2, 7 + i * 4.4);
  } else { // a spot on the road: a stone stele under an old pine
    g.fillStyle = 'rgba(20,20,10,0.3)'; g.beginPath(); g.ellipse(32, 64, 18, 4, 0, 0, 7); g.fill();
    const sg = g.createLinearGradient(24, 0, 40, 0); sg.addColorStop(0, '#c8c2b4'); sg.addColorStop(1, '#6a665c'); g.fillStyle = sg; g.fillRect(26, 32, 12, 30); g.fillStyle = '#8a8478'; g.fillRect(24, 60, 16, 4); g.beginPath(); g.ellipse(32, 32, 7, 3, 0, Math.PI, 0); g.fill();
    g.fillStyle = 'rgba(40,36,30,0.6)'; for (let i = 0; i < 4; i++) g.fillRect(30, 38 + i * 5, 4, 2);
    g.fillStyle = '#4a2e18'; g.beginPath(); g.moveTo(52, 64); g.quadraticCurveTo(48, 40, 56, 22); g.lineTo(58, 24); g.quadraticCurveTo(52, 42, 56, 64); g.fill();
    g.fillStyle = '#2e5e26'; for (const [x, y, w] of [[54, 22, 14], [46, 30, 12], [60, 34, 10]]) { g.beginPath(); g.ellipse(x, y, w, 4.5, -0.1, 0, 7); g.fill(); }
  }
  PC.set(p.id, cv); return cv;
}
// ---------------------------------------------------------------- the army on the road: a little general (48×48), four ways, two steps
const WC = new Map();
const SKIN = { y: '#e8b48a', w: '#f0c8a4', r: '#d0705a', d: '#b07850', b: '#6a4430', g: '#e8b48a' };
export function marcher(p, dir, step, side) {
  const key = p.id + dir + step; if (WC.has(key)) return WC.get(key);
  const [cv, g] = C(48, 48), L = p.look || {}, skin = SKIN[L.face] || SKIN.y, cloth = side || '#3a5aa8', hair = L.hair === 'red' ? '#a83a1a' : L.hair === 'gold' ? '#c8982a' : L.hair === 'white' ? '#d8d8d8' : '#2a2018';
  const hat = { helm: '#9aa0aa', fur: '#8a6a4a', monk: skin, taoist: '#4a4a6a', scholar: '#2a2e38', official: '#1a1a20', turban: '#c83a2a', crown: '#e0b030', female: hair, band: hair, hair, scarf: '#3a4a5a' }[L.hat] || hair;
  const side2 = dir === 'left' || dir === 'right', flip = dir === 'left';
  g.save(); if (flip) { g.translate(48, 0); g.scale(-1, 1); }
  g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(24, 44, 11, 3.5, 0, 0, 7); g.fill();
  // legs and boots, swinging
  const sw = step ? 3 : -3;
  g.fillStyle = '#3a2a22'; if (side2) { g.fillRect(19 + sw, 34, 5, 9); g.fillRect(25 - sw, 34, 5, 9); } else { g.fillRect(18, 34, 5, 9 + (step ? -1 : 0)); g.fillRect(25, 34, 5, 9 + (step ? 0 : -1)); }
  g.fillStyle = '#1a1410'; if (side2) { g.fillRect(18 + sw, 42, 7, 3); g.fillRect(24 - sw, 42, 7, 3); } else { g.fillRect(17, 42, 7, 3); g.fillRect(24, 42, 7, 3); }
  // the body: a tunic in the army's colour, a belt, a cape behind
  if (dir !== 'down') { g.fillStyle = '#7a2a22'; g.beginPath(); g.moveTo(15, 22); g.lineTo(33, 22); g.lineTo(35, 38); g.lineTo(13, 38); g.fill(); }
  const bg = g.createLinearGradient(14, 0, 34, 0); bg.addColorStop(0, sh(cloth, 1.3)); bg.addColorStop(1, sh(cloth, 0.6)); g.fillStyle = bg; g.beginPath(); g.roundRect(15, 21, 18, 15, 3); g.fill();
  g.fillStyle = '#5a3a1a'; g.fillRect(15, 31, 18, 2.5); g.fillStyle = '#d8b040'; g.fillRect(22.5, 31, 3, 2.5);
  if (dir === 'down') { g.fillStyle = '#ece4d4'; g.beginPath(); g.moveTo(21, 21); g.lineTo(24, 27); g.lineTo(27, 21); g.fill(); }
  // arms swinging, a spear over the shoulder
  g.fillStyle = sh(cloth, 0.85); g.fillRect(12, 22 + (step ? 1 : -1), 4, 10); g.fillRect(32, 22 + (step ? -1 : 1), 4, 10); g.fillStyle = skin; g.fillRect(12, 31 + (step ? 1 : -1), 4, 3); g.fillRect(32, 31 + (step ? -1 : 1), 4, 3);
  g.strokeStyle = '#6a4424'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(35, 36); g.lineTo(40, 6); g.stroke(); g.fillStyle = '#d8dce8'; g.beginPath(); g.moveTo(39, 8); g.lineTo(41.5, 0); g.lineTo(42, 8); g.fill(); g.fillStyle = '#c83a2a'; g.fillRect(38.5, 8, 3, 3);
  // the head: a big round face, hair or a helmet, eyes looking the way they walk
  g.fillStyle = skin; g.beginPath(); g.ellipse(24, 14, 8.5, 9, 0, 0, 7); g.fill(); g.fillStyle = sh(skin, 0.75); g.beginPath(); g.ellipse(27, 16, 5, 6, 0, -0.4, 1.8); g.fill();
  g.fillStyle = hat; g.beginPath(); if (dir === 'up') g.ellipse(24, 13, 9, 9.5, 0, 0, 7); else { g.ellipse(24, 9, 9.2, 6.5, 0, Math.PI, 0); g.rect(15, 9, 18.4, 2); } g.fill();
  if (L.hat === 'helm') { g.fillStyle = '#c8a040'; g.fillRect(15, 10, 18.4, 2); g.fillStyle = '#c83a2a'; g.beginPath(); g.moveTo(24, 3); g.quadraticCurveTo(18, -1, 14, 4); g.lineTo(24, 4); g.fill(); }
  if (L.hat === 'scarf' || L.hat === 'band' || !L.hat) { g.fillStyle = sh(hat, 1.4); g.beginPath(); g.arc(24, 2.5, 3, 0, 7); g.fill(); }
  if (dir !== 'up') {
    const ex = side2 ? 2 : 0; g.fillStyle = '#1a1010'; g.fillRect(19.5 + ex, 14, 2, 2.5); if (!side2) g.fillRect(26.5, 14, 2, 2.5); else g.fillRect(25.5 + ex, 14, 2, 2.5);
    if (L.beard === 'long' || L.beard === 'full') { g.fillStyle = L.hair === 'white' ? '#d8d8d8' : hair; g.beginPath(); g.ellipse(24 + ex, 21, 5, L.beard === 'long' ? 6 : 4, 0, 0, Math.PI); g.fill(); }
  }
  g.restore();
  WC.set(key, cv); return cv;
}
