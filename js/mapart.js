// The map in pixel art, in the same hand as the portraits: 16-pixel squares (blown up three times) of grass, fields,
// sand and snow that fray into each other at their edges, water with foam along the shore and reeds in the marsh,
// roads that join their neighbours, bridges and ferries; and the things that stand up from the ground — clumps of
// trees, hills, mountain peaks — outlined and drawn taller than a square so they overlap the row behind. Towns,
// strongholds and temples get their own little pictures; the army walks as a little general.
import { rng, hash } from './util.js';
import { grid, OUT, dk, lt } from './px.js';
const S = 3, CACHE = new Map();
const keep = (key, f) => { if (!CACHE.has(key)) CACHE.set(key, f()); return CACHE.get(key); };
const GROUND = { grass: '#6aa84a', field: '#9ab04e', sand: '#e6d29a', snow: '#e8f0f8' };
const speck = (G, R, n, cols) => { for (let i = 0; i < n; i++) G.set(R.int(0, 15), R.int(0, 15), cols[R.int(0, cols.length - 1)]); };
// the fraying edge of one ground into another: a ragged band of the other's colour along a side
const fray = (G, R, side, col) => { for (let t = 0; t < 16; t++) { const d = R.int(0, 2) + (t % 3 === 0 ? 1 : 0); for (let k = 0; k < d; k++) { const [x, y] = side === 'n' ? [t, k] : side === 's' ? [t, 15 - k] : side === 'w' ? [k, t] : [15 - k, t]; G.set(x, y, k === d - 1 ? dk(col, 0.06) : col); } } };

