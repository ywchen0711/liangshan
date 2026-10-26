// The battle screen in pixel art, in the same hand as the portraits and the map: each general on foot or on
// horseback (48 pixels: lamellar armour, a cape in the colours of their side, a saddle cloth with gilt trim, mane and
// tail, their own headwear and beard, and their own kind of weapon drawn out in full), the soldiers of their ranks by
// kind — spearmen with shields, archers, horsemen, marines, banner-bearers — the war flags of each army, and the
// backdrop of where the fight is, with grass and stones on the ground.
import { rng, hash } from './util.js';
import { grid, OUT, dk, lt, mixC } from './px.js';
import { scene } from './scene.js';
const CACHE = new Map();
const keep = (key, f) => { if (!CACHE.has(key)) CACHE.set(key, f()); return CACHE.get(key); };
const SKIN = { y: '#eeaa74', w: '#f6c89c', r: '#d8704c', d: '#c48254', b: '#7a5034', g: '#eeaa74' };
const HAIRC = { red: '#c8401c', gold: '#e0a830', white: '#ece8e0', purple: '#7a3a8a' };
const colourOf = (p) => ({ ls: '#3a6ab8', song: '#a83a2a', bandit: '#6a5a3a', zhu: '#8a6a2a', zeng: '#5a6a5a', liao: '#5a4a6a', tian: '#7a5a2a', wang: '#4a6a4a', fang: '#c86a1a', jin: '#3a4a4a', xia: '#7a6a3a', wander: '#5a7a8a' }[p.side] || '#5a5a6a');
export const sideColour = colourOf;
export const SIDE_CHAR = { ls: '梁', song: '宋', bandit: '寨', zhu: '祝', zeng: '曾', liao: '遼', tian: '田', wang: '王', fang: '方', jin: '金', xia: '夏', wander: '俠' };
const METAL = '#dce0ec', IRON = '#8e8e9c', WOOD = '#7a5030', GOLD = '#f0c040', RED = '#d83a2a';
const dseg = (x, y, [ax, ay], [bx, by]) => { const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1))); return [Math.hypot(x - ax - dx * t, y - ay - dy * t), t]; };
function stroke(G, pts, r, col, o) { const n = pts.length - 1; return G.shape((x, y) => { for (let i = 0; i < n; i++) { const [d, t] = dseg(x, y, pts[i], pts[i + 1]); if (d <= (typeof r === 'function' ? r((i + t) / n) : r)) return true; } return false; }, col, o); }
const line = (G, pts, col) => { for (let i = 0; i < pts.length - 1; i++) G.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], col); };

