import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { MartialRank, ShotResult, MARTIAL_RANKS } from '../types/archery';
import {
  Trophy,
  RotateCcw,
  ArrowRight,
  Medal,
  AlertCircle,
  BookOpen,
  Users,
  Award,
  Lock,
} from 'lucide-react';
import { archeryAudio } from '../audio/ArcheryAudio';

interface ExamSummaryModalProps {
  currentRank: MartialRank;
  shotResults: ShotResult[];
  isHeritageBadgeEarned: boolean;
  isNextStageGatePassed: boolean;
  onRetry: () => void;
  onNextRank: (nextRank: MartialRank) => void;
  onOpenNextStageQuiz: (nextRank: MartialRank) => void;
  onOpenRelayModal?: () => void;
}

const STAGE_CHINA_MILESTONE: Record<string, { title: string; detail: string }> = {
  rank_wusheng: {
    title: '中國奧運記憶 · 2008 北京奧運張娟娟破壟斷奪金',
    detail:
      '2008年8月14日，張娟娟在北京奧林匹克公園射箭場大雨中連克三位韓國名將，決賽以 110:109 擊敗衛冕冠軍朴成賢，奪得中國奧運史上首枚射箭金牌！',
  },
  rank_xiucai: {
    title: '中國奧運記憶 · 2012 倫敦奧運戴小祥男單歷史突破',
    detail:
      '2012年倫敦奧運會，戴小祥在男子個人淘汰賽中多次通過一箭決生死（Shoot-off）闖入四強並奪得銅牌，實現中國男子射箭奧運個人獎牌零的突破。',
  },
  rank_juren: {
    title: '中國奧運記憶 · 2024 巴黎奧運中國女團榮軍院激戰奪銀',
    detail:
      '2024年巴黎奧運會，由李佳蔓、楊曉蕾、安琦軒組成的中國女子射箭隊在決賽0:4落後絕境下連扳兩局拖入加賽，最終斬獲銀牌，展現頑強拼搏的中國射箭精神。',
  },
  rank_zhuangyuan: {
    title: '中華射藝傳承 · 從 1984 李玲娟五破奧運紀錄到當代世界之巔',
    detail:
      '自1984年洛杉磯奧運會李玲娟首奪銀牌、五破奧運紀錄以來，中國射箭隊已在奧運賽場斬獲 1 金 7 銀 2 銅，並多次在世界盃與亞運會擊敗強敵奪冠！',
  },
};