export function groundTile(c, x, y, frame, nb) {
  const wet = '~r:'.includes(c), key = c + (wet || 'FbL'.includes(c) ? frame : '') + nb + ((x * 7 + y * 13) & 3);
  return keep(key, () => {
    const G = grid(16, 16), R = rng(hash(key)), [n, e, s, w] = nb.split(''), sides = [['n', n], ['e', e], ['s', s], ['w', w]];
    const base = c === ',' ? 'field' : c === 's' ? 'sand' : c === 'n' ? 'snow' : 'grass', b = GROUND[base];
    if (!wet && !'FbL'.includes(c)) {
      G.rect(0, 0, 16, 16, b); speck(G, R, 20, [dk(b, 0.1), lt(b, 0.1)]);
      if (base === 'grass') { for (let i = 0; i < 3; i++) { const gx = R.int(1, 13), gy = R.int(3, 14); G.set(gx, gy, dk(b, 0.28)); G.set(gx + 1, gy - 1, dk(b, 0.2)); G.set(gx + 2, gy, dk(b, 0.28)); } if (R() < 0.2) { const f = ['#f8e050', '#ffffff', '#f0a0c0'][R.int(0, 2)], fx = R.int(2, 13), fy = R.int(2, 13); G.set(fx, fy, f); G.set(fx + 1, fy, f); G.set(fx, fy + 1, f); } }
      if (base === 'field') for (let r = 1; r < 16; r += 4) { for (let xx = 0; xx < 16; xx++) G.set(xx, r + 2, dk(b, 0.22)); for (let xx = (r % 8 ? 0 : 2); xx < 16; xx += 3) { G.set(xx, r, '#6a9a30'); G.set(xx, r + 1, '#5a8a28'); } }
      if (base === 'snow') speck(G, R, 5, ['#c8d8ec', '#ffffff']);
      if (base === 'sand') for (let i = 0; i < 2; i++) { const yy = R.int(2, 13), xx = R.int(0, 8); for (let j = 0; j < 5; j++) G.set(xx + j, yy + (j > 2 ? 1 : 0), lt(b, 0.25)); }
      for (const [sd, k] of sides) { if (k === 'S' && base !== 'sand') fray(G, R, sd, GROUND.sand); if (k === 'N' && base !== 'snow') fray(G, R, sd, GROUND.snow); if (k === 'G' && base === 'snow') fray(G, R, sd, GROUND.grass); }
      for (const [sd, k] of sides) if (k === 'W') fray(G, R, sd, '#d8c48c');
    } else {
      const deep = c === '~', a = deep ? '#2e64b0' : '#3a7ac4', hl = deep ? '#4a84cc' : '#5a98dc';
      G.rect(0, 0, 16, 16, a);
      for (let i = 0; i < 3; i++) { const yy = (i * 5 + frame * 2 + ((x * 3 + y) % 5)) % 16, xx = (i * 7 + frame * 3 + x * 5) % 12; for (let j = 0; j < 4; j++) G.set(xx + j, yy + (j === 0 || j === 3 ? 1 : 0), hl); }
      // foam where the water meets land
      for (const [sd, k] of sides) if (k !== 'W') for (let t = 0; t < 16; t++) { const d = (t + frame) % 3 === 0 ? 2 : 1; for (let q = 0; q < d; q++) { const [px, py] = sd === 'n' ? [t, q] : sd === 's' ? [t, 15 - q] : sd === 'w' ? [q, t] : [15 - q, t]; G.set(px, py, q === 0 ? '#e8f6ff' : '#a8d4f4'); } }
      if (c === ':') for (let i = 0; i < 7; i++) { const rx = R.int(1, 14), top = R.int(2, 8); for (let yy = top; yy < 15; yy++) G.set(rx, yy, yy % 3 ? '#8aa04a' : '#6a8a3a'); if (R() < 0.5) { G.set(rx, top - 1, '#a8783a'); G.set(rx, top - 2, '#a8783a'); } }
    }
    if (c === 'b' || c === 'L') { // planks on posts with rails
      const v = n === 'R' || s === 'R';
      if (v) { G.rect(3, 0, 10, 16, '#a8784a'); for (let yy = 0; yy < 16; yy += 3) G.rect(3, yy, 10, 1, '#6a4426'); G.rect(2, 0, 1, 16, OUT); G.rect(13, 0, 1, 16, OUT); G.rect(3, 0, 1, 16, '#5a3a1a'); G.rect(12, 0, 1, 16, '#5a3a1a'); }
      else { G.rect(0, 3, 16, 10, '#a8784a'); for (let xx = 0; xx < 16; xx += 3) G.rect(xx, 3, 1, 10, '#6a4426'); G.rect(0, 2, 16, 1, OUT); G.rect(0, 13, 16, 1, OUT); G.rect(0, 3, 16, 1, '#5a3a1a'); G.rect(0, 12, 16, 1, '#5a3a1a'); }
    }
    if (c === 'F') { // a ferry boat tied at the crossing
      G.poly([[1, 9], [15, 9], [12, 13], [4, 13]], (px, py) => (py < 10 ? '#c89058' : '#8a5a2a'));
      G.rect(8, 2, 1, 7, '#4a2e14'); G.poly([[9, 2], [14, 7], [9, 8]], '#f0e4c4');
    }
    return G.canvas(S);
  });
}

// a road drawn over the ground, joined toward its neighbours (n e s w as 1/0)
export function roadTile(conn, v) {
  return keep('r' + conn + v, () => {
    const G = grid(16, 16), [n, e, s, w] = conn.split('').map((k) => k === '1'), r = '#c8a46a', o = (v * 3) % 7;
    const In = (x, y) => (x >= 5 && x <= 10 && y >= 5 && y <= 10) || (n && x >= 5 && x <= 10 && y <= 10) || (s && x >= 5 && x <= 10 && y >= 5) || (w && y >= 5 && y <= 10 && x <= 10) || (e && y >= 5 && y <= 10 && x >= 5);
    G.shape((x, y, px, py) => In(px, py), (x, y) => ((x * 5 + y * 3 + o) % 11 === 0 ? dk(r, 0.2) : (x * 3 + y * 7 + o) % 13 === 0 ? lt(r, 0.2) : r), { out: dk(r, 0.35), shade: false });
    return G.canvas(S);
  });
}

