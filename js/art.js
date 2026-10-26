// The battle screen in pixel art, in the same hand as the portraits and the map: each general on foot or on
// horseback (outlined, lit from the upper left, holding their own kind of weapon), the little soldiers of their ranks,
// and the backdrop of where the fight is.
import { rng, hash } from './util.js';
import { grid, OUT, dk, lt } from './px.js';
import { scene } from './scene.js';
const CACHE = new Map();
const keep = (key, f) => { if (!CACHE.has(key)) CACHE.set(key, f()); return CACHE.get(key); };
const SKIN = { y: '#eeaa74', w: '#f6c89c', r: '#d8704c', d: '#c48254', b: '#7a5034', g: '#eeaa74' };
const HAIRC = { red: '#c8401c', gold: '#e0a830', white: '#ece8e0', purple: '#7a3a8a' };
const colourOf = (p) => ({ ls: '#3a6ab8', song: '#a83a2a', bandit: '#6a5a3a', zhu: '#8a6a2a', zeng: '#5a6a5a', liao: '#5a4a6a', tian: '#7a5a2a', wang: '#4a6a4a', fang: '#c86a1a', jin: '#3a4a4a', xia: '#7a6a3a', wander: '#5a7a8a' }[p.side] || '#5a5a6a');
export const sideColour = colourOf;
const METAL = '#d8dce8', WOOD = '#7a5030';

