// 梁山群英傳: the game. Walk the map of the Song empire, enter towns and strongholds, fight in the wilds, follow the
// story of the novel, and gather the hundred and eight (and whoever else will follow you). The army's state lives in
// S and is saved in the browser (and to the account, when signed in to the game hub).
import { PEOPLE, STAR_IDS, STAR_HOME, SIDE as SIDES } from './data/people.js';
import { GEAR, SLOTS, WTYPE } from './data/gear.js';
import { ITEMS } from './data/items.js';
import { TACTICS } from './data/tactics.js';
import { STORY, SIDE } from './data/story.js';
import { PLACES, PLACE, TILE, MW, MH, buildWorld, dangerAt } from './data/world.js';
import { backdrop } from './art.js';
import { groundTile, roadTile, standing, placeArt, marcher } from './mapart.js';
import { painted } from './face.js';
import { who, newUnit, stats, expNeed, knows, spMax, shopOf, gainExp } from './rules.js';
import { Battle } from './battle.js';
import { say, menu, confirm, toast, panel, banner, input, press, $, el, faceOf } from './ui.js';
import { sfx, music, setSound, soundOn } from './sound.js';
import { rng, hash, clamp, esc, wait } from './util.js';

const KEY = 'liangshan.v1', GAME = 'liangshan', LW = 384, LH = 224, K = 3, VW = 24, VH = 14;
const cv = $('cv'), g = cv.getContext('2d'); cv.width = LW * K; cv.height = LH * K;
const W = buildWorld();
let S = null, scene = 'title', busy = false, cloud = null, battle = null, last = performance.now();
const P = { x: 10, y: 58, fx: 10, fy: 58, dir: 'down', moving: 0, step: 0 };

// ---------------------------------------------------------------- the army
const fresh = () => ({ v: 1, units: {}, party: [], reserve: [], away: [], joined: {}, dead: [], items: { h0: 5, h1: 2 }, gear: [], gold: 300, sp: 10, spMax: 10, x: 10, y: 58, step: 0, flags: {}, sideDone: {}, books: {}, repel: 0, steps: 0, lastInn: '史家村', prisoners: [], prisonDays: {}, prisonLv: {}, sound: true, battles: 0, dueled: {} });
const unitsOf = (ids) => ids.map((id) => S.units[id]).filter(Boolean);
const party = () => unitsOf(S.party);
const front = () => party().slice(0, 5);
const avgLv = () => { const p = party(); return p.length ? Math.round(p.reduce((s, u) => s + u.lv, 0) / p.length) : 1; };
const starsJoined = () => STAR_IDS.filter((id) => S.joined[id] && !S.dead.includes(id)).length;
function refreshSp() { S.spMax = spMax(front()); S.sp = Math.min(S.sp, S.spMax); }
function join(id, lv) {
  if (S.dead.includes(id)) return;
  if (S.units[id]) { S.away = S.away.filter((x) => x !== id); if (!S.party.includes(id) && !S.reserve.includes(id)) (S.party.length < 10 || !S.flags.根據地 ? S.party : S.reserve).push(id); }
  else { const p = who(id), top = front().reduce((m, x) => Math.max(m, x.lv), 1), u = newUnit(id, Math.max(p.lv || 1, lv || 0, top - 1)); S.units[id] = u; (S.party.length < 10 || !S.flags.根據地 ? S.party : S.reserve).push(id); }
  // someone stronger than the weakest of the front five takes their place
  const i = S.party.indexOf(id), pw = (x) => { const t = stats(S.units[x]); return t.atk + t.def * 0.5 + t.zhi * 1.5; };
  if (i >= 5) { let w = 1; for (let k = 2; k < 5; k++) if (pw(S.party[k]) < pw(S.party[w])) w = k; if (pw(id) > pw(S.party[w])) [S.party[w], S.party[i]] = [S.party[i], S.party[w]]; } // (the leader keeps the lead)
  S.joined[id] = true; S.prisoners = S.prisoners.filter((x) => x !== id); refreshSp();
}
function leave(id, dead) { S.party = S.party.filter((x) => x !== id); S.reserve = S.reserve.filter((x) => x !== id); if (dead) { S.dead.push(id); delete S.units[id]; } else if (!S.away.includes(id)) S.away.push(id); refreshSp(); }
function give(id, n = 1) { if (GEAR[id]) { for (let i = 0; i < n; i++) S.gear.push(id); return GEAR[id].name; } if (ITEMS[id]) { S.items[id] = (S.items[id] || 0) + n; return ITEMS[id].name; } return id; }
function save() { S.x = P.x; S.y = P.y; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} if (cloud) cloud.touch(GAME, KEY); }
function load() { try { const v = JSON.parse(localStorage.getItem(KEY)); if (v && v.units) return { ...fresh(), ...v, prisonDays: v.prisonDays || {}, prisonLv: v.prisonLv || {} }; } catch (e) {} return null; }

