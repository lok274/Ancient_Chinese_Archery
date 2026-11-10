import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  BookOpen,
  Compass,
  Award,
  ScrollText,
  Sparkles,
  MapPin,
  Target,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  ShieldAlert,
  Layers,
  Trophy,
  History,
  Medal,
  Scale,
} from 'lucide-react';
import { MartialRank, BowConfig, HistoricalNote } from '../types/archery';
import { PostureCoachOverlay } from './PostureCoachOverlay';

interface ArcheryGuideModalProps {
  onClose: () => void;
  currentRank: MartialRank;
  currentBow: BowConfig;
  historicalNotes: HistoricalNote[];
  isFetchingNote: boolean;
  noteError: string | null;
  initialOpenDrawer?: boolean;
  onRequestNewNote: () => void;
}

type GuideTab = 'china_olympic' | 'chinese_history' | 'comparison' | 'gameplay';

interface OlympicAchievementItem {
  yearAndGames: string;
  medal: 'GOLD' | 'SILVER' | 'BRONZE';
  medalLabel: string;
  athletes: string;
  event: string;
  highlight: string;
  significance: string;
}

const CHINA_OLYMPIC_ACHIEVEMENTS: OlympicAchievementItem[] = [
  {
    yearAndGames: '2008 北京奧運會',
    medal: 'GOLD',
    medalLabel: '金牌 · 歷史首金',
    athletes: '張娟娟 (Zhang Juanjuan)',
    event: '女子個人反曲弓 70米',
    highlight:
      '在奧林匹克公園射箭場大雨中，張娟娟於 1/4 決賽、半決賽與決賽連克朱賢貞、尹玉姬、朴成賢三位韓國頂尖名將，決賽以 110:109 絕殺奪冠！',
    significance:
      '奪得中國奧運史上第一枚射箭金牌，一舉打破韓國女子射箭自 1984 年以來對奧運女子個人金牌長達 24 年的壟斷！',
  },
  {
    yearAndGames: '1984 洛杉磯奧運會',
    medal: 'SILVER',
    medalLabel: '銀牌 · 奧運首秀破紀錄',
    athletes: '李玲娟 (Li Lingjuan)',
    event: '女子個人雙輪全能',
    highlight:
      '新中國重返奧運賽場首次參加射箭比賽，李玲娟以總成績 2559 環奪得銀牌，並在比賽過程中五次打破奧運會紀錄。',
    significance:
      '吹響中國現代競技射箭走向世界頂尖舞台的號角，展現中國女將超凡的心理穩定性。',
  },
  {
    yearAndGames: '2024 巴黎奧運會',
    medal: 'SILVER',
    medalLabel: '銀牌 · 榮軍院絕境加賽',
    athletes: '李佳蔓、楊曉蕾、安琦軒',
    event: '女子團體反曲弓 70米',
    highlight:
      '在巴黎榮軍院決賽面對衛冕冠軍韓國隊，中國女團在 0:4 落後的絕境下頑強連扳兩局（4:4）拖入一箭決生死加賽（Shoot-off），最終僅以 27:29 惜敗奪銀。',
    significance:
      '2024賽季中國女隊曾於世界盃上海站與仁川站兩度擊敗韓國隊奪冠，巴黎奧運銀牌再次印證中韓巔峰對決的世界最高水準。',
  },
  {
    yearAndGames: '1992 巴塞隆納 / 2004 雅典 / 2008 北京 / 2012 倫敦',
    medal: 'SILVER',
    medalLabel: '5枚銀牌 · 女子個人與女團傳承',
    athletes: '何影、王曉竹、馬湘君、張娟娟、陳玲、郭丹、程明、方玉婷、徐晶',
    event: '女子個人（1996何影）＆ 女子團體（1992/2004/2008/2012）',
    highlight:
      '何影於 1996 亞特蘭大奧運奪得女單銀牌；中國女團在雅典（僅差1環）、北京、倫敦連續三屆奧運闖入金牌決賽斬獲銀牌。',
    significance:
      '數十年間中國女子射箭隊始終穩居奧運獎牌榜前列，形成「老帶新、代代傳承」的冠軍底蘊。',
  },
  {
    yearAndGames: '2008 北京奧運會 & 2012 倫敦奧運會',
    medal: 'BRONZE',
    medalLabel: '2枚銅牌 · 男子團體與個人雙突破',
    athletes: '姜林、李文全、薛海峰（08男團）／ 戴小祥（12男單）',
    event: '男子團體反曲弓（2008）＆ 男子個人反曲弓（2012）',
    highlight:
      '2008年中國男團力克強敵首奪奧運團體銅牌；2012年倫敦奧運戴小祥多次歷經加賽決勝闖入四強，奪得男子個人銅牌。',
    significance:
      '先後實現中國男子射箭在奧運團體與個人項目上獎牌「零的突破」，標誌男女隊全面均衡發展。',
  },
];