export const ExamSummaryModal: React.FC<ExamSummaryModalProps> = ({
  currentRank,
  shotResults,
  isHeritageBadgeEarned,
  isNextStageGatePassed,
  onRetry,
  onNextRank,
  onOpenNextStageQuiz,
  onOpenRelayModal,
}) => {
  const totalScore = shotResults.reduce((sum, r) => sum + r.score, 0);
  const isPassed = totalScore >= currentRank.qualifyScore;
  const bullseyes = shotResults.filter((r) => r.score === 10).length;
  const averageScore =
    shotResults.length > 0 ? (totalScore / shotResults.length).toFixed(1) : '0.0';

  const currentIndex = MARTIAL_RANKS.findIndex((r) => r.id === currentRank.id);
  const nextRank =
    currentIndex < MARTIAL_RANKS.length - 1 ? MARTIAL_RANKS[currentIndex + 1] : null;
  const milestone =
    STAGE_CHINA_MILESTONE[currentRank.id] || STAGE_CHINA_MILESTONE.rank_wusheng;

  useEffect(() => {
    if (isPassed) {
      archeryAudio.playDrum();
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#ef4444', '#facc15', '#38bdf8', '#ffffff'],
      });
    }
  }, [isPassed]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-xl bg-slate-900 border-2 border-amber-500/80 rounded-xl p-6 shadow-2xl text-amber-50 flex flex-col items-center">
        {/* Olympic Header */}
        <div className="flex flex-col items-center mb-3 text-center">
          <div className="w-14 h-14 rounded-full bg-red-950/90 border-2 border-amber-400 flex items-center justify-center mb-2 shadow-lg">
            {isPassed ? (
              <Medal className="w-8 h-8 text-amber-400" />
            ) : (
              <AlertCircle className="w-8 h-8 text-amber-500" />
            )}
          </div>
          <span className="text-xs tracking-widest text-amber-400 font-semibold">
            WORLD ARCHERY · 奧林匹克射箭官方成績公報
          </span>
          <h2 className="text-2xl font-bold tracking-wider text-white mt-1">
            {currentRank.title} 完賽結算
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            {currentRank.frontierPass} · 射距 {currentRank.targetDistance} 米
          </p>

          {/* Section 8.5 Optional Heritage Badge (香港射藝探究徽章) */}
          {isHeritageBadgeEarned && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400 text-amber-300 text-xs font-bold shadow-sm">
              <Award className="w-4 h-4 text-amber-400" />
              <span>已獲頒：香港射藝探究徽章 〔OBJ-HK〕</span>
            </div>
          )}
        </div>

        {/* Qualification Result Box */}
        <div
          className={`w-full p-4 rounded-lg border text-center my-2 ${
            isPassed
              ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
              : 'bg-slate-950/70 border-slate-800 text-slate-300'
          }`}
        >
          <div className="text-lg font-bold">
            {isPassed
              ? nextRank
                ? '【 達標晉級 · 闖入下一輪奧運賽程 】'
                : '【 奧運金牌得主 · 榮登世界射箭之巔 】'
              : '【 未達晉級環數 · 調整呼吸與風偏再戰 】'}
          </div>
          <p className="text-xs mt-1.5 leading-relaxed text-slate-200">
            {isPassed
              ? `本局 6 箭總計射出 ${totalScore} 環（晉級標準 ${currentRank.qualifyScore} 環），共命中 ${bullseyes} 支 X-10 環滿分箭，展現中國射箭隊沉著冷靜的大賽風範！`
              : `本局 6 箭總計 ${totalScore} 環，距離晉級標準 ${currentRank.qualifyScore} 環尚差 ${
                  currentRank.qualifyScore - totalScore
                } 環。建議善用左上角逆風修正刻度與 [Space] 屏息穩準。`}
          </p>
        </div>

        {/* 6-Arrow Score Sheet */}
        <div className="w-full my-2.5">
          <div className="text-xs text-slate-300 mb-1.5 flex justify-between font-medium">
            <span>單箭環數紀錄 (End Scoreboard)</span>
            <span className="font-mono tabular-nums text-amber-300">
              單箭均分: {averageScore} 環 · 10環數: {bullseyes}
            </span>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {shotResults.map((res, i) => (
              <div
                key={i}
                className={`flex flex-col items-center justify-center p-2 rounded border ${
                  res.score >= 9
                    ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                    : res.score >= 7
                    ? 'bg-red-500/20 border-red-500/60 text-red-200'
                    : res.score >= 5
                    ? 'bg-sky-500/20 border-sky-500/60 text-sky-200'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <span className="text-[10px] text-slate-400 font-mono">第{i + 1}箭</span>
                <span className="text-base font-bold font-mono tabular-nums mt-0.5">
                  {res.score === 10 ? '10/X' : res.score}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Team China Olympic Milestone Spotlight */}
        <div className="w-full p-3.5 rounded-lg bg-red-950/40 border border-red-500/40 text-xs space-y-1 my-1">
          <div className="flex items-center gap-1.5 font-bold text-amber-300">
            <BookOpen className="w-3.5 h-3.5 text-red-400" />
            <span>{milestone.title}</span>
          </div>
          <p className="text-slate-200 leading-relaxed">{milestone.detail}</p>
        </div>

        {/* Action Buttons + Section 8.7 Peer Relay Button & Section 5 Gate-Locked Next Stage Affordance */}
        <div className="flex flex-wrap items-center gap-2.5 w-full mt-4">
          <button
            onClick={onRetry}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>重賽本輪</span>
          </button>

          {onOpenRelayModal && (
            <button
              type="button"
              onClick={onOpenRelayModal}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-bold text-sky-950 bg-sky-400 hover:bg-sky-300 rounded-lg shadow-md transition-colors cursor-pointer whitespace-nowrap"
            >
              <Users className="w-4 h-4" />
              <span>邀請搭檔接力 〔OBJ-PEER〕</span>
            </button>
          )}

          {isPassed && nextRank ? (
            isNextStageGatePassed ? (
              <button
                onClick={() => onNextRank(nextRank)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-md transition-colors cursor-pointer"
              >
                <span>晉級 · {nextRank.title}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onOpenNextStageQuiz(nextRank)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-md transition-colors cursor-pointer whitespace-nowrap"
                title={`下一關 (${nextRank.title}) 尚未通過准入，點擊前往閱讀與測驗`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>下一關未解鎖 · 前往測驗</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )
          ) : (
            isPassed && (
              <div className="flex-1 flex items-center justify-center py-2.5 px-3 text-xs font-bold text-amber-300 bg-amber-950/60 border border-amber-500 rounded-lg">
                <Trophy className="w-4 h-4 mr-1.5 text-amber-400" />
                <span>榮獲奧林匹克射箭總冠軍</span>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