// ---------------------------------------------------------------- things standing up from the ground (16 wide, taller)
export function standing(c, x, y, snowy) {
  const v = (x * 7 + y * 13) & 3;
  return keep('s' + c + v + (snowy ? 'n' : ''), () => {
    const R = rng(hash(c + v) ^ 77); let G;
    if (c === 'f') { // a clump of trees: broadleaf or pine
      G = grid(16, 22);
      const trees = [[4, 16], [11, 15], [7.5, 21], [13, 21], [2.5, 21]].slice(0, 3 + (v % 3)).sort((a, b) => a[1] - b[1]);
      for (const [tx, ty] of trees) {
        if (snowy || R() < 0.35) { G.rect(tx - 0.5, ty - 2, 1, 2, '#4a2e18'); for (let k = 0; k < 2; k++) { const y0 = ty - 12 + k * 5, wdt = 2.6 + k * 1.2; G.poly([[tx, y0], [tx - wdt - 0.6, y0 + 6], [tx + wdt + 0.6, y0 + 6]], (px, py) => (snowy && py < y0 + 3 ? '#f0f4fa' : px < tx ? '#3e7a3a' : '#2e5e32')); } }
        else { G.rect(tx - 0.5, ty - 3, 2, 3, '#5a3a1e'); G.shape((px, py) => Math.hypot(px - tx, py - (ty - 6.5)) < 3.9, (px, py) => (Math.hypot(px - tx + 1.6, py - ty + 8) < 1.8 ? '#7ab84e' : py > ty - 5 ? '#3a742e' : '#4a8a3a')); }
      }
      return G.canvas(S);
    }
    if (c === 'h') { // a rounded hill with grass on it
      G = grid(16, 18); const col = snowy ? '#e0e8f4' : '#7aac4a';
      G.shape((px, py) => ((px - 8) / 7.6) ** 2 + ((py - 17.5) / (9 + v * 0.5)) ** 2 <= 1 && py < 17.5, (px, py) => (Math.hypot(px - 5, py - 11) < 3 ? lt(col, 0.25) : px > 10 ? dk(col, 0.18) : col));
      for (let i = 0; i < 3; i++) { const gx = R.int(3, 12), gy = R.int(12, 16); G.set(gx, gy, dk(col, 0.3)); G.set(gx + 1, gy - 1, dk(col, 0.25)); }
      return G.canvas(S);
    }
    if (c === 'M') { // a craggy peak: a lit face, a shadowed face, snow on top
      G = grid(16, 25); const peaks = v % 2 ? [[4, 12, 5], [12, 10, 5], [8, 2, 7]] : [[11, 8, 6], [7, 2 + v, 7]];
      for (const [px, top, wd] of peaks) G.poly([[px, top], [px - wd, 24], [px + wd, 24]], (qx, qy) => (qy < top + (24 - top) * 0.28 ? (qx < px ? '#ffffff' : '#c8d4e4') : qx < px ? '#9a9284' : '#6a6458'));
      return G.canvas(S);
    }
    return null;
  });
}

