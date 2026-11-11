/**
 * Shot Score Telemetry & National Sports-Tech Support Data Card Banner
 * Educational Objectives:
 * - OBJ-TECH     — 探究創新科技以認識國家發展
 * - OBJ-IDENTITY — 深化對祖國的認識，培養國家觀念與國民身份認同
 *
 * Spatial Rule (Section 5): Anchored in Top-Right peripheral zone (top-14 right-4),
 * keeping the central 50%, 50% aiming sightline 100% unobstructed.
 */

import React, { useState } from 'react';
import { ShotResult } from '../types/archery';
import { Target, Zap, ScrollText, Cpu, ChevronDown, ChevronUp } from 'lucide-react';
import { SPORTS_TECH_CASES } from '../data/inquiry/sportsTechCases';

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
  isFetchingNote,
  onOpenHistoricalNotes,
  onNextArrow,
}) => {
  const [showTechCard, setShowTechCard] = useState<boolean>(true);

  if (!result) return null;

  const isBullseye = result.score === 10;
  const isHit = result.score > 0;

  // Rotate through National Sports-Tech Support Data Cards by arrowIndex
  const techCase =
    SPORTS_TECH_CASES[(Math.max(1, arrowIndex) - 1) % SPORTS_TECH_CASES.length];

  return (
    <div className="fixed top-14 right-4 z-30 pointer-events-none flex flex-col items-end gap-2 max-w-sm">
      {/* Primary Shot Telemetry Card */}
      <div
        className={`pointer-events-auto px-3.5 py-2.5 rounded-lg shadow-2xl border flex flex-col gap-2 backdrop-blur-md transition-all animate-in fade-in duration-150 w-full ${
          isBullseye
            ? 'bg-amber-950/90 border-amber-500/90 text-amber-100'
            : isHit
            ? 'bg-slate-950/90 border-amber-700/60 text-stone-100'
            : 'bg-slate-950/90 border-stone-800 text-stone-300'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            {isBullseye ? (
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <Target className="w-4 h-4 text-amber-500 shrink-0" />
            )}
            <span className="text-sm font-bold tracking-wide">{result.ringName}</span>
          </div>
          <span className="font-mono tabular-nums font-bold text-amber-300 text-sm shrink-0">
            +{result.score}環
          </span>
        </div>

        {/* Compact Flight Metrics */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-300 font-mono tabular-nums border-t border-stone-800/80 pt-1.5">
          <span>飛行 {result.flightTime.toFixed(2)}s</span>
          <span className="text-stone-600">·</span>
          <span>
            {result.distanceFromCenter > 50
              ? '脫靶'
              : `偏心 ${(result.distanceFromCenter * 100).toFixed(1)}cm`}
          </span>
          <span className="text-stone-600">·</span>
          <span>風速 {result.windSpeed.toFixed(1)}m/s</span>
          {result.thumbAngleDeg !== undefined && (
            <>
              <span className="text-stone-600">·</span>
              <span>
                撒放 {result.thumbAngleDeg >= 0 ? '+' : ''}
                {result.thumbAngleDeg}°
              </span>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5">
            {isHit && (
              <button
                type="button"
                onClick={onOpenHistoricalNotes}
                className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-amber-200 bg-amber-900/60 hover:bg-amber-800/80 border border-amber-500/50 rounded transition-all cursor-pointer whitespace-nowrap"
              >
                <ScrollText className="w-3 h-3 text-amber-400" />
                <span>{isFetchingNote ? '調閱中...' : '奧運與史話'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowTechCard((prev) => !prev)}
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-sky-200 bg-slate-900 hover:bg-slate-800 border border-sky-500/40 rounded transition-all cursor-pointer whitespace-nowrap"
            >
              <Cpu className="w-3 h-3 text-sky-400" />
              <span>體育科研卡</span>
              {showTechCard ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          </div>

          <button
            onClick={onNextArrow}
            className="px-3 py-1 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded transition-all cursor-pointer whitespace-nowrap"
          >
            {arrowIndex < totalArrows ? `第 ${arrowIndex + 1} 箭 [Space]` : '完賽結算'}
          </button>
        </div>
      </div>

      {/* Section 8.3: National Sports-Tech Support Data Card (Optional Second Line) */}
      {showTechCard && (
        <div className="pointer-events-auto w-full p-3 rounded-lg bg-slate-950/92 border border-sky-500/45 shadow-xl text-xs space-y-1.5 backdrop-blur-md">
          <div className="flex items-center justify-between gap-2">
            <span className="px-1.5 py-0.5 rounded bg-sky-500/20 border border-sky-400/40 text-[10px] font-bold text-sky-300">
              {techCase.methodTag}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              國家隊科研支援 〔OBJ-TECH〕
            </span>
          </div>
          <div className="font-bold text-amber-300 text-xs">{techCase.headline}</div>
          <p className="text-[11px] text-slate-200 leading-relaxed">{techCase.oneLineFact}</p>
          <div className="pt-1 border-t border-slate-800 text-[10px] text-emerald-300 font-mono leading-snug">
            {techCase.causalChain}
          </div>
        </div>
      )}
    </div>
  );
};