interface HistoryEraItem {
  era: string;
  period: string;
  title: string;
  content: string;
  artifactOrQuote: string;
}

const CHINESE_ARCHERY_HISTORY: HistoryEraItem[] = [
  {
    era: '01 · 遠古與先秦起源',
    period: '距今 28,000 年 — 公元前 11 世紀',
    title: '峙峪石鏃與「弦木為弧」：世界最早弓箭文明之一',
    content:
      '山西朔州峙峪遺址出土距今約 2.8 萬年的燧石箭鏃，證實中國是人類最早發明並使用弓箭的地區之一。至夏商時期，青銅箭鏃與複合木胎弓廣泛應用於漁獵與車戰，甲骨文中「射」字即為張弓搭矢之象形。',
    artifactOrQuote: '《易經 · 繫辭下》：「弦木為弧，剡木為矢，弧矢之利，以威天下。」',
  },
  {
    era: '02 · 西周「六藝」與禮射文化',
    period: '公元前 1046 年 — 公元前 256 年',
    title: '君子六藝之「射」：以射觀德、揖讓而升',
    content:
      '西周貴族教育將「禮、樂、射、御、書、數」定為君子六藝。周禮將射箭昇華為「大射、賓射、燕射、鄉射」四大禮射儀式，要求射手伴隨雅樂節奏發矢，強調「內志正，外體直」，將競技體育與道德修養完美合一。',
    artifactOrQuote:
      '《論語 · 八佾》：「君子無所爭，必也射乎！揖讓而升，下而飲，其爭也君子。」',
  },
  {
    era: '03 · 春秋戰國與秦漢科技',
    period: '公元前 770 年 — 公元 220 年',
    title: '《考工記》六材複合角弓：領先世界千年的製弓科學',
    content:
      '《周禮·考工記·弓人》系統總結了「干（木胎）、角（牛角抗壓）、筋（牛鹿背筋抗拉）、膠（魚鰾膠）、絲、漆」六材合成反曲複合弓的流體與材料力學規律。秦漢時期，標準化強弩與漢軍複合騎射弓成為守護絲綢之路的核心利器。',
    artifactOrQuote:
      '《考工記》：「材美工巧，合此四者，然後可以為良弓：干也者以為遠也，角也者以為疾也。」',
  },
  {
    era: '04 · 唐宋至明清武舉制度',
    period: '公元 702 年 — 1905 年',
    title: '千年武舉科考與明清射學理論巔峰',
    content:
      '唐代長安二年（702年）武則天首創「武舉」，將步射（長垛、馬射、步射）列為國家選拔將領的法定科目。明代高穎撰《射學正宗》、茅元儀編《武備志》，清代八旗更將「順肩開弓、四平馬步、拇指扳指（韘）撒放」推向歷史高峰。',
    artifactOrQuote: '明 · 高穎《射學正宗》：「審者詳審於未發之先，固者堅固於已發之際。」',
  },
  {
    era: '05 · 現代奧林匹克射箭時代',
    period: '1959 年 — 至今',
    title: '從傳統射藝到奧運五環：中國射箭的世界榮耀',
    content:
      '1959年中國正式引進國際射箭總會（FITA / World Archery）現代反曲弓競賽規則。趙素霞、徐開才等前輩多次打破世界紀錄；1984年李玲娟奧運奪銀、2008年張娟娟北京奧運破壟斷奪金、2024巴黎奧運女團摘銀，同時傳統中華禮射亦在全國高校與國際賽場蓬勃復興。',
    artifactOrQuote: '傳統「內志正、外體直、審固乃發」之心法，至今仍是中國奧運射箭隊心理訓練的核心格言。',
  },
];