// ---------------------------------------------------------------- a general on foot or horseback (48 x 48), facing right
const HORSE = [['#9a6238', '#2a1e1a'], ['#f0f0ec', '#b8b8c0'], ['#2e2a2a', '#141010'], ['#b8642e', '#6a3418'], ['#a8a8ac', '#5a5a62']];
export function battler(p, frame = 0) {
  return keep('b' + p.id + frame, () => {
    const G = grid(48, 56).offset(0, 8), L = p.look || {}, R = rng(hash(p.id)), skin = SKIN[L.face] || SKIN.y, hair = L.hair === 'white' ? '#ece8e0' : HAIRC[L.hair] || '#2a2024';
    const cloth = colourOf(p), mounted = p.troop === '騎', f = frame % 2, w = p.weapon || '劍';
    const robe = ['謀', '術'].includes(p.troop) || ['scholar', 'taoist', 'official'].includes(L.hat) || L.female;
    const armour = !robe && (L.hat === 'helm' || L.hat === 'fur' || mounted || p.wu > 78);
    const metal = p.side === 'song' || p.side === 'jin' || (p.rank && p.rank <= 12) ? '#c8a048' : p.side === 'liao' ? '#9a8a72' : IRON;
    G.ell(24, 46.5, mounted ? 17 : 8, 1.5, 'rgba(0,0,0,0.32)', { out: false, shade: false });
    // ---- the horse
    let seat = 0;
    if (mounted) {
      const [hc, mane] = p.id === '盧俊義' ? HORSE[1] : p.id === '呼延灼' ? HORSE[2] : HORSE[R.int(0, HORSE.length - 1)];
      const legs = f ? [[13, 0], [17, -3], [32, -3], [35, 0]] : [[13, -3], [17, 0], [32, 0], [35, -3]];
      for (const [i, [lx, lift]] of legs.entries()) { const far = i === 1 || i === 2; stroke(G, [[lx, 34], [lx + (lift ? 2 : 0), 40 + lift / 2], [lx + (lift ? 1 : 0), 45 + lift]], 1.1, far ? dk(hc, 0.2) : hc); G.rect(lx - 1 + (lift ? 1 : 0), 44 + lift, 3, 1, p.id === '呼延灼' ? '#f0f0ec' : '#2a2020'); }
      stroke(G, [[10, 28], [6, 32 + f], [4, 39 + f], [6, 42]], (t) => 2.2 - t * 1.4, mane); // the tail
      G.shape((x, y) => ((x - 23) / 13) ** 2 + ((y - 31) / 6.4) ** 2 <= 1, (x, y) => (y < 28 && x < 30 ? lt(hc, 0.18) : y > 34 ? dk(hc, 0.15) : hc));
      G.poly([[31, 32], [33, 20], [37, 17], [40, 20], [38, 31]], (x, y) => (x < 35 ? lt(hc, 0.12) : hc)); // the neck
      G.poly([[36, 16], [42, 18], [45, 22], [44, 25], [40, 25], [37, 22]], hc); // the head
      G.poly([[37, 17], [37.5, 13], [39.5, 16.5]], hc); G.set(41, 19, OUT); G.set(44, 23, dk(hc, 0.45));
      stroke(G, [[36, 16], [33, 19], [31, 25]], 1.2, mane, { out: false }); // the mane
      line(G, [[43, 22], [38, 24], [31, 24]], '#5a3018'); G.set(43, 21, GOLD); // bridle and reins
      G.poly([[15, 25], [31, 25], [33, 33], [14, 33]], (x, y) => (y > 31.5 ? GOLD : cloth)); // the saddle cloth
      G.rect(18, 23, 11, 3, '#5a3018'); G.rect(27, 33, 1, 4, '#3a2a1a'); G.rect(26, 37, 3, 1, IRON);
      seat = -15;
    }
    // ---- the rider: cape, legs, body, arms
    const by = 22 + seat; // the top of the body
    stroke(G, [[19, by + 1], [13 - f, by + 9], [10 - f, by + (mounted ? 14 : 18)]], (t) => 2.2 + t * 1.6, (x, y) => ((x + y) % 4 === 0 ? dk(cloth, 0.4) : dk(cloth, 0.26))); // the cape
    if (!mounted) {
      const st = f ? 2 : -2;
      stroke(G, [[21, by + 11], [20 - st, by + 18], [20 - st, by + 22]], 1.5, '#4a3a32'); stroke(G, [[25, by + 11], [26 + st, by + 18], [26 + st, by + 22]], 1.5, '#5a4a40');
      G.rect(18 - st, by + 22, 5, 2, '#2a1e18'); G.rect(24 + st, by + 22, 5, 2, '#2a1e18');
    } else { stroke(G, [[24, by + 11], [27, by + 15], [27, by + 19]], 1.5, '#4a3a32'); G.rect(26, by + 19, 4, 2, '#2a1e18'); }
    // tassets or the skirt of a robe
    G.poly([[17, by + 9], [30, by + 9], [31, by + (robe ? 18 : 14)], [16, by + (robe ? 18 : 14)]], (x, y) => (armour ? ((x + (y >> 1)) % 3 === 0 ? dk(metal, 0.25) : metal) : (y % 4 === 0 ? dk(cloth, 0.1) : cloth)));
    G.shape((x, y) => x > 17.5 && x < 29.5 && y > by && y < by + 10, (x, y) => {
      if (!armour) return Math.abs(x - 23.5 - (y - by) * 0.3) < 1 ? '#f0ece0' : cloth;
      const off = ((y - by) >> 1) % 2; return y % 2 === 0 ? dk(metal, 0.28) : (x + off) % 2 ? lt(metal, 0.1) : metal; // lamellar scales
    });
    G.rect(18, by + 8, 12, 2, '#5a3a1a'); G.rect(23, by + 8, 2, 2, GOLD);
    if (armour) { G.ell(27, by + 2, 3.6, 2.4, (x, y) => (y < by + 2 ? lt(metal, 0.25) : metal)); G.ell(23.5, by + 5, 2, 2, '#e8e0d0', { shade: false }); G.ell(23.5, by + 5, 1.3, 1.3, GOLD, { out: false }); }
    if (L.hat === 'monk') for (let i = 0; i < 7; i++) G.set(20 + i, by + 1 + Math.abs(i - 3) * 0.6, i % 2 ? '#6a3a2a' : '#a86a3a'); // prayer beads
    stroke(G, [[19, by + 2], [17, by + 7], [18, by + 10]], 1.3, armour ? dk(metal, 0.12) : dk(cloth, 0.15)); // the far arm
    // ---- the head
    const hx = 24, hy = by - 6;
    G.ell(hx, hy, 4.6, 5, skin);
    G.ell(hx - 3.6, hy + 0.5, 1.2, 1.8, dk(skin, 0.1)); // the ear
    G.rect(hx + 1, hy - 1, 2, 1, OUT); G.set(hx + 2, hy, OUT); G.set(hx + 4.5, hy + 1, dk(skin, 0.3)); G.set(hx + 2, hy + 3, '#8a3a30'); G.set(hx + 3, hy + 3, '#8a3a30');
    const fierce = p.wu - p.zhi > 28 || p.side === 'bandit';
    G.rect(hx, hy - 3 + (fierce ? 1 : 0), 4, 1, dk(hair, 0.1)); if (fierce) G.set(hx + 3, hy - 1, dk(hair, 0.1));
    if (L.face === 'g') { G.set(hx + 1, hy + 1, '#6a98c0'); G.set(hx + 2, hy + 1, '#6a98c0'); G.set(hx + 1, hy + 2, '#6a98c0'); }
    const bd = L.hair === 'white' || (L.beard === 'long' && R() < 0.3) ? '#ece8e0' : hair;
    if (L.beard === 'long') stroke(G, [[hx + 2, hy + 4], [hx + 2.5, hy + 9], [hx + 1.5, hy + 12]], (t) => 1.8 - t * 1.1, bd);
    if (L.beard === 'full') G.shape((x, y) => Math.hypot(x - hx - 1.5, y - hy - 3.5) < 3.4 && y > hy + 1.5, bd);
    if (L.beard === 'goatee') G.rect(hx + 1.5, hy + 4, 2, 3, bd);
    if (L.beard === 'mous' || L.beard === 'goatee' || L.beard === 'long') G.rect(hx + 1, hy + 2, 4, 1, bd);
    if (L.beard === 'stub') { G.set(hx, hy + 3, mixC(skin, bd, 0.5)); G.set(hx + 1, hy + 4, mixC(skin, bd, 0.5)); G.set(hx + 3, hy + 4, mixC(skin, bd, 0.5)); }
    const cap = (low, col, back = 0) => G.shape((x, y) => Math.hypot((x - hx) / 5, (y - hy) / 5.4) <= 1 && (y < low || x < hx - 2 + back), col);
    switch (L.hat) {
      case 'helm': cap(hy - 1, (x, y) => (y === Math.floor(hy - 2) ? dk(metal, 0.3) : x < hx ? lt(metal, 0.2) : metal)); G.rect(hx - 5, hy - 1, 3, 6, metal); stroke(G, [[hx, hy - 5], [hx - 3, hy - 9], [hx - 7, hy - 8]], (t) => 1.4 - t * 0.6, RED); G.rect(hx - 0.5, hy - 7, 1, 2, GOLD); break;
      case 'fur': cap(hy - 1, (x, y) => ((x + y) % 3 === 0 ? '#6a4a2a' : '#8a6a4a')); G.rect(hx - 5, hy - 2, 10, 2, '#e8dcc8'); stroke(G, [[hx - 4, hy - 3], [hx - 8, hy + 4]], 0.8, '#e8dcc8'); break;
      case 'scarf': cap(hy - 1.5, (x, y) => ((x + y) % 4 === 0 ? '#2e2e48' : '#3a3a5a')); stroke(G, [[hx - 4, hy - 2], [hx - 8, hy + 1 - f], [hx - 9, hy + 4]], 0.8, '#3a3a5a'); break;
      case 'band': cap(hy - 2, hair); G.rect(hx - 4, hy - 2, 9, 1, RED); stroke(G, [[hx - 4, hy - 2], [hx - 8, hy - f], [hx - 9, hy + 3]], 0.6, RED); break;
      case 'monk': G.set(hx - 1, hy - 3, lt(skin, 0.4)); G.set(hx, hy - 4, lt(skin, 0.4)); break;
      case 'hair': cap(hy - 1, hair, 1); stroke(G, [[hx - 3, hy - 2], [hx - 7, hy + 2], [hx - 7, hy + 7]], 1.6, hair); if (p.id === '武松') G.rect(hx - 4, hy - 3, 9, 1, '#d8c890'); break;
      case 'taoist': cap(hy - 1.5, hair); G.ell(hx - 1, hy - 5.6, 2, 1.6, hair); G.rect(hx - 2, hy - 7, 3, 2, '#4a4a6a'); G.set(hx - 1, hy - 8, GOLD); break;
      case 'scholar': cap(hy - 1.5, '#2a3a4a'); G.rect(hx - 4, hy - 7, 7, 4, '#2a3a4a'); stroke(G, [[hx - 4, hy - 3], [hx - 7, hy + 3]], 0.7, '#4a5a6a'); break;
      case 'official': cap(hy - 1.5, '#262028'); G.rect(hx - 3, hy - 7, 6, 4, '#262028'); G.rect(hx - 10, hy - 5, 7, 1, '#262028'); break;
      case 'turban': cap(hy - 0.5, (x, y) => (y % 2 ? '#a82a1a' : RED)); G.ell(hx, hy - 5.5, 3.4, 2, RED); G.set(hx + 1, hy - 4, GOLD); break;
      case 'crown': cap(hy - 1.5, hair); G.rect(hx - 3, hy - 6, 6, 2, GOLD); for (const x of [-3, 0, 2]) G.set(hx + x, hy - 7, GOLD); break;
      case 'female': cap(hy - 1, hair, 1); G.ell(hx - 2, hy - 5.4, 2.4, 2, hair); stroke(G, [[hx - 3, hy - 1], [hx - 6, hy + 5], [hx - 5, hy + 9]], 1.5, hair); G.set(hx + 1, hy - 5, GOLD); G.set(hx + 2, hy - 6, '#e85a6a'); break;
      default: cap(hy - 1.5, hair); G.ell(hx - 1, hy - 5.6, 1.8, 1.5, hair);
    }
    // ---- the near arm and the weapon in its hand
    const ax = 32, ay = by + 5; // the hand
    stroke(G, [[27, by + 2], [30, by + 5], [ax, ay]], 1.4, armour ? metal : cloth);
    weapon(G, w, ax, ay, f, p);
    G.ell(ax, ay, 1.3, 1.3, skin);
    return G.canvas();
  });
}
function weapon(G, w, x, y, f, p) {
  const tassel = (tx, ty) => { G.rect(tx, ty, 2, 1, RED); G.set(tx, ty + 1, RED); G.set(tx + 1, ty + 2, RED); };
  if ('槍矛叉戟'.includes(w)) { // a long shaft held forward, its head beyond the horse's nose
    stroke(G, [[x - 16, y + 7], [x + 14, y - 6]], 0.6, WOOD, { out: false }); G.line(x - 16, y + 8, x + 14, y - 5, dk(WOOD, 0.3));
    const tx = x + 14, ty = y - 6;
    if (w === '槍') { G.poly([[tx - 1, ty - 1], [tx + 5, ty - 3.5], [tx + 1, ty + 1.5]], METAL); tassel(tx - 3, ty + 1); }
    if (w === '矛') { stroke(G, [[tx - 1, ty], [tx + 2, ty - 2], [tx + 3, ty], [tx + 6, ty - 3]], 0.7, METAL); tassel(tx - 3, ty + 1); } // the serpent spear, its blade waving
    if (w === '叉') { G.rect(tx - 1, ty - 3, 1, 5, METAL); for (const d of [-3, 0, 3]) G.line(tx, ty + d * 0.4, tx + 4, ty - 2 + d * 0.6, METAL); }
    if (w === '戟') { G.poly([[tx - 1, ty - 1], [tx + 5, ty - 3.5], [tx + 1, ty + 1.5]], METAL); G.shape((qx, qy) => { const d = Math.hypot(qx - tx + 1, qy - ty - 3); return d < 3.4 && d > 1.8 && qy > ty; }, METAL); }
    return;
  }
  if (w === '刀') { stroke(G, [[x - 2, y + 12], [x + 3, y - 14]], 0.6, WOOD, { out: false }); G.poly([[x + 3, y - 13], [x + 7, y - 21], [x + 9, y - 19], [x + 6, y - 11]], (qx) => (qx < x + 6 ? lt(METAL, 0.3) : METAL)); tassel(x + 1, y - 11); G.set(x + 3, y - 12, GOLD); return; }
  if (w === '斧') { stroke(G, [[x - 2, y + 9], [x + 2, y - 11]], 0.6, WOOD, { out: false }); G.poly([[x + 2, y - 12], [x + 8, y - 15], [x + 8, y - 6], [x + 2, y - 8]], (qx) => (qx > x + 6 ? lt(METAL, 0.4) : METAL)); return; }
  if (w === '鞭') { for (let i = 0; i < 6; i++) G.rect(x + i * 0.7, y - 2 - i * 2, 2, 2, i % 2 ? IRON : lt(IRON, 0.25)); G.rect(x - 1, y, 3, 1, GOLD); return; }
  if (w === '錘') { stroke(G, [[x, y + 2], [x + 2, y - 7]], 0.5, WOOD, { out: false }); G.ell(x + 2.5, y - 9, 3, 3, (qx, qy) => (qx < x + 2 && qy < y - 9 ? '#f8e080' : '#c8a040')); for (const d of [-2, 2]) G.set(x + 2.5 + d, y - 9, '#8a6a20'); return; }
  if (w === '棍') { stroke(G, [[x - 10, y + 10], [x + 8, y - 12]], 0.7, '#8a5a2a', { out: false }); G.rect(x + 7, y - 12, 2, 2, IRON); G.rect(x - 11, y + 9, 2, 2, IRON); return; }
  if (w === '杖') { stroke(G, [[x - 1, y + 14], [x + 2, y - 16]], 0.7, '#a8884a', { out: false }); G.shape((qx, qy) => { const d = Math.hypot(qx - x - 2.5, qy - y + 18); return d < 3 && d > 1.6; }, METAL); for (const d of [-2, 2]) G.set(x + 2 + d, y - 15, GOLD); return; } // the monk's staff with its crescent and rings
  if (w === '戒') { for (const d of [0, 4]) { G.poly([[x + d, y], [x + d + 1, y - 10], [x + d + 3, y - 12], [x + d + 2, y - 1]], METAL); G.rect(x + d - 1, y, 3, 1, GOLD); } return; }
  if (w === '弓') { for (let i = 0; i <= 16; i++) G.set(x + 1 + Math.round(Math.sin(i / 16 * Math.PI) * 4), y - 8 + i, '#8a5a2a'); G.line(x + 1, y - 8, x + 1, y + 8, '#f0e8d8'); G.line(x - 4, y, x + 8, y, '#c8b890'); G.set(x + 8, y, METAL); G.rect(15, y - 6, 3, 8, '#6a4a2a'); for (const d of [0, 2]) G.set(15 + d, y - 7, '#f0f0f0'); return; }
  if (w === '鏢') { for (const d of [-2, 0, 2]) G.line(x, y + d * 0.3, x + 5, y - 2 + d, METAL); G.rect(19, y + 2, 3, 3, '#6a4a2a'); return; }
  if (w === '扇') { G.shape((qx, qy) => { const a = Math.atan2(qy - y, qx - x), d = Math.hypot(qx - x, qy - y); return d > 1 && d < 8 && a < -0.6 && a > -2.2; }, (qx, qy) => ((Math.round(Math.atan2(qy - y, qx - x) * 5) % 2) ? '#f4f0e4' : '#d8d0c0')); G.rect(x - 1, y - 1, 2, 3, WOOD); return; }
  if (w === '鏈') { for (let i = 0; i < 5; i++) G.set(x + i, y - i * 1.5, IRON); G.ell(x + 6, y - 8, 2.4, 2.4, IRON); return; }
  if (w === '砲') { G.rect(x - 2, y - 2, 9, 4, '#4a4a52'); G.rect(x + 6, y - 3, 2, 6, '#3a3a42'); G.set(x - 3, y - 3, '#f8a030'); return; }
  // a straight sword
  G.poly([[x, y - 1], [x + 9, y - 9], [x + 10, y - 8], [x + 1, y + 1]], (qx) => (qx > x + 6 ? lt(METAL, 0.4) : METAL)); G.line(x - 1, y - 2, x + 2, y + 1, GOLD);
}

