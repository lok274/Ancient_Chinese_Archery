/**
 * Material Evolution Lab Drawer (材質演化實驗室)
 * Educational Objective: OBJ-TECH — 探究創新科技以認識國家發展
 *
 * Spatial Rule: Opens upward as a compact collapsible drawer from the bottom-left peripheral
 * zone (w-72 max). Never expands horizontally into the central aiming reticle zone.
 * Read-only simulation: projects a "歷史對照軌跡（模擬）" ghost arc in the 3D scene without
 * mutating live BallisticsEngine outputs or scorecards.
 */

import React from 'react';
import { FlaskConical, ChevronUp, ChevronDown, Eye, EyeOff, Sparkles } from 'lucide-react';
import { MATERIAL_TIMELINE_STAGES, MaterialStage } from '../data/inquiry/materialTimeline';
import { BowConfig, MartialRank, WindState } from '../types/archery';

interface MaterialEvolutionLabProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  selectedStageId: string;
  onSelectStageId: (id: string) => void;
  ghostEnabled: boolean;
  onToggleGhost: (enabled: boolean) => void;
  currentBow: BowConfig;
  currentRank: MartialRank;
  windState: WindState;
  disabled?: boolean;
}

export const MaterialEvolutionLab: React.FC<MaterialEvolutionLabProps> = ({
  isOpen,
  onToggleOpen,
  selectedStageId,
  onSelectStageId,
  ghostEnabled,
  onToggleGhost,
  currentBow,
  currentRank,
  windState,
  disabled = false,
}) => {
  const stageIndex = Math.max(
    0,
    MATERIAL_TIMELINE_STAGES.findIndex((s) => s.id === selectedStageId)
  );
  const activeStage: MaterialStage =
    MATERIAL_TIMELINE_STAGES[stageIndex] || MATERIAL_TIMELINE_STAGES[0];

  // Derived read-only comparison metrics at current target distance
  const refMassG = currentBow.arrowMassGrams || 22;
  const speedRatio = Math.sqrt(refMassG / activeStage.massG);
  const estLaunchSpeed = Math.round(currentBow.initialVelocity * speedRatio);
  const dist = currentRank.targetDistance;
  const flightTimeSec = dist / Math.max(18, estLaunchSpeed * (1 - activeStage.dragCoeff * 0.08));
  const gravityDropCm = Math.round(0.5 * 9.81 * flightTimeSec * flightTimeSec * 100);
  const windDriftCm = Math.round(
    Math.abs(Math.sin(windState.directionAngle) * windState.speed) *
      flightTimeSec *
      activeStage.dragCoeff *
      18
  );

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    if (disabled) return;
    const dir = e.deltaY > 0 ? 1 : -1;
    const nextIdx = Math.max(
      0,
      Math.min(MATERIAL_TIMELINE_STAGES.length - 1, stageIndex + dir)
    );
    onSelectStageId(MATERIAL_TIMELINE_STAGES[nextIdx].id);
    if (!ghostEnabled) onToggleGhost(true);
  };

  return (
    <div
      className={`fixed bottom-14 left-4 z-20 w-72 transition-all duration-200 ${
        disabled ? 'opacity-0 pointer-events-none translate-y-2' : 'opacity-100 pointer-events-auto'
      }`}
      onWheel={handleWheel}
    >
      {/* Collapsible Trigger Pill */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onToggleOpen}
          className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-bold bg-slate-950/90 hover:bg-slate-900 text-amber-200 border border-amber-500/40 rounded-md shadow-lg backdrop-blur-md cursor-pointer transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <FlaskConical className="w-3.5 h-3.5 text-sky-400" />
            <span>材質演化實驗室 〔OBJ-TECH〕</span>
          </span>
          <span className="flex items-center gap-1 text-[10px] font-mono text-sky-300">
            <span>{activeStage.label.split('（')[0]}</span>
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </span>
        </button>
      </div>

      {/* Upward Vertical Drawer (Strictly w-72, never intrudes into center aiming reticle) */}
      {isOpen && (
        <div className="mt-1.5 p-3 bg-slate-950/95 border border-sky-500/40 rounded-lg shadow-2xl text-xs text-slate-200 space-y-2.5 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <div>
              <div className="text-[10px] font-mono text-sky-400">
                歷史對照軌跡（模擬）· 滾輪或滑桿切換
              </div>
              <div className="font-bold text-amber-300 text-xs">{activeStage.label}</div>
            </div>
            <button
              type="button"
              onClick={() => onToggleGhost(!ghostEnabled)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold border cursor-pointer transition-colors ${
                ghostEnabled
                  ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="在 3D 賽場中顯示/隱藏歷史材質模擬對照軌跡"
            >
              {ghostEnabled ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>{ghostEnabled ? '3D軌跡開啟' : '顯示3D軌跡'}</span>
            </button>
          </div>

          {/* Vertical / Step Timeline Selector */}
          <div className="space-y-1">
            <input
              type="range"
              min={0}
              max={MATERIAL_TIMELINE_STAGES.length - 1}
              step={1}
              value={stageIndex}
              onChange={(e) => {
                const idx = Number(e.target.value);
                onSelectStageId(MATERIAL_TIMELINE_STAGES[idx].id);
                if (!ghostEnabled) onToggleGhost(true);
              }}
              className="w-full accent-sky-400 cursor-pointer"
              aria-label="材質演化時間軸滑桿"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              {MATERIAL_TIMELINE_STAGES.map((st, idx) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    onSelectStageId(st.id);
                    if (!ghostEnabled) onToggleGhost(true);
                  }}
                  className={`px-1 py-0.5 rounded cursor-pointer transition-colors ${
                    idx === stageIndex
                      ? 'bg-sky-500/25 text-sky-300 font-bold border border-sky-500/40'
                      : 'hover:text-slate-200'
                  }`}
                >
                  {idx + 1}.{st.label.slice(0, 2)}
                </button>
              ))}
            </div>
          </div>

          {/* Era & Material Spec */}
          <div className="p-2 rounded bg-slate-900/90 border border-slate-800 space-y-1">
            <div className="text-[10px] text-amber-400 font-mono">{activeStage.era}</div>
            <div className="text-[11px] font-semibold text-white">{activeStage.materialSpec}</div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {activeStage.flightNarrative}
            </p>
          </div>

          {/* Read-Only Ballistic Comparison Telemetry */}
          <div className="grid grid-cols-4 gap-1 text-center font-mono bg-slate-900/70 p-1.5 rounded border border-slate-800/80">
            <div>
              <div className="text-[9px] text-slate-400">箭重</div>
              <div className="text-[11px] font-bold text-amber-300">{activeStage.massG}g</div>
            </div>
            <div>
              <div className="text-[9px] text-slate-400">阻力Cd</div>
              <div className="text-[11px] font-bold text-sky-300">{activeStage.dragCoeff}</div>
            </div>
            <div>
              <div className="text-[9px] text-slate-400">{dist}m下墜</div>
              <div className="text-[11px] font-bold text-rose-300">-{gravityDropCm}cm</div>
            </div>
            <div>
              <div className="text-[9px] text-slate-400">橫風漂移</div>
              <div className="text-[11px] font-bold text-emerald-300">±{windDriftCm}cm</div>
            </div>
          </div>

          {/* Mandatory One-Line "驅動因素" Statement */}
          <div className="p-2 rounded bg-sky-950/40 border border-sky-500/30 text-[11px] text-sky-200 leading-snug">
            <span className="inline-flex items-center gap-1 font-bold text-amber-300 mr-1">
              <Sparkles className="w-3 h-3" />
            </span>
            {activeStage.drivingFactor}
          </div>

          <div className="text-[9px] text-slate-500 truncate" title={activeStage.sourceRef}>
            考據來源：{activeStage.sourceRef}
          </div>
        </div>
      )}
    </div>
  );
};
