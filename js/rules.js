// The rules: what a general's numbers are once their level and gear are counted, how many soldiers they lead, how
// fights are reckoned, what experience a level needs, what a shop sells, how likely a beaten general is to join.
import { PEOPLE } from './data/people.js';
import { GEAR, GEAR_LIST } from './data/gear.js';
import { ITEMS, ITEM_LIST } from './data/items.js';
import { TACTICS, tacticsOf } from './data/tactics.js';
import { BEASTS } from './data/story.js';
import { rng, hash, clamp } from './util.js';

// the nameless: soldiers of every side, for story battles and the wilds
export const GRUNTS = {
  官兵甲: { side: 'song', wu: 60, zhi: 30, troop: '步', weapon: '槍', look: { face: 'y', hat: 'helm', beard: 'stub' } }, 官兵乙: { side: 'song', wu: 62, zhi: 28, troop: '騎', weapon: '刀', look: { face: 'y', hat: 'helm', beard: 'mous' } },
  寨兵: { side: 'bandit', wu: 58, zhi: 25, troop: '步', weapon: '刀', look: { face: 'd', hat: 'scarf', beard: 'full' } }, 打手: { side: 'bandit', wu: 56, zhi: 20, troop: '步', weapon: '棍', look: { face: 'y', hat: 'band', beard: 'stub' } },
  莊客: { side: 'zhu', wu: 60, zhi: 28, troop: '步', weapon: '槍', look: { face: 'y', hat: 'scarf', beard: 'stub' } }, 江州官兵: { side: 'song', wu: 64, zhi: 30, troop: '步', weapon: '槍', look: { face: 'y', hat: 'helm', beard: 'stub' } },
  登州官兵: { side: 'song', wu: 64, zhi: 30, troop: '弓', weapon: '弓', look: { face: 'y', hat: 'helm', beard: 'stub' } }, 青州官兵: { side: 'song', wu: 66, zhi: 30, troop: '騎', weapon: '槍', look: { face: 'y', hat: 'helm', beard: 'mous' } },
  大名府官兵: { side: 'song', wu: 68, zhi: 32, troop: '騎', weapon: '刀', look: { face: 'y', hat: 'helm', beard: 'full' } }, 御林軍: { side: 'song', wu: 72, zhi: 34, troop: '騎', weapon: '槍', look: { face: 'w', hat: 'helm', beard: 'mous' } },
  寨兵乙: { side: 'bandit', wu: 58, zhi: 25, troop: '弓', weapon: '弓', look: { face: 'y', hat: 'scarf', beard: 'stub' } }, 方臘兵: { side: 'fang', wu: 72, zhi: 34, troop: '步', weapon: '刀', look: { face: 'y', hat: 'turban', beard: 'stub' } },
  遼兵: { side: 'liao', wu: 72, zhi: 30, troop: '騎', weapon: '刀', look: { face: 'y', hat: 'fur', beard: 'full' } },
};
for (const [k, g] of Object.entries(GRUNTS)) { Object.assign(g, { id: k, name: k, nick: '', tong: g.wu - 6, su: g.wu - 10, grunt: 1 }); }
export const who = (id) => PEOPLE[id] || BEASTS[id] || GRUNTS[id];