// ---------------------------------------------------------------- the soldiers of the ranks, by kind (16 x 18), facing right
export function soldier(col, frame, troop = '步') {
  return keep('s' + col + frame + troop, () => {
    const G = grid(16, 18), f = frame % 2, cav = troop === '騎', skin = '#eeaa74';
    G.ell(8, 17, cav ? 7 : 3.6, 0.9, 'rgba(0,0,0,0.3)', { out: false, shade: false });
    let by = 9;
    if (cav) { // a little horse
      const hc = frame % 3 ? '#8a5a34' : '#5a3a2a';
      for (const [lx, d] of [[3, f], [5, 1 - f], [10, f], [12, 1 - f]]) G.rect(lx, 13, 1, 4 - d, dk(hc, 0.2));
      G.ell(7.5, 12, 5.5, 2.4, hc); G.poly([[11, 12], [13, 7], [15, 8], [13.5, 12]], hc); G.set(14, 8, OUT); G.rect(1, 11, 2, 3, '#2a1e1a');
      G.rect(5, 9, 5, 2, col); by = 3;
    } else { G.rect(6 + f, by + 5, 1, 3, '#3a2a22'); G.rect(9 - f, by + 5, 1, 3, '#3a2a22'); }
    G.shape((x, y) => y > by && y < by + 5.5 && x > 5 && x < 10.5, (x, y) => (y === by + 4 ? '#5a3a1a' : troop === '水' ? (y % 2 ? '#e8e4d8' : col) : col));
    G.ell(8, by - 1.8, 2.3, 2.2, skin); G.set(9, by - 2, OUT);
    if (troop === '水') G.rect(6, by - 4, 4, 1, '#d8c890'); else G.shape((x, y) => Math.hypot((x - 8) / 2.6, (y - by + 2) / 2.4) <= 1 && y < by - 2, troop === '謀' || troop === '術' ? '#3a3a5a' : '#9a9aa8');
    if (troop === '弓') { for (let i = 0; i <= 8; i++) G.set(11 + Math.round(Math.sin(i / 8 * Math.PI) * 2), by - 3 + i, '#8a5a2a'); G.line(11, by - 3, 11, by + 5, '#e8e0d0'); }
    else if (troop === '謀' || troop === '術') { G.rect(11, by - 9, 1, 15, WOOD); G.rect(12, by - 9, 4, 4, col); G.set(13, by - 8, GOLD); } // a banner
    else if (troop === '水') { G.rect(11, by - 5, 1, 11, WOOD); G.line(11, by - 5, 13, by - 6, IRON); G.set(13, by - 5, IRON); } // a hook pole
    else { G.rect(11, by - 7, 1, 13, WOOD); G.poly([[10.5, by - 7], [11.5, by - 10], [12.5, by - 7]], METAL); if (!cav) G.ell(5, by + 2.5, 2.2, 2.8, (x, y) => (Math.hypot(x - 5, y - by - 2.5) < 1 ? GOLD : dk(col, 0.25))); }
    return G.canvas();
  });
}

