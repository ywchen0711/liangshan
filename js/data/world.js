// The world: a map of the Song empire in the years of the novel, from Shaanxi in the west to the Liao and the sea
// in the north and east and Fang La's Jiangnan in the south. The Yellow River and the Yangtze cross it, the marsh of
// Liangshan lies in the middle with the fortress on its island, mountain ranges wall it in. Roads join the towns;
// away from them the wilds are full of outlaws and soldiers. It is built the same way every time from a seed.
import { rng } from '../util.js';
export const MW = 128, MH = 116;
// tiles: . grass  , farmland  f forest  h hills  M mountains (impassable)  ~ water (impassable)  r river (impassable)
// = road  b bridge  F ferry (needs a boat pass)  L the causeway to Liangshan (needs the way opened)  : reeds  n snow
export const TILE = {
  '.': { name: '草原', cost: 1, enc: 1 }, ',': { name: '農田', cost: 1, enc: 0.6 }, f: { name: '森林', cost: 1, enc: 1.5 }, h: { name: '丘陵', cost: 1, enc: 1.4 }, M: { name: '高山', block: 1 },
  '~': { name: '水', block: 1 }, r: { name: '河', block: 1 }, '=': { name: '官道', cost: 1, enc: 0.15 }, b: { name: '橋', cost: 1, enc: 0 }, F: { name: '渡口', cost: 1, enc: 0, need: '渡江' }, L: { name: '水寨', cost: 1, enc: 0, need: '梁山' },
  ':': { name: '蘆葦', cost: 1, enc: 1.2 }, n: { name: '雪原', cost: 1, enc: 1.3 }, s: { name: '沙灘', cost: 1, enc: 0.8 },
};
// places: id, kind, x, y, danger level, what's there
// kinds: capital, city, town, village, fort (a mountain stronghold), temple, field (a spot on the road), base
export const PLACES = [
  ['史家村', 'village', 10, 58, 1], ['少華山', 'fort', 16, 64, 3], ['華州', 'city', 16, 52, 4], ['渭州', 'city', 6, 44, 3], ['延安府', 'city', 8, 28, 30],
  ['五台山', 'temple', 30, 16, 5], ['瓦罐寺', 'temple', 32, 34, 6], ['太原', 'city', 22, 24, 32], ['威勝州', 'fort', 20, 10, 46], ['蓋州', 'city', 32, 6, 46], ['昭德府', 'city', 12, 18, 46],
  ['大名府', 'city', 52, 24, 20], ['曾頭市', 'fort', 40, 18, 32], ['相州', 'city', 44, 30, 26], ['薊州', 'city', 66, 8, 22], ['二仙山', 'temple', 72, 4, 22],
  ['雄州', 'city', 76, 16, 44], ['檀州', 'city', 84, 6, 46], ['霸州', 'city', 92, 12, 48], ['密雲', 'town', 88, 2, 47], ['幽州', 'city', 100, 6, 50], ['燕京', 'capital', 110, 8, 55], ['會寧府', 'city', 122, 2, 62], ['興慶府', 'city', 2, 10, 55],
  ['滄州', 'city', 82, 22, 7], ['柴家莊', 'village', 88, 26, 7], ['飲馬川', 'fort', 94, 18, 20],
  ['高唐州', 'city', 66, 32, 27], ['凌州', 'city', 58, 28, 30], ['東昌府', 'city', 56, 40, 36], ['東平府', 'city', 60, 50, 36], ['梁山', 'base', 70, 50, 0], ['石碣村', 'village', 79, 53, 9], ['朱貴酒店', 'town', 70, 59, 8],
  ['鄆城縣', 'city', 78, 60, 10], ['東溪村', 'village', 84, 62, 6], ['黃泥岡', 'field', 62, 58, 12], ['景陽岡', 'field', 48, 44, 11], ['陽穀縣', 'city', 46, 48, 12], ['清河縣', 'village', 42, 38, 10],
  ['祝家莊', 'fort', 62, 66, 23], ['扈家莊', 'village', 57, 69, 22], ['李家莊', 'village', 67, 70, 22], ['濟州', 'city', 76, 68, 15],
  ['青州', 'city', 100, 40, 28], ['清風寨', 'fort', 94, 46, 16], ['二龍山', 'fort', 106, 34, 14], ['桃花山', 'fort', 110, 44, 9], ['白虎山', 'fort', 102, 52, 27], ['對影山', 'fort', 90, 54, 16],
  ['沂水縣', 'village', 92, 62, 18], ['沂嶺', 'field', 98, 64, 18], ['登州', 'city', 114, 28, 24], ['登雲山', 'fort', 120, 32, 24], ['芒碭山', 'fort', 70, 78, 28], ['枯樹山', 'fort', 50, 74, 30], ['黃門山', 'fort', 60, 80, 22], ['武岡鎮', 'village', 38, 56, 16],
  ['東京', 'capital', 38, 66, 8], ['野豬林', 'field', 48, 60, 7], ['孟州', 'city', 24, 70, 14], ['十字坡', 'village', 28, 62, 13], ['快活林', 'field', 20, 74, 14],
  ['江州', 'city', 60, 87, 20], ['揭陽嶺', 'field', 70, 85, 18], ['無為軍', 'city', 52, 84, 21], ['建康府', 'city', 84, 83, 40],
  ['潤州', 'city', 88, 95, 54], ['蘇州', 'city', 100, 97, 56], ['秀州', 'city', 106, 102, 57], ['湖州', 'city', 92, 102, 57], ['杭州', 'city', 100, 107, 58], ['睦州', 'city', 86, 106, 62], ['歙州', 'city', 74, 104, 62], ['幫源洞', 'fort', 80, 112, 66],
  ['南豐', 'fort', 34, 102, 48], ['宛州', 'city', 28, 84, 46], ['荊南', 'city', 18, 98, 48],
].map(([id, kind, x, y, lv]) => ({ id, name: id, kind, x, y, lv }));
export const PLACE = Object.fromEntries(PLACES.map((p) => [p.id, p]));
// the roads: pairs of places joined by a road
const ROADS = `史家村-少華山 史家村-華州 華州-渭州 華州-延安府 渭州-延安府 華州-孟州 少華山-十字坡 十字坡-孟州 孟州-快活林 十字坡-東京 延安府-太原 太原-五台山 五台山-瓦罐寺 瓦罐寺-東京 瓦罐寺-相州 太原-昭德府 昭德府-威勝州 威勝州-蓋州 延安府-興慶府
東京-野豬林 野豬林-滄州 東京-陽穀縣 陽穀縣-景陽岡 景陽岡-清河縣 清河縣-相州 相州-大名府 大名府-曾頭市 曾頭市-相州 大名府-凌州 凌州-高唐州 高唐州-滄州 滄州-柴家莊 柴家莊-飲馬川 滄州-雄州 雄州-薊州 薊州-二仙山 雄州-檀州 檀州-密雲 檀州-霸州 霸州-幽州 幽州-燕京 燕京-會寧府
陽穀縣-東昌府 東昌府-東平府 東平府-朱貴酒店 朱貴酒店-鄆城縣 鄆城縣-東溪村 東溪村-石碣村 鄆城縣-濟州 朱貴酒店-黃泥岡 黃泥岡-野豬林 黃泥岡-祝家莊 祝家莊-扈家莊 祝家莊-李家莊 李家莊-濟州 扈家莊-枯樹山 濟州-芒碭山 武岡鎮-東京 武岡鎮-陽穀縣 高唐州-東平府
滄州-青州 鄆城縣-對影山 對影山-清風寨 清風寨-青州 青州-二龍山 青州-桃花山 青州-白虎山 對影山-沂水縣 沂水縣-沂嶺 青州-登州 登州-登雲山
東京-宛州 宛州-荊南 荊南-南豐 宛州-江州 芒碭山-黃門山 黃門山-江州 江州-無為軍 江州-揭陽嶺 揭陽嶺-建康府 建康府-潤州 潤州-蘇州 蘇州-湖州 蘇州-秀州 秀州-杭州 湖州-杭州 杭州-睦州 睦州-歙州 歙州-幫源洞 睦州-幫源洞 南豐-歙州`;

