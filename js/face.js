// Portraits in the manner of the old strategy games: a small bust drawn square by square on a 32 by 40 grid, every
// shape in a dark outline, flat colours lit from the upper left, on a pale ground in the colour of the sitter's side.
// Each of the five hundred is drawn from their look — face, headwear, beard, hair — and their strength and wit: the
// strong frown, the wise are calm, the outlaws of the greenwood scowl with scars and patched eyes.
import { rng, hash } from './util.js';
import { grid, OUT, mixC, dk, lt } from './px.js';

const GW = 32, GH = 40, S = 10, CACHE = new Map(), cx = 16;
const SKIN = { y: '#eeaa74', w: '#f6c89c', r: '#d8704c', d: '#c48254', b: '#7a5034', g: '#eeaa74' };
const HAIR = { red: '#c8401c', gold: '#e0a830', white: '#ece8e0', purple: '#7a3a8a' };
const GROUND = { ls: '#c4d2ee', song: '#ecc8bc', bandit: '#d8ccb0', zhu: '#e8d8a8', zeng: '#c8d4c0', liao: '#d4c8dc', tian: '#e0ccb0', wang: '#c4d8c0', fang: '#f0d0a8', jin: '#c0c8cc', xia: '#e0d8b0', wander: '#c0d4dc', beast: '#d0d0d0' };
const ROBE = { ls: '#3a6ab8', song: '#a83a2a', bandit: '#6a5a3a', zhu: '#8a6a2a', zeng: '#5a6a5a', liao: '#5a4a6a', tian: '#7a5a2a', wang: '#4a6a4a', fang: '#c86a1a', jin: '#3a4a4a', xia: '#7a6a3a', wander: '#5a7a8a' };
const GOLD = '#f0c040', WHITE = '#f8f6f0', LIP = '#9a3a30';

export function painted(p) {
  if (CACHE.has(p.id)) return CACHE.get(p.id);
  const G = grid(GW, GH), R = rng(hash(p.id) ^ 0x51ed), L = p.look || {}, bg = GROUND[p.side] || '#d8d0c8';
  for (let y = 0; y < GH; y++) G.rect(0, y, GW, 1, mixC(bg, '#ffffff', Math.max(0, 0.3 - y / 90)));
  person(G, p, L, R);
  for (let x = 0; x < GW; x++) { G.set(x, 0, '#3a2418'); G.set(x, GH - 1, '#3a2418'); }
  for (let y = 0; y < GH; y++) { G.set(0, y, '#3a2418'); G.set(GW - 1, y, '#3a2418'); }
  const c = G.canvas(S); CACHE.set(p.id, c); return c;
}

const dseg = (x, y, [ax, ay], [bx, by]) => { const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1))); return [Math.hypot(x - ax - dx * t, y - ay - dy * t), t]; };
function stroke(G, pts, r, col, o) { const n = pts.length - 1; return G.shape((x, y) => { for (let i = 0; i < n; i++) { const [d, t] = dseg(x, y, pts[i], pts[i + 1]); if (d <= (typeof r === 'function' ? r((i + t) / n) : r)) return true; } return false; }, col, o); }

