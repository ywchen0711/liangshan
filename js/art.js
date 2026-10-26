// Pixel art in the manner of the old 16-bit Chinese RPGs: map tiles, the icons of towns and strongholds, walking
// figures, a portrait for every one of the five hundred (drawn from their look: face, headwear, beard, hair) and
// the figures and backdrops of the battle screen. Everything is drawn into small canvases once and scaled up crisp.
import { rng, hash } from './util.js';
const C = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; };
const px = (g, x, y, col, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), f = (v) => Math.max(0, Math.min(255, Math.round(k > 1 ? v + (255 - v) * (k - 1) : v * k))); return '#' + [16, 8, 0].map((s) => f((n >> s) & 255).toString(16).padStart(2, '0')).join(''); };

// ---------------------------------------------------------------- map tiles (16×16), two frames for water
const TC = new Map();
export function tile(c, x, y, frame, around) {
  const key = c + (('~rF:'.includes(c)) ? frame : 0) + (around || '') + ((x * 7 + y * 13) % 4);
  if (TC.has(key)) return TC.get(key);
  const [cv, g] = C(16, 16), R = rng(hash(key)), v = (x * 7 + y * 13) % 4;
  const grass = () => { px(g, 0, 0, '#5c9c3c', 16, 16); for (let i = 0; i < 14; i++) px(g, R.int(0, 15), R.int(0, 15), R() < 0.5 ? '#6cb04a' : '#4a8a30'); for (let i = 0; i < 3; i++) { const a = R.int(1, 14), b = R.int(2, 14); px(g, a, b, '#7cc05a'); px(g, a, b - 1, '#7cc05a'); } };
  const water = (deep) => { px(g, 0, 0, deep ? '#2a5aa8' : '#3a70c0', 16, 16); for (let i = 0; i < 4; i++) { const a = (R.int(0, 12) + frame * 3) % 14, b = R.int(1, 14); px(g, a, b, '#6aa0e8', 3, 1); px(g, a + 1, b - 1, '#9ac8f8', 1, 1); } };
  if (c === '.' || c === '=' || c === 'b') grass();
  if (c === ',') { px(g, 0, 0, '#8aa848', 16, 16); for (let r = 1; r < 16; r += 3) { px(g, 0, r, '#a8b858', 16, 1); for (let i = 0; i < 6; i++) px(g, R.int(0, 15), r - 1, '#6a8a30'); } }
  if (c === 'f') { grass(); for (const [cx, cy, s] of [[4, 6, 4], [11, 5, 4], [8, 11, 5]]) { px(g, cx - 1, cy + s - 1, '#5a3a1a', 2, 3); for (let yy = -s; yy <= s - 1; yy++) for (let xx = -s; xx <= s; xx++) if (xx * xx + yy * yy * 1.3 < s * s) px(g, cx + xx, cy + yy, yy < -1 ? '#3a8a2a' : '#2a6a1e'); px(g, cx - 2, cy - s + 1, '#5aaa40', 2, 1); } }
  if (c === 'h') { grass(); for (const [cx, cy, s] of [[5, 10, 6], [12, 12, 4]]) for (let yy = 0; yy < s; yy++) { const w = Math.round((s - yy) * 1.3); px(g, cx - w, cy - yy, yy > s / 2 ? '#7aa048' : '#6a8a3a', w * 2, 1); px(g, cx - w, cy - yy, '#8ab858', 2, 1); } }
  if (c === 'M') { px(g, 0, 0, '#5c9c3c', 16, 16); for (const [cx, base, hgt] of [[5, 15, 12], [11, 15, 10]]) for (let yy = 0; yy < hgt; yy++) { const w = Math.round((hgt - yy) * 0.62); px(g, cx - w, base - yy, '#7a7468', w, 1); px(g, cx, base - yy, '#5a544a', w + 1, 1); if (yy > hgt - 4) px(g, cx - w, base - yy, '#f0f0f8', w * 2 + 1, 1); } }
  if (c === '~' || c === 'r') water(c === '~');
  if (c === ':') { water(false); for (let i = 0; i < 9; i++) { const a = R.int(0, 15), b = R.int(4, 15); px(g, a, b - 4, '#8a9a4a', 1, 4); px(g, a, b - 5, '#c8b860'); } }
  if (c === 'n') { px(g, 0, 0, '#e8eef8', 16, 16); for (let i = 0; i < 10; i++) px(g, R.int(0, 15), R.int(0, 15), R() < 0.5 ? '#ffffff' : '#c8d4e8'); }
  if (c === 's') { px(g, 0, 0, '#e8d8a0', 16, 16); for (let i = 0; i < 8; i++) px(g, R.int(0, 15), R.int(0, 15), '#d0c088'); }
  if (c === '=') { // a road, joined toward its neighbours
    const col = '#c8a868', ed = '#a88848', [n, e, s2, w] = (around || '0000').split('').map((k) => k === '1');
    px(g, 5, 5, col, 6, 6); if (n) px(g, 5, 0, col, 6, 6); if (s2) px(g, 5, 10, col, 6, 6); if (w) px(g, 0, 5, col, 6, 6); if (e) px(g, 10, 5, col, 6, 6);
    for (let i = 0; i < 5; i++) px(g, R.int(5, 10), R.int(5, 10), ed);
  }
  if (c === 'b' || c === 'L' || c === 'F') { water(false); if (c === 'F') { px(g, 3, 7, '#7a4a22', 10, 3); px(g, 4, 6, '#a86a32', 8, 1); px(g, 7, 1, '#5a3a1a', 1, 6); px(g, 8, 2, '#f0e8d0', 4, 4); } else { px(g, 2, 0, '#8a5a2a', 12, 16); for (let yy = 0; yy < 16; yy += 3) px(g, 2, yy, '#6a4220', 12, 1); px(g, 2, 0, '#5a3a1a', 1, 16); px(g, 13, 0, '#5a3a1a', 1, 16); } }
  // shores: a pale edge where water meets land
  if (('~r:'.includes(c)) && around) { const [n, e, s2, w] = around.split('').map((k) => k === '1'); const sh = '#d8c890'; if (n) px(g, 0, 0, sh, 16, 2); if (s2) px(g, 0, 14, sh, 16, 2); if (w) px(g, 0, 0, sh, 2, 16); if (e) px(g, 14, 0, sh, 2, 16); }
  TC.set(key, cv); return cv;
}
// ---------------------------------------------------------------- icons of places (24×24, drawn centred on the tile)
const IC = new Map();
export function placeIcon(p) {
  if (IC.has(p.id)) return IC.get(p.id);
  const [cv, g] = C(24, 24), roof = p.kind === 'capital' ? '#c8a020' : '#a83a2a', wall = '#9a9488', dk = '#5a5448';
  if (p.kind === 'city' || p.kind === 'capital') {
    px(g, 2, 9, wall, 20, 12); px(g, 2, 9, '#b8b2a4', 20, 2); for (let x = 2; x < 22; x += 3) px(g, x, 7, wall, 2, 2); px(g, 9, 14, '#3a2a1a', 6, 7); px(g, 9, 14, '#5a3a20', 6, 1);
    px(g, 6, 3, roof, 12, 3); px(g, 4, 5, shade(roof, 0.75), 16, 2); px(g, 8, 6, '#e8d8b0', 8, 3); if (p.kind === 'capital') { px(g, 9, 0, roof, 6, 2); px(g, 7, 2, shade(roof, 0.8), 10, 1); }
    px(g, 2, 20, dk, 20, 1);
  } else if (p.kind === 'village' || p.kind === 'town') {
    for (const [x, y] of [[2, 10], [12, 6], [10, 14]]) { px(g, x, y + 4, '#e8dcc0', 9, 6); px(g, x - 1, y + 2, '#8a5a2a', 11, 3); px(g, x, y + 1, '#a8703a', 9, 1); px(g, x + 3, y + 7, '#5a3a20', 3, 3); }
  } else if (p.kind === 'fort') {
    for (let yy = 0; yy < 8; yy++) px(g, 12 - (8 - yy) * 1.4, 22 - yy, '#6a8a3a', (8 - yy) * 2.8, 1);
    for (let x = 3; x < 21; x += 2) { px(g, x, 8, '#7a4a20', 1, 9); px(g, x, 7, '#a86a32', 1, 1); } px(g, 3, 12, '#5a3a1a', 18, 1);
    px(g, 11, 1, '#4a2a10', 1, 10); px(g, 12, 1, p.id === '梁山' ? '#e8c020' : '#c83a2a', 7, 5); px(g, 12, 6, '#a82a1a', 5, 1);
  } else if (p.kind === 'temple') {
    for (let i = 0; i < 4; i++) { const y = 4 + i * 4, w = 6 + i * 3; px(g, 12 - w / 2 - 1, y, '#5a3a2a', w + 2, 1); px(g, 12 - w / 2, y + 1, '#c8b890', w, 3); }
    px(g, 11, 0, '#d8a020', 2, 4); px(g, 9, 20, '#a83a2a', 6, 3);
  } else if (p.kind === 'base') {
    for (let yy = 0; yy < 10; yy++) px(g, 12 - (10 - yy) * 1.2, 23 - yy, '#5a7a3a', (10 - yy) * 2.4, 1);
    px(g, 3, 10, wall, 18, 8); px(g, 3, 10, '#c8c2b4', 18, 2); px(g, 9, 13, '#3a2a1a', 6, 5); px(g, 5, 5, '#a83a2a', 14, 3); px(g, 4, 7, '#7a2a1a', 16, 2);
    px(g, 19, 0, '#4a2a10', 1, 12); px(g, 20, 0, '#f0c830', 4, 7); px(g, 21, 2, '#a82a1a', 2, 1); px(g, 21, 4, '#a82a1a', 2, 1);
  } else { // a spot on the road: a stone marker and a tree
    px(g, 9, 8, '#9a9488', 6, 12); px(g, 9, 8, '#c8c2b4', 6, 2); px(g, 11, 11, '#5a5448', 2, 6); px(g, 16, 6, '#2a6a1e', 7, 7); px(g, 19, 13, '#5a3a1a', 1, 6);
  }
  IC.set(p.id, cv); return cv;
}
// ---------------------------------------------------------------- the look of a person
const SKIN = { y: '#f0c898', w: '#f8dcc0', r: '#d86848', d: '#b08058', b: '#5a3a2a', g: '#f0c898' };
const HAIRC = { red: '#c8401a', gold: '#d8a830', white: '#e8e8e8', purple: '#6a3a8a' };
const colourOf = (p) => { const s = { ls: '#3a6ab8', song: '#a83a2a', bandit: '#6a5a3a', zhu: '#8a6a2a', zeng: '#5a6a5a', liao: '#5a4a6a', tian: '#7a5a2a', wang: '#4a6a4a', fang: '#c86a1a', jin: '#3a4a4a', xia: '#7a6a3a', wander: '#5a7a8a' }[p.side] || '#5a5a6a'; return s; };
export const sideColour = colourOf;
// ---------------------------------------------------------------- portraits (48×48)
const PC = new Map();
export function portrait(p) {
  if (PC.has(p.id)) return PC.get(p.id);
  const [cv, g] = C(48, 48), L = p.look || {}, R = rng(hash(p.id)), skin = SKIN[L.face] || SKIN.y, sk2 = shade(skin, 0.82), sk3 = shade(skin, 0.68), hair = HAIRC[L.hair] || (p.lv > 50 && R() < 0.3 ? '#9a9a9a' : '#2a2226'), hr2 = shade(hair, 1.4);
  const cloth = colourOf(p), armour = L.hat === 'helm' || L.hat === 'fur';
  // background: a soft gradient in the side's colour
  for (let y = 0; y < 48; y++) px(g, 0, y, shade(cloth, 0.35 + y / 48 * 0.25), 48, 1);
  // shoulders and chest: armour plates, or a robe with a crossed collar
  for (let y = 36; y < 48; y++) { const w = 15 + (y - 36) * 0.9; px(g, 24 - w, y, armour ? '#8a8e98' : cloth, w * 2, 1); }
  if (armour) { for (let y = 38; y < 48; y += 3) px(g, 10, y, '#b8bcc8', 28, 1); px(g, 9, 37, '#c8a040', 6, 3); px(g, 33, 37, '#c8a040', 6, 3); }
  else { px(g, 19, 36, '#e8e0d0', 10, 3); for (let i = 0; i < 9; i++) { px(g, 19 + i, 36 + i, shade(cloth, 0.7), 2, 1); px(g, 29 - i, 36 + i, shade(cloth, 0.8), 1, 1); } }
  // neck and face: an oval, wider for the burly
  const wide = p.wu > 85 && !L.female ? 1 : 0, fx = 14 - wide, fw = 20 + wide * 2;
  px(g, 20, 32, sk2, 8, 5);
  for (let y = 12; y < 36; y++) { const t = (y - 12) / 24, w = Math.round(fw / 2 * (t < 0.7 ? 1 : 1 - (t - 0.7) * (L.female ? 1.8 : 1.4))); px(g, 24 - w, y, skin, w * 2, 1); px(g, 24 + w - 2, y, sk2, 2, 1); }
  px(g, 24 - fw / 2 - 1, 22, sk2, 2, 5); px(g, 24 + fw / 2 - 1, 22, sk2, 2, 5); // ears
  if (L.face === 'g') for (let i = 0; i < 9; i++) px(g, 26 + R.int(0, 5), 22 + R.int(0, 7), '#5a8aa8', 2, 2); // Yang Zhi's blue mark
  // eyes: fierce or gentle by strength and wit
  const fierce = p.wu - p.zhi > 30, ey = 23, bc = L.hair === 'white' ? '#c8c8c8' : shade(hair, 0.9);
  for (const sx of [17, 27]) { px(g, sx, ey, '#ffffff', 4, 2); px(g, sx + (sx < 24 ? 2 : 1), ey, '#1a1a1a', 2, 2); if (L.female) { px(g, sx - 1, ey - 1, '#1a1a1a', 6, 1); } else px(g, sx, ey - 1, '#3a2a2a', 4, 1);
    px(g, sx - (fierce ? 1 : 0), ey - 3 - (fierce ? 0 : 1), bc, 5 + (fierce ? 1 : 0), fierce ? 2 : 1); if (fierce) px(g, sx < 24 ? sx + 3 : sx - 1, ey - 2, bc, 2, 1); }
  if (L.face === 'r' || L.face === 'd') px(g, 23, 27, sk3, 2, 1);
  px(g, 23, 26, sk3, 2, 2); // nose
  px(g, 21, 30, L.female ? '#c84a4a' : '#8a4a3a', 6, 1); // mouth
  if (L.female) { px(g, 16, 27, '#f0a0a0', 3, 1); px(g, 29, 27, '#f0a0a0', 3, 1); }
  // beards
  const bd = L.hair === 'white' || (p.lv > 50 && L.beard === 'long') ? '#d8d8d8' : hair;
  if (L.beard === 'stub') for (let i = 0; i < 18; i++) px(g, 17 + R.int(0, 14), 29 + R.int(0, 6), shade(bd, 1.6));
  if (L.beard === 'mous' || L.beard === 'goatee' || L.beard === 'long' || L.beard === 'full') { px(g, 19, 29, bd, 4, 1); px(g, 25, 29, bd, 4, 1); px(g, 18, 30, bd, 2, 1); px(g, 28, 30, bd, 2, 1); }
  if (L.beard === 'goatee') px(g, 22, 32, bd, 4, 5);
  if (L.beard === 'long') { for (let y = 31; y < 46; y++) { const w = Math.max(1, 5 - Math.abs(y - 36) * 0.25); px(g, 24 - w, y, bd, w * 2, 1); } px(g, 23, 33, hr2, 1, 10); }
  if (L.beard === 'full') { for (let y = 26; y < 40; y++) { const w = y < 30 ? 11 : 11 - (y - 30) * 0.9; px(g, 24 - w, y, bd, 3, 1); px(g, 24 + w - 3, y, bd, 3, 1); if (y > 30) px(g, 24 - w, y, bd, w * 2, 1); } px(g, 21, 30, '#8a4a3a', 6, 1); }
  // hair and headwear
  const hat = L.hat;
  const capOf = (col, low = 14) => { for (let y = 6; y < low; y++) { const w = Math.min(12, 6 + (y - 6) * 1.6); px(g, 24 - w, y, col, w * 2, 1); } px(g, 12, low - 1, shade(col, 0.7), 24, 2); };
  if (hat === 'scarf' || hat === 'band') { capOf(hair, 17); px(g, 14, 14, hair, 3, 8); px(g, 31, 14, hair, 3, 8); const sc = hat === 'band' ? '#c83a2a' : R.pick(['#3a3a5a', '#5a3a2a', '#2a4a6a', '#6a2a2a', '#3a5a3a']); if (hat === 'band') { px(g, 13, 15, sc, 22, 3); px(g, 34, 14, sc, 3, 7); } else { for (let y = 4; y < 14; y++) { const w = Math.min(12, 4 + (y - 4) * 1.8); px(g, 24 - w, y, sc, w * 2, 1); } px(g, 12, 13, shade(sc, 0.7), 24, 2); px(g, 22, 2, sc, 4, 3); px(g, 32, 9, sc, 4, 10); } }
  if (hat === 'helm' || hat === 'fur') { const hc = hat === 'fur' ? '#8a6a4a' : '#9a9ea8'; for (let y = 3; y < 17; y++) { const w = Math.min(13, 5 + (y - 3) * 1.6); px(g, 24 - w, y, hc, w * 2, 1); } px(g, 11, 15, shade(hc, 0.7), 26, 3); px(g, 15, 6, shade(hc, 1.4), 6, 2);
    if (hat === 'helm') { px(g, 23, 0, '#c83a2a', 2, 4); px(g, 21, 0, '#e85a3a', 6, 1); px(g, 10, 17, hc, 3, 10); px(g, 35, 17, hc, 3, 10); } else { for (let i = 0; i < 12; i++) px(g, 11 + i * 2, 16 + (i % 2), '#e8dcc8', 2, 2); } }
  if (hat === 'monk') { for (let y = 7; y < 15; y++) { const w = Math.min(11, 5 + (y - 7) * 1.5); px(g, 24 - w, y, skin, w * 2, 1); } px(g, 18, 9, shade(skin, 1.2), 5, 2); for (let i = 0; i < 6; i++) px(g, 16 + i * 3, 13, '#c84a3a'); for (let i = 0; i < 10; i++) px(g, 13 + i * 2.4, 40 + Math.abs(i - 4.5), '#5a3a1a', 2, 2); }
  if (hat === 'hair') { capOf(hair, 17); for (let i = 0; i < 9; i++) { const x = 11 + i * 3; px(g, x, 2 + (i % 2) * 2, hair, 3, 10); } px(g, 11, 14, hair, 4, 14); px(g, 33, 14, hair, 4, 14); if (p.id === '武松') { px(g, 12, 13, '#d8c890', 24, 2); px(g, 20, 4, '#c8a040', 8, 2); } }
  if (hat === 'taoist') { capOf(hair, 16); px(g, 18, 2, '#4a4a6a', 12, 6); px(g, 20, 0, '#4a4a6a', 8, 2); px(g, 23, 1, '#e8c840', 2, 4); px(g, 14, 15, hair, 3, 10); px(g, 31, 15, hair, 3, 10); }
  if (hat === 'scholar') { capOf(hair, 16); px(g, 15, 3, '#2a3a4a', 18, 9); px(g, 17, 1, '#2a3a4a', 14, 2); px(g, 32, 6, '#4a5a6a', 6, 12); px(g, 10, 6, '#4a5a6a', 6, 12); }
  if (hat === 'official') { capOf(hair, 16); px(g, 15, 3, '#1a1a1a', 18, 10); px(g, 4, 9, '#1a1a1a', 11, 2); px(g, 33, 9, '#1a1a1a', 11, 2); px(g, 16, 11, '#c8a040', 16, 1); }
  if (hat === 'turban') { capOf(hair, 16); for (let y = 4; y < 15; y++) { const w = Math.min(13, 6 + (y - 4) * 1.4); px(g, 24 - w, y, y % 3 ? '#c83a2a' : '#a82a1a', w * 2, 1); } px(g, 22, 3, '#e8c040', 4, 3); }
  if (hat === 'crown') { capOf(hair, 16); px(g, 14, 4, '#e8c030', 20, 6); for (const x of [14, 19, 24, 29]) px(g, x, 1, '#e8c030', 3, 3); px(g, 22, 6, '#c83a2a', 4, 2); }
  if (hat === 'female') { for (let y = 6; y < 18; y++) { const w = Math.min(13, 6 + (y - 6) * 1.6); px(g, 24 - w, y, hair, w * 2, 1); } px(g, 17, 0, hair, 14, 8); px(g, 13, 16, hair, 4, 22); px(g, 31, 16, hair, 4, 22); px(g, 26, 2, '#e8c040', 6, 2); px(g, 30, 1, '#c83a5a', 3, 3); }
  // frame
  g.strokeStyle = '#e8d8a0'; g.lineWidth = 1; g.strokeRect(0.5, 0.5, 47, 47);
  PC.set(p.id, cv); return cv;
}
// ---------------------------------------------------------------- walking figure (16×16): 4 directions × 2 steps
const WC = new Map();
export function walker(p, dir, step) {
  const key = p.id + dir + step; if (WC.has(key)) return WC.get(key);
  const [cv, g] = C(16, 16), L = p.look || {}, skin = SKIN[L.face] || SKIN.y, hair = HAIRC[L.hair] || '#2a2226', cloth = colourOf(p);
  const hat = { helm: '#9a9ea8', fur: '#8a6a4a', monk: skin, taoist: '#4a4a6a', scholar: '#2a3a4a', official: '#1a1a1a', turban: '#c83a2a', crown: '#e8c030', female: hair, band: hair, hair, scarf: '#3a3a5a' }[L.hat] || hair;
  px(g, 4, 14, 'rgba(0,0,0,0.25)', 8, 2);
  // legs
  const l = step ? 1 : 0; px(g, 5, 11, '#3a2a2a', 2, 3 + (l ? 0 : 1)); px(g, 9, 11, '#3a2a2a', 2, 3 + l);
  // body
  px(g, 4, 7, cloth, 8, 5); px(g, 4, 7, shade(cloth, 1.3), 8, 1); px(g, 4, 10, '#5a3a1a', 8, 1);
  if (dir === 'down') { px(g, 7, 7, '#e8e0d0', 2, 3); } // arms
  px(g, 3, 8 + (step && dir !== 'up' ? 1 : 0), skin, 1, 3); px(g, 12, 8 + (!step && dir !== 'up' ? 1 : 0), skin, 1, 3);
  // head
  px(g, 5, 2, skin, 6, 5); px(g, 4, 1, hat, 8, 3); if (dir === 'up') px(g, 5, 2, hat, 6, 5);
  if (dir === 'down') { px(g, 6, 4, '#1a1a1a'); px(g, 9, 4, '#1a1a1a'); }
  if (dir === 'left') { px(g, 5, 4, '#1a1a1a'); px(g, 9, 2, hat, 2, 4); }
  if (dir === 'right') { px(g, 10, 4, '#1a1a1a'); px(g, 5, 2, hat, 2, 4); }
  if (L.hat === 'helm') px(g, 7, 0, '#c83a2a', 2, 1);
  if (L.beard === 'long' || L.beard === 'full') { if (dir === 'down') px(g, 6, 6, hair === '#2a2226' ? '#2a2226' : hair, 4, 2); }
  WC.set(key, cv); return cv;
}
// ---------------------------------------------------------------- battle: a general on foot or horseback (32×32), facing right
const BC = new Map();
export function battler(p, frame = 0) {
  const key = p.id + frame; if (BC.has(key)) return BC.get(key);
  const [cv, g] = C(32, 32), L = p.look || {}, skin = SKIN[L.face] || SKIN.y, hair = HAIRC[L.hair] || '#2a2226', cloth = colourOf(p), mounted = p.troop === '騎';
  const hat = { helm: '#9a9ea8', fur: '#8a6a4a', monk: skin, taoist: '#4a4a6a', scholar: '#2a3a4a', official: '#1a1a1a', turban: '#c83a2a', crown: '#e8c030', female: hair, band: hair, hair, scarf: '#3a3a5a' }[L.hat] || hair;
  const bob = frame % 2;
  if (mounted) { // the horse
    const hc = rng(hash(p.id))() < 0.5 ? '#8a5a34' : rng(hash(p.id + 'h'))() < 0.5 ? '#f0f0f0' : '#2a2a2a';
    px(g, 6, 18, hc, 18, 7); px(g, 22, 13, hc, 5, 8); px(g, 25, 12, hc, 5, 4); px(g, 28, 13, '#1a1a1a'); px(g, 4, 18, shade(hc, 0.6), 3, 7);
    for (const [x, o] of [[7, 0], [11, 1], [18, 0], [22, 1]]) px(g, x, 25, shade(hc, 0.8), 2, 5 - ((o + frame) % 2));
    px(g, 11, 16, '#7a2a1a', 8, 3);
  } else { px(g, 12, 22, '#3a2a2a', 3, 8 - bob); px(g, 17, 22, '#3a2a2a', 3, 7 + bob); }
  const by = mounted ? 6 : 10;
  px(g, 11, by + 6, cloth, 10, 9); px(g, 11, by + 6, shade(cloth, 1.3), 10, 2); px(g, 11, by + 12, '#5a3a1a', 10, 1);
  px(g, 13, by, skin, 7, 7); px(g, 12, by - 1, hat, 9, 3); px(g, 12, by, hat, 2, 5); px(g, 18, by + 3, '#1a1a1a'); if (L.hat === 'helm') px(g, 15, by - 3, '#c83a2a', 2, 2);
  if (L.beard === 'long' || L.beard === 'full') px(g, 16, by + 5, L.hair === 'white' ? '#d8d8d8' : hair, 4, L.beard === 'long' ? 5 : 3);
  // the weapon, held forward
  const w = p.weapon, metal = '#d8dce8';
  if ('槍矛戟叉'.includes(w)) { px(g, 14, by + 9, '#7a5030', 18, 1); px(g, 29, by + 7, metal, 3, 4); }
  else if ('刀'.includes(w)) { px(g, 20, by - 2, '#7a5030', 1, 14); px(g, 19, by - 6, metal, 4, 6); }
  else if ('斧'.includes(w)) { px(g, 21, by - 1, '#7a5030', 1, 13); px(g, 22, by - 2, metal, 5, 5); }
  else if ('鞭錘棍杖鏈'.includes(w)) { px(g, 20, by + 1, w === '杖' ? '#c8a040' : '#8a8e98', 2, 13); if (w === '錘') px(g, 19, by - 1, '#c8a040', 4, 4); }
  else if (w === '弓') { for (let i = 0; i < 12; i++) px(g, 22 + Math.round(Math.sin(i / 11 * Math.PI) * 3), by + i, '#8a5a2a'); px(g, 22, by, '#e8e0d0', 1, 12); }
  else if (w === '扇' || w === '拂') { px(g, 21, by + 6, '#f0f0e8', 5, 5); px(g, 21, by + 10, '#7a5030', 1, 3); }
  else { px(g, 21, by + 2, metal, 1, 10); px(g, 20, by + 10, '#c8a040', 3, 1); }
  BC.set(key, cv); return cv;
}
// a small foot soldier, for the ranks behind each general (8×10)
const SC = new Map();
export function soldier(col, frame) {
  const key = col + frame; if (SC.has(key)) return SC.get(key);
  const [cv, g] = C(8, 10); px(g, 2, 0, '#9a9ea8', 4, 2); px(g, 2, 2, '#f0c898', 4, 2); px(g, 1, 4, col, 6, 4); px(g, 2, 8, '#3a2a2a', 1, 2 - frame % 2); px(g, 5, 8, '#3a2a2a', 1, 1 + frame % 2); px(g, 7, 0, '#d8dce8', 1, 8);
  SC.set(key, cv); return cv;
}
// battle backdrops (400×150): sky, distant hills, the ground of where the fight is
const BG = new Map();
export function backdrop(kind) {
  if (BG.has(kind)) return BG.get(kind);
  const [cv, g] = C(400, 150), R = rng(hash(kind));
  const sky = { snow: ['#a8b8d0', '#e0e8f0'], water: ['#5a88c8', '#b8d8f0'], night: ['#1a1a3a', '#3a3a6a'], town: ['#7aa8d8', '#d8e8f0'], fort: ['#8a98b8', '#d8d0c0'], mountain: ['#6a98c8', '#c8d8e8'], forest: ['#6aa0c8', '#c8e0e8'] }[kind] || ['#6aa8e0', '#d0e8f8'];
  for (let y = 0; y < 70; y++) { const t = y / 70; px(g, 0, y, mixC(sky[0], sky[1], t), 400, 1); }
  for (let i = 0; i < 4; i++) { const cx = R.int(0, 400), cy = R.int(8, 40); for (let k = 0; k < 6; k++) px(g, cx + k * 6 - 15, cy - (k % 2) * 3, 'rgba(255,255,255,0.8)', 14, 5); }
  const far = kind === 'snow' ? '#c8d0e0' : '#7a90a8', near = { snow: '#e8eef8', water: '#3a70c0', town: '#a89878', fort: '#8a8a70', mountain: '#7a8a5a', forest: '#3a6a2a' }[kind] || '#6a9a3a';
  for (let x = 0; x < 400; x++) { const h = 20 + Math.sin(x / 37) * 8 + Math.sin(x / 13 + 2) * 4; px(g, x, 70 - h, far, 1, h); }
  if (kind === 'mountain' || kind === 'fort') for (let x = 0; x < 400; x++) { const h = 35 + Math.abs(Math.sin(x / 29)) * 25; px(g, x, 75 - h, '#6a7468', 1, h); if (Math.abs(Math.sin(x / 29)) > 0.9) px(g, x, 75 - h, '#f0f0f0', 1, 4); }
  for (let y = 70; y < 150; y++) px(g, 0, y, mixC(near, shade(near, 0.7), (y - 70) / 80), 400, 1);
  if (kind === 'water') for (let i = 0; i < 60; i++) px(g, R.int(0, 400), R.int(72, 150), '#8ab8f0', R.int(4, 12), 1);
  else for (let i = 0; i < 160; i++) px(g, R.int(0, 400), R.int(72, 150), shade(near, R() < 0.5 ? 1.2 : 0.8), 2, 1);
  if (kind === 'forest') for (let i = 0; i < 14; i++) { const x = R.int(0, 400), y = R.int(56, 74); for (let yy = 0; yy < 14; yy++) px(g, x - (14 - yy) / 2, y - 14 + yy, '#2a5a1e', 14 - yy + yy, 1); }
  if (kind === 'town' || kind === 'fort') { for (let x = 0; x < 400; x += 4) px(g, x, 58, kind === 'fort' ? '#7a4a20' : '#9a9488', 3, 14); px(g, 0, 70, '#5a4a3a', 400, 2); }
  BG.set(kind, cv); return cv;
}
function mixC(a, b, t) { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16), c = (s) => Math.round(((A >> s) & 255) * (1 - t) + ((B >> s) & 255) * t); return `rgb(${c(16)},${c(8)},${c(0)})`; }