export function buildWorld() {
  const R = rng(1107), T = Array.from({ length: MH }, () => new Array(MW).fill('.'));
  const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < MW && y < MH) T[y][x] = c; }, get = (x, y) => (x >= 0 && y >= 0 && x < MW && y < MH ? T[y][x] : '~');
  // smooth noise: a few octaves of interpolated random grids
  const grid = (n, seed) => { const g = rng(seed), a = []; for (let i = 0; i <= n; i++) { a.push([]); for (let j = 0; j <= n; j++) a[i].push(g()); } return (x, y) => { const fx = Math.max(0, Math.min(n - 0.001, x / MW * n)), fy = Math.max(0, Math.min(n - 0.001, y / MH * n)), i = Math.floor(fy), j = Math.floor(fx), u = fx - j, v = fy - i, s = (t) => t * t * (3 - 2 * t); const A = a[i][j], B = a[i][j + 1], C = a[i + 1][j], D = a[i + 1][j + 1]; return A + (B - A) * s(u) + (C - A) * s(v) + (A - B - C + D) * s(u) * s(v); }; };
  const n1 = grid(10, 3), n2 = grid(24, 4), n3 = grid(48, 5), noise = (x, y) => n1(x, y) * 0.55 + n2(x, y) * 0.3 + n3(x, y) * 0.15;
  const nf = grid(20, 8), nf2 = grid(44, 9);
  // ranges: Taihang down the west, Huashan, Wutai, Taishan, the hills of Jiangnan
  const ranges = [[[14, 4], [22, 20], [26, 40], [30, 50]], [[18, 60], [22, 62]], [[26, 10], [34, 18]], [[86, 34], [92, 42]], [[104, 30], [110, 38]], [[70, 110], [84, 114]], [[64, 100], [74, 112]], [[40, 78], [48, 82]], [[6, 34], [10, 40]], [[0, 0], [10, 6]]];
  const nearRange = (x, y) => { let d = 99; for (const r of ranges) for (let i = 0; i + 1 < r.length; i++) { const [ax, ay] = r[i], [bx, by] = r[i + 1], dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1))); d = Math.min(d, Math.hypot(x - ax - dx * t, y - ay - dy * t)); } return d; };
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const h = noise(x, y) + Math.max(0, 1 - nearRange(x, y) / 5) * 0.55, f = nf(x, y) * 0.7 + nf2(x, y) * 0.3;
    let c = '.'; if (h > 0.78) c = 'M'; else if (h > 0.64) c = 'h'; else if (f > 0.62) c = 'f'; else if (f < 0.3) c = ',';
    if (y < 14 && c !== 'M' && R() < 0.85) c = c === 'f' ? 'f' : 'n';
    T[y][x] = c;
  }
  // the sea: east and south-east, with a ragged shore and sand
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const shore = 120 - (y > 60 ? (y - 60) * 0.05 : 0) + (n2(x, y) - 0.5) * 8 + (y < 26 ? (26 - y) * 0.3 : 0) + (y > 100 ? -(y - 100) * 0.4 : 0); if (x > shore + 1.5) set(x, y, '~'); else if (x > shore) set(x, y, 's'); }
  // rivers: the Yellow River and the Yangtze, wavering a little
  const river = (pts, w) => { for (let i = 0; i + 1 < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1], L = Math.ceil(Math.hypot(bx - ax, by - ay) * 4); for (let k = 0; k <= L; k++) { const t = k / L, x = ax + (bx - ax) * t, y = ay + (by - ay) * t + (n2(x, ay) - 0.5) * 3; const r = w / 2; for (let yy = Math.floor(y - r); yy <= Math.ceil(y + r); yy++) for (let xx = Math.floor(x - r); xx <= Math.ceil(x + r); xx++) if (Math.hypot(xx - x, yy - y) <= r + 0.35 && get(xx, yy) !== '~') set(xx, yy, 'r'); } } };
  river([[0, 48], [18, 50], [32, 55], [44, 53], [51, 41], [60, 35], [74, 29], [90, 25], [108, 21], [127, 19]], 2);
  river([[0, 88], [24, 86], [46, 91], [62, 92], [80, 89], [96, 90], [112, 89], [127, 91]], 3);
  river([[60, 92], [58, 100], [62, 110], [60, 116]], 1); // the Qiantang, toward Hangzhou
  // the marsh of Liangshan: water with reeds round it, an island in the middle
  const LX = 70, LY = 50;
  for (let y = LY - 10; y <= LY + 10; y++) for (let x = LX - 12; x <= LX + 12; x++) { const d = Math.hypot((x - LX) / 10, (y - LY) / 8) + (n3(x, y) - 0.5) * 0.25; if (d < 0.95) set(x, y, '~'); else if (d < 1.18) set(x, y, ':'); }
  for (let y = LY - 2; y <= LY + 2; y++) for (let x = LX - 3; x <= LX + 3; x++) if (Math.hypot((x - LX) / 3, (y - LY) / 2.2) < 1.05) set(x, y, Math.abs(x - LX) + Math.abs(y - LY) < 3 ? '.' : 'f');
  // clear room round every place
  for (const p of PLACES) for (let y = p.y - 1; y <= p.y + 1; y++) for (let x = p.x - 1; x <= p.x + 1; x++) { const c = get(x, y); if (p.id === '梁山' ? false : 'M~r:'.includes(c)) set(x, y, p.kind === 'fort' || p.kind === 'temple' ? 'h' : ','); }
  // roads: the cheapest way between each pair, over hills and forests but round mountains; bridges where they cross
  // a river, a ferry on the Yangtze, a causeway onto the marsh
  const cost = (x, y) => { const c = get(x, y); return c === 'M' ? 40 : c === '~' ? 999 : c === 'r' ? 14 : c === ':' ? 6 : c === 'h' ? 3 : c === 'f' ? 2.2 : c === '=' || c === 'b' ? 0.6 : 1; };
  const path = (a, b) => {
    const N = MW * MH, dist = new Float32Array(N).fill(1e9), prev = new Int32Array(N).fill(-1), open = [[0, a.y * MW + a.x]]; dist[a.y * MW + a.x] = 0;
    const goal = b.y * MW + b.x;
    while (open.length) { let bi = 0; for (let i = 1; i < open.length; i++) if (open[i][0] < open[bi][0]) bi = i; const [, k] = open[bi]; open[bi] = open[open.length - 1]; open.pop(); if (k === goal) break;
      const x = k % MW, y = (k - x) / MW; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= MW || Y >= MH) continue; const c = cost(X, Y); if (c > 500) continue; const kk = Y * MW + X, nd = dist[k] + c; if (nd < dist[kk]) { dist[kk] = nd; prev[kk] = k; open.push([nd + Math.abs(X - b.x) + Math.abs(Y - b.y), kk]); } } }
    const out = []; for (let k = goal; k !== -1; k = prev[k]) out.push([k % MW, Math.floor(k / MW)]); return out.reverse();
  };
  for (const pair of ROADS.split(/\s+/).filter(Boolean)) { const [a, b] = pair.split('-').map((id) => PLACE[id]); if (!a || !b) throw new Error('road ' + pair);
    for (const [x, y] of path(a, b)) { const c = get(x, y); if (c === 'r') set(x, y, y >= 82 && y <= 95 && x !== 60 ? 'F' : 'b'); else if (c === 'M') set(x, y, 'h'); else if (c !== 'F' && c !== 'b') set(x, y, '='); } }
  // the causeway: from the south shore over the water to the island
  for (let y = LY + 3; y <= LY + 9; y++) { const c = get(LX, y); if (c === '~' || c === ':') set(LX, y, 'L'); else if (c !== '=') set(LX, y, '='); }
  set(LX, LY + 9, '='); for (let y = LY + 10; y <= 59; y++) if (get(LX, y) !== '=') set(LX, y, get(LX, y) === '~' ? 'L' : '=');
  for (const p of PLACES) set(p.x, p.y, '=');
  return T;
}
// how dangerous the wilds are at a spot: the level of the nearest place, rising a little away from the roads
export function dangerAt(x, y) {
  let best = null, bd = 1e9; for (const p of PLACES) { if (p.kind === 'base') continue; const d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = p; } }
  return { place: best, lv: Math.max(1, Math.round(best.lv + Math.min(6, bd / 6))) };
}