// ---------------------------------------------------------------- the body: a robe with a crossed collar, or armour
function body(G, p, L, o) {
  const wide = o.burly ? 17 : o.female ? 14 : 16, robe = ROBE[p.side] || '#5a5a6a', metal = o.gilt ? '#d8a840' : '#8e8e9c';
  const col = (x, y) => (o.armour ? (y % 3 === 1 ? dk(metal, 0.24) : metal) : robe);
  G.shape((x, y) => y >= 31 && ((x - cx) / wide) ** 2 + ((y - 40.5) / 9.5) ** 2 <= 1, col);
  if (o.armour) {
    for (const sd of [-1, 1]) G.ell(cx + sd * (wide - 5), 34.5, 4.6, 3.4, (x, y) => (y === 35 ? dk(metal, 0.2) : metal));
    G.ell(cx, 36, 2.3, 2.3, (x, y) => (x < cx && y < 36 ? WHITE : GOLD), { shade: false });
    G.rect(cx - 4, 31, 8, 1, robe);
  } else {
    const cc = o.female ? lt(robe, 0.5) : WHITE;
    G.shape((x, y) => y >= 31 && y <= 37 && Math.abs(x - (cx - 4 + (y - 31) * 0.75)) < 1, cc, { out: false });
    G.shape((x, y) => y >= 31 && y <= 35 && Math.abs(x - (cx + 3.6 - (y - 31) * 0.95)) < 1, cc, { out: false });
    G.shape((x, y) => y >= 31 && y < 34 && x > cx - 3.4 + (y - 31) * 0.75 && x < cx + 2.6 - (y - 31) * 0.95, o.skin, { out: false, shade: false });
    if (L.hat === 'monk') for (let i = 0; i <= 8; i++) { const x = cx - 5 + i * 1.25, y = 35 - ((x - cx) / 5) ** 2 * 2.6; G.set(x, y, i % 2 ? '#6a3a2a' : '#8a5a3a'); }
  }
}