export const ArcheryGuideModal: React.FC<ArcheryGuideModalProps> = ({
  onClose,
  currentRank,
  currentBow,
  historicalNotes,
  isFetchingNote,
  noteError,
  initialOpenDrawer = false,
  onRequestNewNote,
}) => {
  const [activeTab, setActiveTab] = useState<GuideTab>('china_olympic');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(
    initialOpenDrawer || historicalNotes.length > 0 || isFetchingNote
  );
  const [isPostureCoachOpen, setIsPostureCoachOpen] = useState<boolean>(false);
  const [selectedNoteIndex, setSelectedNoteIndex] = useState<number>(0);

  useEffect(() => {
    if (historicalNotes.length > 0) {
      setSelectedNoteIndex(0);
    }
  }, [historicalNotes.length]);

  useEffect(() => {
    if (initialOpenDrawer) {
      setIsDrawerOpen(true);
    }
  }, [initialOpenDrawer]);

  const activeNote = historicalNotes[selectedNoteIndex] || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div
        className={`relative w-full transition-all duration-300 ${
          isDrawerOpen ? 'max-w-6xl' : 'max-w-4xl'
        } bg-slate-900 border border-amber-500/60 rounded-xl shadow-2xl text-slate-100 max-h-[90vh] flex flex-col overflow-hidden`}
      >
        {/* Top Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 border-b border-slate-800 bg-slate-950/85 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-600/20 border border-red-500/40 text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-wide text-amber-300">
                中國奧運射箭輝煌成就 ＆ 中華射藝千年歷史館
              </h2>
              <p className="text-[11px] text-slate-400">
                當前賽場：{currentRank.frontierPass}（{currentRank.title} · {currentRank.targetDistance}米）
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Button to Open 'Posture Coach' 3D Biomechanical Overlay */}
            <button
              type="button"
              onClick={() => setIsPostureCoachOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border transition-all cursor-pointer bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/50 text-emerald-300 whitespace-nowrap"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>3D 姿勢教練</span>
            </button>

            {/* Toggle Button for 'Historical & Olympic Notes' Drawer */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                isDrawerOpen
                  ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                  : 'bg-slate-800/90 hover:bg-slate-800 border-amber-600/50 text-amber-300'
              }`}
            >
              <ScrollText className="w-3.5 h-3.5 text-amber-400" />
              <span>AI 奧運與史話解說</span>
              {isFetchingNote ? (
                <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              ) : (
                <span className="px-1.5 py-0.2 rounded-xs bg-amber-950 border border-amber-700/60 text-[10px] font-mono text-amber-300">
                  {historicalNotes.length}
                </span>
              )}
              {isDrawerOpen ? (
                <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <ChevronLeft className="w-3.5 h-3.5 text-amber-400" />
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-amber-200 rounded transition-colors cursor-pointer"
              aria-label="關閉視窗"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 px-5 py-2.5 bg-slate-950/60 border-b border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('china_olympic')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'china_olympic'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Medal className="w-3.5 h-3.5 text-amber-300" />
            <span>中國射箭隊奧運成就</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('chinese_history')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'chinese_history'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>射箭在中國的歷史 (2.8萬年傳承)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('comparison')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'comparison'
                ? 'bg-sky-500 text-slate-950 shadow-sm'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>現代奧運反曲弓 vs. 傳統角弓</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gameplay')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'gameplay'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>奧運賽制與操作指南</span>
          </button>
        </div>

        {/* Main Body Split */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Column: Selected Tab Content */}
          <div
            className={`flex-1 overflow-y-auto p-5 space-y-5 text-xs leading-relaxed ${
              isDrawerOpen ? 'lg:border-r lg:border-slate-800' : ''
            }`}
          >
            {/* TAB 1: TEAM CHINA OLYMPIC ACHIEVEMENTS (中國射箭隊奧運輝煌成就) */}
            {activeTab === 'china_olympic' && (
              <div className="space-y-4">
                {/* Summary Banner */}
                <div className="p-4 rounded-lg bg-gradient-to-r from-red-950/70 via-slate-900 to-amber-950/40 border border-red-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-amber-300 tracking-wider">
                      TEAM CHINA ARCHERY · 中國國家射箭隊奧運榮譽榜
                    </div>
                    <h3 className="text-base font-bold text-white">
                      自 1984 洛杉磯奧運會以來累計斬獲 1 金 · 7 銀 · 2 銅（共 10 枚奧運獎牌）
                    </h3>
                    <p className="text-slate-300">
                      從李玲娟首秀五破奧運紀錄，到 2008 北京奧運張娟娟連克三名韓國選手奪得歷史首金，再到 2024 巴黎奧運女團頑強拼至加賽奪銀，中國射箭隊始終是世界箭壇最具競爭力的頂尖勁旅。
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 shrink-0 text-center font-mono tabular-nums">
                    <div className="px-3 py-2 rounded bg-amber-500/20 border border-amber-400/50">
                      <div className="text-lg font-bold text-amber-300">1</div>
                      <div className="text-[10px] text-amber-100">奧運金牌</div>
                    </div>
                    <div className="px-3 py-2 rounded bg-slate-400/20 border border-slate-300/40">
                      <div className="text-lg font-bold text-slate-100">7</div>
                      <div className="text-[10px] text-slate-300">奧運銀牌</div>
                    </div>
                    <div className="px-3 py-2 rounded bg-orange-600/20 border border-orange-500/40">
                      <div className="text-lg font-bold text-orange-300">2</div>
                      <div className="text-[10px] text-orange-200">奧運銅牌</div>
                    </div>
                  </div>
                </div>

                {/* Milestone Cards */}
                <div className="space-y-3">
                  {CHINA_OLYMPIC_ACHIEVEMENTS.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-lg bg-slate-950/75 border border-slate-800 hover:border-amber-500/40 transition-colors space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              item.medal === 'GOLD'
                                ? 'bg-amber-400 text-slate-950'
                                : item.medal === 'SILVER'
                                ? 'bg-slate-200 text-slate-950'
                                : 'bg-orange-400 text-slate-950'
                            }`}
                          >
                            {item.medalLabel}
                          </span>
                          <span className="text-sm font-bold text-amber-300">
                            {item.yearAndGames}
                          </span>
                          <span className="text-slate-500">·</span>
                          <span className="text-xs font-semibold text-white">
                            {item.athletes}
                          </span>
                        </div>
                        <span className="text-[11px] text-sky-300 font-mono">{item.event}</span>
                      </div>

                      <p className="text-slate-200 leading-relaxed">{item.highlight}</p>

                      <div className="pt-1.5 border-t border-slate-800/80 text-[11px] text-amber-200/90">
                        <strong>歷史意義：</strong>
                        {item.significance}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: HISTORY OF ARCHERY IN CHINA (射箭在中國的千年歷史) */}
            {activeTab === 'chinese_history' && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-gradient-to-r from-amber-950/50 via-slate-900 to-slate-900 border border-amber-500/40 space-y-1">
                  <div className="text-xs font-bold text-amber-400">
                    CHINESE ARCHERY HERITAGE · 中華射藝兩萬八千年文明長卷
                  </div>
                  <h3 className="text-base font-bold text-white">
                    從峙峪石鏃、西周「六藝」禮射、《考工記》角弓到現代奧運賽場
                  </h3>
                  <p className="text-slate-300">
                    在中國文化中，射箭不僅是護國禦敵的實用技藝，更是歷代君子修身養性、觀德知禮的精神載體。
                  </p>
                </div>

                <div className="space-y-3">
                  {CHINESE_ARCHERY_HISTORY.map((era, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-lg bg-slate-950/75 border border-slate-800 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-bold text-amber-300">{era.era}</span>
                        <span className="text-[11px] font-mono text-slate-400">{era.period}</span>
                      </div>
                      <div className="text-xs font-bold text-white">{era.title}</div>
                      <p className="text-slate-300 leading-relaxed">{era.content}</p>
                      <div className="p-2.5 rounded bg-slate-900 border border-amber-500/25 text-[11px] text-amber-200 font-serif">
                        {era.artifactOrQuote}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: MODERN OLYMPIC RECURVE VS TRADITIONAL CHINESE BOW */}
            {activeTab === 'comparison' && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-slate-950/80 border border-sky-500/35 space-y-1">
                  <h3 className="text-sm font-bold text-sky-300">
                    古今交融：現代奧運競技反曲弓 vs. 中國傳統複合角弓
                  </h3>
                  <p className="text-slate-300">
                    現代奧運反曲弓（Olympic Recurve）與中國古代《考工記》筋角反曲弓在能量儲存原理上同源，但在材料科技、瞄準輔助與撒放手法上各有千秋：
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-lg bg-slate-950/80 border border-sky-500/40 space-y-2.5">
                    <div className="text-sm font-bold text-sky-300 border-b border-slate-800 pb-1.5">
                      現代奧運競技反曲弓 (Olympic Recurve)
                    </div>
                    <ul className="space-y-2 text-slate-300">
                      <li>
                        <strong className="text-white">弓具材質：</strong>
                        CNC 航空鋁鎂合金或高模量碳纖維弓把（Riser），配碳纖維泡沫芯層壓弓片（Limbs）。
                      </li>
                      <li>
                        <strong className="text-white">輔助系統：</strong>
                        配備可微調光學準星（Sight）、長短碳纖平衡桿（Stabilizers）、箭側墊（Plunger）與控制拉距一致性的響片（Clicker）。
                      </li>
                      <li>
                        <strong className="text-white">扣弦與靠位：</strong>
                        採用「地中海式三指勾弦法」（食指在箭上、中指無名指在箭下），佩戴牛皮護指（Tab），弓弦緊貼下巴與鼻尖正中定位。
                      </li>
                      <li>
                        <strong className="text-white">奧運標準賽制：</strong>
                        男女統一射距 70 米，使用直徑 122 厘米五色十環靶紙（10環直徑僅 12.2 厘米，相當於一個光碟大小）。
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-950/80 border border-amber-500/40 space-y-2.5">
                    <div className="text-sm font-bold text-amber-300 border-b border-slate-800 pb-1.5">
                      中國傳統複合筋角弓 (Traditional Chinese Horn Bow)
                    </div>
                    <ul className="space-y-2 text-slate-300">
                      <li>
                        <strong className="text-white">六材工藝：</strong>
                        遵循《考工記》「干（竹木）、角（水牛角）、筋（牛背筋）、膠（魚鰾膠）、絲、漆」手工歷時數年製成。
                      </li>
                      <li>
                        <strong className="text-white">無準星裸弓：</strong>
                        無任何機械準星、平衡桿或響片，全憑射手「審固」直覺、馬步身架與肌肉記憶完成高低風偏修正。
                      </li>
                      <li>
                        <strong className="text-white">拇指扳指撒放：</strong>
                        採用東亞傳統「蒙古式拇指扣弦法」，右拇指佩戴玉、角或骨製扳指（韘）勾弦，箭搭於弓把右側，配合前手微撇（Khatra）避開箭羽。
                      </li>
                      <li>
                        <strong className="text-white">禮射與武舉文化：</strong>
                        講究《周禮》五射（白矢、參連、剡注、襄尺、井儀）與「發而不中，反求諸己」的君子修養。
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Launch 3D Posture Coach Banner */}
                <div
                  onClick={() => setIsPostureCoachOpen(true)}
                  className="p-4 rounded-lg bg-gradient-to-r from-emerald-950/50 via-slate-900 to-slate-900 border border-emerald-500/40 hover:border-emerald-400 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-bold text-emerald-300">
                      開啟 3D 骨架審固與奧運 T 字動作教練
                    </div>
                    <p className="text-slate-300 mt-0.5">
                      以 360° 三維骨架視角檢視「兩肩一線（T-Shape Alignment）」、下盤穩定度與背肌擴張發力。
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-300 shrink-0">
                    <span>進入 3D 教練</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: GAMEPLAY & OLYMPIC RULES */}
            {activeTab === 'gameplay' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-lg space-y-2.5">
                  <h3 className="text-sm font-bold text-amber-300 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-sky-400" />
                    <span>奧運射箭比賽實戰操作指南</span>
                  </h3>
                  <ul className="space-y-2 text-slate-300">
                    <li>
                      <strong className="text-amber-200">1. 開弓與瞄準（長按滑鼠左鍵）：</strong>
                      按住滑鼠左鍵開弓並移動滑鼠對準五色十環靶心。左上角儀表會即時計算當前風速下的「逆風修正量（cm）」與「仰角」。
                    </li>
                    <li>
                      <strong className="text-amber-200">2. 屏息凝神過響片（按住 Space 鍵）：</strong>
                      開弓後按住 <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[10px] text-amber-300">Space</kbd> 鍵可進入國家隊選手「屏息鎖定」狀態，消除 86% 準星晃動並微幅拉近視野，但心率與體力消耗會加快。
                    </li>
                    <li>
                      <strong className="text-amber-200">3. 撒放角度微調（Q / E / R 鍵）：</strong>
                      透過 <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[10px]">Q</kbd> / <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[10px]">E</kbd> 微調撒放角度（或按 <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[10px]">R</kbd> 一鍵校準最佳角度），避免撒放擦把造成左右偏差。
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Right Slide-Over Drawer: AI Olympic Commentary & Chinese Archery History Notes */}
          <AnimatePresence initial={false}>
            {isDrawerOpen && (
              <motion.aside
                key="historical-notes-drawer"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 'auto', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="w-full lg:w-[410px] shrink-0 bg-slate-950/95 border-t lg:border-t-0 border-slate-800 flex flex-col overflow-hidden"
              >
                <div className="p-4 border-b border-slate-800 bg-gradient-to-r from-red-950/40 via-slate-950 to-slate-950 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <div>
                      <h3 className="text-sm font-bold text-amber-200 tracking-wide">
                        AI 奧運戰報與中華射藝史話
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        命中靶面時即時連結中國隊奧運名場面與千年射藝歷史
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onRequestNewNote}
                    disabled={isFetchingNote}
                    className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-50 text-amber-200 border border-amber-500/40 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${isFetchingNote ? 'animate-spin text-amber-300' : ''}`}
                    />
                    <span>{isFetchingNote ? '生成中' : '生成新篇'}</span>
                  </button>
                </div>

                <div className="px-4 py-2 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-red-400" />
                    <span>{currentRank.frontierPass}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 truncate max-w-[180px]">
                    {currentRank.title}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs leading-relaxed">
                  {isFetchingNote && (
                    <div className="p-5 rounded-lg bg-slate-900/70 border border-amber-500/30 flex flex-col items-center justify-center text-center gap-3 my-4">
                      <div className="w-8 h-8 rounded-full border-2 border-amber-500/30 border-t-amber-400 animate-spin" />
                      <div className="space-y-1">
                        <div className="text-amber-200 font-semibold">
                          正在調閱中國奧運射箭檔案與中華射藝史料...
                        </div>
                        <p className="text-[11px] text-slate-400">
                          結合「{currentRank.frontierPass}」與您的實射環數生成專題解說
                        </p>
                      </div>
                    </div>
                  )}

                  {noteError && !isFetchingNote && (
                    <div className="p-3 rounded bg-red-950/50 border border-red-800/60 text-red-200 flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <div className="font-semibold">史話生成異常</div>
                        <p className="text-[11px] text-red-300/90">{noteError}</p>
                      </div>
                    </div>
                  )}

                  {historicalNotes.length > 1 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {historicalNotes.map((note, idx) => (
                        <button
                          key={note.id}
                          type="button"
                          onClick={() => setSelectedNoteIndex(idx)}
                          className={`px-2.5 py-1 rounded text-[11px] whitespace-nowrap border transition-colors cursor-pointer ${
                            idx === selectedNoteIndex
                              ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-semibold'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          第{note.arrowIndex}箭 · {note.score}環
                        </button>
                      ))}
                    </div>
                  )}

                  {activeNote && !isFetchingNote ? (
                    <motion.div
                      key={activeNote.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-3"
                    >
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-500/50 text-amber-300 font-semibold flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          第 {activeNote.arrowIndex} 箭 · +{activeNote.score}環
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                          {activeNote.dynastyEra}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-lg bg-slate-900/90 border border-amber-500/40 space-y-2.5">
                        <div className="text-sm font-bold text-amber-300 border-b border-slate-800 pb-1.5">
                          {activeNote.headline}
                        </div>

                        <div className="space-y-1">
                          <div className="text-[11px] font-semibold text-red-400">
                            【中國射箭隊奧運輝煌時刻】
                          </div>
                          <p className="text-slate-200 leading-relaxed">
                            {activeNote.passGeographyAndHistory}
                          </p>
                        </div>

                        <div className="space-y-1 pt-2 border-t border-slate-800">
                          <div className="text-[11px] font-semibold text-sky-400">
                            【中華千年射藝歷史淵源】
                          </div>
                          <p className="text-slate-300 leading-relaxed">
                            {activeNote.archeryTacticalInsight}
                          </p>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-800 bg-slate-950/70 p-2.5 rounded">
                          <div className="text-[10px] text-amber-400 mb-0.5">
                            射道格言與典籍印證：
                          </div>
                          <p className="text-amber-100/90 italic font-serif">
                            「{activeNote.classicalCitation}」
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    !isFetchingNote && (
                      <div className="p-5 rounded-lg bg-slate-900/50 border border-slate-800 text-center space-y-3 my-4">
                        <Award className="w-7 h-7 text-amber-400 mx-auto" />
                        <div className="space-y-1">
                          <div className="text-amber-200 font-semibold">
                            射中五色十環靶即可解鎖 AI 奧運與歷史專題解說
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            您也可以點擊下方按鈕，立即由 Gemini 生成關於「{currentRank.frontierPass}」的中國隊奧運成就與中華射箭史故事。
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={onRequestNewNote}
                          className="px-3.5 py-1.5 rounded text-xs font-semibold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors cursor-pointer"
                        >
                          立即生成中國隊奧運與射箭史解說
                        </button>
                      </div>
                    )
                  )}
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400">
            當前賽段：<span className="text-amber-300 font-semibold">{currentRank.title}</span> ·{' '}
            <span>{currentRank.frontierPass}</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors cursor-pointer"
          >
            返回奧運賽場
          </button>
        </div>
      </div>

      {/* Interactive 3D Posture Coach Overlay */}
      <PostureCoachOverlay
        isOpen={isPostureCoachOpen}
        onClose={() => setIsPostureCoachOpen(false)}
        currentBow={currentBow}
        currentRank={currentRank}
      />
    </div>
  );
};