// ---------------------------------------------------------------- a war flag (one per army), flying in the wind
export function flag(side, t) {
  const fr = Math.floor(t * 6) % 4;
  return keep('flag' + side + fr, () => {
    const c = document.createElement('canvas'); c.width = 30; c.height = 46; const g = c.getContext('2d'), col = side === 'ls' ? '#e8c020' : colourOf({ side }), ch = SIDE_CHAR[side] || '軍';
    g.fillStyle = '#3a2410'; g.fillRect(2, 2, 2, 44); g.fillStyle = GOLD; g.fillRect(1, 0, 4, 3);
    // the cloth, rippling: each column shifted by a wave
    for (let x = 0; x < 22; x++) { const dy = Math.round(Math.sin(x / 4 + fr * 1.57) * 1.5 * (x / 22)); g.fillStyle = x === 0 ? dk(col, 0.3) : (x + dy) % 7 === 0 ? dk(col, 0.12) : col; g.fillRect(4 + x, 4 + dy, 1, 22); g.fillStyle = side === 'ls' ? '#a82a1a' : GOLD; g.fillRect(4 + x, 25 + dy, 1, 2); g.fillStyle = OUT; g.fillRect(4 + x, 3 + dy, 1, 1); g.fillRect(4 + x, 27 + dy, 1, 1); }
    g.fillStyle = side === 'ls' ? '#8a1a10' : '#fff4d8'; g.font = 'bold 13px "Noto Serif TC", serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, 15, 15);
    return c;
  });
}