// ---------------------------------------------------------------- places (24 x 24, blown up)
export function placeArt(p) {
  return keep('p' + p.id, () => {
    const G = grid(24, 24), W = 24, b = 23;
    const roof = (x0, x1, y, depth, col) => { G.poly([[x0 - 2, y + depth], [x0 + 1, y], [x1 - 1, y], [x1 + 2, y + depth]], (x, yy) => ((yy - y) % 2 === 0 ? dk(col, 0.25) : col)); };
    const wall = (x0, x1, y0, y1, col) => G.shape((x, y) => x > x0 && x < x1 && y > y0 && y < y1, (x, y) => (x < x0 + 2 ? lt(col, 0.2) : col));
    const flag = (x, y, col) => { G.rect(x, y, 1, 7, '#3a2410'); G.rect(x + 1, y, 4, 3, col); };
    if (p.kind === 'city' || p.kind === 'capital') {
      const big = p.kind === 'capital';
      wall(0, W - 1, 11, b, '#b8b0a0'); for (let x = 1; x < W - 1; x += 2) G.set(x, 11, '#a8a090');
      for (let y = 14; y < b; y += 3) for (let x = 2 + ((y / 3) % 2) * 2; x < W - 2; x += 4) G.set(x, y, '#8a8478');
      G.shape((x, y) => Math.abs(x - 12) < 3 && y > 16 && y < b, (x, y) => (y < 18 ? '#3a2a1a' : '#6a4422'));
      wall(6, 18, 7, 12, '#a83a2a'); for (let x = 8; x < 17; x += 3) G.set(x, 9, '#f0e0b0');
      roof(6, 18, 3, 4, big ? '#d8a830' : '#4a5a6a'); if (big) { roof(8, 16, 0, 3, '#d8a830'); for (const x of [1, 19]) roof(x, x + 4, 7, 3, '#d8a830'); }
      flag(1, 3, '#c83a2a'); flag(20, 3, '#c83a2a');
    } else if (p.kind === 'village' || p.kind === 'town') {
      for (const [x, y, w] of [[1, 9, 8], [12, 7, 9], [6, 14, 9]]) { wall(x, x + w, y + 3, y + 8, '#ece0c4'); G.rect(x + Math.floor(w / 2), y + 5, 2, 3, '#4a3220'); G.poly([[x - 1, y + 4], [x + w / 2, y - 1], [x + w + 1, y + 4]], (px, py) => ((px + py) % 3 === 0 ? '#a8864a' : '#d0a860')); }
      for (let x = 0; x < W; x += 2) G.set(x, 22, '#7a5a32'); G.rect(0, 21, W, 1, '#8a6a3a');
      G.ell(21, 13, 2.4, 2.4, '#4a8a3a'); G.rect(21, 15, 1, 3, '#5a3a1e');
      if (p.kind === 'town') { G.rect(14, 2, 1, 6, '#c83a2a'); G.rect(15, 2, 3, 3, '#f0e8c8'); G.set(16, 3, '#c83a2a'); }
    } else if (p.kind === 'fort') {
      G.shape((x, y) => ((x - 12) / 12) ** 2 + ((y - 24) / 13) ** 2 <= 1, (x, y) => (Math.hypot(x - 9, y - 14) < 4 ? '#9ac060' : x > 15 ? '#4a7a2e' : '#6a9a40'));
      for (let x = 3; x < 21; x += 2) { const yb = 17 - Math.sin((x - 3) / 18 * Math.PI) * 3; G.rect(x, yb - 4, 1, 4, '#8a5a2a'); G.set(x, yb - 5, '#a8703a'); }
      G.rect(4, 6, 1, 7, '#5a3a1a'); G.rect(8, 6, 1, 7, '#5a3a1a'); wall(3, 10, 4, 8, '#8a5a2a'); roof(3, 10, 1, 3, '#6a4a2a');
      flag(16, 3, p.id === '梁山' ? '#f0c830' : '#c83a2a');
    } else if (p.kind === 'temple') {
      for (let i = 0; i < 4; i++) { const y = 3 + i * 4.5, w = 5 + i * 2.5; roof(12 - w / 2, 12 + w / 2, y, 2, '#4a5a6a'); wall(12 - w / 2, 12 + w / 2, y + 1.5, y + 5, '#e8d8b8'); G.set(12, y + 3, '#a82a22'); }
      G.rect(11.5, 0, 1, 3, '#e0b040');
      for (const x of [3, 21]) G.poly([[x, 10], [x - 3, 22], [x + 3, 22]], (px) => (px < x ? '#3e7a3a' : '#2e5e32'));
    } else if (p.kind === 'base') {
      G.shape((x, y) => ((x - 12) / 12) ** 2 + ((y - 25) / 14) ** 2 <= 1, (x, y) => (x > 15 ? '#3e6a2a' : '#5a8a3a'));
      wall(2, 21, 12, 21, '#c8c0b0'); for (let x = 3; x < 21; x += 2) G.set(x, 12, '#d8d0c0');
      G.shape((x, y) => Math.abs(x - 11.5) < 2.5 && y > 16 && y < 21, '#3a2a1a');
      wall(5, 18, 8, 13, '#8a2a1a'); roof(5, 18, 4, 4, '#a83a2a'); roof(7, 16, 0, 3, '#a83a2a');
      G.rect(21, 0, 1, 12, '#3a2410'); G.shape((x, y) => x > 21.5 && x < 24 && y > 0 && y < 8, '#f0c830');
    } else { // a spot on the road: a stone stele under an old pine
      wall(7, 13, 9, 21, '#b8b4ac'); G.rect(6, 20, 9, 2, '#8a8478'); for (let y = 11; y < 19; y += 2) G.rect(9, y, 2, 1, '#6a665e');
      G.rect(17, 10, 1, 12, '#4a2e18'); for (const [x, y, w] of [[18, 7, 5], [15, 10, 4], [20, 12, 3.5]]) G.ell(x, y, w, 1.8, '#2e5e26');
    }
    return G.canvas(S);
  });
}