// ---------------------------------------------------------------- a general's numbers
export const P = (lv) => 1 + lv * 0.08;
export function gearOf(u) { return Object.values(u.equip || {}).filter(Boolean).map((gid) => GEAR[gid]).filter(Boolean); }
export function stats(u) {
  const p = who(u.id), gs = gearOf(u), b = u.bonus || {};
  const sum = (k) => gs.reduce((s, g) => s + (g[k] || 0), 0);
  const wu = p.wu + (b.wu || 0) + sum('wu'), zhi = p.zhi + (b.zhi || 0) + sum('zhi'), tong = p.tong + (b.tong || 0) + sum('tong'), su = p.su + (b.su || 0) + sum('su');
  const w = u.equip && GEAR[u.equip.weapon], own = w && (w.owner === p.id ? 1.18 : w.type === p.weapon ? 1.08 : 1);
  const lv = u.lv, k = P(lv);
  return { wu, zhi, tong, su, lv, troop: p.troop,
    atk: Math.round((wu * 1.6 + (w ? (w.famous && w.owner === p.id ? Math.min(w.atk, 40 + lv * 3.2) : w.atk) : 0) * 0.9 * (own || 1)) * k), // a hero's own weapon grows with them
    def: Math.round((tong * 1.2 + sum('def') * 1.3) * k * 0.9),
    max: Math.round(120 + tong * 6 + lv * lv * 1.2 + lv * 30 + (b.troops || 0)),
    spd: su + lv * 0.5 };
}
export function newUnit(id, lv, extra = {}) {
  const p = who(id), u = { id, lv: Math.max(1, lv || p.lv || 1), exp: 0, equip: {}, bonus: {}, troops: 0, ...extra };
  if (!extra.equip) u.equip = starterGear(p, u.lv);
  u.troops = stats(u).max; return u;
}
// what someone carries when you meet them: a weapon of their kind and armour fit for their rank
export function starterGear(p, lv) {
  const tier = clamp(Math.floor(lv / 3.6), 0, 19), R = rng(hash(p.id + lv)), eq = {};
  const own = GEAR['f_' + p.id]; if (own && lv >= 12) eq.weapon = own.id;
  else { const w = GEAR_LIST.find((g) => g.slot === 'weapon' && g.type === p.weapon && g.tier === tier) || GEAR_LIST.find((g) => g.slot === 'weapon' && g.type === '刀' && g.tier === tier); if (w) eq.weapon = w.id; }
  const at = clamp(Math.floor(lv / 5.5), 0, 11), arm = GEAR_LIST.filter((g) => g.slot === 'armor' && g.tier === at && !g.famous && !g.campaign);
  if (arm.length && lv > 2) eq.armor = R.pick(arm).id;
  const hm = GEAR_LIST.filter((g) => g.slot === 'helm' && g.tier === Math.max(0, at - 1) && !g.famous && !g.campaign); if (hm.length && lv > 6) eq.helm = R.pick(hm).id;
  if (p.troop === '騎') { const hs = GEAR_LIST.filter((g) => g.slot === 'horse' && g.tier === clamp(Math.floor(lv / 9), 0, 7) && !g.famous); if (hs.length) eq.horse = R.pick(hs).id; }
  return eq;
}
export const expNeed = (lv) => lv * lv * 3 + lv * 30 + 20;
// gain experience: returns the levels gained
export function gainExp(u, n) {
  let ups = 0; u.exp += n;
  while (u.lv < 99 && u.exp >= expNeed(u.lv)) { u.exp -= expNeed(u.lv); const before = stats(u).max; u.lv++; ups++; u.troops = Math.min(stats(u).max, u.troops + (stats(u).max - before)); }
  return ups;
}
export const knows = (u, books) => tacticsOf(who(u.id), u.lv, (books || {})[u.id] || []).filter((t) => TACTICS[t]);
// the army's strategy points: wise generals bring more
export function spMax(party) { return Math.round(10 + party.reduce((s, u) => s + stats(u).zhi * (1 + u.lv / 10), 0) / 14); }

// ---------------------------------------------------------------- reckoning a fight
const BEAT = { 騎: '步', 步: '弓', 弓: '騎' };
export function damage(a, d, R, opt = {}) {
  const A = a.atk * (a.buff?.atk || 1) * (a.status?.weak ? 0.7 : 1), D = d.def * (d.buff?.def || 1) * (d.guard ? 1.6 : 1);
  let m = (0.35 + 0.65 * Math.sqrt(Math.max(0, a.troops) / a.max)) * (A / (A + D)) * 1.1 * (0.88 + R() * 0.24);
  if (BEAT[a.troop] === d.troop) m *= 1.2; if (a.troop === '謀' || a.troop === '術') m *= 0.75;
  if (opt.water) { if (a.troop === '水') m *= 1.35; else if (a.troop === '騎') m *= 0.85; }
  const crit = R() < 0.05 + Math.max(0, a.wu - 80) / 300;
  return { n: Math.max(1, Math.round(A * m * (crit ? 1.6 : 1))), crit };
}
export function hitChance(a, d) { return clamp(0.92 + (a.spd - d.spd) / 400 - (a.status?.blind ? 0.4 : 0), 0.35, 0.99); }
export function tacticPower(a, d, t, R, opt = {}) {
  const T = TACTICS[t], Z = a.zhi, k = P(a.lv) * (opt.pow || 1);
  if (T.kind === 'heal') return Math.round(Z * 2.6 * k * T.pow * (0.9 + R() * 0.2));
  if (T.kind === 'revive') return Math.round(d.max * T.pow);
  const el = { fire: opt.ground === 'forest' ? 1.3 : opt.ground === 'snow' || opt.ground === 'water' ? 0.7 : 1, water: opt.ground === 'water' ? 1.35 : 1, rock: opt.ground === 'mountain' || opt.ground === 'fort' ? 1.3 : 0.9 }[T.el] || 1;
  return Math.round(Z * 2.2 * k * T.pow * 1.2 * el * (Z / (Z + d.zhi * 0.6)) * (0.88 + R() * 0.24));
}
export function tacticHits(a, d, t) { const T = TACTICS[t]; if (T.to === 'ally' || T.to === 'allies' || T.to === 'self') return 1; return clamp(0.85 + (a.zhi - d.zhi) / 200, 0.4, 0.98) * (T.kind === 'debuff' ? T.pow / 0.7 * 0.9 : 1); }

