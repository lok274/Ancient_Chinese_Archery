/**
 * Hong Kong Archery Heritage Anchors (香港射藝文化與內地同源線索)
 * Educational Objective: OBJ-HK — 認識內地與香港系出同源的關係
 *
 * Framing Rule (CRITICAL): Hong Kong is portrayed as an active participant in an ongoing
 * cultural exchange within the national tradition, pairing each Hong Kong fact with its
 * mainland institutional or historical counterpart.
 */

export interface HKHeritageEntry {
  id: string;
  yearOrEra: string;
  title: string;
  hkFact: string;
  mainlandCounterpart: string;
  culturalConnection: string;
  sourceAnchorId: string;
  category: '歷史文物' | '宗族武舉' | '當代工藝交流' | '青年與學界共融';
}

export const HK_HERITAGE_NOTES: HKHeritageEntry[] = [
  {
    id: 'hk_pingshan_wuju',
    yearOrEra: '清代（1644 — 1905 年）',
    title: '屏山鄧氏宗族：清代武舉人傳統與官兵箭文物',
    hkFact:
      '香港新界元朗屏山鄧氏宗族在清代崇文尚武，族中曾考取多位武舉人，屏山鄧族文物館至今珍藏清朝官兵箭實物及武舉練武石鎖。',
    mainlandCounterpart:
      '清代全國統一推行武科舉制度（童試、鄉試、會試、殿試），考核步射、馬射與開硬弓（八力至十二力制弓），嶺南學子赴廣州鄉試及京師會試。',
    culturalConnection:
      '印證香港新界宗族社會自古納入國家科舉選才與軍事防務體系，習射風尚與中原及嶺南各地同根同源。',
    sourceAnchorId: 'SRC-HK-01',
    category: '宗族武舉',
  },
  {
    id: 'hk_coastal_defence_museum',
    yearOrEra: '秦末漢初文物（館藏展覽）',
    title: '香港海防博物館藏亞洲傳統射藝與秦漢單木弓',
    hkFact:
      '香港海防博物館（現改設為香港抗戰及海防博物館）舉辦亞洲傳統射藝專題展覽並珍藏二千多年前秦末漢初單木弓等珍貴古代弓矢展品。',
    mainlandCounterpart:
      '與長沙馬王堆漢墓、湖北江陵楚墓及居延漢塞出土之先秦兩漢單體木弓、複合弓形制相互印證，展現中華早期製弓工藝的廣域傳播。',
    culturalConnection:
      '透過香港本地文博機構的考古與軍事藏品整理，讓香港市民與學子直觀接觸兩千年前秦漢時期的國家軍事與製弓工程實物。',
    sourceAnchorId: 'SRC-HK-02',
    category: '歷史文物',
  },
  {
    id: 'hk_traditional_bow_assoc',
    yearOrEra: '2018 年成立至今',
    title: '香港中華傳統弓總會：兩地非遺製弓工藝研習交流',
    hkFact:
      '香港中華傳統弓總會於 2018 年成立，積極在香港社區與學界推廣中華傳統射藝，多位香港教練專程赴內地拜訪傳統角弓與箭支製作師傅交流工藝。',
    mainlandCounterpart:
      '北京「聚元號」等國家級非物質文化遺產弓箭製作技藝傳承單位，以及山東、河北等地傳統筋角弓復原工坊。',
    culturalConnection:
      '香港射藝界主動參與傳統六材製弓工藝的研習、記錄與現代教學轉化，成為國家非遺射藝傳承網絡中活躍的一環。',
    sourceAnchorId: 'SRC-HK-03',
    category: '當代工藝交流',
  },
  {
    id: 'hk_qinghai_youth_exchange',
    yearOrEra: '當代青年體育文化交流',
    title: '香港青年代表赴青海參加全國及國際傳統射箭比賽',
    hkFact:
      '香港青年射手組隊前往青海等傳統射箭文化重鎮，與內地各民族射手同場參加傳統射箭錦標賽，切磋拇指扳指撒放與遠距原野射準技藝。',
    mainlandCounterpart:
      '青海尖扎、共和等地作為「中國民族射箭運動之鄉」，定期舉辦匯聚全國各省區及港澳代表隊的傳統弓赛事與文化節。',
    culturalConnection:
      '香港青年以參賽者與傳承者身份親身踏足祖國西部高原賽場，在同場競技中深化對中華多民族射藝共同體的體認。',
    sourceAnchorId: 'SRC-HK-04',
    category: '青年與學界共融',
  },
  {
    id: 'hk_university_clubs',
    yearOrEra: '當代高校社團互訪',
    title: '香港大專院校射藝學會赴內地高校學藝與合訓',
    hkFact:
      '香港多所大專院校成立傳統射藝及現代射箭學會，組織學生骨幹赴內地高校與禮射研習基地學藝，研習《周禮》鄉射禮儀軌與現代競技技術。',
    mainlandCounterpart:
      '清華大學、復旦大學及華東政法大學等內地高校中華射藝聯盟與大學生射箭錦標賽體系。',
    culturalConnection:
      '兩地青年學子以「揖讓而升」的禮射精神與科學訓練方法為紐帶，共同推動中華射藝在現代高等學府中的復興與創新。',
    sourceAnchorId: 'SRC-HK-05',
    category: '青年與學界共融',
  },
];