// ---------------------------------------------------------------- the army on the road: a little general, four ways, two steps
const SKIN = { y: '#eeaa74', w: '#f6c89c', r: '#d8704c', d: '#c48254', b: '#7a5034', g: '#eeaa74' };
export function marcher(p, dir, step, side) {
  return keep('m' + p.id + dir + step + side, () => {
    const face = dir; dir = dir === 'right' ? 'left' : dir;
    const L = p.look || {}, skin = SKIN[L.face] || SKIN.y, cloth = side || '#3a5aa8', hair = L.hair === 'red' ? '#c8401c' : L.hair === 'gold' ? '#e0a830' : L.hair === 'white' ? '#ece8e0' : '#2a2024';
    const hat = { helm: '#9a9aa8', fur: '#8a6a4a', monk: skin, taoist: '#4a4a6a', scholar: '#2a3a4a', official: '#262028', turban: '#c83a2a', crown: '#e0b030' }[L.hat] || hair;
    const G = grid(16, 16), sideways = dir === 'left' || dir === 'right', back = dir === 'up', st = step ? 1 : 0;
    G.ell(8, 15, 4.6, 1, 'rgba(0,0,0,0.3)', { out: false, shade: false });
    if (sideways) { G.rect(6 + st, 11, 2, 3, '#3a2a22'); G.rect(8 - st, 11, 2, 3, '#2a1e18'); } else { G.rect(5, 11, 2, 3 - st, '#3a2a22'); G.rect(9, 11, 2, 2 + st, '#3a2a22'); }
    if (back) G.rect(4, 7, 8, 5, '#7a2a22'); // the cape
    G.shape((x, y) => y > 6.5 && y < 12 && Math.abs(x - 8) < (sideways ? 3.2 : 4), cloth);
    G.rect(5, 10, 6, 1, '#5a3a1a');
    G.rect(13, 1, 1, 12, '#6a4424'); G.set(13, 0, '#d8dce8'); G.set(13, 2, '#c83a2a');
    const hx = sideways ? (dir === 'left' ? 7 : 9) : 8;
    G.ell(hx, 4.2, 3.8, 3.6, back ? hat : skin);
    if (!back) {
      G.shape((x, y) => Math.hypot((x - hx) / 4, (y - 4.2) / 3.8) <= 1 && y < 3.2, hat);
      if (sideways) G.set(dir === 'left' ? hx - 2 : hx + 1, 4, OUT); else { G.set(hx - 2, 4, OUT); G.set(hx + 1, 4, OUT); }
      if (L.beard === 'long' || L.beard === 'full') G.rect(hx - 1.5, 6, 3, 2, L.hair === 'white' ? '#ece8e0' : hair);
    }
    if (L.hat === 'helm') G.set(hx - 0.5, 0, '#d83a2a');
    const c = G.canvas(S); if (face === 'right') { const f = document.createElement('canvas'); f.width = c.width; f.height = c.height; const g = f.getContext('2d'); g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(c, 0, 0); return f; } return c;
  });
}