// ---------------------------------------------------------------- drawing
function draw(t) {
  g.setTransform(K, 0, 0, K, 0, 0); g.imageSmoothingEnabled = false;
  if (scene === 'battle' && battle) { battle.render(g, t); return; }
  if (scene === 'title') return drawTitle(t);
  drawMap(t);
}
// what touches each side of a square: W water, S sand, N snow, G other ground; R a road (for bridges)
const WET = '~r:FbL';
const PLACE_AT = new Map(PLACES.map((p) => [p.x + ',' + p.y, p]));
function sideCodes(x, y, c) {
  const at = (dx, dy) => { const n = (W[y + dy] || [])[x + dx]; return n == null ? '~' : n; };
  const code = (n, dx, dy) => { if ('FbL'.includes(c)) return n === '=' || 'FbL'.includes(n) || PLACE_AT.has((x + dx) + ',' + (y + dy)) ? 'R' : WET.includes(n) ? 'W' : 'G'; if (WET.includes(c)) return WET.includes(n) ? 'W' : 'G'; return WET.includes(n) ? 'W' : n === 's' ? 'S' : n === 'n' ? 'N' : 'G'; };
  return [[0, -1], [1, 0], [0, 1], [-1, 0]].map(([dx, dy]) => code(at(dx, dy), dx, dy)).join('');
}
function drawMap(t) {
  const cx = P.fx * 16 + 8 - LW / 2, cy = P.fy * 16 + 8 - LH / 2, x0 = Math.floor(cx / 16), y0 = Math.floor(cy / 16), frame = Math.floor(t * 1.6) % 3;
  g.fillStyle = '#2a5aa8'; g.fillRect(0, 0, LW, LH); g.imageSmoothingEnabled = false;
  const X = (x) => Math.round((x * 16 - cx) * K) / K, Y = (y) => Math.round((y * 16 - cy) * K) / K;
  // the ground
  for (let y = y0 - 1; y <= y0 + VH + 1; y++) for (let x = x0 - 1; x <= x0 + VW + 1; x++) {
    if (x < 0 || y < 0 || x >= MW || y >= MH) continue; let c = W[y][x];
    const nb = sideCodes(x, y, c), under = 'fhM='.includes(c) ? (nb.includes('N') || y < 12 ? 'n' : '.') : c;
    g.drawImage(groundTile(under, x, y, frame, under === c ? nb : sideCodes(x, y, under)), X(x), Y(y), 16, 16);
    if (c === '=') { const conn = [[0, -1], [1, 0], [0, 1], [-1, 0]].map(([dx, dy]) => { const n = (W[y + dy] || [])[x + dx]; return n === '=' || 'bFL'.includes(n) || PLACE_AT.has((x + dx) + ',' + (y + dy)) ? '1' : '0'; }).join(''); g.drawImage(roadTile(conn, (x * 7 + y * 3) & 3), X(x), Y(y), 16, 16); }
  }
  // things standing up, row by row so the nearer overlap the farther
  for (let y = y0 - 1; y <= y0 + VH + 2; y++) for (let x = x0 - 1; x <= x0 + VW + 1; x++) {
    if (x < 0 || y < 0 || x >= MW || y >= MH) continue; const c = W[y][x]; if (!'fhM'.includes(c)) continue;
    const img = standing(c, x, y, y < 12 || sideCodes(x, y, c).includes('N')); if (img) { const hsh = (x * 73856093 ^ y * 19349663) >>> 0, jx = (hsh % 7) - 3, w = 16, h = img.height / 3; g.drawImage(img, X(x) + Math.round(jx * (c === 'M' ? 0.7 : 0.4)), Y(y) + 16 - h + ((hsh >>> 8) % 2), w, h); }
  }
  g.font = 'bold 6px "Noto Sans TC", sans-serif'; g.textAlign = 'center';
  for (const p of PLACES) { if (p.x < x0 - 2 || p.x > x0 + VW + 2 || p.y < y0 - 2 || p.y > y0 + VH + 2) continue; const sx = X(p.x), sy = Y(p.y); g.drawImage(placeArt(p), sx - 4, sy - 9, 24, 24);
    g.lineWidth = 2; g.strokeStyle = 'rgba(0,0,0,0.75)'; g.strokeText(p.name, sx + 8, sy + 22); g.fillStyle = storyHere(p.id) ? '#ffe070' : '#ffffff'; g.fillText(p.name, sx + 8, sy + 22); if (storyHere(p.id)) { g.fillStyle = '#ffe070'; g.fillText('！', sx + 8, sy - 11 + Math.sin(t * 4) * 1.5); } }
  // the army
  const lead = party()[0]; if (lead) { const img = marcher(who(lead.id), P.dir, P.moving ? Math.floor(t * 8) % 2 : 0, '#3a5aa8'); g.drawImage(img, X(P.fx), Y(P.fy) - 4, 16, 16); }
  const d = dangerAt(P.x, P.y), tn = TILE[W[P.y][P.x]];
  g.fillStyle = 'rgba(36,12,6,0.75)'; g.fillRect(2, 2, 92, 11); g.font = '6px "Noto Sans TC", sans-serif'; g.textAlign = 'left'; g.fillStyle = '#e8e0c8'; g.fillText(`${d.place.name}附近 · ${tn.name}`, 5, 9.5);
  g.imageSmoothingEnabled = false;
}
function drawTitle(t) {
  g.drawImage(backdrop('water'), 0, 0, LW, 150); g.fillStyle = '#1a0a06'; g.fillRect(0, 150, LW, 74);
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, 0, LW, LH);
  const ids = ['宋江', '盧俊義', '吳用', '林沖', '武松', '魯智深', '李逵', '花榮', '扈三娘', '燕青'];
  g.imageSmoothingEnabled = false; ids.forEach((id, i) => { const p = painted(PEOPLE[id]); g.globalAlpha = 0.95; g.drawImage(p, 10 + i * 36.6, 150 + Math.sin(t + i) * 2, 34, 42.5); }); g.globalAlpha = 1; g.imageSmoothingEnabled = false;
}
// ---------------------------------------------------------------- the story
const stepNow = () => STORY[S.step];
const sideOpen = (s) => !S.sideDone[s.id] && (s.need || []).every((f) => S.flags[f]);
function storyHere(id) { const s = stepNow(); if (s && s.at === id && ready(s)) return true; return SIDE.some((x) => x.at === id && sideOpen(x)); }
function ready(s) { if (s.need?.heroes && starsJoined() < s.need.heroes) return false; return true; }
async function runStep(s, isSide) {
  busy = true;
  try {
    music('town'); if (s.lines) await say(s.lines);
    if (s.battle) {
      const r = await fight({ foes: s.battle.foes, bg: s.battle.bg, boss: s.battle.boss, flee: s.battle.flee });
      if (r.end !== 'win' && !s.battle.flee) { await defeated(); return; }
    }
    if (s.after) await say(s.after);
    for (const id of s.leave || []) leave(id, (s.dead || []).includes(id));
    for (const id of s.dead || []) if (!S.dead.includes(id)) leave(id, true);
    for (const j of s.join || []) { const [id, jl] = j.split('@'), was = S.joined[id]; join(id, +jl || 0); if (!was) toast(`${who(id).name}「${who(id).nick}」加入了！`, 2600); }
    for (const id of s.give || []) toast(`得到 ${give(id)}`);
    if (s.gold) { S.gold += s.gold; toast(`得到銀兩 ${s.gold}`); }
    for (const f of s.set || []) S.flags[f] = true;
    if (s.rest) restAll();
    if (isSide) S.sideDone[s.id] = true; else S.step++;
    save();
    const next = stepNow(); if (next && !isSide) await banner(`目標：${next.goal}`, 1800);
  } finally { busy = false; music('road'); }
}
async function defeated() {
  await say([['-', '全軍潰敗……眾人狼狽地逃回了上次住宿的地方。'], ['-', '盤纏丟了一半。']]);
  S.gold = Math.floor(S.gold / 2); const p = PLACE[S.lastInn] || PLACE['史家村']; P.x = P.fx = p.x; P.y = P.fy = p.y; restAll(); save();
}
function restAll() { for (const u of [...party(), ...unitsOf(S.reserve)]) u.troops = stats(u).max; refreshSp(); S.sp = S.spMax; }
// ---------------------------------------------------------------- battles
async function fight(o) {
  if (!front().length) return { end: 'lose' };
  scene = 'battle'; music('battle'); refreshSp();
  battle = new Battle({ ...o, party: front(), S, onJoin: (id, lv) => { join(id, lv); toast(`${who(id).name}加入了！`); } });
  await banner(o.boss ? '大戰開始！' : '遭遇敵軍！', 900);
  const r = await battle.run(); S.battles++;
  if (r.end === 'win') for (const u of party().slice(5)) gainExp(u, Math.round(r.exp / 2)); // the ones who waited learn something too
  battle = null; scene = 'map'; music('road'); refreshSp();
  return r;
}
// the wilds: who you might meet near a place, at about its level
function wildFoes() {
  const d = dangerAt(P.x, P.y), R = rng((Date.now() ^ (P.x * 977 + P.y * 131)) >>> 0), lv = clamp(Math.round(d.lv * 0.85 + avgLv() * 0.15), 1, 70);
  const near = PLACES.filter((p) => Math.hypot(p.x - P.x, p.y - P.y) < 22).map((p) => p.id);
  const pool = Object.values(PEOPLE).filter((p) => p.home && near.includes(p.home) && (p.join === 'capture' || p.join === 'tavern' && p.gen) && !S.joined[p.id] && !S.dead.includes(p.id) && Math.abs((p.lv || lv) - lv) < 14 && !(S.flags.招安 && p.side === 'song'));
  const n = R.int(1, Math.min(5, 1 + Math.floor(lv / 6) + (R() < 0.3 ? 1 : 0))), foes = [];
  const grunt = d.lv > 52 && P.y > 88 ? '方臘兵' : d.lv > 43 && P.y < 20 ? '遼兵' : S.flags.招安 ? '寨兵' : R() < 0.5 ? '寨兵' : '官兵甲';
  for (let i = 0; i < n; i++) { if (pool.length && R() < 0.55) { const p = pool.splice(R.int(0, pool.length - 1), 1)[0]; foes.push(`${p.id}@${clamp(lv + R.int(-2, 2), 1, 70)}`); } else foes.push(`${R() < 0.3 ? (grunt === '寨兵' ? '寨兵乙' : grunt === '官兵甲' ? '官兵乙' : grunt) : grunt}@${clamp(lv + R.int(-3, 1), 1, 70)}`); }
  const tc = W[P.y][P.x]; return { foes, bg: tc === 'f' ? 'forest' : tc === 'h' ? 'mountain' : tc === 'n' ? 'snow' : tc === ':' ? 'water' : 'plain' };
}
// ---------------------------------------------------------------- walking
const passable = (x, y) => { if (x < 0 || y < 0 || x >= MW || y >= MH) return false; const t = TILE[W[y][x]]; if (t.block) return false; if (t.need && !S.flags[t.need]) return false; return true; };
async function tryMove(dx, dy) {
  P.dir = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up';
  const x = P.x + dx, y = P.y + dy;
  if (!passable(x, y)) { const t = TILE[(W[y] || [])[x]]; if (t && t.need && !P._warned) { P._warned = 1; toast(t.need === '梁山' ? '湖上沒有船。梁山泊的人不會隨便讓陌生人過去。' : '長江上的渡船要「渡船令」才肯開。'); setTimeout(() => { P._warned = 0; }, 2500); } return; }
  P.moving = 1; const fx0 = P.x, fy0 = P.y; P.x = x; P.y = y; const t0 = performance.now();
  await new Promise((res) => { const f = (now) => { const k = Math.min(1, (now - t0) / 150); P.fx = fx0 + dx * k; P.fy = fy0 + dy * k; if (k < 1) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
  P.moving = 0; S.steps++; if (S.repel > 0) S.repel--;
  const place = PLACES.find((p) => p.x === x && p.y === y);
  if (place) { await enterPlace(place); return; }
  // a fight in the wilds, now and then
  const enc = TILE[W[y][x]].enc || 0; P.since = (P.since || 0) + 1;
  if (S.repel <= 0 && P.since > 8 && Math.random() < enc * 0.055 && front().length) { P.since = 0; busy = true; const r = await fight(wildFoes()); busy = false; if (r.end === 'lose') await defeated(); save(); }
}
// ---------------------------------------------------------------- places
async function enterPlace(p) {
  busy = true;
  try {
    const s = stepNow();
    if (s && s.at === p.id && ready(s)) { await runStep(s); }
    for (const x of SIDE) if (x.at === p.id && sideOpen(x)) { if (await confirm(x.goal + '，要處理嗎？')) await runStep(x, true); }
    if (s && s.at === p.id && s.need?.heroes && !ready(s)) await say([['-', `排座次需要聚集至少 ${s.need.heroes} 位天罡地煞星的頭領。現在有 ${starsJoined()} 位。各地的酒館裡還有好漢在等著。`]]);
    if (p.kind === 'field') { if (!storyHere(p.id)) toast(`${p.name}。這裡沒什麼特別的。`); return; }
    await placeMenu(p);
  } finally { busy = false; music('road'); }
}
async function placeMenu(p) {
  music('town');
  for (;;) {
    const city = p.kind === 'city' || p.kind === 'capital', base = p.kind === 'base', temple = p.kind === 'temple', fort = p.kind === 'fort';
    const opts = [];
    if (base) opts.push({ label: '忠義堂（調度頭領）', value: 'hall' });
    if (!fort || base) opts.push({ label: temple ? '參拜歇息（免費）' : base ? '休息（免費）' : `客棧（住宿 ${innCost()} 兩）`, value: 'inn' });
    if (city || base) opts.push({ label: '兵器店', value: 'weapon' }, { label: '防具店', value: 'armor' });
    if ((city && p.lv >= 10) || base) opts.push({ label: '馬市', value: 'horse' }, { label: '珍寶店', value: 'acc' });
    if (!fort || base) opts.push({ label: temple ? '經閣' : '雜貨店', value: 'item' });
    opts.push({ label: '賣東西', value: 'sell' }, { label: '酒館', value: 'tavern' }, { label: '離開', value: 'out' });
    const c = await menu(opts, { title: `${p.name}　💰${S.gold}`, cls: 'place' });
    if (c == null || c === 'out') return;
    if (c === 'inn') await inn(p);
    if (c === 'hall') await hall();
    if (['weapon', 'armor', 'horse', 'acc', 'item'].includes(c)) await shop(p, c === 'item' && temple ? 'temple' : c);
    if (c === 'sell') await sell();
    if (c === 'tavern') await tavern(p);
  }
}
const innCost = () => (PLACE[S.lastInn]?.kind === 'base' ? 0 : 10 + avgLv() * 6);
async function inn(p) {
  const free = p.kind === 'temple' || p.kind === 'base', cost = free ? 0 : 10 + avgLv() * 6;
  if (cost > S.gold) { toast('銀兩不夠'); return; }
  S.gold -= cost; restAll(); S.lastInn = p.id; for (const id of S.prisoners) S.prisonDays[id] = (S.prisonDays[id] || 0) + 1; sfx('heal'); await banner('一夜好眠，兵馬都恢復了', 1200); save(); toast('已存檔');
}
async function shop(p, kind) {
  const list = kind === 'temple' ? shopOf(p, 'item').filter((id) => ['book', 'heal', 'sp', 'cast'].includes(ITEMS[id].kind)).concat(Object.values(ITEMS).filter((i) => i.kind === 'book').slice(0, 8).map((i) => i.id)) : shopOf(p, kind);
  const uniq = [...new Set(list)];
  for (;;) {
    const items = uniq.map((id) => { const x = GEAR[id] || ITEMS[id]; return { label: x.name, hint: `${x.price}`, html: `${esc(x.name)} <small>${esc(gearLine(x))}</small>`, value: id, off: x.price > S.gold }; });
    const id = await menu(items, { title: `${{ weapon: '兵器店', armor: '防具店', horse: '馬市', acc: '珍寶店', item: '雜貨店', temple: '經閣' }[kind]}　💰${S.gold}`, cls: 'shop', foot: ' ', onMove: (it) => { const f = document.querySelector('.shop .mfoot'); if (f && it) f.innerHTML = compareLine(it.value); } });
    if (!id) return;
    const x = GEAR[id] || ITEMS[id]; if (x.price > S.gold) continue;
    S.gold -= x.price; give(id); sfx('coin'); toast(`買了 ${x.name}`);
    if (GEAR[id]) { const who2 = await menu([{ label: '先放著', value: null }, ...party().map((u) => ({ label: who(u.id).name, hint: diffText(u, id), value: u.id }))], { title: '現在給誰裝備？' }); if (who2) equip(S.units[who2], id); }
  }
}
function gearLine(x) { if (!x.slot) return x.desc || ''; const a = []; if (x.atk) a.push('攻' + x.atk); if (x.def) a.push('防' + x.def); for (const [k, n] of [['wu', '武'], ['zhi', '智'], ['tong', '統'], ['su', '速']]) if (x[k]) a.push(n + (x[k] > 0 ? '+' : '') + x[k]); return `${SLOTS[x.slot]}${x.type ? '·' + WTYPE[x.type] : ''} ${a.join(' ')}`; }
function compareLine(id) { const x = GEAR[id] || ITEMS[id]; if (!GEAR[id]) return esc(x.desc || ''); return party().slice(0, 6).map((u) => `${esc(who(u.id).name)} ${diffText(u, id)}`).join('　'); }
function diffText(u, gid) { const x = GEAR[gid], cur = GEAR[u.equip[x.slot]], b = stats(u), u2 = { ...u, equip: { ...u.equip, [x.slot]: gid } }, a = stats(u2); const d = (k, n) => { const v = a[k] - b[k]; return v ? `${n}${v > 0 ? '+' : ''}${v}` : ''; }; return [d('atk', '攻'), d('def', '防'), d('zhi', '智'), d('spd', '速')].filter(Boolean).join(' ') || (cur && cur.id === gid ? '已裝備' : '—'); }
function equip(u, gid) { const x = GEAR[gid], i = S.gear.indexOf(gid); if (i < 0) return; S.gear.splice(i, 1); if (u.equip[x.slot]) S.gear.push(u.equip[x.slot]); u.equip[x.slot] = gid; const m = stats(u).max; u.troops = Math.min(u.troops, m); refreshSp(); }
async function sell() {
  for (;;) {
    const gearRows = [...new Set(S.gear)].map((id) => ({ label: GEAR[id].name, hint: `${Math.floor(GEAR[id].price / 2)}`, html: `${esc(GEAR[id].name)} <small>×${S.gear.filter((x) => x === id).length}</small>`, value: 'g:' + id }));
    const itemRows = Object.entries(S.items).filter(([id]) => ITEMS[id] && ITEMS[id].kind !== 'key').map(([id, n]) => ({ label: ITEMS[id].name, hint: `${Math.floor(ITEMS[id].price / 2)}`, html: `${esc(ITEMS[id].name)} <small>×${n}</small>`, value: 'i:' + id }));
    const v = await menu([...gearRows, ...itemRows], { title: `賣東西　💰${S.gold}`, cls: 'shop' }); if (!v) return;
    const [k, id] = v.split(':'); if (k === 'g') { S.gear.splice(S.gear.indexOf(id), 1); S.gold += Math.floor(GEAR[id].price / 2); } else { S.items[id]--; if (!S.items[id]) delete S.items[id]; S.gold += Math.floor(ITEMS[id].price / 2); } sfx('coin');
  }
}
// the tavern: stars waiting for Liangshan, famous men who want to test you first, the news of the road
async function tavern(p) {
  const stars = S.flags.根據地 ? STAR_IDS.filter((id) => STAR_HOME[id] === p.id && !S.joined[id] && !S.dead.includes(id)) : [];
  const famous = Object.values(PEOPLE).filter((x) => x.join === 'tavern' && !x.gen && x.home === p.id && !S.joined[x.id] && !S.dead.includes(x.id) && (S.flags.招安 || ['王進', '周侗', '張叔夜', '聞煥章'].includes(x.id) && S.flags.聚義));
  const wanderers = Object.values(PEOPLE).filter((x) => x.join === 'tavern' && x.gen && x.home === p.id && !S.joined[x.id] && !S.dead.includes(x.id) && (x.lv || 1) <= avgLv() + 12);
  const rows = [...stars.map((id) => ({ label: `${PEOPLE[id].name}「${PEOPLE[id].nick}」`, hint: PEOPLE[id].star, value: 's:' + id })), ...famous.map((x) => ({ label: `${x.name}「${x.nick}」`, hint: '想比試', value: 'f:' + x.id })), ...wanderers.map((x) => ({ label: `${x.name}「${x.nick}」`, hint: `${Math.round(x.lv * 25)} 兩`, value: 'w:' + x.id })), { label: '打聽消息', value: 'news' }, { label: '離開', value: 'out' }];
  for (;;) {
    const v = await menu(rows, { title: `${p.name}的酒館` }); if (!v || v === 'out') return;
    if (v === 'news') { await say([['-', newsFor(p)]]); continue; }
    const [k, id] = v.split(':'), x = PEOPLE[id];
    if (k === 's') { await say([[id, `久聞梁山泊替天行道。我${x.name}，願上梁山，與眾兄弟同生共死！`]]); join(id); toast(`${x.name}「${x.nick}」加入了！（${x.star}）`, 2600); return tavern(p); }
    if (k === 'w') { const cost = Math.round(x.lv * 25); if (S.gold < cost) { await say([[id, '要我跟你走，先拿出點誠意來。']]); continue; } if (await confirm(`付 ${cost} 兩請${x.name}加入？`)) { S.gold -= cost; join(id); toast(`${x.name}加入了！`); return tavern(p); } continue; }
    if (k === 'f') { await say([[id, `我聽說過你們。想要我${x.name}出力，先贏了我再說！`]]); const r = await fight({ foes: [`${id}@${Math.max(x.lv, avgLv())}`], bg: 'town', boss: 1, flee: 1 }); if (r.end === 'win') { await say([[id, '好本事！我服了，從今以後，就跟著你們。']]); join(id); toast(`${x.name}加入了！`); return tavern(p); } else await say([[id, '再練練吧。']]); continue; }
  }
}
function newsFor(p) {
  const s = stepNow(), hint = s ? `聽說${s.goal.replace(/^（支線）/, '')}——要去「${s.at}」。` : '天下太平了。';
  const near = STAR_IDS.filter((id) => STAR_HOME[id] && !S.joined[id] && !S.dead.includes(id)).map((id) => STAR_HOME[id]); const tip = S.flags.根據地 && near.length ? `另外，有人在${[...new Set(near)].slice(0, 3).join('、')}的酒館見過想上梁山的好漢。` : '';
  return hint + tip;
}
// prisoners travel with the army; each night at an inn softens them a little
const prisonChance = (id) => Math.min(0.9, 0.25 + (S.prisonDays?.[id] || 0) * 0.12 + starsJoined() / 400 + (S.flags.根據地 ? 0.05 : 0));
async function prisoners() {
  for (;;) {
    if (!S.prisoners.length) { toast('軍中沒有俘虜'); return; }
    const id = await menu(S.prisoners.map((id) => ({ label: `${who(id).name}「${who(id).nick}」`, hint: `${Math.round(prisonChance(id) * 100)}%`, value: id })), { title: '俘虜（住一晚客棧，招降的機會就高一點）', foot: '選一位去勸；也可以送禮或放走' });
    if (!id) return; const p = who(id);
    const c = await menu([{ label: '勸降', hint: `${Math.round(prisonChance(id) * 100)}%`, value: 'ask' }, { label: '送禮', value: 'gift', off: !Object.keys(S.items).some((x) => ITEMS[x]?.kind === 'gift') }, { label: '放走', value: 'free' }, { label: '返回', value: 'back' }], { title: `${p.name}（武${p.wu} 智${p.zhi}）` });
    if (c === 'gift') { const g = await menu(Object.entries(S.items).filter(([x]) => ITEMS[x]?.kind === 'gift').map(([x, n]) => ({ label: ITEMS[x].name, hint: '×' + n, value: x })), { title: '送什麼？' }); if (g) { use(g); S.prisonDays[id] = (S.prisonDays[id] || 0) + ITEMS[g].v / 8; toast(`${p.name}收下了${ITEMS[g].name}`); } continue; }
    if (c === 'free') { S.prisoners = S.prisoners.filter((x) => x !== id); await say([[id, '……今日之恩，他日再報。']]); continue; }
    if (c === 'ask') { if (Math.random() < prisonChance(id)) { await say([[id, '……這些日子，我看見了你們是怎麼對待百姓的。我願加入。']]); join(id, S.prisonLv?.[id]); toast(`${p.name}加入了！`); } else { await say([[id, '……讓我再想想。']]); S.prisonDays[id] = (S.prisonDays[id] || 0) + 0.3; } }
  }
}
// the hall at Liangshan: choose who travels with you; prisoners in the cells
async function hall() {
  for (;;) {
    const c = await menu([{ label: '隨行 → 留守', value: 'out', off: S.party.length <= 1 }, { label: '留守 → 隨行', value: 'in', off: !S.reserve.length || S.party.length >= 10 }, { label: `勸降俘虜（${S.prisoners.length}）`, value: 'pris', off: !S.prisoners.length }, { label: '頭領名冊', value: 'roll' }, { label: '返回', value: 'back' }], { title: `忠義堂（隨行 ${S.party.length}/10，留守 ${S.reserve.length}）` });
    if (!c || c === 'back') return;
    if (c === 'out') { const id = await menu(S.party.map((id) => ({ label: who(id).name, hint: 'Lv' + S.units[id].lv, value: id })), { title: '誰留在山上？' }); if (id) { S.party = S.party.filter((x) => x !== id); S.reserve.push(id); refreshSp(); } }
    if (c === 'in') { const id = await menu(S.reserve.map((id) => ({ label: `${who(id).name}「${who(id).nick}」`, hint: 'Lv' + S.units[id].lv, value: id })), { title: '誰跟你走？' }); if (id) { S.reserve = S.reserve.filter((x) => x !== id); S.party.push(id); refreshSp(); } }
    if (c === 'pris') await prisoners();
    if (c === 'roll') await roll();
  }
}
async function roll() {
  const rows = STAR_IDS.map((id) => { const x = PEOPLE[id], j = S.joined[id] && !S.dead.includes(id); return `<div class="rl ${j ? 'on' : S.dead.includes(id) ? 'dead' : ''}"><span>${x.star}</span><b>${j || S.dead.includes(id) ? esc(x.nick + ' ' + x.name) : '？？？'}</b></div>`; }).join('');
  await panel(`<div class="ptitle">一百單八將 · ${starsJoined()} / 108　<small>其他頭領 ${Object.keys(S.joined).filter((id) => !STAR_IDS.includes(id) && !S.dead.includes(id)).length} 位</small></div><div class="roll">${rows}</div>`, 'wide');
}
// ---------------------------------------------------------------- the map menu
async function mapMenu() {
  busy = true;
  try {
    for (;;) {
      const s = stepNow();
      const c = await menu([{ label: '部隊', value: 'units' }, { label: '道具', value: 'items' }, { label: '計策', value: 'tac' }, { label: '隊伍', value: 'order' }, { label: '地圖', value: 'map' }, { label: '名冊', value: 'roll' }, { label: `俘虜（${S.prisoners.length}）`, value: 'pris', off: !S.prisoners.length }, { label: '存檔', value: 'save' }, { label: `聲音：${soundOn() ? '開' : '關'}`, value: 'snd' }, { label: '回標題', value: 'title' }],
        { title: `💰${S.gold}　策略 ${S.sp}/${S.spMax}`, foot: s ? `目標：${esc(s.goal)}（${esc(s.at)}）` : '全劇終', cls: 'main' });
      if (!c) return;
      if (c === 'units') await unitsScreen();
      if (c === 'items') await itemsScreen();
      if (c === 'tac') await fieldTactics();
      if (c === 'order') await orderScreen();
      if (c === 'map') await worldMap();
      if (c === 'roll') await roll();
      if (c === 'pris') await prisoners();
      if (c === 'save') { save(); toast('已存檔'); }
      if (c === 'snd') { S.sound = !soundOn(); setSound(S.sound); if (S.sound) music('road'); }
      if (c === 'title') { if (await confirm('回到標題畫面？（記得先存檔）')) { scene = 'title'; return title(); } }
    }
  } finally { busy = false; }
}
async function unitsScreen() {
  for (;;) {
    const id = await menu(party().map((u) => { const st = stats(u); return { label: who(u.id).name, html: `${esc(who(u.id).name)} <small>Lv${u.lv}</small>`, hint: `${u.troops}/${st.max}`, value: u.id }; }), { title: '部隊' });
    if (!id) return; await unitDetail(S.units[id]);
  }
}
async function unitDetail(u) {
  for (;;) {
    const p = who(u.id), st = stats(u), tac = knows(u, S.books);
    const box = el('div', 'win detail'); const f = faceOf(u.id); if (f) box.appendChild(f);
    box.insertAdjacentHTML('beforeend', `<div class="dinfo"><div class="dname">${esc(p.name)} <small>「${esc(p.nick)}」${p.star ? ' · ' + p.star : ''}</small></div><div>Lv ${u.lv}　經驗 ${u.exp}/${expNeed(u.lv)}　${p.troop}兵</div><div>兵力 ${u.troops} / ${st.max}</div>
      <div class="dstats"><span>武力 <b>${st.wu}</b></span><span>智力 <b>${st.zhi}</b></span><span>統率 <b>${st.tong}</b></span><span>速度 <b>${Math.round(st.su)}</b></span><span>攻擊 <b>${st.atk}</b></span><span>防禦 <b>${st.def}</b></span></div>
      <div class="dtac">計策：${tac.length ? tac.map(esc).join('、') : '—'}</div></div>`);
    $('ui').appendChild(box);
    const c = await menu([...Object.entries(SLOTS).map(([k, n]) => ({ label: n, html: `${n}：${u.equip[k] ? esc(GEAR[u.equip[k]].name) : '—'}`, value: k })), { label: '返回', value: 'back' }], { title: '裝備', cls: 'equip' });
    box.remove();
    if (!c || c === 'back') return;
    const own = [...new Set(S.gear.filter((gid) => GEAR[gid].slot === c))];
    const gid = await menu([{ label: '（卸下）', value: '-' }, ...own.map((gid) => ({ label: GEAR[gid].name, html: `${esc(GEAR[gid].name)} <small>${esc(gearLine(GEAR[gid]))}</small>`, hint: diffText(u, gid), value: gid }))], { title: SLOTS[c], cls: 'shop' });
    if (gid === '-') { if (u.equip[c]) { S.gear.push(u.equip[c]); delete u.equip[c]; u.troops = Math.min(u.troops, stats(u).max); } }
    else if (gid) equip(u, gid);
  }
}
async function itemsScreen() {
  for (;;) {
    const rows = Object.entries(S.items).filter(([id, n]) => n > 0 && ITEMS[id]).sort((a, b) => a[0].localeCompare(b[0])).map(([id, n]) => ({ label: ITEMS[id].name, html: `${esc(ITEMS[id].name)} <small>${esc(ITEMS[id].desc)}</small>`, hint: '×' + n, value: id, off: !['field', 'both'].includes(ITEMS[id].use) }));
    const id = await menu(rows.length ? rows : [{ label: '（沒有東西）', off: true }], { title: '道具', cls: 'shop' }); if (!id) return;
    const I = ITEMS[id];
    if (I.kind === 'repel') { S.repel = I.v; use(id); toast(I.desc); continue; }
    if (I.kind === 'sp') { S.sp = Math.min(S.spMax, S.sp + I.v); use(id); toast('策略值回復'); continue; }
    if (I.kind === 'healAll') { for (const u of party()) u.troops = Math.min(stats(u).max, u.troops + I.v); use(id); sfx('heal'); toast('全軍兵力回復'); continue; }
    const tid = await menu(party().map((u) => ({ label: who(u.id).name, hint: `${u.troops}/${stats(u).max}`, value: u.id })), { title: `給誰用${I.name}？` }); if (!tid) continue; const u = S.units[tid];
    if (I.kind === 'heal') { u.troops = Math.min(stats(u).max, u.troops + I.v); sfx('heal'); }
    if (I.kind === 'revive') { u.troops = Math.max(u.troops, Math.round(stats(u).max * I.v)); sfx('heal'); }
    if (I.kind === 'stat') { u.bonus[I.stat] = (u.bonus[I.stat] || 0) + I.v; sfx('buff'); toast(`${who(tid).name}的能力提升了`); }
    if (I.kind === 'book') { const b = (S.books[tid] = S.books[tid] || []); if (b.includes(I.tactic) || knows(u, S.books).includes(I.tactic)) { toast('已經會了'); continue; } b.push(I.tactic); toast(`${who(tid).name}學會了「${I.tactic}」`); sfx('buff'); }
    use(id);
  }
}
const use = (id) => { S.items[id]--; if (S.items[id] <= 0) delete S.items[id]; };
async function fieldTactics() {
  const casters = party().filter((u) => knows(u, S.books).some((t) => ['heal', 'revive'].includes(TACTICS[t].kind)));
  if (!casters.length) { toast('沒有人會救護的計策'); return; }
  const cid = await menu(casters.map((u) => ({ label: who(u.id).name, value: u.id })), { title: `誰施展？（策略值 ${S.sp}）` }); if (!cid) return;
  const c = S.units[cid], list = knows(c, S.books).filter((t) => ['heal'].includes(TACTICS[t].kind));
  const tid = await menu(list.map((t) => ({ label: t, hint: '' + TACTICS[t].sp, value: t, off: TACTICS[t].sp > S.sp })), { title: '計策' }); if (!tid) return; const T = TACTICS[tid];
  const targets = T.to === 'allies' ? party() : [S.units[await menu(party().map((u) => ({ label: who(u.id).name, hint: `${u.troops}/${stats(u).max}`, value: u.id })), { title: '給誰？' })]].filter(Boolean);
  if (!targets.length) return; S.sp -= T.sp; const z = stats(c).zhi * 2.6 * (1 + c.lv * 0.08) * T.pow;
  for (const u of targets) u.troops = Math.min(stats(u).max, u.troops + Math.round(z)); sfx('heal'); toast('兵力回復了');
}
async function orderScreen() {
  for (;;) {
    const id = await menu(party().map((u, i) => ({ label: `${i < 5 ? '★' : '　'} ${who(u.id).name}`, hint: `Lv${u.lv} ${who(u.id).troop}`, value: u.id })), { title: '隊伍（前五位出戰；選人再選位置）', cls: 'order' });
    if (!id) return; const to = await menu(party().map((u, i) => ({ label: `第 ${i + 1} 位：${who(u.id).name}`, value: i })), { title: `把${who(id).name}換到……` });
    if (to == null) continue; const from = S.party.indexOf(id); [S.party[from], S.party[to]] = [S.party[to], S.party[from]]; refreshSp();
  }
}
async function worldMap() {
  const [c2, g2] = [document.createElement('canvas'), null]; c2.width = MW * 3; c2.height = MH * 3; const gg = c2.getContext('2d');
  const col = { '.': '#5c9c3c', ',': '#8aa848', f: '#2a6a1e', h: '#7aa048', M: '#7a7468', '~': '#2a5aa8', r: '#3a70c0', '=': '#c8a868', b: '#8a5a2a', F: '#8a5a2a', L: '#8a5a2a', ':': '#8a9a4a', n: '#e8eef8', s: '#e8d8a0' };
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { gg.fillStyle = col[W[y][x]] || '#000'; gg.fillRect(x * 3, y * 3, 3, 3); }
  gg.font = 'bold 9px "Noto Sans TC", sans-serif'; gg.textAlign = 'center';
  for (const p of PLACES) { gg.fillStyle = storyHere(p.id) ? '#ffe070' : '#ffffff'; gg.fillRect(p.x * 3 - 1, p.y * 3 - 1, 5, 5); gg.lineWidth = 2.5; gg.strokeStyle = '#000'; gg.strokeText(p.name, p.x * 3 + 1, p.y * 3 - 3); gg.fillText(p.name, p.x * 3 + 1, p.y * 3 - 3); }
  gg.fillStyle = '#ff3a3a'; gg.fillRect(P.x * 3 - 3, P.y * 3 - 3, 8, 8);
  const box = el('div', 'win panel wide mapbox'); box.appendChild(c2); $('ui').appendChild(box);
  await new Promise((res) => { const off = input.on((a) => { if (a === 'cancel' || a === 'ok' || a === 'menu') { off(); box.remove(); res(); } }); box.onclick = () => press('cancel'); });
}
// ---------------------------------------------------------------- title and the loop
async function title() {
  scene = 'title'; music('town'); busy = true;
  const t = el('div', 'titlebox', '<div class="tzh">梁山群英傳</div><div class="ten">HEROES OF THE MARSH</div><div class="tsub">替天行道 · 一百單八將</div>'); $('ui').appendChild(t);
  const saved = load();
  const c = await menu([{ label: '新的旅程', value: 'new' }, { label: '繼續', value: 'load', off: !saved }], { title: '', noCancel: true, cls: 'tmenu' });
  t.remove();
  if (c === 'new') { if (saved && !(await confirm('要開始新的旅程嗎？舊的紀錄會被覆蓋。'))) return title(); S = fresh(); P.x = P.fx = 10; P.y = P.fy = 58; }
  else { S = saved; P.x = P.fx = S.x; P.y = P.fy = S.y; }
  setSound(S.sound !== false); scene = 'map'; music('road'); busy = false; refreshSp();
  const s = stepNow(); if (s && s.auto) { await runStep(s); }
  else if (s) await banner(`目標：${s.goal}`, 1600);
}
function loop(now) {
  requestAnimationFrame(loop);
  const t = now / 1000; draw(t);
  if (scene === 'map' && !busy && !P.moving) {
    const h = input.held, d = h.has('up') ? [0, -1] : h.has('down') ? [0, 1] : h.has('left') ? [-1, 0] : h.has('right') ? [1, 0] : null;
    if (d) { busy = true; tryMove(...d).finally(() => { busy = false; }); }
  }
}
input.on((a) => { if (scene === 'map' && !busy && (a === 'cancel' || a === 'menu')) mapMenu(); if (scene === 'map' && !busy && a === 'ok') { const p = PLACES.find((q) => q.x === P.x && q.y === P.y); if (p) { busy = true; enterPlace(p).finally(() => { busy = false; }); } } });
// the touch pad: hold a direction to walk
for (const b of document.querySelectorAll('[data-k]')) { const k = b.dataset.k; const down = (e) => { e.preventDefault(); if (['up', 'down', 'left', 'right'].includes(k)) input.held.add(k); press(k); }; const up = () => input.held.delete(k); b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up); b.addEventListener('pointercancel', up); }
function fit() { const r = Math.min(innerWidth / LW, innerHeight / LH); cv.style.width = Math.floor(LW * r) + 'px'; cv.style.height = Math.floor(LH * r) + 'px'; document.documentElement.style.setProperty('--s', r.toFixed(3)); }
addEventListener('resize', fit); fit();
requestAnimationFrame(loop);
(async () => { try { cloud = await import('/save.js'); await cloud.pull(GAME, KEY); } catch (e) { cloud = null; } title(); })();
window.LS = { get S() { return S; }, get busy() { return busy; }, P, join, fight, runStep, STORY, get scene() { return scene; }, save, give, enterPlace, PLACE };