function person(G, p, L, R) {
  const female = !!L.female, burly = p.wu >= 86 && !female;
  const old = L.hair === 'white' || (p.lv >= 48 && (L.beard === 'long' || L.beard === 'goatee') && R() < 0.45);
  const menace = !female && p.side === 'bandit', fierce = menace || (!female && p.wu - p.zhi > 28), wise = !menace && p.zhi - p.wu > 25;
  const skin = SKIN[L.face] || SKIN.y, hair = old ? WHITE : HAIR[L.hair] || ['#2a2024', '#3a2a22', '#241c1c'][R.int(0, 2)];
  const rx = female ? 6.7 : burly ? 8.1 : 7.4, ry = 9.1, fcy = 19.6, hat = L.hat || (female ? 'female' : 'top');
  const head = (x, y, e = 0) => { const dy = (y - fcy) / (ry + e), k = dy > 0 ? 1 - 0.3 * dy * dy : 1; return ((x - cx) / ((rx + e) * k)) ** 2 + dy * dy <= 1; };
  const armour = hat === 'helm' || hat === 'fur' || ((p.troop === '騎' || p.wu > 80) && !wise && !['monk', 'taoist', 'scholar', 'official'].includes(hat) && !female && R() < 0.6);
  // behind: long hair, hoods, the cheek guards of a helmet
  if (hat === 'female' || hat === 'hair') G.shape((x, y) => y > 12 && y < (hat === 'hair' ? 31 : 35) && ((x - cx) / (rx + 2.6)) ** 2 + ((y - 21) / 13) ** 2 <= 1, (x, y) => ((x + y) % 5 === 0 ? dk(hair, 0.15) : hair));
  if (hat === 'scarf') { const vc = R.pick(['#3a3a5a', '#5a3a2a', '#2a4a6a', '#6a2a2a', '#3a5a3a']); L = { ...L, scarfC: vc }; G.shape((x, y) => (y > 13 && y < 24 && Math.abs(x - cx) < rx + 2 && Math.abs(x - cx) > rx - 0.5), vc); }
  if (hat === 'helm') for (const sd of [-1, 1]) G.rect(sd < 0 ? cx - rx - 2 : cx + rx, 14, 2, 9, '#8e8e9c');
  body(G, p, L, { burly, female, armour, skin, gilt: p.side === 'song' && p.lv >= 40 });
  G.shape((x, y) => y > 26 && y < 32 && Math.abs(x - cx) < (female ? 2.6 : 3.4), dk(skin, 0.18));
  const bh = old ? WHITE : hair, bcol = (x, y) => ((x * 3 + y) % 5 === 0 ? dk(bh, 0.14) : bh);
  if (L.beard === 'long') stroke(G, [[cx, 26], [cx, 36.5]], (t) => 4.6 - t * 2.8, bcol);
  // ears, then the face
  for (const sd of [-1, 1]) G.ell(cx + sd * (rx + 0.3), 20.5, 1.5, 2.2, skin);
  G.shape((x, y) => head(x, y), skin);
  if (L.face === 'g') G.shape((x, y) => head(x, y, -0.6) && ((x - (cx + 3.8)) / 2.8) ** 2 + ((y - 23) / 2.6) ** 2 <= 1 + (((x * 7 + y * 3) % 5) - 2) * 0.12, '#6a98c0', { out: false, shade: false }); // Yang Zhi's blue mark
  if (old || p.lv > 60) { G.set(11, 23, dk(skin, 0.2)); G.set(20, 23, dk(skin, 0.2)); }
  // the eyes and brows
  const close = R() < 0.3 ? 1 : 0, eY = 19, patch = menace && R() < 0.15;
  for (const sd of [-1, 1]) {
    const x0 = sd < 0 ? 11 + close : 18 - close;
    for (let i = 0; i < 3; i++) { G.set(x0 + i, eY - 1, OUT); G.set(x0 + i, eY, i === (sd < 0 ? 2 : 0) ? '#2a1a14' : WHITE); }
    if (female) G.set(sd < 0 ? x0 - 1 : x0 + 3, eY - 1, OUT);
    const bc = old ? '#f0ece8' : dk(hair, 0.1), inner = sd < 0 ? x0 + 3 : x0 - 1, outer = sd < 0 ? x0 - 1 : x0 + 3;
    if (!female) for (let i = 0; i <= 4; i++) { const x = outer + (inner - outer) * i / 4, y = fierce ? eY - 4 + Math.round(i / 2.2) : wise ? eY - 3 - (i > 0 && i < 4 ? 1 : 0) : eY - 3; G.set(x, y, bc); if ((burly || fierce) && i > 1) G.set(x, y - 1, bc); }
    else for (let i = 1; i <= 3; i++) G.set(outer + (inner - outer) * i / 4, eY - 3, dk(hair, 0.05));
  }
  if (patch) { G.rect(17, 18, 4, 3, '#1c1216'); G.line(9, 15, 23, 18, '#1c1216'); }
  if (menace && R() < 0.6) { const s = R.int(0, 2); if (s === 0) G.line(19, 21, 22, 25, '#f0b8a8'); if (s === 1) G.line(10, 17, 13, 22, '#f0b8a8'); if (s === 2) G.line(12, 24, 15, 27, '#f0b8a8'); }
  // nose, mouth, cheeks
  G.set(16, 21, dk(skin, 0.2)); G.set(16, 22, dk(skin, 0.26)); G.set(15, 22, dk(skin, 0.2));
  const mY = 25;
  if (female) { G.set(15, mY, '#d0484c'); G.set(16, mY, '#d0484c'); G.set(10, 22, '#f2a094'); G.set(21, 22, '#f2a094'); }
  else if (fierce) { for (let x = 14; x <= 17; x++) G.set(x, mY, LIP); G.set(13, mY + 1, LIP); G.set(18, mY + 1, LIP); if (menace && R() < 0.5) { G.set(14, mY + 1, WHITE); G.set(17, mY + 1, WHITE); } }
  else if (wise) { for (let x = 14; x <= 17; x++) G.set(x, mY, LIP); G.set(13, mY - 1, LIP); G.set(18, mY - 1, LIP); }
  else for (let x = 14 + (R() < 0.5 ? 0 : 1); x <= 17; x++) G.set(x, mY, LIP);
  // beards
  const beard = menace && (!L.beard || L.beard === 'none') ? (R() < 0.6 ? 'stub' : 'full') : L.beard;
  if (beard === 'stub') G.shape((x, y) => head(x, y) && y > 23 && (Math.floor(x) + Math.floor(y)) % 2 === 0 && !(Math.floor(y) === mY && Math.abs(x - cx) < 2.6), mixC(skin, bh, 0.45), { out: false, shade: false });
  if (beard === 'full') { G.shape((x, y) => y > 23.5 && (head(x, y, 0.5) || (y < 30 + (Math.floor(x) % 2) && Math.abs(x - cx) < 6.5 - (y - 27) * 1.2)) && !(y > mY && y < mY + 1 && Math.abs(x - cx) < 2.2), bcol); for (let x = 14; x <= 17; x++) G.set(x, mY, '#4a1a18'); }
  if (beard === 'goatee' || beard === 'long' || beard === 'mous') { G.shape((x, y) => (y > 23 && y < 24.9 && Math.abs(x - cx) < 3.4 && Math.abs(x - cx) > 0.6) || (beard !== 'mous' && y > 23 && y < 27 && Math.abs(x - cx) > 2.4 && Math.abs(x - cx) < 3.5), bcol, { shade: false }); if (beard === 'goatee') G.shape((x, y) => y > 26.5 && y < 31 && Math.abs(x - cx) < 2.2 - (y - 27) * 0.35, bcol); for (let x = 14; x <= 17; x++) G.set(x, mY, '#4a1a18'); }
  hats(G, p, L, { hat, hair, skin, rx, head, old, female });
}

