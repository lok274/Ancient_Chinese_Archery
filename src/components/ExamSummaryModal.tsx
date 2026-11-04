import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { MartialRank, ShotResult, MARTIAL_RANKS } from '../types/archery';
import { Award, RotateCcw, ArrowRight, ShieldCheck, ShieldAlert } from 'lucide-react';
import { archeryAudio } from '../audio/ArcheryAudio';

interface ExamSummaryModalProps {
  currentRank: MartialRank;
  shotResults: ShotResult[];
  onRetry: () => void;
  onNextRank: (nextRank: MartialRank) => void;
}

export const ExamSummaryModal: React.FC<ExamSummaryModalProps> = ({
  currentRank,
  shotResults,
  onRetry,
  onNextRank,
}) => {
  const totalScore = shotResults.reduce((sum, r) => sum + r.score, 0);
  const isPassed = totalScore >= currentRank.qualifyScore;
  const bullseyes = shotResults.filter((r) => r.score === 10).length;
  const averageScore = (totalScore / shotResults.length).toFixed(1);

  // Find next rank
  const currentIndex = MARTIAL_RANKS.findIndex((r) => r.id === currentRank.id);
  const nextRank = currentIndex < MARTIAL_RANKS.length - 1 ? MARTIAL_RANKS[currentIndex + 1] : null;

  useEffect(() => {
    if (isPassed) {
      archeryAudio.playDrum();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#d4af37', '#e85d04', '#9e2a2b', '#ffffff'],
      });
    }
  }, [isPassed]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="w-full max-w-lg bg-stone-900 border-2 border-amber-600/80 rounded-lg p-6 shadow-2xl text-amber-50 flex flex-col items-center">
        {/* Imperial Seal Header */}
        <div className="flex flex-col items-center mb-4 text-center">
          <div className="w-14 h-14 rounded-full bg-amber-950/80 border-2 border-amber-500/80 flex items-center justify-center mb-2 shadow-inner">
            {isPassed ? (
              <ShieldCheck className="w-8 h-8 text-amber-400" />
            ) : (
              <ShieldAlert className="w-8 h-8 text-amber-600" />
            )}
          </div>
          <span className="text-xs tracking-widest text-amber-400/80 uppercase">兵部武選司 · 考射策定</span>
          <h2 className="text-2xl font-bold tracking-wider text-amber-100 mt-1">
            {currentRank.title} 射策結案
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">{currentRank.subtitle}</p>
        </div>

        {/* Evaluation Decree */}
        <div
          className={`w-full p-4 rounded-md border text-center my-2 ${
            isPassed
              ? 'bg-amber-950/40 border-amber-600/60 text-amber-200'
              : 'bg-stone-950/60 border-stone-800 text-stone-400'
          }`}
        >
          <div className="text-lg font-bold">
            {isPassed ? '【 及第 · 准予升階 】' : '【 未及科格 · 尚祈勉力 】'}
          </div>
          <p className="text-xs mt-1.5 leading-relaxed text-stone-300">
            {isPassed
              ? `考官評語：連環六矢，開弓沉穩，貫穿皮侯，得總分 ${totalScore} 分（及格標準 ${currentRank.qualifyScore} 分），身手非凡，特賜及第！`
              : `考官評語：六矢得總分 ${totalScore} 分，距合格標準 ${currentRank.qualifyScore} 分尚差 ${currentRank.qualifyScore - totalScore} 分。需多修心養氣，重修審固法。`}
          </p>
        </div>

        {/* Detailed Arrow Breakdown */}
        <div className="w-full my-3">
          <div className="text-xs text-stone-400 mb-1.5 flex justify-between font-medium">
            <span>各矢著靶實況</span>
            <span className="font-mono">平均: {averageScore} 環 / 鵠心: {bullseyes} 次</span>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {shotResults.map((res, i) => (
              <div
                key={i}
                className={`flex flex-col items-center justify-center p-2 rounded border ${
                  res.score === 10
                    ? 'bg-amber-900/50 border-amber-400 text-amber-200'
                    : res.score >= 8
                    ? 'bg-stone-800 border-amber-700/60 text-stone-200'
                    : res.score > 0
                    ? 'bg-stone-800/60 border-stone-700 text-stone-300'
                    : 'bg-stone-950 border-stone-800 text-stone-500'
                }`}
              >
                <span className="text-[10px] text-stone-400 font-mono">第{i + 1}矢</span>
                <span className="text-base font-bold font-mono mt-0.5">{res.score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full mt-4">
          <button
            onClick={onRetry}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs font-semibold text-stone-300 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>再試本關</span>
          </button>

          {isPassed && nextRank ? (
            <button
              onClick={() => onNextRank(nextRank)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded shadow-md transition-colors"
            >
              <span>進階 · {nextRank.title}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            isPassed && (
              <div className="flex-1 flex items-center justify-center py-2.5 px-4 text-xs font-bold text-amber-300 bg-amber-950/60 border border-amber-700 rounded">
                <Award className="w-4 h-4 mr-1 text-amber-400" />
                <span>已登武舉絕頂（狀元及第）</span>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