// ---------------------------------------------------------------- what a place sells
export function shopOf(place, kind) {
  const lv = place.lv || 1, R = rng(hash(place.id + kind)), base = place.kind === 'capital' ? 2 : place.kind === 'city' ? 1 : place.kind === 'base' ? 3 : 0;
  const top = clamp(Math.floor(lv / 3.4) + base, 1, 19), low = Math.max(0, top - 5);
  if (kind === 'weapon') { const types = [...new Set(GEAR_LIST.filter((g) => g.slot === 'weapon' && !g.famous).map((g) => g.type))].sort(() => R() - 0.5).slice(0, place.kind === 'base' ? 18 : 9); return GEAR_LIST.filter((g) => g.slot === 'weapon' && !g.famous && types.includes(g.type) && g.tier >= low && g.tier <= top).map((g) => g.id); }
  if (kind === 'armor') { const t2 = clamp(Math.floor(top * 0.6), 0, 11), l2 = Math.max(0, t2 - 3); return GEAR_LIST.filter((g) => (g.slot === 'armor' || g.slot === 'helm') && !g.famous && (g.campaign ? lv >= 46 : g.tier >= l2 && g.tier <= t2)).filter((g, i) => R() < 0.55 || g.campaign).map((g) => g.id); }
  if (kind === 'horse') return GEAR_LIST.filter((g) => g.slot === 'horse' && !g.famous && g.tier <= clamp(Math.floor(top / 2.6), 0, 7)).filter(() => R() < 0.5).map((g) => g.id);
  if (kind === 'acc') return GEAR_LIST.filter((g) => g.slot === 'acc' && !g.famous && (g.campaign ? lv >= 46 : g.tier <= clamp(Math.floor(top * 0.9), 0, 17) && g.tier >= Math.max(0, top - 8))).filter(() => R() < 0.4).map((g) => g.id);
  // items: medicines and charms by the town's strength, books in great cities, local goods
  const it = (k) => ITEM_LIST.filter((i) => i.kind === k);
  const t = clamp(Math.floor(lv / 9), 0, 7);
  let out = [...it('heal').filter((i) => i.tier <= t && i.tier >= t - 2), ...it('healAll').filter((i) => i.tier <= t - 1 && i.tier >= t - 3), ...it('sp').filter((i) => i.tier <= Math.floor(t / 1.7)), ...it('revive').filter((i) => i.tier <= Math.floor(t / 2)), ...it('cure').filter(() => R() < 0.6), ...it('buff').filter(() => R() < 0.4), ...it('repel').filter((i, k) => k <= t / 3), it('escape')[0]];
  out.push(...it('cast').filter((i) => i.tier <= Math.floor(t / 3) && TACTICS[i.tactic].lv <= lv + 6).filter(() => R() < 0.4));
  if (base >= 1) out.push(...it('book').filter(() => R() < (base >= 2 ? 0.35 : 0.12)), ...it('gift').filter(() => R() < 0.3), ...it('stat').filter((i) => i.tier <= Math.floor(t / 2.5)).filter(() => R() < 0.4));
  out.push(...it('trade').filter((i) => i.town === place.id));
  return [...new Set(out.filter(Boolean).map((i) => i.id))];
}
// ---------------------------------------------------------------- recruiting a general you have beaten
export function recruitChance(p, leader, gifts = 0, joined = 0) {
  if (!p || p.join === 'never' || p.join === 'story' || p.grunt || p.beast) return 0;
  const base = p.side === 'bandit' || p.side === 'wander' ? 0.45 : p.side === 'song' ? 0.3 : 0.22;
  return clamp(base + (leader ? (stats(leader).zhi - 60) / 300 + (stats(leader).tong - 60) / 400 : 0) + joined / 500 + gifts / 100 - (p.wu + p.zhi > 160 ? 0.1 : 0), 0.05, 0.92);
}
export { TACTICS, ITEMS, GEAR, PEOPLE };