// ---------------------------------------------------------------- a general on foot or horseback (32 x 32), facing right
export function battler(p, frame = 0) {
  return keep('b' + p.id + frame, () => {
    const G = grid(32, 32), L = p.look || {}, skin = SKIN[L.face] || SKIN.y, hair = HAIRC[L.hair] || '#2a2024', cloth = colourOf(p), mounted = p.troop === '騎', bob = frame % 2;
    const hat = { helm: '#9a9aa8', fur: '#8a6a4a', monk: skin, taoist: '#4a4a6a', scholar: '#2a3a4a', official: '#262028', turban: '#c83a2a', crown: '#e0b030' }[L.hat] || hair;
    const armour = L.hat === 'helm' || L.hat === 'fur' || (mounted && p.wu > 80);
    G.ell(16, 30.5, mounted ? 12 : 6, 1.3, 'rgba(0,0,0,0.3)', { out: false, shade: false });
    if (mounted) { // the horse: bay, white or black
      const R = rng(hash(p.id)), hc = R() < 0.5 ? '#9a6238' : R() < 0.5 ? '#f0f0ec' : '#2e2a2a';
      for (const [x, o] of [[7, 0], [11, 1], [19, 0], [23, 1]]) G.rect(x, 22, 2, 7 - ((o + frame) % 2), dk(hc, 0.15));
      G.shape((x, y) => ((x - 15) / 10) ** 2 + ((y - 19) / 4.4) ** 2 <= 1 || (x > 22 && x < 27.5 && y > 11 && y < 20 && x > 22 + (20 - y) * 0.1), hc);
      G.ell(27, 12.5, 3.6, 2.4, hc); G.set(28, 12, OUT);
      G.poly([[5, 17], [1, 24 + bob], [3, 25], [7, 19]], dk(hc, 0.35));
      G.rect(11, 15, 9, 2, '#8a2a1a');
    } else { G.rect(13, 22, 3, 8 - bob, '#3a2a22'); G.rect(17, 22, 3, 7 + bob, '#3a2a22'); }
    const by = mounted ? 5 : 9;
    // the body, the head and the headwear
    G.shape((x, y) => y > by + 5.5 && y < by + 14 && Math.abs(x - 16) < 4.6, (x, y) => (armour && y % 3 === 0 ? dk('#8e8e9c', 0.2) : armour ? '#8e8e9c' : cloth));
    G.rect(12, by + 11, 9, 1, '#5a3a1a');
    if (armour) G.rect(12, by + 7, 9, 1, cloth);
    G.ell(16.5, by + 3, 3.8, 3.6, skin);
    G.set(18, by + 3, OUT);
    if (L.hat !== 'monk') G.shape((x, y) => Math.hypot((x - 16.5) / 4.1, (y - by - 3) / 3.9) <= 1 && (y < by + 1.6 || x < 15), hat);
    if (L.hat === 'helm') { G.rect(16, by - 3, 1, 2, '#d83a2a'); G.set(15, by - 3, '#d83a2a'); }
    if (L.hat === 'scarf' || L.hat === 'band' || !L.hat) G.ell(15, by - 1.4, 1.6, 1.3, hat);
    if (L.beard === 'long' || L.beard === 'full') G.rect(16, by + 5, 3, L.beard === 'long' ? 5 : 3, L.hair === 'white' ? '#ece8e0' : hair);
    // the weapon, held forward
    const w = p.weapon || '劍';
    if ('槍矛戟叉'.includes(w)) { G.rect(14, by + 9, 18, 1, WOOD); G.poly([[29, by + 7], [32, by + 9.5], [29, by + 12]], METAL); if (w === '戟') G.rect(28, by + 6, 1, 3, METAL); }
    else if ('刀'.includes(w)) { G.rect(20, by - 2, 1, 14, WOOD); G.poly([[20, by - 7], [23, by - 4], [22, by + 1], [20, by - 1]], METAL); }
    else if ('斧'.includes(w)) { G.rect(21, by - 1, 1, 13, WOOD); G.poly([[22, by - 3], [27, by - 1], [27, by + 3], [22, by + 2]], METAL); }
    else if ('鞭錘棍杖鏈'.includes(w)) { G.rect(20, by, 2, 14, w === '杖' ? '#c8a040' : '#8a8e98'); if (w === '錘') G.ell(21, by - 1, 2.4, 2.4, '#c8a040'); if (w === '杖') G.ell(21, by - 1, 1.6, 1.6, '#e8d070'); }
    else if (w === '弓') { for (let i = 0; i < 13; i++) G.set(22 + Math.round(Math.sin(i / 12 * Math.PI) * 3), by + i, '#8a5a2a'); G.rect(22, by, 1, 13, '#e8e0d0'); }
    else if (w === '扇' || w === '拂') { G.poly([[21, by + 6], [27, by + 3], [27, by + 10]], '#f0f0e8'); G.rect(21, by + 6, 1, 4, WOOD); }
    else if (w === '戒') { for (const dx of [0, 3]) { G.rect(20 + dx, by + 2, 1, 9, METAL); G.set(20 + dx, by + 11, '#c8a040'); } }
    else { G.rect(21, by + 1, 1, 10, METAL); G.rect(20, by + 10, 3, 1, '#c8a040'); }
    return G.canvas();
  });
}
// a small foot soldier, for the ranks behind each general (8 x 10)
export function soldier(col, frame) {
  return keep('s' + col + frame, () => {
    const G = grid(8, 10);
    G.rect(6, 0, 1, 9, '#d8dce8');
    G.shape((x, y) => y > 3.5 && y < 8 && x > 1 && x < 6, col, { out: OUT });
    G.shape((x, y) => Math.hypot(x - 3.5, y - 2.4) < 2.1, (x, y) => (y < 2 ? '#9a9aa8' : '#eeaa74'), { out: OUT });
    G.set(2, 9 - (frame % 2), '#3a2a22'); G.set(4, 8 + (frame % 2), '#3a2a22');
    return G.canvas();
  });
}
// the backdrop of a battle (400 x 150): the same painted country as 西遊記, cropped to the field, the hour laid over
const KIND = { plain: ['mount', {}], forest: ['forest', {}], mountain: ['mount', {}], snow: ['ice', { mood: 'snow' }], water: ['river', {}], night: ['mount', { mood: 'night' }], town: ['town', {}], fort: ['mount', { mood: 'dusk' }] };
export function backdrop(kind) {
  return keep('bg' + kind, () => {
    const [theme, V] = KIND[kind] || KIND.plain, src = scene(theme, V), c = document.createElement('canvas'); c.width = 400; c.height = 150;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(src, 0, 58, src.width, src.height - 58, 0, 0, 400, 150);
    if (kind === 'fort') { // a palisade on the ridge
      for (let x = 0; x < 400; x += 5) { g.fillStyle = '#5a3a1a'; g.fillRect(x, 50, 4, 16); g.fillStyle = '#8a5a2a'; g.fillRect(x, 50, 3, 16); g.fillStyle = '#a8703a'; g.fillRect(x + 1, 48, 1, 2); }
      g.fillStyle = '#3a2410'; g.fillRect(0, 64, 400, 2);
    }
    return c;
  });
}
