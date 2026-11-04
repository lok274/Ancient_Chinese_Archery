import React, { useState } from 'react';
import { BowConfig, CameraViewMode, BOW_PRESETS, MARTIAL_RANKS, MartialRank } from '../types/archery';
import { ChevronDown, ChevronUp, Eye, RotateCcw, Award, Info } from 'lucide-react';

interface BottomControlDockProps {
  currentBow: BowConfig;
  onSelectBow: (bow: BowConfig) => void;
  currentRank: MartialRank;
  onSelectRank: (rank: MartialRank) => void;
  cameraMode: CameraViewMode;
  onSelectCameraMode: (mode: CameraViewMode) => void;
  onResetRound: () => void;
  disabled?: boolean;
}

export const BottomControlDock: React.FC<BottomControlDockProps> = ({
  currentBow,
  onSelectBow,
  currentRank,
  onSelectRank,
  cameraMode,
  onSelectCameraMode,
  onResetRound,
  disabled = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredTooltip, setHoveredTooltip] = useState<'bow' | 'rank' | null>(null);

  // Immediately hide any active tooltip when shooting / drawing begins
  React.useEffect(() => {
    if (disabled) {
      setHoveredTooltip(null);
    }
  }, [disabled]);

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[94vw] max-w-[940px] flex flex-col items-center pointer-events-auto">
      {/* Collapse / Expand Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center gap-1.5 px-3.5 py-1 mb-1.5 text-xs font-medium text-amber-200 bg-stone-900/95 hover:bg-stone-800 border border-stone-700/80 rounded-t-md shadow-md transition-all cursor-pointer whitespace-nowrap"
        aria-label={isCollapsed ? '展開控制欄' : '收起控制欄'}
      >
        {isCollapsed ? (
          <>
            <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
            <span>展開控制欄</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
            <span>收起控制欄 (純享全景)</span>
          </>
        )}
      </button>

      {/* Main Dock Container */}
      {!isCollapsed && (
        <div className="relative w-full p-3.5 bg-stone-950/90 border border-stone-800/90 rounded-lg shadow-xl text-stone-200">
          {/* Historical Context Hover Tooltip Card (Hidden during active drawing/aiming/flight) */}
          {!disabled && hoveredTooltip === 'bow' && (
            <div className="absolute bottom-full left-0 mb-2.5 w-80 p-3 bg-stone-900/95 border border-amber-700/60 rounded-md shadow-2xl text-xs pointer-events-none transition-opacity duration-150 z-30">
              <div className="flex items-center justify-between border-b border-stone-800 pb-1.5 mb-1.5">
                <span className="font-bold text-amber-300">{currentBow.name}</span>
                <span className="text-[11px] text-amber-200/80 font-mono">
                  {currentBow.dynasty} · {currentBow.drawWeightLbs}磅
                </span>
              </div>
              <p className="text-stone-300 leading-relaxed mb-2">{currentBow.description}</p>
              <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1 border-t border-stone-800/80 font-mono tabular-nums">
                <span>初速: {currentBow.initialVelocity} m/s</span>
                <span>箭重: {currentBow.arrowMassGrams}g</span>
                <span>拉距: {currentBow.drawLengthInches}吋</span>
              </div>
            </div>
          )}

          {!disabled && hoveredTooltip === 'rank' && (
            <div className="absolute bottom-full left-1/4 mb-2.5 w-80 p-3 bg-stone-900/95 border border-amber-700/60 rounded-md shadow-2xl text-xs pointer-events-none transition-opacity duration-150 z-30">
              <div className="flex items-center justify-between border-b border-stone-800 pb-1.5 mb-1.5">
                <span className="font-bold text-amber-300">{currentRank.title}</span>
                <span className="text-[11px] text-amber-200/80">{currentRank.subtitle}</span>
              </div>
              <p className="text-stone-300 leading-relaxed mb-2">{currentRank.description}</p>
              <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1 border-t border-stone-800/80 font-mono tabular-nums">
                <span>射距: {currentRank.targetDistance}m ({Math.round(currentRank.targetDistance * 0.7)}步)</span>
                <span>及格: {currentRank.qualifyScore}/60分</span>
                <span>風速: {currentRank.windRange[0]}–{currentRank.windRange[1]}m/s</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            {/* 1. Bow Selector (選弓) with Historical Hover Tooltip */}
            <div
              className="flex flex-col gap-1 relative"
              onMouseEnter={() => !disabled && setHoveredTooltip('bow')}
              onMouseLeave={() => setHoveredTooltip(null)}
              onFocus={() => !disabled && setHoveredTooltip('bow')}
              onBlur={() => setHoveredTooltip(null)}
            >
              <label className="text-[11px] font-semibold text-amber-300/80 uppercase tracking-wider flex items-center justify-between">
                <span>配備角弓 (Draw Weight)</span>
                <Info className="w-3 h-3 text-amber-400/70" />
              </label>
              <select
                value={currentBow.id}
                onChange={(e) => {
                  const b = BOW_PRESETS.find((x) => x.id === e.target.value);
                  if (b) onSelectBow(b);
                }}
                disabled={disabled}
                className="w-full px-2.5 py-1.5 text-xs bg-stone-900 border border-stone-700 rounded text-amber-100 hover:border-amber-600 focus:outline-hidden focus:border-amber-500 transition-colors cursor-pointer"
              >
                {BOW_PRESETS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.drawWeightLbs}磅)
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Martial Exam Stage (武舉品階與射距) with Historical Hover Tooltip */}
            <div
              className="flex flex-col gap-1 relative"
              onMouseEnter={() => !disabled && setHoveredTooltip('rank')}
              onMouseLeave={() => setHoveredTooltip(null)}
              onFocus={() => !disabled && setHoveredTooltip('rank')}
              onBlur={() => setHoveredTooltip(null)}
            >
              <label className="text-[11px] font-semibold text-amber-300/80 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-400" />
                  <span>武舉品階 (Distance)</span>
                </span>
                <Info className="w-3 h-3 text-amber-400/70" />
              </label>
              <select
                value={currentRank.id}
                onChange={(e) => {
                  const r = MARTIAL_RANKS.find((x) => x.id === e.target.value);
                  if (r) onSelectRank(r);
                }}
                disabled={disabled}
                className="w-full px-2.5 py-1.5 text-xs bg-stone-900 border border-stone-700 rounded text-amber-100 hover:border-amber-600 focus:outline-hidden focus:border-amber-500 transition-colors cursor-pointer"
              >
                {MARTIAL_RANKS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} ({r.targetDistance}米 · {Math.round(r.targetDistance * 0.7)}步)
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Camera View Mode (視角切換) */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-amber-300/80 uppercase tracking-wider flex items-center gap-1">
                <Eye className="w-3 h-3 text-cyan-400" />
                <span>觀看視角 (Camera View)</span>
              </label>
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => onSelectCameraMode('first_person')}
                  className={`px-2 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                    cameraMode === 'first_person'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-stone-900 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                  }`}
                >
                  第一人稱
                </button>
                <button
                  onClick={() => onSelectCameraMode('flight_chase')}
                  className={`px-2 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                    cameraMode === 'flight_chase'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-stone-900 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                  }`}
                >
                  隨箭追蹤
                </button>
                <button
                  onClick={() => onSelectCameraMode('target_view')}
                  className={`px-2 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                    cameraMode === 'target_view'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-stone-900 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                  }`}
                >
                  靶心特寫
                </button>
              </div>
            </div>

            {/* 4. Action: Reset Round (重置應試) */}
            <div className="flex items-end justify-end">
              <button
                onClick={onResetRound}
                className="w-full md:w-auto flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-stone-200 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded transition-colors cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>重置考場</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
