// Five hundred things to carry: medicines for wounded soldiers, rations and wine for the army, charms that cast a
// tactic once, military classics that teach one for good, tonics that make a general stronger for ever, gifts that
// win a captured general over, the local goods of each town to sell on, and the keys of the story.
// use: field (on the road), battle, both · kind: heal, healAll, revive, sp, cure, buff, cast, book, stat, gift, trade,
// key, repel, escape
import { TACTICS } from './tactics.js';
export const ITEMS = {};
const add = (id, o) => { ITEMS[id] = { id, ...o }; };

// medicines, for one company or the whole army, by strength
const HEAL1 = [['草藥', 120, 10], ['傷藥', 300, 30], ['金創藥', 700, 80], ['上品金創藥', 1500, 180], ['續骨膏', 3000, 400], ['九轉還魂丹', 6000, 900], ['太醫秘藥', 10000, 1600], ['神醫妙藥', 20000, 3000]];
HEAL1.forEach(([n, v, p], i) => add('h' + i, { name: n, kind: 'heal', use: 'both', v, price: p, tier: i, desc: `救治一隊 ${v} 名傷兵` }));
const HEALA = [['犒軍酒肉', 200, 60], ['大鍋飯', 500, 160], ['慶功宴', 1200, 420], ['聚義大宴', 3000, 1100], ['御賜酒宴', 7000, 2800], ['天子犒賞', 14000, 6000]];
HEALA.forEach(([n, v, p], i) => add('ha' + i, { name: n, kind: 'healAll', use: 'both', v, price: p, tier: i, desc: `我軍全體各救治 ${v} 名` }));
for (const [n, k, p, i] of [['還魂草', 0.25, 300, 0], ['回生丹', 0.5, 900, 1], ['起死回生丹', 1, 3000, 2], ['靈芝仙丹', 1, 8000, 3]]) add('rv' + i, { name: n, kind: 'revive', use: 'both', v: k, price: p, tier: i, desc: `使潰散的一隊重整，兵力回復 ${Math.round(k * 100)}%` });
for (const [n, v, p, i] of [['清茶', 10, 40, 0], ['龍井', 25, 120, 1], ['兵法筆記', 50, 300, 2], ['錦囊', 100, 700, 3], ['天機錦囊', 999, 2000, 4]]) add('sp' + i, { name: n, kind: 'sp', use: 'both', v, price: p, tier: i, desc: v > 900 ? '策略值全滿' : `策略值回復 ${v}` });
for (const [n, st, p] of [['醒神湯', 'confuse', 60], ['定心丸', 'stun', 90], ['明目散', 'blind', 60], ['壯骨酒', 'weak', 80], ['萬應丹', 'all', 300]]) add('c_' + st, { name: n, kind: 'cure', use: 'battle', status: st, price: p, desc: st === 'all' ? '解除一隊所有異狀' : '解除一隊的異狀' });
// battle tonics: for one fight
for (const [n, stat, k, p, to] of [['燒刀子', 'atk', 1.2, 120, 'ally'], ['三碗不過岡', 'atk', 1.4, 400, 'ally'], ['戰鼓', 'atk', 1.2, 600, 'allies'], ['帥旗', 'def', 1.25, 600, 'allies'], ['鐵盾', 'def', 1.4, 300, 'ally'], ['甲馬', 'spd', 1.5, 250, 'ally'], ['神行甲馬', 'spd', 1.4, 800, 'allies']]) add('b_' + n, { name: n, kind: 'buff', use: 'battle', stat, v: k, to, price: p, desc: `${to === 'allies' ? '我軍全體' : '一隊'}${{ atk: '攻擊', def: '防禦', spd: '速度' }[stat]}上升` });
// charms that cast a tactic once (three grades for each), and the classics that teach one
const GRADE = [['符', 1, 1], ['寶符', 1.4, 2.6], ['神符', 1.9, 6]];
for (const [tid, t] of Object.entries(TACTICS)) {
  if (t.kind === 'escape' || tid === '妖術') continue;
  GRADE.forEach(([g, pw, pk], i) => add(`s_${tid}_${i}`, { name: tid + g, kind: 'cast', use: 'battle', tactic: tid, pow: pw, price: Math.round((t.sp * 40 + 60) * pk / 10) * 10, tier: i, desc: `施展${tid}${i ? `（威力 ×${pw}）` : ''}：${t.desc}` }));
}
add('esc0', { name: '煙霧彈', kind: 'escape', use: 'battle', price: 150, desc: '放煙脫離戰場（頭目戰無效）' });
add('esc1', { name: '遁甲符', kind: 'escape', use: 'battle', price: 500, desc: '必定脫離戰場（頭目戰無效）' });
const BOOKS = [['孫子兵法', '埋伏'], ['吳子', '堅守'], ['六韜', '鼓舞'], ['三略', '疑兵'], ['尉繚子', '離間'], ['司馬法', '迷霧'], ['太公兵法', '火龍陣'], ['孫臏兵法', '萬箭齊發'], ['武經總要', '火燒連營'], ['李衛公問對', '山崩'], ['將苑', '混亂'], ['水經注', '洪水'], ['河防通議', '水淹七軍'],
  ['奇門遁甲', '遁走'], ['六丁六甲書', '狂風'], ['五雷天書', '五雷正法'], ['太乙金華經', '雷擊'], ['青囊書', '全軍救護'], ['黃帝內經', '大救護'], ['傷寒論', '救護'], ['天書殘卷', '回天'], ['火攻篇', '烈火'], ['地形篇', '落石'], ['九地篇', '飛沙走石'], ['神行法', '神行'], ['射經', '亂箭'], ['水戰要略', '水計'], ['火攻要略', '火計']];