// ---------------------------------------------------------------- a beast of the story (48 x 36): the tiger of Jingyang Ridge, the yellow-turbaned spirit soldiers
export function beastArt(p, frame) {
  return keep('beast' + p.beast + frame, () => {
    const G = grid(48, 40), f = frame % 2;
    G.ell(24, 38.5, 16, 1.4, 'rgba(0,0,0,0.3)', { out: false, shade: false });
    if (p.beast === 'tiger') {
      const fur = '#e8a030', stripe = (x, y) => ((x * 0.9 + y * 0.35) % 5 < 1.2 && y < 30 ? '#2a1a0a' : y > 28 ? '#f8f0e0' : fur);
      for (const [lx, d] of [[10, f], [15, 1 - f], [30, f], [35, 1 - f]]) { G.rect(lx, 28, 4, 9 - d * 2, '#d89028'); G.rect(lx, 36 - d * 2, 5, 2, '#f8f0e0'); }
      stroke(G, [[8, 24], [3, 18 - f * 2], [2, 12], [5, 9]], 1.3, (x, y) => (y % 4 < 2 ? '#2a1a0a' : fur));
      G.shape((x, y) => ((x - 23) / 15) ** 2 + ((y - 25) / 6.4) ** 2 <= 1, stripe);
      G.shape((x, y) => Math.hypot(x - 39, y - 18) < 7, (x, y) => ((x + y) % 5 === 0 && y < 16 ? '#2a1a0a' : y > 20 ? '#f8f0e0' : fur)); // the head
      for (const ex of [34, 42]) G.poly([[ex - 2, 12], [ex - 1, 8], [ex + 2, 11]], fur);
      G.rect(39, 16, 2, 1, '#f0d020'); G.set(40, 16, OUT); G.rect(43, 16, 2, 1, '#f0d020'); G.set(44, 16, OUT);
      G.rect(43, 20, 3, 1, '#3a2a2a'); G.rect(40, 23, 6, 1, OUT); G.set(41, 24, '#ffffff'); G.set(44, 24, '#ffffff'); G.rect(42, 24, 2, 1, '#c83a2a');
      G.rect(38, 11, 3, 1, '#2a1a0a'); G.rect(39, 10, 1, 3, '#2a1a0a'); // 王 on the brow
    } else { // a spirit soldier in a yellow turban, half there
      G.shape((x, y) => y > 14 && y < 38 && Math.abs(x - 24) < 7 + (y - 14) * 0.15, (x, y) => (y % 3 === 0 ? '#2a1a3a' : '#3a2a4a'));
      G.ell(24, 10, 5, 5, '#c8c0d8'); G.rect(19, 5, 10, 3, '#e8c040'); G.set(22, 10, '#e84a3a'); G.set(26, 10, '#e84a3a');
      G.rect(31, 6, 1, 26, METAL); G.rect(30, 22, 3, 1, GOLD);
      for (let i = 0; i < 5; i++) G.rect(15 + i * 4, 36 + ((i + f) % 2), 3, 2, '#2a1a3a');
    }
    return G.canvas();
  });
}

