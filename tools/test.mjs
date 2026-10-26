// Checks the data: every name in the story exists, every gift and reward exists, every place is on the map and can
// be reached, the counts are right, and the story brings in enough of the hundred and eight to reach the ranking.
import { PEOPLE, STAR_IDS, STAR_HOME, COUNT } from '../js/data/people.js';
import { GEAR_LIST, GEAR } from '../js/data/gear.js';
import { ITEM_LIST, ITEMS } from '../js/data/items.js';
import { STORY, SIDE } from '../js/data/story.js';
import { PLACE, PLACES, buildWorld, MW, MH } from '../js/data/world.js';
import { who, newUnit, stats, damage, shopOf } from '../js/rules.js';
import { rng } from '../js/util.js';
let fail = 0; const bad = (m) => { fail++; console.log('  FAIL', m); };
console.log('people', COUNT(), 'gear', GEAR_LIST.length, 'items', ITEM_LIST.length);
if (COUNT() !== 500) bad('people ' + COUNT()); if (GEAR_LIST.length !== 1000) bad('gear'); if (ITEM_LIST.length !== 500) bad('items');
const joined = new Set(), dead = new Set();
for (const s of [...STORY, ...SIDE]) {
  if (!PLACE[s.at]) bad(`${s.id}: no place ${s.at}`);
  for (const [w] of [...(s.lines || []), ...(s.after || [])]) if (w !== '-' && !who(w) && !['閻婆惜'].includes(w)) bad(`${s.id}: unknown speaker ${w}`);
  for (const f of (s.battle?.foes || [])) { const [id, lv] = f.split('@'); if (!who(id)) bad(`${s.id}: unknown foe ${id}`); if (!(+lv > 0)) bad(`${s.id}: no level ${f}`); }
  for (const id of [...(s.join || []), ...(s.leave || [])].map((x) => x.split('@')[0])) if (!PEOPLE[id]) bad(`${s.id}: unknown person ${id}`);
  for (const g of s.give || []) if (!GEAR[g] && !ITEMS[g]) bad(`${s.id}: unknown reward ${g}`);
  if (STORY.includes(s)) { for (const id of (s.join || []).map((x) => x.split('@')[0])) if (!dead.has(id)) joined.add(id); for (const id of s.dead || []) { dead.add(id); joined.delete(id); }
    if (s.need?.heroes) { const n = STAR_IDS.filter((id) => joined.has(id)).length, tav = STAR_IDS.filter((id) => !joined.has(id) && STAR_HOME[id]).length; console.log(`  by ${s.id}: ${n} stars from the story, ${tav} more waiting in inns`); if (n + tav < s.need.heroes) bad('not enough heroes for ' + s.id); } }
}
const missing = STAR_IDS.filter((id) => !joined.has(id) && !STAR_HOME[id] && !dead.has(id)); if (missing.length) bad('stars with no way in: ' + missing.join(' '));
for (const id of Object.keys(STAR_HOME)) if (!PLACE[STAR_HOME[id]]) bad('star home ' + id + ' ' + STAR_HOME[id]);
for (const p of Object.values(PEOPLE)) if (p.home && !PLACE[p.home]) bad(`${p.name}: home ${p.home} is not a place`);
// the map
const T = buildWorld(); for (const p of PLACES) { const c = T[p.y][p.x]; if ('M~r'.includes(c)) bad('place on ' + c + ' ' + p.id); }
const reach = (flags) => { const seen = new Uint8Array(MW * MH), st = [[10, 58]]; while (st.length) { const [x, y] = st.pop(); if (seen[y * MW + x]) continue; seen[y * MW + x] = 1; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= MW || Y >= MH) continue; const c = T[Y][X]; if ('M~r'.includes(c) || (c === 'F' && !flags.F) || (c === 'L' && !flags.L)) continue; st.push([X, Y]); } } return seen; };
const all = reach({ F: 1, L: 1 }); for (const p of PLACES) if (!all[p.y * MW + p.x]) bad('cannot reach ' + p.id);
const start = reach({}); if (start[PLACE['杭州'].y * MW + PLACE['杭州'].x]) bad('Jiangnan reachable without the ferry'); if (start[PLACE['梁山'].y * MW + PLACE['梁山'].x]) bad('Liangshan reachable before it opens');
// a fight between equals takes a few blows; shops have stock
const R = rng(5); for (const lv of [1, 20, 40, 60]) { const a = newUnit('林沖', lv), b = newUnit('關勝', lv), sa = { ...stats(a), troops: stats(a).max }, sb = { ...stats(b), troops: stats(b).max }; const d = damage(sa, sb, R).n; console.log(`  lv${lv}: troops ${sb.max}, a blow ${d} (${(sb.max / d).toFixed(1)} blows)`); }
for (const id of ['史家村', '東京', '梁山', '杭州']) { const n = ['weapon', 'armor', 'item'].map((k) => shopOf(PLACE[id], k).length); console.log(`  shop ${id}:`, n.join('/')); if (n.some((x) => !x)) bad('empty shop at ' + id); }
console.log(fail ? `${fail} problems` : 'all ok'); process.exit(fail ? 1 : 0);