BOOKS.forEach(([n, tid], i) => add('bk' + i, { name: '《' + n + '》', kind: 'book', use: 'field', tactic: tid, price: 800 + TACTICS[tid].sp * 160, desc: `讀了之後學會「${tid}」` }));
// tonics that raise a general's abilities for good
const TONIC = { wu: [['虎骨酒', 1], ['熊膽', 1], ['豹胎丸', 2], ['龍筋', 3], ['麒麟血', 4]], zhi: [['龍眼', 1], ['人參', 1], ['靈芝', 2], ['雪蓮', 3], ['仙桃', 4]], tong: [['鹿茸', 1], ['何首烏', 1], ['肉蓯蓉', 2], ['千年參王', 3], ['帥印', 4]], su: [['羚羊角', 1], ['燕窩', 1], ['飛燕丹', 2], ['神行丹', 3], ['追風丹', 4]], troops: [['軍糧', 1], ['壯丁名冊', 2], ['募兵令', 3], ['徵兵詔', 4], ['萬人敵', 5]] };
const SN = { wu: '武力', zhi: '智力', tong: '統率', su: '速度', troops: '兵力上限' };
for (const [stat, list] of Object.entries(TONIC)) list.forEach(([n, v], i) => add(`t_${stat}${i}`, { name: n, kind: 'stat', use: 'field', stat, v: stat === 'troops' ? v * 60 : v, price: [400, 900, 2500, 6000, 14000][i], tier: i, desc: `一位將領的${SN[stat]}永久 +${stat === 'troops' ? v * 60 : v}` }));
// gifts: a general you have beaten is likelier to join if you give them something they like
const GIFTS = [['女兒紅', 'wine'], ['竹葉青', 'wine'], ['杜康', 'wine'], ['汾酒', 'wine'], ['紹興黃酒', 'wine'], ['梨花白', 'wine'], ['葡萄美酒', 'wine'], ['御酒', 'wine'], ['透瓶香', 'wine'], ['出門倒', 'wine'],
  ['和闐玉璧', 'jade'], ['羊脂玉鐲', 'jade'], ['翡翠如意', 'jade'], ['白玉觀音', 'jade'], ['玉帶', 'jade'], ['夜明珠', 'jade'], ['珊瑚樹', 'jade'], ['瑪瑙杯', 'jade'],
  ['王羲之字帖', 'art'], ['吳道子畫卷', 'art'], ['顏真卿碑拓', 'art'], ['蘇東坡墨寶', 'art'], ['米芾山水', 'art'], ['端硯', 'art'], ['徽墨', 'art'], ['宣紙', 'art'],
  ['蜀錦', 'silk'], ['杭綢', 'silk'], ['雲錦', 'silk'], ['湘繡', 'silk'], ['錦袍', 'silk'],
  ['名劍譜', 'arms'], ['寶刀圖', 'arms'], ['鎧甲圖', 'arms'], ['良弓', 'arms'], ['兵器譜', 'arms'],
  ['金錠', 'gold'], ['銀錠', 'gold'], ['珍珠', 'gold'], ['交子', 'gold'], ['金葉子', 'gold']];