// ---------------------------------------------------------------- the backdrop of a battle (400 x 150)
// the same painted country as 西遊記, cropped to the field, the hour laid over, and the ground scattered with grass,
// stones and flowers (or the ripples of water)
const KIND = { plain: ['mount', {}], forest: ['forest', {}], mountain: ['mount', {}], snow: ['ice', { mood: 'snow' }], water: ['river', {}], night: ['mount', { mood: 'night' }], town: ['town', {}], fort: ['mount', { mood: 'dusk' }] };
export function backdrop(kind) {
  return keep('bg' + kind, () => {
    const [theme, V] = KIND[kind] || KIND.plain, src = scene(theme, V), c = document.createElement('canvas'); c.width = 400; c.height = 150;
    const g = c.getContext('2d'), R = rng(hash(kind) ^ 0x77); g.imageSmoothingEnabled = false; g.drawImage(src, 0, 58, src.width, src.height - 58, 0, 0, 400, 150);
    if (kind === 'fort') { // a palisade on the ridge, with a gate tower
      for (let x = 0; x < 400; x += 5) { g.fillStyle = '#3a2410'; g.fillRect(x, 50, 5, 17); g.fillStyle = '#8a5a2a'; g.fillRect(x + 1, 50, 3, 16); g.fillStyle = '#a8703a'; g.fillRect(x + 2, 48, 1, 2); }
      g.fillStyle = '#5a3a1a'; g.fillRect(180, 30, 40, 22); g.fillStyle = '#2a1a10'; g.fillRect(192, 40, 16, 12); g.fillStyle = '#4a3a2a'; g.fillRect(174, 26, 52, 5); g.fillStyle = '#c83a2a'; g.fillRect(198, 14, 1, 13); g.fillRect(199, 14, 8, 5);
    }
    if (kind === 'town') { g.fillStyle = 'rgba(60,40,30,0.25)'; g.fillRect(0, 66, 400, 4); }
    // the ground: tufts, stones, flowers, ruts — fewer towards the horizon
    const hz = 64;
    for (let i = 0; i < 220; i++) {
      const y = hz + 4 + Math.pow(R(), 0.8) * (146 - hz), x = R() * 400, s = (y - hz) / (150 - hz);
      if (kind === 'water') { if (y > 96 && R() < 0.7) { g.fillStyle = 'rgba(220,240,255,0.5)'; g.fillRect(Math.round(x), Math.round(y), 2 + Math.round(s * 5), 1); } continue; }
      const r = R();
      if (r < 0.55) { const col = kind === 'snow' ? '#c8d4e4' : '#3e6a2a'; g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), 1, 1); g.fillRect(Math.round(x) + 1, Math.round(y) - 1, 1, 2); g.fillRect(Math.round(x) + 2, Math.round(y), 1, 1); }
      else if (r < 0.75) { const sz = 1 + Math.round(s * 2); g.fillStyle = '#5a564e'; g.fillRect(Math.round(x), Math.round(y), sz + 1, sz); g.fillStyle = '#9a968c'; g.fillRect(Math.round(x), Math.round(y), sz, Math.max(1, sz - 1)); }
      else if (r < 0.85 && kind !== 'snow' && kind !== 'town') { g.fillStyle = ['#f8e050', '#ffffff', '#f0a0c0', '#e86a5a'][R.int(0, 3)]; g.fillRect(Math.round(x), Math.round(y), 1, 1); }
      else if (kind === 'town' || kind === 'plain') { g.fillStyle = 'rgba(90,70,40,0.35)'; g.fillRect(Math.round(x), Math.round(y), 4 + Math.round(s * 8), 1); }
    }
    return c;
  });
}
