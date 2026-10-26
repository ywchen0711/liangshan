// Everyone in the game: the hundred and eight stars of Liangshan, the people of the novel around them (officials,
// bandits, the Zhu and Zeng clans, the Liao, Tian Hu, Wang Qing and Fang La), generals of the real Song, Liao and
// Jin, and enough invented officers and outlaws to make five hundred. Each has four abilities — 武 strength in a
// fight, 智 wit (tactics and resisting them), 統 command (how many soldiers they can lead), 速 speed — a kind of
// troop, a favourite weapon, a look for their portrait, and where and how they can be met.
import { rng, hash } from '../util.js';

// troop kinds: 步 foot, 騎 horse, 弓 archers, 水 marines, 謀 strategists, 術 sorcerers
export const TROOP = { 步: '步兵', 騎: '騎兵', 弓: '弓兵', 水: '水軍', 謀: '謀士', 術: '術士' };
// sides
export const SIDE = { ls: '梁山', song: '宋廷', bandit: '綠林', zhu: '祝家莊', zeng: '曾頭市', liao: '大遼', tian: '田虎', wang: '王慶', fang: '方臘', jin: '大金', xia: '西夏', wander: '江湖' };

// the hundred and eight: rank|star|nickname|name|武|智|troop|weapon|look (face, headwear, beard, hair colour, f for women)
// faces: y fair, w pale, r red, d dark, b black, g blue-marked; headwear: scarf, helm, monk, taoist, scholar, official,
// hair (loose), band, female, fur, turban, crown; beards: none, stub, mous, goatee, long, full
const STARS = `
1|天魁星|呼保義|宋江|62|82|步|劍|d,scarf,mous
2|天罡星|玉麒麟|盧俊義|98|70|騎|槍|w,helm,goatee
3|天機星|智多星|吳用|30|98|謀|扇|w,scholar,goatee
4|天閒星|入雲龍|公孫勝|50|95|術|劍|y,taoist,long
5|天勇星|大刀|關勝|95|75|騎|刀|r,helm,long
6|天雄星|豹子頭|林沖|96|72|騎|矛|w,helm,full
7|天猛星|霹靂火|秦明|92|40|騎|棍|r,helm,full
8|天威星|雙鞭|呼延灼|92|60|騎|鞭|d,helm,full
9|天英星|小李廣|花榮|88|70|弓|弓|w,scarf,none
10|天貴星|小旋風|柴進|60|75|騎|劍|w,scarf,mous
11|天富星|撲天鵰|李應|82|65|騎|槍|y,helm,goatee
12|天滿星|美髯公|朱仝|85|68|騎|刀|r,scarf,long
13|天孤星|花和尚|魯智深|95|45|步|杖|y,monk,full
14|天傷星|行者|武松|95|55|步|戒|y,hair,stub
15|天立星|雙槍將|董平|90|55|騎|槍|w,helm,none
16|天捷星|沒羽箭|張清|82|60|弓|鏢|w,helm,none
17|天暗星|青面獸|楊志|90|62|騎|刀|g,helm,stub
18|天佑星|金槍手|徐寧|86|64|騎|槍|w,helm,mous
19|天空星|急先鋒|索超|87|40|騎|斧|y,helm,full
20|天速星|神行太保|戴宗|55|70|步|劍|y,scarf,goatee
21|天異星|赤髮鬼|劉唐|80|40|步|刀|y,hair,full,red
22|天殺星|黑旋風|李逵|92|15|步|斧|b,hair,full
23|天微星|九紋龍|史進|84|50|騎|刀|w,band,none
24|天究星|沒遮攔|穆弘|80|45|騎|槍|y,scarf,stub
25|天退星|插翅虎|雷橫|80|45|步|刀|d,scarf,full
26|天壽星|混江龍|李俊|82|70|水|槍|y,scarf,stub
27|天劍星|立地太歲|阮小二|78|45|水|叉|d,band,stub
28|天平星|船火兒|張橫|78|40|水|刀|y,band,full
29|天罪星|短命二郎|阮小五|78|40|水|叉|d,band,stub
30|天損星|浪裡白條|張順|76|50|水|刀|w,band,none
31|天敗星|活閻羅|阮小七|80|38|水|叉|d,band,none
32|天牢星|病關索|楊雄|80|45|步|刀|y,scarf,mous
33|天慧星|拚命三郎|石秀|82|55|步|刀|w,scarf,none
34|天暴星|兩頭蛇|解珍|78|40|弓|叉|d,scarf,stub
35|天哭星|雙尾蠍|解寶|78|38|弓|叉|d,scarf,stub
36|天巧星|浪子|燕青|78|75|弓|弓|w,scarf,none
37|地魁星|神機軍師|朱武|45|90|謀|劍|w,scholar,goatee
38|地煞星|鎮三山|黃信|78|50|騎|劍|y,helm,mous
39|地勇星|病尉遲|孫立|85|55|騎|鞭|y,helm,full
40|地傑星|醜郡馬|宣贊|76|40|騎|刀|d,helm,full
41|地雄星|井木犴|郝思文|74|45|騎|槍|y,helm,mous
42|地威星|百勝將|韓滔|74|50|騎|槍|y,helm,mous
43|地英星|天目將|彭玘|74|48|騎|刀|y,helm,mous
44|地奇星|聖水將|單廷珪|72|60|水|槍|d,helm,stub
45|地猛星|神火將|魏定國|72|60|騎|刀|r,helm,stub
46|地文星|聖手書生|蕭讓|20|78|謀|扇|w,scholar,goatee
47|地正星|鐵面孔目|裴宣|50|72|步|劍|w,official,goatee
48|地闊星|摩雲金翅|歐鵬|72|45|步|槍|y,scarf,stub
49|地闔星|火眼狻猊|鄧飛|74|40|步|鏈|y,scarf,stub
50|地強星|錦毛虎|燕順|74|40|步|刀|y,hair,full,red
51|地暗星|錦豹子|楊林|70|45|步|槍|y,scarf,mous
52|地軸星|轟天雷|凌振|55|70|弓|砲|y,helm,mous
53|地會星|神算子|蔣敬|30|80|謀|扇|w,scholar,goatee
54|地佐星|小溫侯|呂方|74|45|騎|戟|w,helm,none
55|地佑星|賽仁貴|郭盛|74|45|騎|戟|w,helm,none
56|地靈星|神醫|安道全|10|80|謀|扇|y,scholar,long
57|地獸星|紫髯伯|皇甫端|20|70|謀|扇|y,scarf,full,purple
58|地微星|矮腳虎|王英|65|30|騎|槍|y,scarf,stub
59|地慧星|一丈青|扈三娘|82|55|騎|刀|w,female,none
60|地暴星|喪門神|鮑旭|74|25|步|劍|d,hair,full
61|地默星|混世魔王|樊瑞|60|80|術|劍|y,taoist,stub
62|地猖星|毛頭星|孔明|68|35|步|槍|y,scarf,none
63|地狂星|獨火星|孔亮|66|35|步|槍|y,scarf,none
64|地飛星|八臂哪吒|項充|70|30|步|鏢|d,hair,full
65|地走星|飛天大聖|李袞|70|30|步|鏢|d,hair,full
66|地巧星|玉臂匠|金大堅|20|65|謀|扇|w,scholar,goatee
67|地明星|鐵笛仙|馬麟|70|50|騎|劍|w,scarf,none
68|地進星|出洞蛟|童威|66|40|水|叉|y,band,stub
69|地退星|翻江蜃|童猛|66|38|水|叉|y,band,stub
70|地滿星|玉幡竿|孟康|55|50|水|槍|w,scarf,none
71|地遂星|通臂猿|侯健|40|50|步|劍|y,scarf,stub
72|地周星|跳澗虎|陳達|70|30|騎|槍|y,scarf,full
73|地隱星|白花蛇|楊春|68|40|騎|刀|y,scarf,mous
74|地異星|白面郎君|鄭天壽|66|45|步|劍|w,scarf,none
75|地理星|九尾龜|陶宗旺|65|30|步|棍|d,scarf,stub
76|地俊星|鐵扇子|宋清|40|50|步|劍|d,scarf,none
77|地樂星|鐵叫子|樂和|50|55|步|槍|w,scarf,none
78|地捷星|花項虎|龔旺|66|35|騎|槍|y,scarf,full
79|地速星|中箭虎|丁得孫|66|35|騎|叉|y,scarf,full
80|地鎮星|小遮攔|穆春|64|35|步|槍|y,scarf,stub
81|地羈星|操刀鬼|曹正|60|40|步|刀|y,scarf,stub
82|地魔星|雲裡金剛|宋萬|66|30|步|槍|y,scarf,full
83|地妖星|摸著天|杜遷|62|30|步|槍|y,scarf,full
84|地幽星|病大蟲|薛永|60|45|步|棍|y,scarf,stub
85|地伏星|金眼彪|施恩|58|50|步|槍|w,scarf,none
86|地僻星|打虎將|李忠|64|40|步|槍|y,scarf,mous
87|地空星|小霸王|周通|64|35|騎|槍|y,scarf,stub
88|地孤星|金錢豹子|湯隆|66|45|步|錘|d,scarf,stub
89|地全星|鬼臉兒|杜興|62|40|步|刀|d,scarf,full
90|地短星|出林龍|鄒淵|66|35|步|刀|y,scarf,full
91|地角星|獨角龍|鄒潤|66|35|步|刀|y,scarf,stub
92|地囚星|旱地忽律|朱貴|50|55|步|刀|y,scarf,stub
93|地藏星|笑面虎|朱富|48|55|步|刀|y,scarf,stub
94|地平星|鐵臂膊|蔡福|60|40|步|刀|y,scarf,stub
95|地損星|一枝花|蔡慶|58|40|步|棍|y,scarf,none
96|地奴星|催命判官|李立|58|35|步|刀|y,scarf,stub
97|地察星|青眼虎|李雲|66|45|步|刀|g,official,stub
98|地惡星|沒面目|焦挺|64|25|步|棍|y,scarf,none
99|地醜星|石將軍|石勇|64|35|步|棍|d,scarf,full
100|地數星|小尉遲|孫新|72|45|騎|鞭|y,scarf,mous
101|地陰星|母大蟲|顧大嫂|66|45|步|刀|y,female,none
102|地刑星|菜園子|張青|62|45|步|棍|y,scarf,stub
103|地壯星|母夜叉|孫二娘|64|50|步|刀|w,female,none
104|地劣星|活閃婆|王定六|55|35|水|刀|y,scarf,none
105|地健星|險道神|郁保四|60|20|步|棍|d,hair,full
106|地耗星|白日鼠|白勝|40|40|步|刀|y,scarf,stub
107|地賊星|鼓上蚤|時遷|50|65|步|刀|y,scarf,none
108|地狗星|金毛犬|段景住|45|45|騎|刀|y,hair,stub,gold`;