GIFTS.forEach(([n, like], i) => add('g' + i, { name: n, kind: 'gift', use: 'field', like, v: 10 + (i % 5) * 5, price: 150 + (i % 10) * 120 + (like === 'jade' || like === 'art' ? 400 : 0), desc: '送給被俘的將領，提高招降的機會' }));
// what each place is known for: bought cheap at home, sold dear elsewhere
const LOCAL = {
  陽穀縣: ['炊餅', '景陽岡酒', '虎皮'], 鄆城縣: ['鄆城棗', '黃河鯉魚'], 東京: ['汴梁燒餅', '樊樓點心', '相國寺香燭', '御街花燈'], 大名府: ['大名綢緞', '香油'], 滄州: ['滄州鐵器', '鹽', '鴨梨'],
  江州: ['潯陽江魚', '廬山雲霧茶', '琵琶'], 孟州: ['孟州藥材', '饅頭'], 青州: ['青州蜜桃', '紅絲硯'], 華州: ['華山松子', '秦椒'], 渭州: ['渭州羊肉', '西涼馬鞍'], 薊州: ['薊州栗子', '燒酒'],
  高唐州: ['高唐棉布'], 東平府: ['東平阿膠'], 東昌府: ['東昌雕版'], 濟州: ['濟州蒲席', '魯錦'], 登州: ['登州海鹽', '海參'], 杭州: ['西湖龍井', '杭扇', '絲綢'], 蘇州: ['蘇繡', '碧螺春'], 潤州: ['潤州醋', '金山茶'],
  睦州: ['睦州竹器'], 歙州: ['歙硯', '徽墨錠'], 燕京: ['燕京皮貨', '遼東人參'], 檀州: ['檀州皮帽'], 幽州: ['幽州駿馬鞍'], 建康府: ['雨花石', '鹽水鴨'], 延安府: ['延安小米', '羊皮襖'],
};
let li = 0; for (const [town, list] of Object.entries(LOCAL)) for (const n of list) add('l' + li++, { name: n, kind: 'trade', use: 'none', town, price: 40 + (li * 37) % 260, desc: `${town}的名產，帶到別處能賣個好價錢` });
// clearing the road: incense that keeps fights away, guides that show the way
for (const [n, v, p, i] of [['驅邪香', 120, 60, 0], ['避兵符', 300, 160, 1], ['太平令', 800, 420, 2]]) add('rp' + i, { name: n, kind: 'repel', use: 'field', v, price: p, desc: `${v} 步之內不會遇到敵人` });
// the keys of the story (cannot be sold)
const KEYS = [['生辰綱', '梁中書送給蔡太師的十萬貫金珠寶貝'], ['金翠蓮的信', '渭州賣唱女子的哭訴'], ['柴進的薦書', '小旋風柴進寫給梁山的推薦信'], ['投名狀', '入夥梁山要交的投名狀'], ['羅真人的符', '二仙山羅真人親手畫的破妖符'],
  ['鉤鐮槍圖', '破連環馬的鉤鐮槍法圖譜'], ['雁翎甲', '徐寧家傳的寶甲（交給時遷就能引徐寧上山）'], ['石碣天書', '一百單八人的名字刻在上面'], ['招安詔書', '朝廷的招安詔書'], ['天子御酒', '天子賞賜的御酒'] ,
  ['太乙混天象陣圖', '兀顏光的大陣圖'], ['方臘的龍袍', '幫源洞找到的龍袍'], ['宋江的反詩', '潯陽樓上的題詩'], ['晁天王的箭', '射死晁蓋的那支毒箭'], ['盧員外的信', '寫給盧俊義的藏頭詩'],
  ['渡船令', '可以搭船橫渡長江'], ['破陣兵書', '九天玄女授予宋江的天書'], ['梁山地圖', '梁山泊的水路圖'], ['張順的魂', '湧金門下張順的忠魂'], ['替天行道旗', '梁山的杏黃大旗']];
KEYS.forEach(([n, d], i) => add('k' + i, { name: n, kind: 'key', use: 'none', price: 0, desc: d }));
// fill to five hundred with the ordinary goods of the road, so towns have something to sell and fights something to drop
const GOODS = ['乾糧', '麻繩', '火摺子', '油燈', '草鞋', '斗笠', '蓑衣', '雨傘', '水囊', '鐵鍋', '柴刀', '麻袋', '銅錢串', '算盤', '毛筆', '硯台', '紙扇', '香爐', '佛像', '銅鏡', '梳子', '胭脂', '繡花鞋', '荷包', '棉被', '燈籠', '魚竿', '漁網', '竹簍', '扁擔'];
const GRADE2 = ['', '上等', '精緻', '名貴'];
for (let i = 0; Object.keys(ITEMS).length < 500; i++) { const g = GOODS[i % GOODS.length], q = GRADE2[Math.floor(i / GOODS.length) % GRADE2.length], name = (q + g) + (i >= GOODS.length * GRADE2.length ? '（' + '甲乙丙丁戊己庚辛'[Math.floor(i / (GOODS.length * GRADE2.length)) % 8] + '）' : '');
  add('m' + i, { name, kind: 'trade', use: 'none', price: Math.round((10 + (i % GOODS.length) * 6) * (1 + GRADE2.indexOf(q) * 1.8)), desc: '尋常的物品，可以賣錢' }); }
export const ITEM_LIST = Object.values(ITEMS);
