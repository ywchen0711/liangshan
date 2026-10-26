// A thousand pieces of equipment in five slots: weapons, armour, helmets, horses and keepsakes. Most come in a ladder
// of materials from wood to the finest steel; a few dozen are the famous ones of the novel (Lin Chong's eighteen-foot
// snake spear, Lu Zhishen's iron staff, Guan Sheng's green dragon blade, Xu Ning's goose-feather armour, the Jade
// Lion that shines in the night). A general fights better with their favourite kind of weapon, and best of all with
// their own.
export const SLOTS = { weapon: '武器', armor: '鎧甲', helm: '頭盔', horse: '坐騎', acc: '飾品' };
export const WTYPE = { 刀: '大刀', 槍: '長槍', 矛: '蛇矛', 戟: '畫戟', 劍: '寶劍', 斧: '大斧', 鞭: '鋼鞭', 錘: '銅錘', 棍: '棍棒', 杖: '禪杖', 戒: '戒刀', 弓: '弓', 叉: '鋼叉', 鏢: '暗器', 扇: '羽扇', 拂: '拂塵', 砲: '火砲', 鏈: '飛錘' };
export const GEAR = {};
const add = (g) => { g.id = g.id || 'q' + Object.keys(GEAR).length; GEAR[g.id] = g; return g; };
const price = (power, k = 1) => Math.round((20 + power * power * 1.6) * k / 5) * 5;