// everyone else with a name: name|nickname|side|武|智|troop|weapon|look|level|region|how they join
// join: story (only through the story), capture (beaten, they may be talked round), tavern (waiting in an inn),
// never (enemies to the end)
const NAMED = `
晁蓋|托塔天王|ls|84|60|騎|刀|y,scarf,full|6|東溪村|story
王倫|白衣秀士|bandit|45|50|步|劍|w,scholar,goatee|8|梁山|never
王進|八十萬禁軍教頭|wander|88|60|騎|棍|y,helm,mous|30|延安府|tavern
周侗|鐵臂膀|wander|92|72|步|棍|y,scarf,long,white|45|東京|tavern
高俅|殿帥府太尉|song|50|60|騎|劍|w,official,goatee|40|東京|never
蔡京|太師|song|10|85|謀|扇|w,official,long,white|45|東京|never
童貫|樞密使|song|62|60|騎|劍|w,official,none|42|東京|never
楊戩|太尉|song|20|60|謀|扇|w,official,none|40|東京|never
梁世傑|梁中書|song|30|55|謀|扇|w,official,goatee|22|大名府|never
高衙內|花花太歲|song|25|20|步|劍|w,official,none|6|東京|never
陸謙|陸虞候|song|60|40|步|刀|w,scarf,mous|8|滄州|never
富安|乾鳥頭|song|40|30|步|刀|y,scarf,stub|7|滄州|never
董超|押解公人|song|46|20|步|棍|y,scarf,stub|6|野豬林|capture
薛霸|押解公人|song|48|18|步|棍|y,scarf,full|6|野豬林|capture
鄭屠|鎮關西|bandit|66|20|步|刀|y,scarf,full|3|渭州|never
崔道成|生鐵佛|bandit|70|30|步|杖|y,monk,full|5|瓦罐寺|never
丘小乙|飛天夜叉|bandit|68|32|步|刀|y,taoist,stub|5|瓦罐寺|never
鄧龍|二龍山寨主|bandit|62|30|步|刀|y,scarf,full|14|二龍山|never
牛二|沒毛大蟲|bandit|50|10|步|刀|d,hair,stub|8|東京|never
洪教頭|柴府教師|wander|62|22|步|棍|y,scarf,goatee|7|柴家莊|capture
蔣忠|蔣門神|bandit|76|25|步|刀|y,scarf,full|14|快活林|never
張蒙方|張都監|song|50|50|騎|劍|w,official,goatee|15|孟州|never
張團練|團練使|song|62|35|騎|刀|y,helm,full|15|孟州|never
西門慶|西門大官人|bandit|62|50|步|劍|w,scarf,none|12|陽穀縣|never
李鬼|剪徑賊|bandit|40|12|步|斧|b,hair,stub|10|沂嶺|capture
劉高|清風寨知寨|song|40|45|步|劍|w,official,goatee|16|清風寨|never
黃文炳|通判|song|30|70|謀|扇|w,official,goatee|20|無為軍|never
蔡得章|蔡九知府|song|20|40|謀|扇|w,official,none|20|江州|never
何濤|緝捕使臣|song|52|40|步|刀|y,scarf,stub|9|石碣村|capture
黃安|團練使|song|70|40|水|槍|y,helm,mous|10|石碣村|capture
祝朝奉|祝太公|zhu|20|50|謀|扇|y,scholar,long,white|24|祝家莊|never
祝龍|祝大郎|zhu|72|40|騎|槍|y,helm,stub|23|祝家莊|capture
祝虎|祝二郎|zhu|70|36|騎|刀|y,helm,stub|23|祝家莊|capture
祝彪|祝三郎|zhu|78|40|騎|槍|w,helm,none|24|祝家莊|never
欒廷玉|鐵棒|zhu|88|62|騎|棍|y,helm,full|25|祝家莊|capture
扈成|飛天虎|zhu|70|45|騎|刀|w,scarf,none|23|扈家莊|capture
李吉|獵戶|zhu|40|20|弓|弓|y,scarf,stub|20|祝家莊|capture
高廉|高唐知府|song|55|86|術|劍|w,official,goatee|27|高唐州|never
殷天錫|殷直閣|song|40|20|步|劍|w,official,none|25|高唐州|never
曾弄|曾長官|zeng|30|52|謀|扇|y,fur,long,white|33|曾頭市|never
曾塗|曾家長子|zeng|78|40|騎|槍|y,fur,stub|32|曾頭市|capture
曾密|曾家次子|zeng|74|40|騎|刀|y,fur,stub|32|曾頭市|capture
曾索|曾家三子|zeng|72|40|騎|叉|y,fur,stub|32|曾頭市|capture
曾魁|曾家四子|zeng|72|40|騎|槍|y,fur,stub|32|曾頭市|capture
曾升|曾家五子|zeng|70|40|騎|刀|y,fur,none|32|曾頭市|capture
史文恭|曾頭市教師|zeng|93|70|騎|槍|y,helm,full|35|曾頭市|never
蘇定|曾頭市副教師|zeng|76|45|騎|槍|y,helm,mous|33|曾頭市|capture
李固|盧府管家|song|30|40|步|劍|y,scarf,goatee|30|大名府|never
慕容彥達|青州知府|song|30|50|謀|扇|w,official,goatee|28|青州|never
程萬里|東平太守|song|20|40|謀|扇|w,official,goatee|36|東平府|never
張叔夜|濟州太守|song|72|82|騎|劍|w,official,long|44|濟州|tavern
宿元景|殿前太尉|song|10|82|謀|扇|w,official,long,white|40|東京|never
聞煥章|東京謀士|song|20|86|謀|扇|w,scholar,long|40|東京|tavern
王煥|河南節度使|song|85|50|騎|槍|y,helm,long,white|40|梁山|capture
徐京|上黨節度使|song|78|45|騎|刀|y,helm,full|40|梁山|capture
楊溫|中山節度使|song|78|45|騎|槍|y,helm,mous|40|梁山|capture
李從吉|安平節度使|song|76|45|騎|刀|y,helm,mous|40|梁山|capture
項元鎮|琅琊節度使|song|76|45|騎|槍|y,helm,mous|40|梁山|capture
張開|清河節度使|song|76|45|騎|刀|y,helm,mous|40|梁山|capture
王文德|雲中節度使|song|78|45|騎|槍|y,helm,full|40|梁山|capture
梅展|潁州節度使|song|76|45|騎|刀|y,helm,mous|40|梁山|capture
韓存保|御營將軍|song|80|50|騎|戟|y,helm,full|41|梁山|capture
荊忠|江夏節度使|song|74|40|騎|刀|y,helm,full|40|梁山|capture
劉夢龍|水軍統制|song|72|50|水|槍|y,helm,mous|41|梁山|capture
牛邦喜|水軍副統制|song|70|40|水|叉|y,helm,stub|40|梁山|capture
黨世英|御營統制|song|72|40|騎|刀|y,helm,stub|40|梁山|capture
黨世雄|御營統制|song|72|40|騎|刀|y,helm,stub|40|梁山|capture
丘岳|御林軍統制|song|76|40|騎|槍|y,helm,full|41|梁山|capture
周昂|御林軍統制|song|76|40|騎|斧|y,helm,full|41|梁山|capture
耶律延禧|大遼天祚帝|liao|20|40|謀|扇|w,crown,goatee|55|燕京|never
兀顏光|大遼都統軍|liao|94|82|騎|戟|y,fur,long|56|燕京|capture
兀顏延壽|都統軍之子|liao|82|60|騎|槍|w,fur,none|50|燕京|capture
耶律得重|檀州守將|liao|74|50|騎|刀|y,fur,full|46|檀州|capture
耶律國珍|檀州副將|liao|80|45|騎|槍|y,fur,stub|46|檀州|capture
耶律國寶|檀州副將|liao|80|45|騎|槍|y,fur,stub|46|檀州|capture
阿里奇|遼國上將|liao|84|45|騎|槍|y,fur,full|47|密雲|capture
賀重寶|霸州守將|liao|76|72|術|刀|y,fur,full|50|霸州|capture
瓊妖納延|遼國大將|liao|80|45|騎|槍|y,fur,full|50|幽州|capture
寇鎮遠|遼國大將|liao|72|45|騎|刀|y,fur,stub|48|幽州|capture
天山勇|遼國神箭|liao|78|45|弓|弓|y,fur,stub|49|幽州|capture
咬兒惟康|遼國大將|liao|74|40|騎|斧|y,fur,full|48|檀州|capture
楚明玉|遼國大將|liao|70|42|騎|槍|y,fur,stub|48|檀州|capture
曹明濟|遼國大將|liao|66|40|騎|刀|y,fur,stub|46|檀州|capture
蕭奉先|遼國樞密使|liao|40|66|謀|扇|w,fur,goatee|50|燕京|capture
耶律大石|遼國林牙|liao|85|86|騎|劍|w,fur,goatee|55|燕京|capture
田虎|晉王|tian|60|50|騎|劍|y,crown,full|50|威勝州|never
鈕文忠|田虎大將|tian|78|45|騎|刀|y,helm,full|48|威勝州|capture
孫安|田虎大將|tian|86|55|騎|劍|y,helm,mous|50|威勝州|capture
喬道清|幻魔君|tian|55|88|術|劍|y,taoist,long|52|威勝州|capture
瓊英|瓊矢鏃|tian|82|62|弓|鏢|w,female,none|50|威勝州|capture
卞祥|田虎先鋒|tian|80|40|騎|斧|d,helm,full|48|威勝州|capture
山士奇|田虎大將|tian|78|40|騎|鞭|y,helm,full|48|威勝州|capture
馬靈|神駒子|tian|70|70|術|錘|y,taoist,stub|50|威勝州|capture
王慶|楚王|wang|70|50|騎|劍|w,crown,mous|50|南豐|never
杜壆|王慶大將|wang|86|50|騎|矛|d,helm,full|48|南豐|capture
段三娘|王慶之妻|wang|70|30|騎|刀|y,female,none|46|南豐|capture
酆泰|王慶大將|wang|80|35|騎|錘|d,helm,full|47|南豐|capture
袁朗|王慶大將|wang|82|45|騎|鞭|r,helm,full|48|南豐|capture
李助|金劍先生|wang|60|80|術|劍|y,taoist,goatee|48|南豐|capture
方臘|聖公|fang|72|72|騎|劍|y,turban,goatee|68|幫源洞|never
方天定|南安王|fang|70|50|騎|劍|w,turban,none|60|杭州|capture
方貌|方臘之弟|fang|68|45|騎|刀|y,turban,mous|58|蘇州|capture
方傑|方臘之姪|fang|88|60|騎|戟|w,turban,none|64|睦州|capture
方垕|方臘之弟|fang|60|50|騎|刀|y,turban,goatee|62|睦州|capture
鄧元覺|寶光如來|fang|90|40|步|杖|y,monk,full|60|杭州|capture
石寶|南離大將軍|fang|90|55|騎|刀|d,turban,full|61|杭州|capture
厲天閏|鎮國大將軍|fang|86|45|騎|槍|y,turban,full|60|杭州|capture
司行方|護國大將軍|fang|80|40|騎|刀|y,turban,full|58|杭州|capture
王寅|兵部尚書|fang|84|62|騎|槍|y,turban,mous|62|歙州|capture
龐萬春|小養由基|fang|82|50|弓|弓|y,turban,stub|62|歙州|capture
包道乙|靈應天師|fang|60|88|術|劍|y,taoist,long|63|睦州|capture
鄭彪|鄭魔君|fang|80|72|術|槍|y,turban,stub|63|睦州|capture
婁敏中|方臘丞相|fang|30|76|謀|扇|w,scholar,goatee|62|幫源洞|capture
呂師囊|潤州守將|fang|76|50|騎|槍|y,turban,full|54|潤州|capture
杜微|方臘大將|fang|70|50|步|鏢|d,turban,stub|62|幫源洞|capture
夏侯成|方臘大將|fang|72|40|騎|刀|y,turban,stub|60|睦州|capture
衛忠|方臘大將|fang|72|40|騎|槍|y,turban,stub|56|蘇州|capture
張韜|方臘大將|fang|70|40|騎|刀|y,turban,stub|56|蘇州|capture
吳值|方臘大將|fang|72|40|騎|槍|y,turban,stub|58|杭州|capture
黃愛|方臘大將|fang|72|40|騎|刀|y,turban,stub|58|杭州|capture
韓世忠|潑韓五|song|90|72|騎|槍|y,helm,full|58|杭州|tavern
梁紅玉|擊鼓將軍|song|76|78|弓|弓|w,female,none|58|潤州|tavern
岳飛|鵬舉|song|94|86|騎|槍|w,helm,mous|60|相州|tavern
宗澤|汝霖|song|60|86|謀|扇|w,official,long,white|56|東京|tavern
种師道|老种經略相公|song|72|86|騎|劍|w,helm,long,white|55|延安府|tavern
种師中|小种經略相公|song|82|70|騎|槍|y,helm,long|54|延安府|tavern
劉延慶|宋軍都統制|song|72|50|騎|刀|y,helm,full|52|雄州|capture
王稟|太原守將|song|82|62|騎|刀|y,helm,full|54|太原|tavern
辛興宗|宋軍統制|song|74|50|騎|槍|y,helm,mous|56|杭州|capture
楊惟忠|宋軍統制|song|78|55|騎|刀|y,helm,mous|56|杭州|capture
王淵|宋軍統制|song|78|56|騎|槍|y,helm,mous|56|杭州|tavern
劉光世|宋軍統制|song|72|62|騎|刀|w,helm,mous|56|延安府|tavern
張俊|宋軍統制|song|78|60|騎|槍|y,helm,full|56|延安府|tavern
吳玠|涇原將|song|84|76|騎|槍|y,helm,full|58|延安府|tavern
吳璘|涇原將|song|82|72|騎|槍|y,helm,mous|56|延安府|tavern
劉錡|隴右將|song|84|80|騎|槍|w,helm,mous|58|渭州|tavern
李綱|兵部侍郎|song|40|86|謀|扇|w,official,goatee|56|東京|tavern
完顏阿骨打|大金太祖|jin|92|82|騎|刀|y,fur,full|62|會寧府|never
完顏宗望|斡離不|jin|88|72|騎|槍|y,fur,full|58|燕京|capture
完顏宗翰|粘罕|jin|86|82|騎|刀|y,fur,full|58|燕京|capture
完顏宗弼|兀朮|jin|90|70|騎|斧|y,fur,full|58|燕京|capture
完顏婁室|大金名將|jin|86|60|騎|槍|y,fur,full|56|燕京|capture
李乾順|大夏崇宗|xia|60|72|騎|劍|y,crown,goatee|55|興慶府|never
察哥|西夏晉王|xia|84|66|騎|刀|y,fur,full|52|興慶府|capture`;

