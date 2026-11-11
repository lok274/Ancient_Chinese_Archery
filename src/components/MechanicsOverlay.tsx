/**
 * Live Biomechanics & Bow Mechanics Overlay (力學疊加層：應力熱圖、拉弓力曲線與偏心輪傳動比)
 * Educational Objective: OBJ-TECH — 探究創新科技以認識國家發展
 *
 * Implements Section 8.6:
 * - Strictly read-only observation of drawTension and currentBow.
 * - 2D mini-chart anchored in peripheral left zone, max 240px × 120px.
 * - After a student passes the 50m stage (`rank_xiucai`) quiz, the mechanics overlay's built-in inquiry prompt
 *   is replaced with: `試運用剛才學到的原理：改變弓臂材料的彈性模量，觀察軌跡如何變化`, linking back to `MaterialEvolutionLab.tsx`.
 */

import React from 'react';
import { Activity, HelpCircle, ArrowUpRight, X, FlaskConical } from 'lucide-react';
import { BowConfig } from '../types/archery';

interface MechanicsOverlayProps {
  enabled: boolean;
  drawTension: number;
  currentBow: BowConfig;
  passed50mQuiz: boolean;
  overlayEnabledShotCount: number;
  dismissedTechPrompt: boolean;
  onDismissTechPrompt: () => void;
  onOpen50mQuiz: () => void;
  onOpenMaterialLab: () => void;
}

export const MechanicsOverlay: React.FC<MechanicsOverlayProps> = ({
  enabled,
  drawTension,
  currentBow,
  passed50mQuiz,
  overlayEnabledShotCount,
  dismissedTechPrompt,
  onDismissTechPrompt,
  onOpen50mQuiz,
  onOpenMaterialLab,
}) => {
  if (!enabled) return null;

  const peakWeightLbs = currentBow.drawWeightLbs;
  const currentDrawLengthIn = 8 + drawTension * (currentBow.drawLengthInches - 8);

  const recurveForceLbs = Math.round(peakWeightLbs * Math.pow(drawTension, 0.92));
  const camRatio =
    drawTension < 0.65
      ? 1.15 - drawTension * 0.3
      : Math.max(0.25, 0.95 - ((drawTension - 0.65) / 0.35) * 0.7);
  const compoundHoldingLbs = Math.round(peakWeightLbs * Math.min(1, drawTension * 1.45) * camRatio);

  const chartW = 216;
  const chartH = 68;
  const recurvePoints: string[] = [];
  const compoundPoints: string[] = [];

  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const x = 12 + t * (chartW - 20);
    const rF = Math.pow(t, 0.92);
    const rY = chartH - 6 - rF * (chartH - 16);
    recurvePoints.push(`${x.toFixed(1)},${rY.toFixed(1)}`);

    const cRatio =
      t < 0.65 ? 1.15 - t * 0.3 : Math.max(0.25, 0.95 - ((t - 0.65) / 0.35) * 0.7);
    const cF = Math.min(1, t * 1.45) * cRatio;
    const cY = chartH - 6 - cF * (chartH - 16);
    compoundPoints.push(`${x.toFixed(1)},${cY.toFixed(1)}`);
  }

  const markerX = 12 + drawTension * (chartW - 20);
  const markerRecurveY =
    chartH - 6 - Math.pow(drawTension, 0.92) * (chartH - 16);

  const showInquiryPrompt = (passed50mQuiz || overlayEnabledShotCount >= 3) && !dismissedTechPrompt;

  return (
    <div className="fixed top-14 left-5 z-20 pointer-events-none flex flex-col gap-2 w-[240px]">
      {/* 2D Draw-Force Curve Mini-Chart (Strictly max 240px × 120px) */}
      <div className="w-[240px] h-[120px] p-2 bg-slate-950/90 border border-emerald-500/45 rounded-lg shadow-xl backdrop-blur-md flex flex-col justify-between text-[10px] text-slate-200">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 font-bold text-emerald-300">
            <Activity className="w-3 h-3" />
            <span>拉弓力曲線 (F-x)</span>
          </span>
          <span className="font-mono text-amber-300">
            {recurveForceLbs}lb / {currentDrawLengthIn.toFixed(1)}&quot;
          </span>
        </div>

        <svg width={chartW} height={chartH} className="overflow-visible">
          <line x1="12" y1={chartH - 6} x2={chartW - 4} y2={chartH - 6} stroke="#475569" strokeWidth="1" />
          <line x1="12" y1="6" x2="12" y2={chartH - 6} stroke="#475569" strokeWidth="1" />

          <polyline
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.5"
            strokeDasharray="3 2"
            points={compoundPoints.join(' ')}
          />

          <polyline
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            points={recurvePoints.join(' ')}
          />

          <circle
            cx={markerX}
            cy={markerRecurveY}
            r="4"
            fill={drawTension > 0.75 ? '#ef4444' : drawTension > 0.35 ? '#f59e0b' : '#10b981'}
            stroke="#fff"
            strokeWidth="1"
          />
        </svg>

        <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
          <span>
            <span className="text-emerald-400">━ 反曲弓</span> ·{' '}
            <span className="text-sky-400">┅ 複合弓省力谷</span>
          </span>
          <span className="text-sky-300">
            輪傳動比 {(camRatio * 100).toFixed(0)}% ({compoundHoldingLbs}lb)
          </span>
        </div>
      </div>

      {/* 3D Limb Stress Legend Pill */}
      <div className="px-2.5 py-1 bg-slate-950/85 border border-slate-800 rounded text-[10px] font-mono text-slate-300 flex items-center justify-between">
        <span>3D弓臂應力熱圖:</span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>低</span>
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>中</span>
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span>峰值</span>
        </span>
      </div>

      {/* Built-in Inquiry Prompt (Section 8.6: dynamically switches once 50m quiz is passed) */}
      {showInquiryPrompt && (
        <div className="pointer-events-auto p-2.5 bg-slate-900/95 border border-amber-400/70 rounded-lg shadow-2xl text-xs space-y-1.5 animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300">
              <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>力學實測探究提問 〔OBJ-TECH〕</span>
            </span>
            <button
              type="button"
              onClick={onDismissTechPrompt}
              className="text-slate-400 hover:text-slate-200 cursor-pointer"
              aria-label="關閉提示"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {passed50mQuiz ? (
            <>
              <p className="text-[11px] text-emerald-200 font-semibold leading-snug">
                試運用剛才學到的原理：改變弓臂材料的彈性模量，觀察軌跡如何變化
              </p>
              <button
                type="button"
                onClick={onOpenMaterialLab}
                className="w-full flex items-center justify-center gap-1 py-1 px-2 rounded bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-[11px] cursor-pointer transition-colors"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>開啟左下角「材質演化實驗室」</span>
              </button>
            </>
          ) : (
            <>
              <p className="text-[11px] text-white font-semibold leading-snug">
                「為什麼複合弓能在保持高箭速的同時減輕拉弓負擔？」
              </p>
              <button
                type="button"
                onClick={onOpen50mQuiz}
                className="w-full flex items-center justify-center gap-1 py-1 px-2 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[11px] cursor-pointer transition-colors"
              >
                <span>前往 50m 關卡資料與測驗探究</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
