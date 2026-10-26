// Plays the whole story without a screen: the party travels from step to step, fights the wilds near the next place
// until it is strong enough (as a player would), buys gear fit for its level, and fights each story battle with a
// simple sensible plan. It prints how many fights in the wilds each step needed, so the story's levels can be tuned.
import { STORY } from '../js/data/story.js';
import { PLACE, dangerAt } from '../js/data/world.js';
import { PEOPLE } from '../js/data/people.js';
import { who, newUnit, stats, damage, hitChance, tacticPower, tacticHits, gainExp, knows, spMax, starterGear, TACTICS } from '../js/rules.js';
import { rng, clamp } from '../js/util.js';

const R = rng(42), units = {}; let partyIds = [], spPool = 0;
const front = () => partyIds.map((id) => units[id]).sort((a, b) => stats(b).atk + stats(b).zhi * 2 - stats(a).atk - stats(a).zhi * 2).slice(0, 5);
const avg = () => { const f = front(); return f.reduce((s, u) => s + u.lv, 0) / f.length; };
function join(id, lv0) { if (units[id]) { if (!partyIds.includes(id)) partyIds.push(id); return; } const p = who(id); units[id] = newUnit(id, Math.max(p.lv || 1, lv0 || 0, Math.round(avg() || 1) - 1)); partyIds.push(id); }
function heal() { for (const u of Object.values(units)) u.troops = stats(u).max; spPool = spMax(front()); }
function regear() { for (const u of Object.values(units)) { const eq = starterGear(who(u.id), u.lv + 2); for (const k of Object.keys(eq)) u.equip[k] = eq[k]; } }
function fight(foeSpecs, opt = {}) {
  const mk = (u, side) => ({ u, side, p: who(u.id), lv: u.lv, ...stats(u), troops: u.troops, buff: {}, status: {}, gone: u.troops <= 0 });
  const A = front().map((u) => mk(u, 'a')), F = foeSpecs.map((s) => { const [id, lv] = s.split('@'); return mk(newUnit(id, +lv), 'f'); });
  let fsp = spMax(F.map((b) => b.u));
  const alive = (L) => L.filter((b) => !b.gone);
  const hurt = (t, n) => { t.troops -= n; if (t.troops <= 0) { t.troops = 0; t.gone = true; } };
  for (let round = 0; round < 40; round++) {
    const acts = [];
    for (const b of alive(A)) {
      const tac = knows(b.u, {}), low = alive(A).find((x) => x.troops < x.max * 0.4);
      const heal1 = tac.filter((t) => TACTICS[t].kind === 'heal' && TACTICS[t].sp <= spPool).sort((a, c) => TACTICS[c].pow - TACTICS[a].pow)[0];
      const dmg = tac.filter((t) => TACTICS[t].kind === 'dmg' && TACTICS[t].sp <= spPool).sort((a, c) => TACTICS[c].pow * (TACTICS[c].to === 'all' ? alive(F).length : 1) - TACTICS[a].pow * (TACTICS[a].to === 'all' ? alive(F).length : 1))[0];
      if (low && heal1) { spPool -= TACTICS[heal1].sp; acts.push({ b, t: TACTICS[heal1].to === 'allies' ? alive(A) : [low], tac: heal1 }); }
      else if (dmg && (b.troop === '謀' || b.troop === '術' || R() < 0.3)) { spPool -= TACTICS[dmg].sp; acts.push({ b, t: TACTICS[dmg].to === 'all' ? alive(F) : [alive(F).sort((x, y) => x.troops - y.troops)[0]], tac: dmg }); }
      else acts.push({ b, t: [alive(F).sort((x, y) => x.troops - y.troops)[0]] });
    }
    for (const b of alive(F)) { const tac = knows(b.u, {}).filter((t) => TACTICS[t].kind === 'dmg' && TACTICS[t].sp <= fsp); if (tac.length && R() < (b.troop === '謀' || b.troop === '術' ? 0.7 : 0.25)) { const t = tac[0]; fsp -= TACTICS[t].sp; acts.push({ b, t: TACTICS[t].to === 'all' ? alive(A) : [alive(A).sort((x, y) => x.troops - y.troops)[0]], tac: t }); } else acts.push({ b, t: [R() < 0.55 ? alive(A).sort((x, y) => x.troops - y.troops)[0] : R.pick(alive(A))] }); }
    acts.sort((x, y) => y.b.spd * (0.9 + R() * 0.2) - x.b.spd * (0.9 + R() * 0.2));
    for (const a of acts) {
      if (a.b.gone) continue; const foesOf = a.b.side === 'a' ? F : A;
      if (a.tac) { const T = TACTICS[a.tac]; for (const t of a.t) { if (!t || (t.gone && T.kind !== 'revive')) continue; if (T.kind === 'heal') { t.troops = Math.min(t.max, t.troops + tacticPower(a.b, t, a.tac, R)); continue; } if (R() < tacticHits(a.b, t, a.tac)) hurt(t, tacticPower(a.b, t, a.tac, R, { ground: opt.bg })); } }
      else { let t = a.t[0]; if (!t || t.gone) t = alive(foesOf)[0]; if (!t) continue; if (R() < hitChance(a.b, t)) hurt(t, damage(a.b, t, R, { water: opt.bg === 'water' }).n); }
      if (!alive(F).length || !alive(A).length) break;
    }
    if (!alive(F).length || !alive(A).length) break;
  }
  const win = !alive(F).length;
  for (const b of A) b.u.troops = Math.max(1, b.troops);
  if (win) { const exp = Math.round(F.reduce((s, f) => s + f.lv * (f.p.grunt ? 9 : 13) * (opt.boss ? 1.8 : 1) + 6, 0)); for (const b of A) gainExp(b.u, b.gone ? Math.round(exp / 2) : exp); }
  return win;
}
function wild(place) { const lv = clamp(Math.round(dangerAt(place.x, place.y).lv * 0.85 + avg() * 0.15), 1, 70), n = R.int(1, Math.min(5, 1 + Math.floor(lv / 6))), out = []; for (let i = 0; i < n; i++) out.push(`${R() < 0.5 ? '寨兵' : '官兵甲'}@${clamp(lv + R.int(-3, 1), 1, 70)}`); return out; }
let total = 0;
for (const s of STORY) {
  for (const id of s.leave || []) partyIds = partyIds.filter((x) => x !== id);
  if (s.battle) {
    const top = Math.max(...s.battle.foes.map((f) => +f.split('@')[1])), place = PLACE[s.at];
    let grind = 0; heal(); regear();
    while (avg() < top - 3 && grind < 60) { if (!fight(wild(place))) heal(); grind++; heal(); }
    let won = false, tries = 0; while (!won && tries < 25) { heal(); won = fight(s.battle.foes, { boss: s.battle.boss, bg: s.battle.bg }); if (!won) { for (let k = 0; k < 3; k++) { fight(wild(place)); heal(); } grind += 3; } tries++; }
    total += grind;
    console.log(`${s.id.padEnd(11)} foes≤${String(top).padStart(2)}  party ${avg().toFixed(1).padStart(4)} (${front().map((u) => u.id + u.lv).join(' ')})  wild fights ${String(grind).padStart(2)}${won ? '' : (s.battle.flee ? '  (lost, as written)' : '  ** LOST **')}`);
  }
  for (const j of s.join || []) { const [id, lv] = j.split('@'); join(id, +lv); }
  for (const id of s.dead || []) { partyIds = partyIds.filter((x) => x !== id); delete units[id]; }
  if (partyIds.length > 12) partyIds = front().map((u) => u.id).concat(partyIds.filter((id) => !front().some((u) => u.id === id))).slice(0, 12);
}
console.log('wild fights in all:', total);
