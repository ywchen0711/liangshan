// A battle, as the old Three Kingdoms RPGs fought them: two armies face each other, each general at the head of
// their soldiers; a general's soldiers are their life. Each round you give every general an order — attack, a
// tactic from the army's strategy points, an item, hold the line, all-out attack, or retreat — then everyone acts in
// order of speed. Generals beaten in the field may be talked into joining.
import { battler, soldier, backdrop, portrait } from './art.js';
import { who, newUnit, stats, damage, hitChance, tacticPower, tacticHits, gainExp, knows, spMax, recruitChance, TACTICS, ITEMS, GEAR } from './rules.js';
import { GEAR_LIST } from './data/gear.js';
import { ITEM_LIST } from './data/items.js';
import { menu, say, toast, el, $, input, faceOf, confirm } from './ui.js';
import { rng, hash, wait, clamp, esc } from './util.js';
import { sfx } from './sound.js';

const LW = 384, LH = 224;
export class Battle {
  constructor(o) {
    this.o = o; this.R = rng((Date.now() & 0xffff) ^ hash(o.foes.join())); this.t = 0; this.fx = []; this.pops = [];
    const mk = (u, side, i) => { const s = stats(u); return { u, side, i, id: u.id, p: who(u.id), name: who(u.id).name, lv: u.lv, ...s, troops: u.troops, buff: {}, status: {}, guard: false, dx: 0, flash: 0, gone: u.troops <= 0 }; };
    this.allies = o.party.slice(0, 5).map((u, i) => mk(u, 'ally', i));
    this.foes = o.foes.map((f, i) => { const [id, lv] = typeof f === 'string' ? f.split('@') : [f.id, f.lv]; const u = newUnit(id, +lv); return mk(u, 'foe', i); });
    const fsp = spMax(this.foes.map((b) => b.u)); this.foeSp = fsp; this.water = o.bg === 'water'; this.ground = o.bg;
    this.log = '';
  }
  alive(side) { return (side === 'ally' ? this.allies : this.foes).filter((b) => !b.gone); }
  // where each one stands on the field
  pos(b) { const n = b.side === 'ally' ? this.allies.length : this.foes.length, gap = n > 1 ? Math.min(22, 84 / (n - 1)) : 0, y = 78 - gap * (n - 1) / 2 + b.i * gap, colX = b.side === 'ally' ? 300 : 84; return [colX + (b.i % 2 ? (b.side === 'ally' ? 22 : -22) : 0), Math.round(y)]; }
  render(g, t) {
    this.t = t; g.imageSmoothingEnabled = false; g.drawImage(backdrop(this.o.bg || 'plain'), 0, 0, LW, 150);
    g.fillStyle = '#10142a'; g.fillRect(0, 150, LW, LH - 150);
    for (const b of [...this.foes, ...this.allies]) {
      if (b.gone && !b.fade) continue; const [x0, y0] = this.pos(b), dir = b.side === 'ally' ? -1 : 1, x = x0 + b.dx * dir, y = y0, frame = Math.floor(t * 4 + b.i) % 2;
      g.save(); if (b.fade) g.globalAlpha = Math.max(0, b.fade); if (b.status.confuse) g.globalAlpha *= 0.85;
      // the ranks: up to eight soldiers behind the general, fewer as they fall
      const n = Math.ceil(clamp(b.troops / b.max, 0, 1) * 8), col = b.side === 'ally' ? '#3a6ab8' : '#a83a2a';
      for (let k = 0; k < n; k++) { const sx = x - dir * (22 + (k % 4) * 9) + (b.charge || 0) * dir * 30, sy = y + 4 + Math.floor(k / 4) * 9 + (k % 2) * 2; g.save(); g.translate(sx, sy); if (dir < 0) g.scale(-1, 1); g.drawImage(soldier(col, frame + k), -4, 0); g.restore(); }
      g.save(); g.translate(x, y - 8); if (dir < 0) g.scale(-1, 1); const img = b.p.beast ? beastImg(b.p, frame) : battler(b.p, frame); g.drawImage(img, -16, 0); g.restore();
      if (b.flash > 0) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = b.flash; g.fillStyle = '#ffffff'; g.fillRect(x - 16, y - 8, 32, 32); g.globalCompositeOperation = 'source-over'; }
      // a little bar of soldiers under them
      g.globalAlpha = 1; g.fillStyle = '#000'; g.fillRect(x - 14, y + 26, 28, 3); g.fillStyle = b.troops / b.max > 0.5 ? '#5ad85a' : b.troops / b.max > 0.25 ? '#e8c840' : '#e84a3a'; g.fillRect(x - 14, y + 26, 28 * clamp(b.troops / b.max, 0, 1), 3);
      if (b.marked) { g.strokeStyle = '#ffe070'; g.lineWidth = 1; g.strokeRect(x - 18, y - 12, 36, 42); }
      g.restore();
    }
    for (const f of this.fx) drawFx(g, f, t);
    this.fx = this.fx.filter((f) => t - f.t0 < f.life);
    g.textAlign = 'center'; g.font = 'bold 10px "Noto Sans TC", sans-serif';
    for (const p of this.pops) { const k = (t - p.t0) / 1.1; if (k > 1) continue; g.globalAlpha = 1 - Math.max(0, k - 0.6) * 2.5; g.lineWidth = 3; g.strokeStyle = '#000'; g.strokeText(p.text, p.x, p.y - k * 16); g.fillStyle = p.col; g.fillText(p.text, p.x, p.y - k * 16); g.globalAlpha = 1; }
    this.pops = this.pops.filter((p) => t - p.t0 < 1.1);
  }
  pop(b, text, col = '#ffffff') { const [x, y] = this.pos(b); this.pops.push({ x, y: y - 10, text, col, t0: this.t }); }
  // the windows under the field: the enemy on the left, your generals on the right with their soldiers
  hud() {
    let h = $('bhud'); if (!h) { h = el('div', ''); h.id = 'bhud'; $('ui').appendChild(h); }
    const row = (b) => `<div class="brow ${b.gone ? 'out' : ''} ${b.marked ? 'mk' : ''}"><b>${esc(b.name)}</b><span class="bt">${b.gone ? '潰散' : b.troops}</span><i><em style="width:${clamp(b.troops / b.max, 0, 1) * 100}%"></em></i>${Object.keys(b.status).filter((k) => b.status[k] > 0).map((k) => `<u>${{ confuse: '亂', stun: '暈', blind: '盲', weak: '弱' }[k]}</u>`).join('')}</div>`;
    h.innerHTML = `<div class="win bfoe">${this.foes.map(row).join('')}</div><div class="win bally"><div class="bsp">策略值 ${this.o.S.sp} / ${this.o.S.spMax}${this.auto ? '<span class="bauto">總攻擊中</span>' : ''}</div>${this.allies.map(row).join('')}</div>`;
  }
  async run() {
    this.hud(); sfx('battle');
    if (this.o.intro) await say(this.o.intro);
    for (let round = 1; round < 99; round++) {
      // ---- orders
      const orders = []; let all = false;
      const able = this.allies.filter((b) => !b.gone && !b.status.stun);
      for (let i = 0; i < able.length; i++) {
        const b = able[i];
        if (this.auto) { const t = this.alive('foe').sort((x, y) => x.troops - y.troops)[0]; orders.push({ b, kind: 'attack', target: t }); continue; }
        if (all) { orders.push({ b, kind: 'attack', target: null }); continue; }
        b.marked = true; this.hud();
        const ord = await this.orderFor(b, i === 0);
        b.marked = false; this.hud();
        if (ord === 'back') { if (i > 0) { orders.pop(); i -= 2; } else i--; continue; }
        if (ord.kind === 'flee') { const r = await this.tryFlee(); if (r) return this.finish('fled'); orders.length = 0; i = able.length; break; }
        if (ord.kind === 'auto') { this.setAuto(true); i--; continue; }
        if (ord.kind === 'allout') { all = true; orders.push({ b, kind: 'attack', target: null }); continue; }
        orders.push(ord);
      }
      // ---- the enemy
      for (const b of this.alive('foe')) if (!b.status.stun) orders.push(this.foeOrder(b));
      // ---- act, fastest first
      orders.sort((a, b) => b.b.spd * (b.b.buff.spd || 1) * (0.9 + this.R() * 0.2) - a.b.spd * (a.b.buff.spd || 1) * (0.9 + this.R() * 0.2));
      for (const o of orders) { if (o.b.gone) continue; await this.act(o); this.hud(); const e = this.over(); if (e) { this.setAuto(false); return this.finish(e); } }
      // ---- statuses wear off
      for (const b of [...this.allies, ...this.foes]) { b.guard = false; for (const k of Object.keys(b.status)) if (b.status[k] > 0) b.status[k]--; }
      this.hud();
    }
    this.setAuto(false); return this.finish('lose');
  }
  // 總攻擊: every general strikes the weakest foe, round after round, until the fight ends or a key is pressed
  setAuto(on) {
    if (on === !!this.auto) return; this.auto = on;
    if (on) { this.banner('總攻擊！（按任意鍵停止）'); this._autoOff = input.on(() => { this.setAuto(false); this.banner('總攻擊停止，下回合起重新下令'); }); }
    else if (this._autoOff) { this._autoOff(); this._autoOff = null; }
    this.hud();
  }
  over() { if (!this.alive('foe').length) return 'win'; if (!this.alive('ally').length) return 'lose'; return null; }
  async orderFor(b, first) {
    const S = this.o.S, tac = knows(b.u, S.books), items = Object.entries(S.items).filter(([id, n]) => n > 0 && ITEMS[id] && (ITEMS[id].use === 'battle' || ITEMS[id].use === 'both'));
    const place = (w) => { w.style.left = '50%'; w.style.top = '18%'; w.style.transform = 'translateX(-50%)'; };
    for (;;) {
      const c = await menu([{ label: '攻擊', value: 'atk' }, { label: '計策', value: 'tac', off: !tac.length, hint: tac.length ? '' : '—' }, { label: '道具', value: 'item', off: !items.length }, { label: '防禦', value: 'guard' }, { label: '全軍突擊', value: 'allout', hint: '本回合' }, { label: '總攻擊', value: 'auto', hint: '自動' }, ...(first ? [{ label: this.o.boss ? '撤退（不可）' : '撤退', value: 'flee', off: !!this.o.boss && !this.o.flee }] : [])], { title: b.name, cls: 'bcmd', place, noCancel: first });
      if (c == null) return 'back';
      if (c === 'guard') return { b, kind: 'guard' };
      if (c === 'allout' || c === 'flee' || c === 'auto') return { b, kind: c };
      if (c === 'atk') { const t = await this.pickTarget('foe'); if (t) return { b, kind: 'attack', target: t }; continue; }
      if (c === 'tac') {
        const id = await menu(tac.map((t) => ({ label: t, hint: `${TACTICS[t].sp}`, value: t, off: TACTICS[t].sp > S.sp })), { title: `計策（策略值 ${S.sp}）`, cls: 'bcmd tac', place, foot: '' , onMove: (it) => { const f = document.querySelector('.bcmd.tac .mfoot'); if (f && it) f.textContent = TACTICS[it.value].desc; } });
        if (!id) continue; const T = TACTICS[id];
        if (T.to === 'one') { const t = await this.pickTarget('foe'); if (!t) continue; return { b, kind: 'tactic', tac: id, target: t }; }
        if (T.to === 'ally' || T.kind === 'revive') { const t = await this.pickTarget('ally', T.kind === 'revive'); if (!t) continue; return { b, kind: 'tactic', tac: id, target: t }; }
        return { b, kind: 'tactic', tac: id };
      }
      if (c === 'item') {
        const id = await menu(items.map(([id, n]) => ({ label: ITEMS[id].name, hint: '×' + n, value: id })), { title: '道具', cls: 'bcmd', place }); if (!id) continue; const I = ITEMS[id];
        if (I.kind === 'escape') { if (this.o.boss) { toast('這一戰不能逃走'); continue; } return { b, kind: 'item', item: id }; }
        if (I.kind === 'cast') { const T = TACTICS[I.tactic]; if (T.to === 'one') { const t = await this.pickTarget('foe'); if (!t) continue; return { b, kind: 'item', item: id, target: t }; } if (T.to === 'ally' || T.kind === 'revive') { const t = await this.pickTarget('ally', T.kind === 'revive'); if (!t) continue; return { b, kind: 'item', item: id, target: t }; } return { b, kind: 'item', item: id }; }
        if (I.kind === 'healAll' || I.to === 'allies') return { b, kind: 'item', item: id };
        const t = await this.pickTarget('ally', I.kind === 'revive'); if (!t) continue; return { b, kind: 'item', item: id, target: t };
      }
    }
  }
  async pickTarget(side, fallen = false) {
    const list = (side === 'foe' ? this.foes : this.allies).filter((b) => (fallen ? b.gone : !b.gone)); if (!list.length) return null;
    const place = (w) => { w.style.left = side === 'foe' ? '4%' : 'auto'; w.style.right = side === 'foe' ? 'auto' : '4%'; w.style.top = '10%'; };
    const r = await menu(list.map((b) => ({ label: b.name, hint: b.gone ? '潰散' : String(b.troops), value: b })), { title: side === 'foe' ? '目標' : '我軍', cls: 'bcmd', place, onMove: (it) => { for (const x of [...this.foes, ...this.allies]) x.marked = x === it?.value; this.hud(); } });
    for (const x of [...this.foes, ...this.allies]) x.marked = false; return r;
  }
  foeOrder(b) {
    const tac = knows(b.u, {}).filter((t) => TACTICS[t].sp <= this.foeSp && TACTICS[t].kind !== 'escape'), R = this.R;
    const hurt = this.alive('foe').find((x) => x.troops < x.max * 0.35);
    if (hurt && tac.includes('救護') && R() < 0.6) return { b, kind: 'tactic', tac: tac.includes('大救護') ? '大救護' : '救護', target: hurt, foe: 1 };
    const dmg = tac.filter((t) => TACTICS[t].kind === 'dmg' || TACTICS[t].kind === 'debuff');
    if (dmg.length && R() < (b.troop === '謀' || b.troop === '術' ? 0.7 : 0.25)) { const t = dmg.sort((a, c) => TACTICS[c].sp - TACTICS[a].sp)[R.int(0, Math.min(1, dmg.length - 1))]; return { b, kind: 'tactic', tac: t, target: this.weakest('ally'), foe: 1 }; }
    return { b, kind: 'attack', target: R() < 0.55 ? this.weakest('ally') : R.pick(this.alive('ally')) };
  }
  weakest(side) { return this.alive(side).sort((a, b) => a.troops - b.troops)[0]; }
  async act(o) {
    const b = o.b, enemy = b.side === 'ally' ? 'foe' : 'ally';
    if (o.kind === 'guard') { b.guard = true; this.pop(b, '防禦', '#a8c8ff'); await wait(250); return; }
    // confusion: strike someone at random, friend or foe
    if (b.status.confuse && o.kind !== 'guard') { const pool = [...this.alive('ally'), ...this.alive('foe')].filter((x) => x !== b); o = { b, kind: 'attack', target: this.R.pick(pool) }; this.pop(b, '混亂', '#e8a0ff'); await wait(200); }
    if (o.kind === 'attack') {
      let t = o.target && !o.target.gone ? o.target : this.R.pick(this.alive(o.target ? o.target.side : enemy)); if (!t) return;
      await this.lunge(b);
      if (this.R() > hitChance(b, t)) { this.pop(t, '閃避', '#a8c8ff'); sfx('miss'); await wait(300); return; }
      const d = damage(b, t, this.R, { water: this.water }); this.hurt(t, d.n, d.crit); sfx(d.crit ? 'crit' : 'hit');
      if (d.crit) this.pop(b, '會心一擊', '#ffd040');
      await wait(380); return;
    }
    if (o.kind === 'tactic' || (o.kind === 'item' && ITEMS[o.item].kind === 'cast')) {
      const id = o.kind === 'tactic' ? o.tac : ITEMS[o.item].tactic, T = TACTICS[id], pow = o.kind === 'item' ? ITEMS[o.item].pow : 1;
      if (o.kind === 'tactic') { if (b.side === 'ally') { if (this.o.S.sp < T.sp) { this.pop(b, '策略值不足', '#ffb0a0'); await wait(300); return; } this.o.S.sp -= T.sp; } else { if (this.foeSp < T.sp) return this.act({ b, kind: 'attack', target: o.target }); this.foeSp -= T.sp; } }
      else this.useItem(o.item);
      this.banner(`${b.name}：${id}`); await wait(500);
      if (T.kind === 'escape') { if (b.side === 'ally' && !this.o.boss) { this.fled = true; } return; }
      const mine = b.side === 'ally' ? 'ally' : 'foe', theirs = mine === 'ally' ? 'foe' : 'ally';
      const targets = T.to === 'one' ? [o.target && !o.target.gone ? o.target : this.R.pick(this.alive(theirs))].filter(Boolean) : T.to === 'all' ? this.alive(theirs) : T.to === 'ally' ? [o.target].filter(Boolean) : T.to === 'allies' ? this.alive(mine) : [b];
      for (const t of targets) this.fx.push({ kind: T.el || T.kind, at: this.pos(t), t0: this.t, life: 0.8 });
      sfx(T.el || T.kind); await wait(450);
      for (const t of targets) {
        if (T.kind === 'heal') { const n = tacticPower(b, t, id, this.R, { pow }); t.troops = Math.min(t.max, t.troops + n); this.pop(t, '+' + n, '#7aff8a'); continue; }
        if (T.kind === 'revive') { if (!t.gone) continue; t.gone = false; t.fade = 0; t.troops = Math.round(t.max * T.pow); this.pop(t, '重整', '#7aff8a'); continue; }
        if (T.kind === 'buff') { t.buff[T.stat] = Math.max(t.buff[T.stat] || 1, T.pow * (pow > 1 ? 1.1 : 1)); this.pop(t, { atk: '攻↑', def: '防↑', spd: '速↑' }[T.stat], '#ffe070'); continue; }
        if (this.R() > tacticHits(b, t, id)) { this.pop(t, '無效', '#a8c8ff'); continue; }
        if (T.kind === 'debuff') { t.status[T.status] = T.status === 'stun' ? 1 : 3; this.pop(t, { confuse: '混亂', stun: '不能動', blind: '命中↓', weak: '攻擊↓' }[T.status], '#e8a0ff'); continue; }
        const n = tacticPower(b, t, id, this.R, { pow, ground: this.ground }); this.hurt(t, n);
        if (id === '飛沙走石') t.status.blind = Math.max(t.status.blind || 0, 2);
      }
      await wait(420); return;
    }
    if (o.kind === 'item') {
      const I = ITEMS[o.item]; this.useItem(o.item); this.banner(`${b.name}：${I.name}`); await wait(350);
      if (I.kind === 'escape') { if (!this.o.boss && (I.id === 'esc1' || this.R() < 0.75)) this.fled = true; else this.pop(b, '逃不掉', '#ffb0a0'); return; }
      const targets = I.kind === 'healAll' || I.to === 'allies' ? this.alive('ally') : [o.target].filter(Boolean);
      for (const t of targets) {
        if (I.kind === 'heal' || I.kind === 'healAll') { const n = Math.min(t.max - t.troops, I.v); t.troops += n; this.pop(t, '+' + n, '#7aff8a'); this.fx.push({ kind: 'heal', at: this.pos(t), t0: this.t, life: 0.7 }); }
        if (I.kind === 'revive' && t.gone) { t.gone = false; t.fade = 0; t.troops = Math.round(t.max * I.v); this.pop(t, '重整', '#7aff8a'); }
        if (I.kind === 'cure') { if (I.status === 'all') t.status = {}; else t.status[I.status] = 0; this.pop(t, '恢復', '#7aff8a'); }
        if (I.kind === 'buff') { t.buff[I.stat] = Math.max(t.buff[I.stat] || 1, I.v); this.pop(t, { atk: '攻↑', def: '防↑', spd: '速↑' }[I.stat], '#ffe070'); }
        if (I.kind === 'sp') { this.o.S.sp = Math.min(this.o.S.spMax, this.o.S.sp + I.v); this.pop(t, '策略↑', '#a8d8ff'); }
      }
      await wait(380);
    }
  }
  useItem(id) { const S = this.o.S; S.items[id] = (S.items[id] || 0) - 1; if (S.items[id] <= 0) delete S.items[id]; }
  hurt(t, n, crit) {
    t.troops = Math.max(0, t.troops - n); t.flash = 1; this.pop(t, String(n), crit ? '#ffd040' : '#ffffff');
    const fade = () => { t.flash = Math.max(0, t.flash - 0.1); if (t.flash > 0) requestAnimationFrame(fade); }; fade();
    if (t.troops <= 0 && !t.gone) { t.gone = true; t.fade = 1; this.pop(t, '潰散', '#ff8a8a'); const f = () => { t.fade -= 0.04; if (t.fade > 0) requestAnimationFrame(f); else t.fade = 0; }; setTimeout(f, 300); }
  }
  async lunge(b) { const t0 = performance.now(); await new Promise((res) => { const f = (now) => { const k = Math.min(1, (now - t0) / 320); b.dx = Math.sin(k * Math.PI) * 40; b.charge = Math.sin(k * Math.PI); if (k < 1) requestAnimationFrame(f); else { b.dx = 0; b.charge = 0; res(); } }; requestAnimationFrame(f); }); }
  banner(text) { let w = $('bbanner'); if (!w) { w = el('div', 'win'); w.id = 'bbanner'; $('ui').appendChild(w); } w.textContent = text; w.hidden = false; clearTimeout(this._bt); this._bt = setTimeout(() => { w.hidden = true; }, 1100); }
  async tryFlee() {
    if (this.o.boss && !this.o.flee) { toast('這一戰不能逃走'); return false; }
    const mine = this.alive('ally').reduce((s, b) => s + b.spd, 0) / Math.max(1, this.alive('ally').length), theirs = this.alive('foe').reduce((s, b) => s + b.spd, 0) / Math.max(1, this.alive('foe').length);
    if (this.o.flee || this.R() < clamp(0.55 + (mine - theirs) / 100, 0.2, 0.95)) { this.banner('全軍撤退！'); await wait(600); return true; }
    this.banner('撤退失敗！'); await wait(600); return false;
  }
  async finish(end) {
    if (this.fled) end = 'fled';
    const S = this.o.S;
    for (const b of this.allies) b.u.troops = Math.max(0, b.troops);
    const h = $('bhud'); if (h) h.remove(); const bb = $('bbanner'); if (bb) bb.remove();
    const res = { end, captured: [], exp: 0, gold: 0, drops: [] };
    if (end !== 'win') return res;
    sfx('win');
    let exp = 0, gold = 0; for (const f of this.foes) { exp += f.lv * (f.p.grunt ? 9 : 13) * (this.o.boss ? 1.8 : 1) + 6; gold += f.lv * (f.p.grunt ? 12 : 20) + 10; }
    exp = Math.round(exp); gold = Math.round(gold * (this.o.boss ? 1.5 : 1)); res.exp = exp; res.gold = gold; S.gold += gold;
    const ups = [];
    for (const b of this.allies) { const n = gainExp(b.u, b.gone ? Math.round(exp / 2) : exp); if (n) ups.push(`${b.name} 升到 ${b.u.lv} 級`); if (b.u.troops <= 0) b.u.troops = 1; }
    // spoils: now and then a weapon or armour near the foes' strength, often something from their packs
    const R = this.R, avgLv = this.foes.reduce((s, f) => s + f.lv, 0) / this.foes.length;
    if (R() < 0.35) { const tier = clamp(Math.round(avgLv / 3.6) + R.int(-1, 1), 0, 19), pool = GEAR_LIST.filter((g) => !g.famous && !g.campaign && (g.slot === 'weapon' ? g.tier === tier : g.tier === Math.round(tier * 0.6))); if (pool.length) { const g = R.pick(pool); S.gear.push(g.id); res.drops.push(g.name); } }
    if (R() < 0.6) { const pool = ITEM_LIST.filter((i) => ['heal', 'healAll', 'sp', 'cure', 'buff', 'cast', 'gift', 'trade'].includes(i.kind) && (i.tier == null || i.tier <= avgLv / 9)); const it = R.pick(pool); S.items[it.id] = (S.items[it.id] || 0) + 1; res.drops.push(it.name); }
    await say([['-', `大獲全勝！得到經驗 ${exp}、銀兩 ${gold}。${res.drops.length ? `繳獲：${res.drops.join('、')}。` : ''}`], ...ups.map((u) => ['-', u])], { fast: true });
    // generals taken in the field
    for (const f of this.foes) { const p = f.p; if (S.joined[p.id] || S.dead.includes(p.id) || !recruitChance(p, this.allies[0].u)) continue; if (R() < (this.o.boss ? 0.8 : 0.5)) res.captured.push(f); }
    for (const f of res.captured) await this.persuade(f);
    return res;
  }
  async persuade(f) {
    const S = this.o.S, p = f.p, leader = this.allies[0].u;
    await say([['-', `${p.name}「${p.nick}」被我軍擒住了。`]], { fast: true });
    for (;;) {
      const chance = recruitChance(p, leader, S._gift || 0, Object.keys(S.joined).length);
      const c = await menu([{ label: '招降', hint: `${Math.round(chance * 100)}%`, value: 'ask' }, { label: '送禮', value: 'gift', off: !Object.keys(S.items).some((id) => ITEMS[id]?.kind === 'gift') }, { label: '釋放', value: 'free' }], { title: `${p.name}（${p.side === 'song' ? '官軍' : '江湖'} · 武${p.wu} 智${p.zhi}）`, noCancel: true });
      if (c === 'gift') { const id = await menu(Object.entries(S.items).filter(([id]) => ITEMS[id]?.kind === 'gift').map(([id, n]) => ({ label: ITEMS[id].name, hint: '×' + n, value: id })), { title: '送什麼？' }); if (id) { S._gift = (S._gift || 0) + ITEMS[id].v; this.useItem(id); toast(`${p.name}收下了${ITEMS[id].name}`); } continue; }
      if (c === 'free') { S._gift = 0; await say([[p.id, '……今日之恩，他日再報。']], { fast: true }); return; }
      if (this.R() < chance) { S._gift = 0; this.o.onJoin(p.id, f.lv); await say([[p.id, R0(['久聞梁山好漢替天行道，我願追隨！', '罷了！今後這條命就交給你們了。', '敗軍之將，承蒙不殺。願效犬馬之勞！', '好！我跟你們幹了！'], p.id)]]); return; }
      S._gift = 0; await say([[p.id, R0(['要殺便殺，我不會投降！', '哼，我豈是貪生怕死之輩！', '休想！'], p.id)]], { fast: true });
      const again = await confirm('要放他走嗎？', '放走', '押在軍中，之後再勸'); if (again) return;
      S.prisoners = S.prisoners || []; if (!S.prisoners.includes(p.id)) { S.prisoners.push(p.id); S.prisonLv = S.prisonLv || {}; S.prisonLv[p.id] = f.lv; S.prisonDays = S.prisonDays || {}; S.prisonDays[p.id] = 0; }
      await say([['-', `${p.name}被押在軍中。隨時可以從選單的「俘虜」再去勸他；每在客棧住一晚，他的心就軟一點。`]], { fast: true }); return;
    }
  }
}
const R0 = (arr, id) => arr[hash(id) % arr.length];
// a tiger, or the black-wind spirit soldiers of the sorcerers
const BEAST = new Map();
function beastImg(p, frame) {
  const key = p.beast + frame; if (BEAST.has(key)) return BEAST.get(key);
  const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d');
  const px = (x, y, col, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  if (p.beast === 'tiger') { px(4, 14, '#e8a030', 22, 9); px(22, 10, '#e8a030', 9, 9); px(25, 13, '#1a1a1a'); px(29, 14, '#c83a2a', 2, 1); for (let x = 6; x < 24; x += 4) px(x, 14, '#2a1a0a', 2, 9); px(23, 10, '#2a1a0a', 1, 4); px(2, 13 + frame, '#e8a030', 3, 2); for (const x of [6, 10, 18, 22]) px(x, 23, '#c88a20', 3, 6 - ((x / 4 + frame) % 2)); px(8, 18, '#f8f0e0', 14, 3); }
  else { g.globalAlpha = 0.85; px(8, 4, '#3a2a4a', 16, 24); px(10, 2, '#c8a040', 12, 4); px(12, 8, '#e84a3a', 2, 2); px(18, 8, '#e84a3a', 2, 2); for (let i = 0; i < 6; i++) px(4 + i * 4, 26 + ((i + frame) % 2) * 2, '#2a1a3a', 3, 4); }
  BEAST.set(key, c); return c;
}
// tactic effects over a target
function drawFx(g, f, t) {
  const k = (t - f.t0) / f.life, [x, y] = f.at, R = rng(Math.floor(f.t0 * 1000));
  g.save();
  if (f.kind === 'fire') for (let i = 0; i < 12; i++) { const a = R() * 6.28, r = R() * 14, h = 6 + R() * 12; g.fillStyle = ['#ff4a1a', '#ff8a2a', '#ffd040'][i % 3]; g.globalAlpha = 1 - k; g.fillRect(x + Math.cos(a) * r, y + 10 - k * h - R() * 8, 3, 5); }
  if (f.kind === 'water') { g.globalAlpha = 1 - k; g.fillStyle = '#4a8ae8'; g.fillRect(x - 24 + k * 10, y + 4, 48, 14 * Math.sin(k * Math.PI)); g.fillStyle = '#a8d8ff'; for (let i = 0; i < 8; i++) g.fillRect(x - 22 + i * 6, y + 2 - Math.sin(k * 6 + i) * 3, 3, 2); }
  if (f.kind === 'rock') for (let i = 0; i < 6; i++) { g.fillStyle = '#7a7468'; g.fillRect(x - 15 + i * 6, y - 40 + k * 60 + (i % 2) * 6, 6, 5); g.fillStyle = '#5a544a'; g.fillRect(x - 15 + i * 6, y - 36 + k * 60 + (i % 2) * 6, 6, 1); }
  if (f.kind === 'thunder') { g.globalAlpha = k < 0.5 ? 1 : 1 - (k - 0.5) * 2; g.strokeStyle = '#fffbd0'; g.lineWidth = 2; g.beginPath(); let yy = y - 60, xx = x; g.moveTo(xx, yy); while (yy < y + 14) { yy += 8; xx += (R() - 0.5) * 10; g.lineTo(xx, yy); } g.stroke(); g.fillStyle = 'rgba(255,255,220,0.25)'; g.fillRect(0, 0, 384, 150); }
  if (f.kind === 'wind') { g.globalAlpha = 1 - k; g.strokeStyle = '#d8d0b0'; g.lineWidth = 1; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(x, y + 6, 6 + i * 3 + k * 10, k * 8 + i, k * 8 + i + 2.4); g.stroke(); } }
  if (f.kind === 'arrow') { g.fillStyle = '#e8e0c8'; for (let i = 0; i < 10; i++) g.fillRect(x - 20 + i * 4 + k * 8, y - 40 + k * 50 + (i % 3) * 4, 1, 6); }
  if (f.kind === 'heal' || f.kind === 'revive' || f.kind === 'buff') { g.globalAlpha = 1 - k; g.fillStyle = f.kind === 'buff' ? '#ffe070' : '#9aff9a'; for (let i = 0; i < 10; i++) g.fillRect(x - 14 + R() * 28, y + 20 - k * 30 - R() * 10, 2, 2); }
  if (f.kind === 'debuff') { g.globalAlpha = 1 - k; g.strokeStyle = '#c89aff'; g.beginPath(); g.arc(x, y - 6, 8 + k * 4, 0, 6.28); g.stroke(); }
  g.restore();
}
