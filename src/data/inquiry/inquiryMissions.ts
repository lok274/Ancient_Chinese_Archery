/**
 * Guided Inquiry Missions (公民科探究任務定義)
 * Educational Objectives: OBJ-TECH, OBJ-IDENTITY, OBJ-PEER, OBJ-HK
 * Follows the 4-step pedagogical cycle: 閱讀材料 → 提問 → 反思 → 產出
 */

export type InquiryObjective = 'OBJ-TECH' | 'OBJ-IDENTITY' | 'OBJ-PEER' | 'OBJ-HK';

export interface InquiryMission {
  id: string;
  objective: InquiryObjective;
  objectiveLabel: string;
  title: string;
  sourceExcerpt: string;      // short original-material snippet
  sourceCitation: string;
  question: string;            // a "why" question, open-ended
  reflectionPrompt: string;
  rubricHint: string[];        // what a strong answer touches on (not a mark scheme)
  artefactTitle: string;       // name of the shareable output
}

export const INQUIRY_MISSIONS: InquiryMission[] = [
  {
    id: 'M-OLY-01',
    objective: 'OBJ-IDENTITY',
    objectiveLabel: 'OBJ-IDENTITY · 深化認識國家發展與國民身份認同',
    title: '奧運突破探究：從追趕者到破局者的能力積累',
    sourceExcerpt:
      '自 1984 年洛杉磯奧運會李玲娟奪得銀牌以來，中國女子射箭在 1992、1996、2004 年多次闖入奧運決賽均屈居亞軍。2008 年 8 月 14 日北京奧運會女子個人賽，張娟娟在暴雨中連續擊敗朱賢貞、尹玉姬、朴成賢三位韓國名將奪金，終結了韓國隊自 1984 年起對該項目長達 24 年的金牌壟斷。2024 年巴黎奧運會，年輕一代中國女團在決賽 0:4 落後下連扳兩局拖入加賽。',
    sourceCitation: '整理自國際奧委會（IOC）官方賽事紀錄及《中國體育年鑑》射箭專篇',
    question:
      '張娟娟2008年金牌為何被視為打破韓國24年壟斷？這對中國射箭的後續發展意味著什麼？',
    reflectionPrompt:
      '請從「長期梯隊建設」、「大賽心理抗壓」、「科研與訓練體系積累」三個角度，分析為何單次金牌突破背後反映的是幾代運動員與科研團隊的接力積累，而非偶然運氣。',
    rubricHint: [
      '指出 1984–2004 年歷屆銀牌積累的國際賽經驗與技術基礎（「老帶新」梯隊傳承）',
      '分析打破 24 年壟斷對後續年輕運動員（如男單戴小祥、2024 巴黎女團）帶來的心理自信與戰術啟示',
      '聯繫模擬器中的「屏息凝神」與「抗風修正」體驗，說明惡劣天氣下穩定發揮所需的科學訓練支撐',
    ],
    artefactTitle: '《中國奧運射箭突破與發展模式探究小結》',
  },
  {
    id: 'M-RIT-01',
    objective: 'OBJ-IDENTITY',
    objectiveLabel: 'OBJ-IDENTITY · 中華禮射傳統與現代體育科學對話',
    title: '兩種文明邏輯對照：《射義》修身觀與奧運 KSL 生物力學',
    sourceExcerpt:
      '《禮記·射義》載：「射者，仁之道也。射求正諸己，己正而後發；發而不中，則不怨勝己者，反求諸己而已矣。」而當代奧運反曲弓廣泛採用的 KSL（BEST）生物力學體系，則將射箭分解為站位、沉肩 T 字骨橋、背肌楔入擴張（Back Tension）與過響片自然撒放等可量化的骨骼力學指標。',
    sourceCitation: '《禮記·射義》原文節錄 ＆ 世界射箭總會（WA）教練員生物力學培訓綱要',
    question:
      '《射義》「正己而後發」與奧運KSL生物力學標準，分別追求什麼？兩者在當代中國射箭訓練中如何融通？',
    reflectionPrompt:
      '對照「3D 姿勢教練」中的骨架視圖，思考古代「內志正、外體直、反求諸己」的心性修養，與現代生物力學追求「骨骼對齊、消除肌肉代償」之間有何相通之處？',
    rubricHint: [
      '說明《射義》追求以射觀德、自我省察與心態平穩（「反求諸己」）',
      '說明 KSL 生物力學追求結構剛性穩定、能量傳遞效率與動作可重複性',
      '指出兩者並非對立：現代高壓決賽中，「正己」的心理定力正是執行精確生物力學動作的前提',
    ],
    artefactTitle: '《傳統禮射「正己」哲學與現代運動生物力學對照筆記》',
  },
  {
    id: 'M-HK-01',
    objective: 'OBJ-HK',
    objectiveLabel: 'OBJ-HK · 認識內地與香港系出同源的歷史文化聯繫',
    title: '香港線索：新界宗族武舉傳統與當代兩地射藝交流',
    sourceExcerpt:
      '香港新界屏山鄧氏宗族於清代曾出過多位武舉人，鄧氏宗祠及文物館至今保存清代官兵弓箭實物；香港海防博物館亦珍藏逾二千年前秦末漢初單木弓展品。自 2018 年香港中華傳統弓總會成立以來，香港教練與大專院校射藝學會多次赴內地拜訪傳統弓箭製作師傅、參加青海等地傳統射箭賽事，共同保育中華射藝。',
    sourceCitation: '康樂及文化事務署古物古蹟辦事處（屏山文物徑資料）及香港傳統射藝交流公開紀錄',
    question:
      '香港新界宗族何以習射為傳統？與中原地區武舉制度有何關聯？當代香港青年與內地的射藝交流體現了怎樣的文化角色？',
    reflectionPrompt:
      '結合場邊「香港射藝文化展板」的史料，說明香港從清代科舉武舉體系到當代傳統弓復原與交流中，如何一直作為中華射藝傳承的積極參與者。',
    rubricHint: [
      '引用屏山鄧氏宗族武舉人與清代官兵箭文物，說明香港新界宗族與國家科舉（武舉步射、馬射、開硬弓）制度一脈相承',
      '結合海防博物館秦漢單木弓藏品，體現嶺南與中原在兵器與射藝上的共同歷史根源',
      '闡述當代香港弓會、高校社團赴內地學藝與參賽，展示香港在保育與推廣中華傳統文化中的主動參與',
    ],
    artefactTitle: '《香江射藝尋根：從新界武舉文物到兩地青年文化共融考察卡》',
  },
  {
    id: 'M-TECH-01',
    objective: 'OBJ-TECH',
    objectiveLabel: 'OBJ-TECH · 探究創新科技與工程力學原理',
    title: '材料與力學：從《考工記》六材到現代複合弓與碳纖箭',
    sourceExcerpt:
      '《周禮·考工記·弓人》記載：「干也者以為遠也，角也者以為疾也，筋也者以為深也。」古人利用牛角抗壓、動物背筋抗拉的特性製造反曲複合弓。現代工程則發展出偏心輪（Cam）複合弓系統，在拉滿弓時透過槓桿傳動比變化實現 65%–80% 的「省力谷（Let-off）」，同時以高模量碳纖維與鋁合金複合材料大幅降低箭桿質量與風阻。',
    sourceCitation: '《周禮·考工記》及現代複合弓機械傳動與材料力學教材',
    question:
      '為什麼複合弓能在保持高箭速的同時減輕拉弓負擔？從石鏃到碳纖維箭的演化反映了國家哪些基礎工業能力的提升？',
    reflectionPrompt:
      '開啟頂部「力學疊加層」與左下角「材質演化實驗室」進行實測，觀察拉弓力曲線（Draw-Force Curve）與不同年代箭鏃的對照軌跡，記錄你的物理發現。',
    rubricHint: [
      '解釋偏心輪（Cam）改變力臂傳動比，使曲線面積（儲存總能量）增大，但滿弓維持拉力（Holding Weight）下降',
      '對照「材質演化實驗室」數據，說明質量（massG）減輕與風阻係數（dragCoeff）下降如何減少 70 米重力下墜與風偏',
      '指出高性能碳纖維、精密鋁合金加工與風洞測試背後依託的是國家現代化工、材料科學與精密製造體系',
    ],
    artefactTitle: '《弓箭材料迭代與生物力學實測探究報告》',
  },
];