function hats(G, p, L, o) {
  const { hat, hair, head, rx } = o, hcol = (x, y) => ((x * 2 + y) % 6 === 0 ? dk(hair, 0.18) : hair);
  const cap = (low, col, e = 0.7, side = 0) => G.shape((x, y) => head(x, y, e) && (y < low || (side && Math.abs(x - cx) > rx - 1.2 && y < low + side)), col);
  switch (hat) {
    case 'top': cap(13.5, hcol, 0.6, 4); G.ell(cx, 9.6, 2.4, 2, hcol); G.rect(cx - 1, 10, 2, 1, '#c83a2a'); break;
    case 'scarf': { const vc = L.scarfC || '#3a3a5a'; G.shape((x, y) => (head(x, y, 1) && y < 14) || ((x - cx) / 4.2) ** 2 + ((y - 9) / 3) ** 2 <= 1, (x, y) => ((x + y) % 4 === 0 ? dk(vc, 0.15) : vc)); stroke(G, [[cx + 3, 9], [cx + 7, 5]], 0.8, vc); break; }
    case 'band': cap(13.5, hcol, 0.6, 4); G.ell(cx, 9.6, 2.4, 2, hcol); G.shape((x, y) => head(x, y, 0.8) && y > 12 && y < 14, '#c83a2a'); stroke(G, [[cx + rx, 13], [cx + rx + 3, 17]], 0.7, '#c83a2a'); break;
    case 'helm': { const m = p.side === 'song' || p.side === 'jin' ? '#d8a840' : '#8e8e9c'; G.shape((x, y) => head(x, y, 1.1) && y < 14.4, (x, y) => (y === 14 ? dk(m, 0.25) : Math.abs(x + 0.5 - cx) < 1 ? lt(m, 0.35) : m)); G.rect(15, 6, 2, 3, GOLD); G.ell(cx, 4.6, 2.2, 2, '#d83a2a'); break; }
    case 'fur': G.shape((x, y) => head(x, y, 1.5) && y < 14, (x, y) => ((x + y) % 3 === 0 ? '#6a4a2a' : '#8a6a4a')); G.shape((x, y) => head(x, y, 1.6) && y > 12 && y < 14.6, (x, y) => (x % 2 ? '#f0e8d8' : '#d8ccb8')); G.ell(cx, 5.8, 1.8, 1.8, '#e8dcc8'); break;
    case 'monk': for (const [x, y] of [[14, 12], [16, 12], [18, 12], [15, 13], [17, 13]]) G.set(x - 0.5, y, dk(o.skin, 0.22)); G.set(12, 12, lt(o.skin, 0.4)); G.set(13, 11, lt(o.skin, 0.4)); break;
    case 'hair':
      G.shape((x, y) => (head(x, y, 1) && y < 14) || (y > 3 && y < 14 && x > 6 && x < 26 && y > 4 + Math.abs(((x * 0.7) % 3) - 1.5) * 3.4 + Math.abs(x - cx) * 0.35), hcol);
      G.shape((x, y) => head(x, y, 1.4) && !head(x, y, -0.3) && y > 12 && y < 22, hcol);
      if (p.id === '武松') G.shape((x, y) => head(x, y, 1.2) && y > 11.5 && y < 13.5, (x, y) => (Math.abs(x + 0.5 - cx) < 1 ? '#c8402a' : '#d8c890')); // the iron hoop of the pilgrim
      break;
    case 'taoist': cap(13.5, hcol, 0.6, 3); G.ell(cx, 8.4, 2.8, 2.4, hcol); G.rect(14, 6, 4, 3, '#4a4a6a'); G.set(15, 5, GOLD); G.set(16, 5, GOLD); stroke(G, [[10.5, 8.5], [21.5, 7.5]], 0.5, '#eadfc4'); break;
    case 'scholar': G.shape((x, y) => (head(x, y, 0.7) && y < 13.4) || (y > 6.5 && y < 13 && Math.abs(x - cx) < 5.6), (x, y) => (y > 11.5 ? '#4a5a6a' : '#2a3a4a')); for (const sd of [-1, 1]) G.rect(sd < 0 ? cx - 8 : cx + 6, 9, 2, 7, '#4a5a6a'); break;
    case 'official': G.shape((x, y) => (head(x, y, 0.6) && y < 13.5) || ((x - cx) / 4.8) ** 2 + ((y - 9.5) / 3.2) ** 2 <= 1, '#262028'); for (const s of [-1, 1]) G.shape((x, y) => y > 9 && y < 11.2 && (s < 0 ? x > 2 && x < 9 : x > 23 && x < 30), '#262028'); G.rect(11, 12, 10, 1, '#c8a040'); break;
    case 'turban': G.shape((x, y) => head(x, y, 1.6) && y < 14.5 || ((x - cx) / 6.4) ** 2 + ((y - 8.6) / 4) ** 2 <= 1, (x, y) => (y % 3 === 0 ? '#a82a1a' : '#c83a2a')); G.ell(cx, 8, 1.4, 1.4, GOLD); break;
    case 'crown': cap(13.5, hcol, 0.6, 3); G.shape((x, y) => (y > 9.5 && y < 12.5 && Math.abs(x - cx) < 6) || [11, 16, 21].some((t) => y > 6.5 && y <= 10 && Math.abs(x - t) < 1.5 - (10 - y) * 0.15), GOLD); G.set(16, 10, '#e84a3a'); G.set(15, 10, '#e84a3a'); break;
    case 'female': {
      G.shape((x, y) => head(x, y, 0.7) && (y < 13.5 || (Math.abs(x - cx) > rx - 1.6 && y < 20)), (x, y) => ((x + y * 2) % 7 === 0 ? dk(hair, 0.15) : hair));
      G.set(15, 12, dk(hair, 0.3)); G.set(15, 11, dk(hair, 0.3));
      const style = o.old ? 0 : hash(p.id) % 3;
      if (style === 0) G.ell(cx, 7.6, 3.8, 2.8, hair);
      if (style === 1) for (const sd of [-1, 1]) G.ell(cx + sd * 5.4, 8.6, 2.8, 2.6, hair);
      if (style === 2) { G.ell(cx, 6.2, 3, 3.6, hair); G.ell(cx, 9.6, 4.6, 1.8, hair); }
      if (!o.old) { stroke(G, style === 1 ? [[8, 9], [12, 7]] : [[11, 8], [23, 6]], 0.5, GOLD); G.ell(style === 1 ? 22 : 21.5, 9.5, 1.3, 1.3, ['#e85a6a', '#f0a0c0', '#ffffff'][hash(p.id + 'f') % 3], { shade: false }); }
      for (const sd of [-1, 1]) G.set(sd < 0 ? cx - rx - 1 : cx + rx, 23, '#e8c050'); break; }
  }
}
