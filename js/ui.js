// The windows, in the style of the old console RPGs: blue boxes with a white border. Dialogue with a portrait and
// words that appear as they are spoken, menus you move through with the arrows (or tap), notices, and the input
// that drives them all: keys, mouse and the touch pad, read as up / down / left / right / ok / cancel.
import { painted } from './face.js';
import { who } from './rules.js';
import { esc, wait } from './util.js';

export const $ = (id) => document.getElementById(id);
export const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
// ---------------------------------------------------------------- input
const listeners = [];
export const input = { held: new Set(), on(fn) { listeners.push(fn); return () => { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); }; } };
const KEYS = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Enter: 'ok', KeyZ: 'ok', Space: 'ok', Escape: 'cancel', KeyX: 'cancel', Backspace: 'cancel', KeyM: 'menu', Tab: 'menu' };
export function press(a) { const top = listeners[listeners.length - 1]; if (top) top(a); }
addEventListener('keydown', (e) => { const a = KEYS[e.code]; if (!a) return; if (e.target.tagName === 'INPUT') return; e.preventDefault(); input.held.add(a); if (!e.repeat || ['up', 'down', 'left', 'right'].includes(a)) press(a); });
addEventListener('keyup', (e) => { const a = KEYS[e.code]; if (a) input.held.delete(a); });
// ---------------------------------------------------------------- dialogue
const face = (id) => { const p = who(id); if (!p || p.beast || p.grunt && !p.look) return null; const c = painted(p), img = el('canvas'); img.width = c.width; img.height = c.height; img.getContext('2d').drawImage(c, 0, 0); return img; };
export const faceOf = face;
export async function say(lines, opt = {}) {
  const box = el('div', 'win talk'), root = $('ui'); root.appendChild(box);
  try {
    for (const ln of lines) {
      const [who0, text] = ln, p = who0 !== '-' ? who(who0) : null;
      box.innerHTML = ''; box.classList.toggle('narr', who0 === '-');
      if (p) { const f = face(who0); if (f) { f.className = 'tface'; box.appendChild(f); } }
      const body = el('div', 'tbody'); if (who0 !== '-') body.appendChild(el('div', 'tname', p ? `${esc(p.name)}${p.nick ? `<small>「${esc(p.nick)}」</small>` : ''}` : esc(who0))); const tx = el('div', 'ttext'); body.appendChild(tx); box.appendChild(body);
      const arrow = el('div', 'tmore', '▼'); box.appendChild(arrow);
      // type it out; ok shows it all at once, then ok again goes on
      let shown = 0, full = false; const chars = [...text];
      const done = new Promise((res) => {
        const off = input.on((a) => { if (a !== 'ok' && a !== 'cancel') return; if (!full) { shown = chars.length; } else { off(); box.onclick = null; res(); } });
        box.onclick = () => press('ok');
      });
      while (shown < chars.length) { shown = Math.min(chars.length, shown + 1); tx.textContent = chars.slice(0, shown).join(''); await wait(opt.fast ? 4 : 22); }
      tx.textContent = text; full = true; arrow.classList.add('on');
      await done;
    }
  } finally { box.remove(); }
}
// ---------------------------------------------------------------- menus
// items: [{ label, hint?, off?, value? }] → the chosen index (or value), or null on cancel
export function menu(items, opt = {}) {
  return new Promise((res) => {
    const w = el('div', 'win menu ' + (opt.cls || '')); if (opt.title) w.appendChild(el('div', 'mtitle', esc(opt.title)));
    const list = el('div', 'mlist'); w.appendChild(list); if (opt.foot) w.appendChild(el('div', 'mfoot', opt.foot));
    let k = Math.max(0, Math.min(items.length - 1, opt.start || 0)); while (items[k] && items[k].off && k < items.length - 1) k++;
    const rows = items.map((it, i) => { const r = el('div', 'mrow' + (it.off ? ' off' : ''), `<span class="ml">${it.html || esc(it.label)}</span>${it.hint != null ? `<span class="mh">${it.htmlHint || esc(it.hint)}</span>` : ''}`); r.onclick = (e) => { e.stopPropagation(); if (it.off) return; k = i; draw(); finish(i); }; r.onmouseenter = () => { k = i; draw(); }; list.appendChild(r); return r; });
    const draw = () => { rows.forEach((r, i) => r.classList.toggle('on', i === k)); rows[k]?.scrollIntoView({ block: 'nearest' }); opt.onMove?.(items[k], k); };
    const finish = (i) => { off(); w.remove(); res(i == null ? null : items[i].value !== undefined ? items[i].value : i); };
    const off = input.on((a) => {
      if (a === 'up' || a === 'down') { const d = a === 'up' ? -1 : 1; for (let n = 0; n < items.length; n++) { k = (k + d + items.length) % items.length; if (!items[k].off) break; } draw(); }
      if ((a === 'left' || a === 'right') && opt.onSide) opt.onSide(a, items[k], k, (nk) => { k = nk; draw(); });
      if (a === 'ok' && items[k] && !items[k].off) finish(k);
      if ((a === 'cancel' || a === 'menu') && !opt.noCancel) finish(null);
    });
    (opt.parent || $('ui')).appendChild(w); if (opt.place) opt.place(w); draw();
  });
}
export async function confirm(text, yes = '是', no = '否') { const r = await menu([{ label: yes }, { label: no }], { title: text, cls: 'small' }); return r === 0; }
export function toast(text, ms = 2200) { const t = el('div', 'toast', esc(text)); $('ui').appendChild(t); setTimeout(() => t.remove(), ms); }
// a panel that stays until cancelled (status screens and the like)
export function panel(html, cls = '') { return new Promise((res) => { const w = el('div', 'win panel ' + cls, html); $('ui').appendChild(w); const off = input.on((a) => { if (a === 'cancel' || a === 'ok' || a === 'menu') { off(); w.remove(); res(); } }); w.onclick = () => press('cancel'); }); }
export function banner(text, ms = 1300) { const b = el('div', 'banner', esc(text)); $('ui').appendChild(b); return wait(ms).then(() => b.remove()); }