// invented names for the rank and file of each side
const SUR = '王李張劉陳楊黃趙周吳徐孫胡朱高林何郭馬羅梁宋鄭謝韓唐馮于董蕭程曹袁鄧許傅沈曾彭呂蘇盧蔣蔡賈丁魏薛葉閻余潘杜戴夏鍾汪田任姜范方石姚譚廖鄒熊金陸郝孔白崔康毛邱秦江史顧侯邵孟龍萬段雷錢湯尹黎易常武喬賀賴龔文';
const GIVEN = '大勇彪虎龍豹雄剛猛威武忠義信仁德貴福寶成林山海天元青雲飛鵬鶴翔順興旺昌盛平安定國邦傑英豪俊超遠達通明光亮輝振鎮遠安和祥瑞慶永長壽松柏鐵石金銀玉珍';
const NICK_A = '鐵金銀銅玉赤青黑白紫雲火雷風雪山水草花錦毒鬼神小大飛撲出跳翻';
const NICK_B = ['臂熊', '面虎', '頭蛇', '爪鷹', '尾狐', '翅鵬', '背狼', '眼雕', '角牛', '鱗龍', '甲龜', '毛獅', '牙豹', '嘴鴉', '頸鶴', '蹄馬', '鞭將', '槍手', '刀客', '羅漢', '金剛', '夜叉', '判官', '太保', '先鋒', '將軍', '大王', '郎君', '書生', '和尚', '道人', '娘子'];
const LIAO_SUR = ['耶律', '蕭', '兀顏', '阿里', '咬兒', '撒八', '移剌', '奚', '韓', '高'], LIAO_GIVEN = ['得勝', '國忠', '延壽', '撒剌', '撻懶', '迭里', '鐸剌', '烈', '斡魯', '阿保', '胡睹', '石', '撒葛', '思溫'];
const JIN_GIVEN = ['宗雄', '宗輔', '撒離喝', '銀術可', '活女', '拔離速', '突合速', '阿里刮', '烏珠', '訛里朵'];

