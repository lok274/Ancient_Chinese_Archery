import { HistoricalNote } from '../types/archery';

interface StaticNoteTemplate {
  headline: string;
  dynastyEra: string;
  passGeographyAndHistory: string;
  archeryTacticalInsight: string;
  classicalCitation: string;
}

const VENUE_STATIC_NOTES: Record<string, StaticNoteTemplate[]> = {
  北京奧林匹克公園射箭場: [
    {
      headline: '雨中破韓奪首金：張娟娟的北京奧運傳奇',
      dynastyEra: '2008 北京奧運會 × 西周禮射傳承',
      passGeographyAndHistory:
        '2008年8月14日，在北京奧林匹克公園射箭場瓢潑大雨中，中國名將張娟娟先後淘汰朱賢貞、尹玉姬，並在決賽以110:109擊敗衛冕冠軍朴成賢，奪得中國奧運史上第一枚射箭金牌，終結韓國女隊24年壟斷！',
      archeryTacticalInsight:
        '此箭命中高分區，展現了極佳的直線推弓與過響片節奏。這與中國古代《禮記·射義》所強調的「內志正，外體直，持弓矢審固」一脈相承——即便風雨交加，核心骨法依然紋絲不動。',
      classicalCitation:
        '《禮記 · 射義》：「射者，進退周還必中禮；內志正，外體直，然後持弓矢審固，然後可以言中。」',
    },
    {
      headline: '北京奧運男女團體雙雙登台：中國箭壇里程碑',
      dynastyEra: '2008 北京奧運會 × 考工記複合弓智慧',
      passGeographyAndHistory:
        '2008年北京奧運會上，不僅張娟娟奪得女單金牌，她還與陳玲、郭丹合力摘得女子團體銀牌；同時由姜林、李文全、薛海峰組成的中國男隊勇奪男子團體銅牌，實現中國男子射箭奧運獎牌零的突破。',
      archeryTacticalInsight:
        '現代奧運反曲弓的碳纖維泡沫芯弓片儲能原理，與兩千多年前《周禮·考工記》記載的「干、角、筋、膠、絲、漆」六材複合反曲弓同源，皆以反曲形變提升初速與抗風穩定性。',
      classicalCitation:
        '《周禮 · 考工記》：「材美工巧，合此四者，然後可以為良弓：干也者以為遠也，角也者以為疾也。」',
    },
  ],
  東京夢之島公園射箭場: [
    {
      headline: '濱海側風中的精準博弈：從倫敦摘銅到東京賽場',
      dynastyEra: '2012 倫敦 — 2020 東京奧運 × 明代《射學正宗》',
      passGeographyAndHistory:
        '2012年倫敦奧運會上，中國選手戴小祥在男子個人淘汰賽中多次頂住一箭決勝（Shoot-off）高壓奪得銅牌，創造中國男單奧運最佳戰績；程明、方玉婷、徐晶則斬獲女團銀牌。東京夢之島賽場臨海多風，更考驗射手抗風能力。',
      archeryTacticalInsight:
        '面對海灣橫風切變，射手必須果斷執行逆風偏置瞄準（Windage Offset），並依靠背闊肌持續向後擴張完成撒放，恰如明代射學家高穎所言「前推泰山、後拉虎尾」之對稱骨力。',
      classicalCitation:
        '明 · 高穎《射學正宗》：「審者詳審於未發之先，固者堅固於已發之際，風吹不移其志。」',
    },
  ],
  巴黎榮軍院射箭場: [
    {
      headline: '榮軍院絕境扳平：2024巴黎奧運中國女團頑強摘銀',
      dynastyEra: '2024 巴黎奧運會 × 唐代武舉步射精神',
      passGeographyAndHistory:
        '2024年巴黎奧運會射箭女團決賽在歷史悠久的榮軍院廣場舉行。由李佳蔓、楊曉蕾、安琦軒組成的中國女團在0:4落後的絕境下，頂住全場壓力連扳兩局追至4:4平，在加賽中打出27環奪得寶貴銀牌！',
      archeryTacticalInsight:
        '70米標準奧運距離下，10環靶心直徑僅12.2厘米（約光碟大小）。要在陣風中命中紅心，需要心率控制、屏息凝神與毫米級響片行程的完美結合。',
      classicalCitation:
        '《論語 · 八佾》：「君子無所爭，必也射乎！揖讓而升，下而飲，其爭也君子。」',
    },
  ],
  洛杉磯奧運決賽主場館: [
    {
      headline: '跨越四十載的五環傳承：從1984李玲娟到巔峰奪金',
      dynastyEra: '1984 洛杉磯奧運 — 當代 × 兩萬八千年中華射藝',
      passGeographyAndHistory:
        '1984年洛杉磯奧運會，李玲娟代表中國首次出戰現代奧運射箭比賽，一人五破奧運紀錄並奪得女子個人銀牌；其後何影（1996女單銀牌、2004女團銀牌）等名將薪火相傳，奠定中國射箭世界強國地位。',
      archeryTacticalInsight:
        '從山西峙峪遺址出土距今2.8萬年的石鏃，到西周六藝禮射、唐宋明清武舉，再到今日70米奧運決賽場上的X10碳鋁箭，中華射藝始終以「正心、正體、審固」冠絕古今。',
      classicalCitation:
        '《易經 · 繫辭下》：「弦木為弧，剡木為矢。」《孟子》：「發而不中，不怨勝己者，反求諸己而已矣。」',
    },
  ],
};

export function createStaticHistoricalNote(params: {
  frontierPass: string;
  frontierRegion: string;
  rankTitle: string;
  bowName: string;
  targetDistance: number;
  ringName: string;
  score: number;
  windName: string;
  timeOfDay: string;
  arrowIndex: number;
}): HistoricalNote {
  const pool =
    VENUE_STATIC_NOTES[params.frontierPass] ||
    VENUE_STATIC_NOTES['北京奧林匹克公園射箭場'];
  const template = pool[(params.arrowIndex - 1) % pool.length];

  return {
    id: `static-note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    frontierPass: params.frontierPass,
    frontierRegion: params.frontierRegion,
    rankTitle: params.rankTitle,
    bowName: params.bowName,
    targetDistance: params.targetDistance,
    ringName: params.ringName,
    score: params.score,
    timeOfDay: params.timeOfDay,
    windName: params.windName,
    arrowIndex: params.arrowIndex,
    headline: `${template.headline}（第${params.arrowIndex}箭 · ${params.score}環）`,
    dynastyEra: template.dynastyEra,
    passGeographyAndHistory: template.passGeographyAndHistory,
    archeryTacticalInsight: template.archeryTacticalInsight,
    classicalCitation: template.classicalCitation,
    timestamp: Date.now(),
  };
}
