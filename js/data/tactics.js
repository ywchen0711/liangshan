// 計策: tactics, paid for from the army's shared pool of strategy points. Strategists and sorcerers learn them as
// their wit and rank grow; some generals have their own (Wei Dingguo's fire, Shan Tinggui's water, Gongsun Sheng's
// thunder rites, An Daoquan's healing); military classics teach the rest.
// kind: dmg (hurts soldiers), heal, revive, buff, debuff, escape · to: one / all (enemies), ally / allies / self
// el: fire, water, rock, thunder, wind, arrow — some grounds help (fire in forests, water by rivers, rock in hills)
export const TACTICS = {
  火計: { kind: 'dmg', to: 'one', el: 'fire', pow: 1.0, sp: 4, zhi: 40, lv: 1, desc: '放火燒敵一隊' },
  烈火: { kind: 'dmg', to: 'one', el: 'fire', pow: 1.8, sp: 9, zhi: 60, lv: 14, desc: '大火燒敵一隊' },
  火龍陣: { kind: 'dmg', to: 'all', el: 'fire', pow: 1.1, sp: 16, zhi: 72, lv: 24, desc: '火龍捲過敵軍全體' },
  火燒連營: { kind: 'dmg', to: 'all', el: 'fire', pow: 1.9, sp: 30, zhi: 88, lv: 40, desc: '連營皆焚，敵軍全體大損' },
  水計: { kind: 'dmg', to: 'one', el: 'water', pow: 1.0, sp: 4, zhi: 42, lv: 3, desc: '決水淹敵一隊' },
  洪水: { kind: 'dmg', to: 'all', el: 'water', pow: 1.0, sp: 15, zhi: 70, lv: 22, desc: '洪水沖垮敵軍全體' },
  水淹七軍: { kind: 'dmg', to: 'all', el: 'water', pow: 1.8, sp: 28, zhi: 86, lv: 38, desc: '大水淹沒敵軍全體' },
  落石: { kind: 'dmg', to: 'one', el: 'rock', pow: 1.1, sp: 5, zhi: 45, lv: 5, desc: '山上滾石砸敵一隊' },
  山崩: { kind: 'dmg', to: 'all', el: 'rock', pow: 1.3, sp: 20, zhi: 78, lv: 30, desc: '山崩地裂，敵軍全體受損' },
  亂箭: { kind: 'dmg', to: 'all', el: 'arrow', pow: 0.6, sp: 8, zhi: 30, lv: 6, troop: '弓', desc: '萬箭齊下，敵軍全體小損' },
  萬箭齊發: { kind: 'dmg', to: 'all', el: 'arrow', pow: 1.2, sp: 18, zhi: 50, lv: 26, troop: '弓', desc: '箭如雨下，敵軍全體受損' },
  雷擊: { kind: 'dmg', to: 'one', el: 'thunder', pow: 1.6, sp: 8, zhi: 70, lv: 8, troop: '術', desc: '召雷劈敵一隊' },
  五雷正法: { kind: 'dmg', to: 'all', el: 'thunder', pow: 1.6, sp: 26, zhi: 90, lv: 30, troop: '術', desc: '五雷轟頂，敵軍全體大損' },
  狂風: { kind: 'dmg', to: 'one', el: 'wind', pow: 1.2, sp: 6, zhi: 60, lv: 6, troop: '術', desc: '狂風捲走敵一隊' },
  飛沙走石: { kind: 'dmg', to: 'all', el: 'wind', pow: 1.1, sp: 18, zhi: 76, lv: 20, troop: '術', desc: '飛沙走石，敵軍全體受損，命中下降' },
  救護: { kind: 'heal', to: 'ally', pow: 1.0, sp: 4, zhi: 36, lv: 1, desc: '救治一隊傷兵' },
  大救護: { kind: 'heal', to: 'ally', pow: 2.2, sp: 10, zhi: 60, lv: 16, desc: '大量救治一隊' },
  全軍救護: { kind: 'heal', to: 'allies', pow: 1.2, sp: 20, zhi: 74, lv: 26, desc: '救治我軍全體' },
  回天: { kind: 'revive', to: 'ally', pow: 0.5, sp: 24, zhi: 80, lv: 30, desc: '使潰散的一隊重整旗鼓' },
  鼓舞: { kind: 'buff', to: 'allies', stat: 'atk', pow: 1.25, sp: 8, zhi: 46, lv: 8, desc: '擂鼓助威，我軍攻擊上升' },
  堅守: { kind: 'buff', to: 'allies', stat: 'def', pow: 1.3, sp: 8, zhi: 44, lv: 10, desc: '堅壁清野，我軍防禦上升' },
  神行: { kind: 'buff', to: 'allies', stat: 'spd', pow: 1.4, sp: 6, zhi: 50, lv: 6, desc: '神行之法，我軍速度上升' },
  混亂: { kind: 'debuff', to: 'one', status: 'confuse', pow: 0.7, sp: 6, zhi: 55, lv: 9, desc: '使敵一隊陷入混亂' },
  離間: { kind: 'debuff', to: 'one', status: 'stun', pow: 0.55, sp: 10, zhi: 70, lv: 18, desc: '離間敵將，使其一回合不能行動' },
  迷霧: { kind: 'debuff', to: 'all', status: 'blind', pow: 0.65, sp: 12, zhi: 62, lv: 14, desc: '佈下迷霧，敵軍命中下降' },
  疑兵: { kind: 'debuff', to: 'all', status: 'weak', pow: 0.7, sp: 12, zhi: 58, lv: 12, desc: '多設疑兵，敵軍攻擊下降' },
  埋伏: { kind: 'dmg', to: 'one', el: 'rock', pow: 2.4, sp: 14, zhi: 80, lv: 28, desc: '十面埋伏，重創敵一隊' },
  遁走: { kind: 'escape', to: 'self', pow: 1, sp: 6, zhi: 30, lv: 1, desc: '全軍撤離戰場' },
  妖術: { kind: 'dmg', to: 'all', el: 'wind', pow: 1.3, sp: 16, zhi: 99, lv: 99, desc: '黑氣沖天，神兵怪獸撲向敵軍' },
};
// signatures: generals who know a tactic from the start, whatever their wit
export const SIGNATURE = {
  吳用: ['火計', '混亂', '鼓舞', '埋伏'], 公孫勝: ['雷擊', '五雷正法', '狂風', '飛沙走石'], 朱武: ['落石', '疑兵', '堅守'], 魏定國: ['火計', '烈火', '火龍陣'], 單廷珪: ['水計', '洪水'],
  凌振: ['火計', '烈火', '山崩'], 樊瑞: ['狂風', '飛沙走石'], 安道全: ['救護', '大救護', '全軍救護', '回天'], 皇甫端: ['救護', '大救護'], 戴宗: ['神行', '遁走'], 時遷: ['混亂', '遁走'],
  宋江: ['鼓舞', '救護'], 蔣敬: ['疑兵', '堅守'], 高廉: ['妖術', '雷擊', '飛沙走石'], 喬道清: ['妖術', '五雷正法'], 包道乙: ['妖術', '雷擊'], 鄭彪: ['妖術', '狂風'], 馬靈: ['火計', '狂風'],
  李助: ['雷擊', '狂風'], 賀重寶: ['迷霧', '狂風'], 聞煥章: ['離間', '疑兵', '水計'], 花榮: ['亂箭'], 張清: ['亂箭'], 龐萬春: ['亂箭', '萬箭齊發'], 李俊: ['水計'], 張順: ['水計'], 阮小二: ['水計'],
  燕青: ['亂箭', '混亂'], 柴進: ['鼓舞'], 盧俊義: ['鼓舞'], 岳飛: ['鼓舞', '堅守', '埋伏'], 宗澤: ['堅守', '疑兵'], 种師道: ['堅守', '埋伏'], 韓世忠: ['鼓舞', '水計'], 梁紅玉: ['鼓舞', '亂箭'],
};
// what a general knows at a level: their own, then whatever their wit and kind of troops allow
export function tacticsOf(p, lv, books = []) {
  const out = new Set(SIGNATURE[p.id] || []);
  const think = p.troop === '謀' || p.troop === '術', wit = p.zhi + (think ? 6 : 0);
  for (const [id, t] of Object.entries(TACTICS)) {
    if (t.lv > 90) continue;
    if (t.troop && t.troop !== p.troop) continue;
    if (wit >= t.zhi && lv >= t.lv && (think || t.zhi <= 50 || wit >= t.zhi + 20)) out.add(id);
  }
  for (const b of books) out.add(b);
  return [...out];
}