// ---- weapons: eighteen kinds, twenty materials each
const MAT = ['木', '竹', '青銅', '黃銅', '生鐵', '熟鐵', '精鐵', '鑌鐵', '百煉', '寒鋼', '烏金', '紫金', '赤霄', '玄鐵', '龍紋', '虎魄', '雷光', '七星', '九天', '混元'];
const WNAME = { 刀: '刀', 槍: '槍', 矛: '矛', 戟: '戟', 劍: '劍', 斧: '斧', 鞭: '鞭', 錘: '錘', 棍: '棍', 杖: '禪杖', 戒: '戒刀', 弓: '弓', 叉: '叉', 鏢: '飛鏢', 扇: '扇', 拂: '拂塵', 砲: '火砲', 鏈: '流星錘' };
// how each kind fights: attack, and what else it lends (wit for fans and whisks, speed for light blades)
const WKIND = { 刀: [1, {}], 槍: [1, { su: 0.1 }], 矛: [1.05, {}], 戟: [1.08, { su: -0.05 }], 劍: [0.9, { zhi: 0.15, su: 0.1 }], 斧: [1.15, { su: -0.1 }], 鞭: [1, { tong: 0.1 }], 錘: [1.12, { su: -0.08 }], 棍: [0.92, { tong: 0.12 }], 杖: [1.1, { tong: 0.08 }], 戒: [0.95, { su: 0.15 }], 弓: [0.95, { su: 0.1 }], 叉: [0.98, {}], 鏢: [0.85, { su: 0.25 }], 扇: [0.45, { zhi: 0.45 }], 拂: [0.5, { zhi: 0.4 }], 砲: [1.05, { zhi: 0.15 }], 鏈: [1, { su: 0.05 }] };
const SPECIAL_MAT = { 扇: ['蒲', '竹', '絹', '白羽', '鶴羽', '孔雀', '鳳羽', '星宿', '紫雲', '玄機', '八卦', '太極', '天機', '玲瓏', '雲錦', '烏木', '玉骨', '金絲', '天罡', '神算'], 拂: ['馬尾', '麈尾', '白雲', '青絲', '銀絲', '鶴尾', '紫霞', '流雲', '太乙', '玄門', '靈寶', '上清', '太清', '玉清', '三清', '五雷', '六丁', '九霄', '混元', '無極'], 弓: ['木', '竹', '角', '鐵胎', '鵲畫', '雕翎', '虎筋', '犀角', '烏號', '落雁', '射雕', '穿雲', '貫日', '神臂', '震天', '靈寶', '七星', '九天', '霹靂', '養由'], 砲: ['竹', '銅', '鐵', '火銃', '子母', '震天', '轟雷', '風火', '霹靂', '連珠', '金輪', '飛天', '火龍', '神機', '赤焰', '玄武', '朱雀', '九頭', '天雷', '滅虜'] };
for (const t of Object.keys(WNAME)) MAT.forEach((m0, i) => {
  const [mult, extra] = WKIND[t], m = (SPECIAL_MAT[t] || MAT)[i], power = Math.round((6 + i * 7.2 + i * i * 0.18) * mult);
  const g = { slot: 'weapon', type: t, tier: i, name: m + WNAME[t], atk: power, price: price(power) };
  for (const [k, f] of Object.entries(extra)) g[k] = Math.round((6 + i * 4) * f * (k === 'zhi' && f > 0.3 ? 2.2 : 1));
  if (t === '扇' || t === '拂') g.atk = Math.round(power * 0.6);
  add(g);
});
// ---- the famous weapons: owner, name, kind, attack and extras
const FAMOUS = [
  ['林沖', '丈八蛇矛', '矛', 200, { su: 12 }], ['魯智深', '水磨鑌鐵禪杖', '杖', 205, { tong: 10 }], ['關勝', '青龍偃月刀', '刀', 210, { tong: 12 }], ['武松', '雪花鑌鐵戒刀', '戒', 190, { su: 16 }],
  ['楊志', '祖傳寶刀', '刀', 195, { wu: 6 }], ['呼延灼', '水磨八稜鋼鞭', '鞭', 198, { tong: 10 }], ['秦明', '狼牙棒', '棍', 196, { wu: 6 }], ['李逵', '兩把板斧', '斧', 200, { su: 6 }],
  ['花榮', '小李廣神弓', '弓', 192, { su: 14 }], ['張清', '飛石錦袋', '鏢', 180, { su: 22 }], ['盧俊義', '點鋼槍', '槍', 208, { su: 10, tong: 8 }], ['董平', '雙槍', '槍', 190, { su: 16 }],
  ['徐寧', '鉤鐮槍', '槍', 188, { tong: 14 }], ['索超', '金蘸斧', '斧', 192, {}], ['史進', '三尖兩刃刀', '刀', 180, { su: 8 }], ['朱仝', '偃月刀', '刀', 182, { tong: 8 }],
  ['吳用', '銅鏈羽扇', '扇', 60, { zhi: 26 }], ['公孫勝', '松紋古定劍', '劍', 120, { zhi: 28 }], ['樊瑞', '混世流星劍', '劍', 110, { zhi: 18 }], ['扈三娘', '日月雙刀', '刀', 180, { su: 18 }],
  ['孫立', '虎眼竹節鞭', '鞭', 184, { tong: 8 }], ['孫新', '竹節鋼鞭', '鞭', 160, {}], ['李應', '渾鐵點鋼槍', '槍', 176, { su: 8 }], ['燕青', '川弩', '弓', 170, { su: 16 }],
  ['史文恭', '方天畫戟', '戟', 200, {}], ['兀顏光', '方天戟', '戟', 206, { tong: 10 }], ['方傑', '鎮南畫戟', '戟', 194, {}], ['鄧元覺', '渾鐵禪杖', '杖', 196, {}],
  ['石寶', '劈風刀', '刀', 196, { su: 8 }], ['龐萬春', '養由基弓', '弓', 188, { su: 14 }], ['岳飛', '瀝泉槍', '槍', 214, { tong: 14, zhi: 8 }], ['韓世忠', '大刀', '刀', 196, { tong: 10 }],
  ['周侗', '鐵臂長棍', '棍', 190, { tong: 12 }], ['欒廷玉', '鐵棒', '棍', 188, { tong: 10 }], ['凌振', '風火砲', '砲', 198, { zhi: 14 }], ['湯隆', '金錢豹子錘', '錘', 168, {}],
  ['張順', '渾鐵分水刀', '刀', 166, { su: 14 }], ['阮小七', '撓鉤鋼叉', '叉', 170, { su: 10 }], ['郭盛', '白纓方天戟', '戟', 172, {}], ['呂方', '赤纓方天戟', '戟', 172, {}],
  ['高廉', '太阿寶劍', '劍', 120, { zhi: 24 }], ['包道乙', '玄天混元劍', '劍', 130, { zhi: 26 }],
];
for (const [owner, name, type, atk, extra] of FAMOUS) add({ id: 'f_' + owner, slot: 'weapon', type, tier: 20, name, atk, owner, famous: 1, price: price(atk, 1.4), ...extra });

