import React from 'react';
import { ShotResult } from '../types/archery';
import { Target, Zap, ScrollText } from 'lucide-react';

interface ShotScoreBannerProps {
  result: ShotResult | null;
  arrowIndex: number;
  totalArrows: number;
  frontierPass: string;
  isFetchingNote: boolean;
  onOpenHistoricalNotes: () => void;
  onNextArrow: () => void;
}

export const ShotScoreBanner: React.FC<ShotScoreBannerProps> = ({
  result,
  arrowIndex,
  totalArrows,
  frontierPass,
  isFetchingNote,
  onOpenHistoricalNotes,
  onNextArrow,
}) => {
  if (!result) return null;

  const isBullseye = result.score === 10;
  const isHit = result.score > 0;

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex flex-col items-center max-w-[92vw]">
      <div
        className={`px-4 py-2.5 rounded-md shadow-xl border flex flex-wrap items-center justify-center gap-3 backdrop-blur-md transition-all animate-in fade-in duration-150 ${
          isBullseye
            ? 'bg-amber-950/85 border-amber-500/90 text-amber-100'
            : isHit
            ? 'bg-stone-900/85 border-amber-700/60 text-stone-100'
            : 'bg-stone-950/85 border-stone-800 text-stone-300'
        }`}
      >
        {/* Score Ring Name & Points */}
        <div className="flex items-center gap-2">
          {isBullseye ? (
            <Zap className="w-4 h-4 text-amber-400" />
          ) : (
            <Target className="w-4 h-4 text-amber-500" />
          )}
          <span className="text-base font-bold tracking-wide whitespace-nowrap">
            {result.ringName}
          </span>
          <span className="font-mono tabular-nums font-bold text-amber-300 text-base">
            +{result.score}分
          </span>
        </div>

        {/* Compact Flight Metrics */}
        <div className="hidden sm:flex items-center gap-2.5 text-xs text-stone-300 border-l border-stone-700/70 pl-3 font-mono tabular-nums">
          <span>飛行 {result.flightTime.toFixed(2)}s</span>
          <span className="text-stone-600">·</span>
          <span>
            {result.distanceFromCenter > 50
              ? '脫靶'
              : `偏心 ${(result.distanceFromCenter * 100).toFixed(1)}cm`}
          </span>
          {result.thumbAngleDeg !== undefined && (
            <>
              <span className="text-stone-600">·</span>
              <span>
                扳指 {result.thumbAngleDeg >= 0 ? '+' : ''}
                {result.thumbAngleDeg}°
              </span>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 border-l border-stone-700/70 pl-3">
          {isHit && (
            <button
              type="button"
              onClick={onOpenHistoricalNotes}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-200 bg-amber-900/60 hover:bg-amber-800/80 border border-amber-500/50 rounded transition-all cursor-pointer whitespace-nowrap"
            >
              <ScrollText className="w-3 h-3 text-amber-400" />
              <span>{isFetchingNote ? '纂修考據中...' : '邊關考據'}</span>
            </button>
          )}

          {isBullseye && (
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(new CustomEvent('replay-bullseye-calligraphy'))
              }
              className="px-2.5 py-1 text-xs font-medium text-amber-100 bg-stone-800/90 hover:bg-stone-700 border border-amber-500/40 rounded transition-all cursor-pointer whitespace-nowrap"
            >
              重展題名
            </button>
          )}

          <button
            onClick={onNextArrow}
            className="px-3.5 py-1 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded transition-all cursor-pointer whitespace-nowrap"
          >
            {arrowIndex < totalArrows ? `進第 ${arrowIndex + 1} 矢 [Space]` : '考核評定'}
          </button>
        </div>
      </div>
    </div>
  );
};
