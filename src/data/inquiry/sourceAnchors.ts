/**
 * Verifiable Source Anchors for Student Historical Annotation (史料標註原始材料庫)
 * Educational Objectives: OBJ-PEER, OBJ-HK, OBJ-IDENTITY, OBJ-TECH
 *
 * Source Discipline: Holds authentic, traceable excerpts with { id, title, excerpt, institution, dateNote }.
 * Students pick keywords from these excerpts and tag them onto timeline nodes or 3D props.
 */

export interface SourceAnchor {
  id: string;
  title: string;
  excerpt: string;
  institution: string;
  dateNote: string;
  suggestedKeywords: string[];
  linkedTarget: 'timeline_shiyu' | 'timeline_kaogong' | 'timeline_olympic' | 'prop_hk_board' | 'prop_bow_mechanics';
  linkedTargetLabel: string;
}

export const SOURCE_ANCHORS: SourceAnchor[] = [
  {
    id: 'SRC-HK-01',
    title: '屏山鄧族文物館藏清代官兵箭與武舉科考記載',
    excerpt:
      '屏山鄧氏宗族於清代人才輩出，除文科功名外，亦有多位族人考中武舉人。鄧族文物館展出一支清代官兵箭，箭桿以堅木製成，配鐵製三棱箭鏃，見證新界宗族子弟修習步射、馬射與開硬弓以應國家武科舉之歷史。',
    institution: '香港古物古蹟辦事處 · 屏山鄧族文物館展品說明',
    dateNote: '清代（18–19世紀文物，2007年開館常設展）',
    suggestedKeywords: ['屏山鄧氏', '清代武舉人', '清朝官兵箭', '步射與開硬弓'],
    linkedTarget: 'prop_hk_board',
    linkedTargetLabel: '3D 場邊香港射藝展板 · 宗族武舉ノード',
  },
  {
    id: 'SRC-HK-02',
    title: '香港海防博物館亞洲傳統射藝展與秦末漢初單木弓',
    excerpt:
      '展覽匯集亞洲不同地區之傳統弓矢文物，當中包括距今二千多年前秦末漢初之單木弓實物，展示中國早期選用堅韌木材順紋削製弓胎之工藝，與中原楚漢墓葬出土弓具形制一脈相承。',
    institution: '康樂及文化事務署 · 香港海防博物館專題展覽資料',
    dateNote: '秦末漢初（約公元前3世紀末至前2世紀初文物）',
    suggestedKeywords: ['香港海防博物館', '秦末漢初單木弓', '亞洲傳統射藝', '順紋木胎'],
    linkedTarget: 'prop_hk_board',
    linkedTargetLabel: '3D 場邊香港射藝展板 · 秦漢文物ノード',
  },
  {
    id: 'SRC-HK-03',
    title: '香港中華傳統弓總會與內地工藝師傅及青海賽事交流紀錄',
    excerpt:
      '香港中華傳統弓總會自 2018 年成立以來，致力於香港推廣中華傳統射藝；其教練團隊及香港大專院校射藝學會多次赴內地拜訪傳統弓箭製作師傅研習筋角弓工藝，並組織香港青年遠赴青海參加傳統射箭比賽。',
    institution: '香港中華傳統弓總會公開活動紀錄及兩地體育文化交流簡報',
    dateNote: '2018年至今',
    suggestedKeywords: ['香港中華傳統弓總會', '赴內地拜訪弓箭師傅', '青海傳統射箭比賽', '大專射藝學會'],
    linkedTarget: 'prop_hk_board',
    linkedTargetLabel: '3D 場邊香港射藝展板 · 當代兩地交流ノード',
  },
  {
    id: 'SRC-TECH-01',
    title: '《周禮·考工記·弓人》六材力學分工原文',
    excerpt:
      '凡為弓，冬析干而春液角，夏治筋，秋合三材，寒奠體，冰析懰……干也者，以為遠也；角也者，以為疾也；筋也者，以為深也；膠也者，以為和也；絲也者，以為固也；漆也者，以為受霜露也。',
    institution: '先秦官書《周禮·冬官考工記》',
    dateNote: '戰國時期（約公元前5世紀—前3世紀）',
    suggestedKeywords: ['冬析干春液角', '干以為遠', '角以為疾', '筋以為深'],
    linkedTarget: 'prop_bow_mechanics',
    linkedTargetLabel: '3D 弓臂應力與材質演化節點',
  },
  {
    id: 'SRC-OLY-01',
    title: '2008 北京奧運會射箭女子個人決賽官方技術公報',
    excerpt:
      '2008年8月14日於北京奧林匹克公園射箭場舉行女子個人反曲弓70米淘汰賽。中國選手張娟娟先後在1/4決賽以106:101勝朱賢貞、半決賽以115:109平奧運紀錄勝尹玉姬、決賽在雨中以110:109勝衛冕冠軍朴成賢，獲得中國奧運史上首枚射箭金牌。',
    institution: '國際射箭總會（FITA / World Archery）2008 北京奧運技術公報',
    dateNote: '2008年8月14日',
    suggestedKeywords: ['北京奧林匹克公園', '110:109絕殺', '打破24年壟斷', '70米雨戰'],
    linkedTarget: 'timeline_olympic',
    linkedTargetLabel: '奧運榮譽時間軸 · 2008 北京首金節點',
  },
];