// ---- armour, helmets: kinds, each in a ladder of quality
const QUAL = ['破舊', '粗製', '尋常', '堅實', '精製', '上等', '百鍊', '名匠', '宮造', '御製', '神工', '天造'];
const ARMOR = [['布衫', 0.5, { su: 4 }], ['皮甲', 0.7, { su: 2 }], ['藤甲', 0.8, { su: 3 }], ['鎖子甲', 1, {}], ['魚鱗甲', 1.05, {}], ['鐵甲', 1.1, { su: -3 }], ['連環甲', 1.15, { tong: 3 }], ['細鱗甲', 1.1, { su: 2 }], ['明光鎧', 1.2, { tong: 4 }], ['山文甲', 1.25, { su: -2 }], ['戰袍', 0.75, { tong: 4 }], ['道袍', 0.6, { zhi: 6 }]];
for (const [nm, k, extra] of ARMOR) QUAL.forEach((q, i) => { const d = Math.round((5 + i * 9 + i * i * 0.5) * k); const g = { slot: 'armor', tier: i, name: q + nm, def: d, price: price(d, 1.05) }; for (const [s, v] of Object.entries(extra)) g[s] = Math.round(v * (1 + i * 0.4)); add(g); });
const HELM = [['頭巾', 0.4, { su: 3 }], ['皮盔', 0.7, {}], ['鐵盔', 1, {}], ['兜鍪', 1.1, {}], ['鳳翅盔', 1.15, { tong: 3 }], ['獅子盔', 1.2, { wu: 2 }], ['綸巾', 0.4, { zhi: 6 }], ['道冠', 0.4, { zhi: 7 }], ['抹額', 0.6, { su: 4 }]];
for (const [nm, k, extra] of HELM) QUAL.forEach((q, i) => { const d = Math.round((3 + i * 5 + i * i * 0.3) * k); const g = { slot: 'helm', tier: i, name: q + nm, def: d, price: price(d, 0.9) }; for (const [s, v] of Object.entries(extra)) g[s] = Math.round(v * (1 + i * 0.35)); add(g); });
for (const [id, slot, name, def, extra] of [
  ['f_徐寧甲', 'armor', '賽唐猊雁翎甲', 150, { su: 12, tong: 8 }], ['f_金甲', 'armor', '黃金鎖子甲', 140, { tong: 10 }], ['f_連環', 'armor', '連環鐵甲', 145, { tong: 12, su: -6 }], ['f_犀甲', 'armor', '犀皮甲', 120, { su: 8 }],
  ['f_蓑衣', 'armor', '梁山蓑衣', 70, { su: 14 }], ['f_戰袍', 'armor', '百花戰袍', 110, { tong: 14 }], ['f_道袍', 'armor', '九宮八卦袍', 90, { zhi: 22 }], ['f_袈裟', 'armor', '錦襴袈裟', 100, { tong: 10, zhi: 8 }],
  ['f_御甲', 'armor', '御賜金甲', 165, { tong: 14 }], ['f_遼甲', 'armor', '遼國狼皮甲', 130, { su: 6, wu: 4 }], ['f_方甲', 'armor', '江南水犀甲', 135, { su: 8 }], ['f_岳甲', 'armor', '精忠戰甲', 170, { tong: 16, zhi: 6 }],
  ['f_紫金冠', 'helm', '紫金束髮冠', 80, { su: 10 }], ['f_鳳翅', 'helm', '鳳翅金盔', 95, { tong: 10 }], ['f_獅盔', 'helm', '獅子吞頭盔', 100, { wu: 6 }], ['f_綸巾', 'helm', '諸葛綸巾', 50, { zhi: 24 }],
  ['f_道冠', 'helm', '紫陽道冠', 50, { zhi: 22 }], ['f_狼帽', 'helm', '貂皮狼帽', 80, { su: 8 }], ['f_戴宗', 'helm', '神行甲馬', 40, { su: 30 }], ['f_笠', 'helm', '范陽氈笠', 60, { su: 12 }],
]) add({ id, slot, tier: 12, name, def, famous: 1, price: price(def, 1.4), ...extra });

// ---- horses: coat and breed
const COAT = ['黃驃', '青驄', '烏騅', '白龍', '棗騮', '紫騮', '花驄', '赤炭', '黑風', '銀鬃', '胭脂', '桃花'], BREED = [['凡馬', 0], ['河曲馬', 1], ['蒙古馬', 2], ['遼東馬', 3], ['西涼馬', 4], ['大宛馬', 5], ['汗血馬', 6], ['天馬', 7]];
for (const [b, i] of BREED) COAT.forEach((c, j) => { const sp = 6 + i * 9 + (j % 3); add({ slot: 'horse', tier: i, name: c + b.replace('馬', '') + '馬', su: sp, tong: Math.round(i * 2.5), def: Math.round(i * 3), price: price(sp, 1.2) }); });
for (const [id, name, su, tong, extra] of [
  ['f_照夜', '照夜玉獅子', 90, 22, {}], ['f_踢雪', '踢雪烏騅', 86, 24, {}], ['f_赤兔', '赤兔馬', 92, 20, { wu: 4 }], ['f_卷毛', '雪白卷毛馬', 84, 18, {}], ['f_千里', '千里龍駒', 88, 16, {}],
  ['f_金毛', '金毛獅子馬', 82, 20, {}], ['f_青鬃', '青鬃馬', 76, 14, {}], ['f_胭脂', '胭脂寶馬', 80, 16, {}], ['f_的盧', '的盧', 85, 12, { su: 4 }], ['f_烏雲', '烏雲蓋雪', 84, 20, {}],
  ['f_大宛', '大宛良駒', 78, 18, {}], ['f_追風', '追風駒', 88, 12, {}], ['f_遼主', '遼主御馬', 86, 22, {}], ['f_金龍', '金龍駒', 90, 20, {}],
]) add({ id, slot: 'horse', tier: 9, name, su, tong, def: 20, famous: 1, price: price(su, 1.5), ...extra });