export const PEOPLE = {};
export const STAR_IDS = [];
const look = (s) => { const [face, hat, beard, hair, extra] = s.split(','); return { face, hat, beard, hair: hair === 'f' ? undefined : hair, female: hat === 'female' }; };
// command and speed from the other two and the kind of troops, with a nudge of chance that is the same every time
function derive(p, R) {
  const t = p.troop;
  p.tong = Math.round(Math.min(99, p.wu * 0.55 + p.zhi * 0.35 + 8 + R.int(-6, 8) + (t === '騎' ? 4 : 0)));
  p.su = Math.round(Math.min(99, p.wu * 0.4 + p.zhi * 0.2 + 22 + R.int(-8, 10) + (t === '騎' ? 10 : t === '弓' ? 6 : t === '謀' ? -4 : 0)));
}
for (const ln of STARS.trim().split('\n')) {
  const [rank, star, nick, name, wu, zhi, troop, weapon, lk] = ln.split('|'), R = rng(hash(name));
  const p = { id: name, name, nick, star, rank: +rank, side: 'ls', wu: +wu, zhi: +zhi, troop, weapon, look: look(lk), join: 'story' };
  derive(p, R); PEOPLE[name] = p; STAR_IDS.push(name);
}
for (const ln of NAMED.trim().split('\n')) {
  const [name, nick, side, wu, zhi, troop, weapon, lk, lv, home, join] = ln.split('|'), R = rng(hash(name));
  const p = { id: name, name, nick, side, wu: +wu, zhi: +zhi, troop, weapon, look: look(lk), lv: +lv, home, join };
  derive(p, R); PEOPLE[name] = p;
}
// the invented, to five hundred: outlaws of each mountain, officers of the prefectures, the armies of the Liao,
// of Tian Hu, Wang Qing, Fang La and the Jin, and wanderers met on the road
const GROUPS = [
  // side, how many, level range, where they are met, their headwear, troops, join
  ['bandit', 70, [2, 30], ['少華山', '桃花山', '二龍山', '白虎山', '飲馬川', '黃門山', '對影山', '芒碭山', '枯樹山', '登雲山', '沂嶺', '揭陽嶺', '黃泥岡', '瓦罐寺', '景陽岡'], 'scarf', '步步騎弓', 'capture'],
  ['song', 80, [6, 50], ['華州', '渭州', '東京', '滄州', '大名府', '鄆城縣', '濟州', '青州', '江州', '高唐州', '東平府', '東昌府', '孟州', '陽穀縣', '清風寨', '無為軍'], 'helm', '騎步弓步水', 'capture'],
  ['liao', 40, [44, 58], ['檀州', '薊州', '霸州', '幽州', '燕京', '密雲'], 'fur', '騎騎弓騎', 'capture'],
  ['tian', 20, [44, 54], ['威勝州', '蓋州', '昭德府'], 'helm', '騎步弓', 'capture'],
  ['wang', 20, [44, 54], ['南豐', '宛州', '荊南'], 'helm', '騎步水', 'capture'],
  ['fang', 50, [50, 66], ['潤州', '蘇州', '杭州', '睦州', '歙州', '幫源洞', '秀州', '湖州'], 'turban', '步騎水弓', 'capture'],
  ['jin', 10, [55, 64], ['燕京', '會寧府'], 'fur', '騎騎弓', 'capture'],
  ['wander', 10, [10, 50], ['少華山', '景陽岡', '揭陽嶺', '飲馬川', '黃泥岡', '延安府', '相州', '太原', '濟州', '江州'], 'band', '步騎弓謀術', 'tavern'],
];
const WEAP = { 步: ['刀', '槍', '棍', '斧', '劍', '錘'], 騎: ['槍', '刀', '矛', '戟', '鞭', '錘'], 弓: ['弓', '弓', '鏢'], 水: ['叉', '刀', '槍'], 謀: ['扇', '劍'], 術: ['劍', '拂'] };
let n = 0; const taken = new Set(Object.keys(PEOPLE)), total = () => Object.keys(PEOPLE).length;
const need = 500 - total(), groupTotal = GROUPS.reduce((s, g) => s + g[1], 0);
GROUPS.forEach(([side, count, [lo, hi], places, hat, troops, join], gi) => {
  const R = rng(9001 + gi), want = gi === GROUPS.length - 1 ? 500 - total() : Math.round(count * need / groupTotal);
  for (let i = 0; i < want; i++) {
    let name; do {
      if (side === 'liao') name = R.pick(LIAO_SUR) + R.pick(LIAO_GIVEN);
      else if (side === 'jin') name = '完顏' + R.pick(JIN_GIVEN) + (R.chance(0.3) ? R.pick(['', '烈', '勃']) : '');
      else { const g1 = R.pick([...GIVEN]); let g2 = R.chance(0.45) ? R.pick([...GIVEN]) : ''; if (g2 === g1) g2 = ''; name = R.pick([...SUR]) + g1 + g2; }
    } while (taken.has(name)); taken.add(name);
    const troop = R.pick([...troops]), lv = R.int(lo, hi), strong = R.chance(0.12), wise = troop === '謀' || troop === '術';
    const wu = wise ? R.int(25, 60) : Math.min(95, R.int(50, 74) + Math.round(lv / 5) + (strong ? R.int(6, 14) : 0)), zhi = wise ? Math.min(95, R.int(62, 82) + Math.round(lv / 8)) : R.int(18, 62);
    const female = R.chance(side === 'liao' || side === 'fang' ? 0.05 : 0.07);
    const p = { id: name, name, nick: R.pick([...NICK_A]) + R.pick(NICK_B), side, wu, zhi, troop, weapon: R.pick(WEAP[troop]), lv, home: R.pick(places), join,
      look: { face: R.pick(['y', 'y', 'y', 'w', 'd', 'r']), hat: female ? 'female' : wise ? (troop === '術' ? 'taoist' : 'scholar') : R.chance(0.7) ? hat : R.pick(['scarf', 'band', 'hair']), beard: female ? 'none' : R.pick(['none', 'stub', 'mous', 'goatee', 'full', 'full', 'long']), female } };
    if (female) p.nick = p.nick.replace(/(大王|郎君|書生|和尚|道人|羅漢)$/, '娘子');
    derive(p, R); p.gen = 1; PEOPLE[name] = p; n++;
  }
});
// the stars' home towns (where they wait in an inn if the story hasn't brought them in) and when they appear
export const STAR_HOME = {
  朱武: '少華山', 陳達: '少華山', 楊春: '少華山', 李忠: '渭州', 周通: '桃花山', 曹正: '二龍山', 施恩: '孟州', 張青: '十字坡', 孫二娘: '十字坡',
  燕順: '清風寨', 王英: '清風寨', 鄭天壽: '清風寨', 黃信: '青州', 呂方: '對影山', 郭盛: '對影山', 石勇: '鄆城縣', 宋清: '鄆城縣', 穆弘: '揭陽嶺', 穆春: '揭陽嶺', 李立: '揭陽嶺', 薛永: '揭陽嶺', 童威: '揭陽嶺', 童猛: '揭陽嶺',
  侯健: '無為軍', 歐鵬: '黃門山', 蔣敬: '黃門山', 馬麟: '黃門山', 陶宗旺: '黃門山', 楊林: '飲馬川', 裴宣: '飲馬川', 鄧飛: '飲馬川', 孟康: '飲馬川', 杜興: '李家莊', 樂和: '登州', 鄒淵: '登雲山', 鄒潤: '登雲山',
  蕭讓: '濟州', 金大堅: '濟州', 湯隆: '武岡鎮', 朱富: '沂水縣', 李雲: '沂水縣', 焦挺: '枯樹山', 鮑旭: '枯樹山', 樊瑞: '芒碭山', 項充: '芒碭山', 李袞: '芒碭山', 皇甫端: '東昌府', 郁保四: '曾頭市', 段景住: '曾頭市',
  蔡福: '大名府', 蔡慶: '大名府', 王定六: '建康府', 安道全: '建康府', 宣贊: '東京', 郝思文: '東京', 龔旺: '東昌府', 丁得孫: '東昌府', 單廷珪: '凌州', 魏定國: '凌州', 孔明: '白虎山', 孔亮: '白虎山',
  朱仝: '鄆城縣', 雷橫: '鄆城縣', 時遷: '薊州', 白勝: '東溪村', 朱貴: '梁山', 杜遷: '梁山', 宋萬: '梁山',
};
export const COUNT = () => Object.keys(PEOPLE).length;
