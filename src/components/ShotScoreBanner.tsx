import React from 'react';
import { ShotResult } from '../types/archery';
import { Target, Zap } from 'lucide-react';

interface ShotScoreBannerProps {
  result: ShotResult | null;
  arrowIndex: number;
  totalArrows: number;
  onNextArrow: () => void;
}

export const ShotScoreBanner: React.FC<ShotScoreBannerProps> = ({
  result,
  arrowIndex,
  totalArrows,
  onNextArrow,
}) => {
  if (!result) return null;

  const isBullseye = result.score === 10;
  const isHit = result.score > 0;

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex flex-col items-center">
      <div
        className={`px-6 py-4 rounded-lg shadow-2xl border flex flex-col items-center gap-2 backdrop-blur-md transition-all animate-in fade-in zoom-in-95 duration-200 ${
          isBullseye
            ? 'bg-amber-950/90 border-amber-500 text-amber-100 ring-2 ring-amber-400/40'
            : isHit
            ? 'bg-stone-900/90 border-amber-700/60 text-stone-100'
            : 'bg-stone-950/90 border-stone-800 text-stone-300'
        }`}
      >
        {/* Score Ring Name */}
        <div className="flex items-center gap-2">
          {isBullseye ? (
            <Zap className="w-5 h-5 text-amber-400" />
          ) : (
            <Target className="w-5 h-5 text-amber-500" />
          )}
          <span className="text-xl font-bold tracking-wide">{result.ringName}</span>
        </div>

        {/* Flight Physics Stats */}
        <div className="flex items-center gap-4 text-xs text-stone-300 border-t border-stone-700/60 pt-2 font-mono">
          <div>
            <span className="text-stone-400">得分: </span>
            <span className="font-bold text-amber-300 text-base">+{result.score}</span>
          </div>
          <span className="text-stone-600">|</span>
          <div>
            <span className="text-stone-400">飛行時間: </span>
            <span className="text-amber-200">{result.flightTime.toFixed(2)}s</span>
          </div>
          <span className="text-stone-600">|</span>
          <div>
            <span className="text-stone-400">偏離金心: </span>
            <span className="text-amber-200">
              {result.distanceFromCenter > 50 ? '脫靶' : `${(result.distanceFromCenter * 100).toFixed(1)}cm`}
            </span>
          </div>
        </div>

        {/* Next Arrow Prompt Button */}
        <button
          onClick={onNextArrow}
          className="mt-2 px-5 py-1.5 text-xs font-semibold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded shadow-sm transition-all cursor-pointer"
        >
          {arrowIndex < totalArrows ? `進第 ${arrowIndex + 1} 矢 (按空白鍵/點擊)` : '查看武舉考核評定'}
        </button>
      </div>
    </div>
  );
};