// ---- keepsakes: rings, pendants, belts, cloaks, tokens, charms…
const ACC = [['護身符', { zhi: 1 }], ['玉佩', { zhi: 1, tong: 0.5 }], ['腰帶', { tong: 1 }], ['披風', { su: 1 }], ['令牌', { tong: 1.2 }], ['指環', { wu: 0.8 }], ['護腕', { wu: 0.6, su: 0.4 }], ['念珠', { zhi: 0.8, tong: 0.4 }], ['香囊', { su: 0.6, zhi: 0.4 }], ['虎符', { tong: 1.4 }]];
const AQ = ['草編', '木刻', '銅製', '銀製', '鍍金', '黃金', '白玉', '翡翠', '瑪瑙', '珊瑚', '琥珀', '水晶', '夜明', '龍鳳', '麒麟', '天罡', '地煞', '星宿'];
for (const [nm, stats] of ACC) AQ.forEach((q, i) => { const g = { slot: 'acc', tier: i, name: q + nm, price: price(4 + i * 4, 1.3) }; for (const [s, k] of Object.entries(stats)) g[s] = Math.max(1, Math.round((2 + i * 1.6) * k)); add(g); });
for (const [id, name, extra] of [
  ['f_天書', '九天玄女天書', { zhi: 26, tong: 12 }], ['f_令', '替天行道令', { tong: 24 }], ['f_旗', '杏黃大旗', { tong: 18, wu: 6 }], ['f_玉麒麟', '玉麒麟佩', { wu: 10, tong: 10 }], ['f_鐵笛', '鐵笛', { su: 14, zhi: 6 }],
  ['f_紅巾', '燕青紅巾', { su: 16 }], ['f_孝帶', '武松孝帶', { wu: 12 }], ['f_扇墜', '智多星扇墜', { zhi: 18 }], ['f_金印', '宋公明金印', { tong: 20, zhi: 8 }], ['f_虎皮', '景陽岡虎皮', { wu: 14, tong: 6 }],
  ['f_生辰', '生辰綱金珠', { tong: 10, su: 10 }], ['f_丹書', '丹書鐵券', { tong: 16, zhi: 10 }], ['f_佛珠', '五台山念珠', { zhi: 12, tong: 12 }], ['f_腰牌', '禁軍腰牌', { wu: 8, tong: 8 }], ['f_瑪瑙', '方臘聖公印', { zhi: 14, tong: 14 }],
  ['f_遼印', '大遼兵符', { tong: 22 }], ['f_神行', '神行符', { su: 26 }], ['f_定魂', '定魂珠', { zhi: 20 }], ['f_金錢', '金錢豹皮', { su: 12, wu: 6 }], ['f_石碣', '石碣天文', { zhi: 16, tong: 16, wu: 6 }],
]) add({ id, slot: 'acc', tier: 18, name, famous: 1, price: 3000 + Object.values(extra).reduce((a, b) => a + b, 0) * 150, ...extra });

// ---- make it exactly a thousand: sturdy campaign gear for the long wars, sold in the last cities
const ROUND = [['征遼', 'armor', 'def'], ['征遼', 'helm', 'def'], ['平南', 'armor', 'def'], ['平南', 'helm', 'def'], ['梁山', 'acc', 'tong'], ['聚義', 'acc', 'wu']];
for (let i = 0; Object.keys(GEAR).length < 1000; i++) { const [pre, slot, stat] = ROUND[i % ROUND.length], tier = 8 + (Math.floor(i / ROUND.length) % 5), v = slot === 'acc' ? 8 + tier * 1.5 : slot === 'armor' ? 60 + tier * 9 : 34 + tier * 5;
  const kind = slot === 'armor' ? ['戰甲', '鐵衣', '征袍', '寒甲', '鎖甲'][Math.floor(i / ROUND.length) % 5] : slot === 'helm' ? ['戰盔', '鐵兜', '盔纓', '寒盔', '鳳盔'][Math.floor(i / ROUND.length) % 5] : ['勳章', '義旗', '腰牌', '戰符', '金牌'][Math.floor(i / ROUND.length) % 5];
  add({ slot, tier, name: pre + kind + (i >= ROUND.length * 5 ? '·' + '甲乙丙丁戊己庚辛壬癸'[Math.floor(i / (ROUND.length * 5)) % 10] : ''), [stat]: Math.round(v), price: price(v, 1.1), campaign: 1 });
}
export const GEAR_LIST = Object.values(GEAR);
