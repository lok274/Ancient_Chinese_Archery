import React from 'react';
import { WindState, GameState } from '../types/archery';
import { Wind, ArrowUpCircle } from 'lucide-react';

interface AimReticleHUDProps {
  gameState: GameState;
  drawTension: number;
  staminaPercent: number;
  isFatigued: boolean;
  breathSeconds: number;
  windState: WindState;
  onActionClick?: () => void;
}

export const AimReticleHUD: React.FC<AimReticleHUDProps> = ({
  gameState,
  drawTension,
  staminaPercent,
  isFatigued,
  breathSeconds,
  windState,
  onActionClick,
}) => {
  const isDrawing = gameState === 'drawing' || gameState === 'aiming';
  const isOptimalZone = isDrawing && !isFatigued && breathSeconds >= 1.2 && breathSeconds <= 3.5;

  // Calculate continuous breathing rhythm phase synced with 2.0 rad/s camera sway
  // Peak focus occurs at trough of breathing motion
  const breathCycle = isDrawing ? Math.sin(breathSeconds * 2.5) : 0;
  const breathHarmony = isOptimalZone
    ? 0.5 + 0.5 * Math.cos((breathSeconds - 2.3) * 2.8) // Peaks smoothly inside optimal window
    : 0;

  // Dynamic ring scale for breathe visualizer
  const outerRingScale = isDrawing
    ? isFatigued
      ? 1.15 + Math.sin(breathSeconds * 18) * 0.08
      : isOptimalZone
      ? 0.82 + (1 - breathHarmony) * 0.22
      : Math.max(0.85, 1.45 - drawTension * 0.45 + breathCycle * 0.06)
    : 1.0;

  // Reticle jitter effect that intensifies when staminaPercent is low (< 40%) or isFatigued is true
  const lowStaminaSeverity = isDrawing && staminaPercent < 0.4 ? (0.4 - staminaPercent) / 0.4 : 0;
  const fatigueSeverity = isDrawing && isFatigued ? Math.min(1.5, 0.65 + (breathSeconds - 3.8) * 0.5) : 0;
  const jitterAmplitudePx = (lowStaminaSeverity * 5.5) + (fatigueSeverity * 9.0);

  const reticleJitterX = jitterAmplitudePx > 0
    ? Math.sin(breathSeconds * 34.0) * jitterAmplitudePx * 0.65 +
      Math.cos(breathSeconds * 51.0) * jitterAmplitudePx * 0.35
    : 0;
  const reticleJitterY = jitterAmplitudePx > 0
    ? Math.cos(breathSeconds * 39.0) * jitterAmplitudePx * 0.65 +
      Math.sin(breathSeconds * 57.0) * jitterAmplitudePx * 0.35
    : 0;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6">
      {/* Top Center: Wind Gauge, Compass & Crosswind Turbulence Indicator */}
      <div className="flex justify-center">
        <div className="flex items-center gap-4 px-4 py-2 bg-black/50 border border-stone-700/60 rounded-md text-amber-50">
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-stone-300">風勢:</span>
            <span className="text-xs font-medium text-amber-200">{windState.directionName}</span>
            <span className="font-mono tabular-nums text-xs text-cyan-300 font-semibold">
              {windState.speed.toFixed(1)} m/s
            </span>
            {windState.speed >= 2.2 && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-xs border font-semibold ${
                  windState.speed >= 4.2
                    ? 'bg-amber-950/80 border-amber-500/60 text-amber-300 animate-pulse'
                    : 'bg-cyan-950/70 border-cyan-600/50 text-cyan-200'
                }`}
                title="高風速產生橫風亂流渦旋，箭矢飛行軌跡與箭身將受氣流擺振影響"
              >
                {windState.speed >= 4.2 ? '強風亂流 · 軌跡擺振' : '側風渦流'}
              </span>
            )}
          </div>

          {/* Wind Compass Arrow */}
          <div className="relative w-6 h-6 flex items-center justify-center border border-stone-600 rounded-full bg-stone-900/60">
            <div
              className="w-1.5 h-4 bg-cyan-400 rounded-xs origin-bottom transition-transform duration-300"
              style={{
                transform: `rotate(${windState.directionAngle}rad)`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Screen Center: Aim Sightline & Breathe Visualizer */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
        <div
          className="relative w-28 h-28 flex items-center justify-center"
          style={{
            transform: `translate3d(${reticleJitterX.toFixed(2)}px, ${reticleJitterY.toFixed(2)}px, 0)`,
          }}
        >
          {/* Outer Reference Circle (Fixed Target Sight Ring) */}
          <div
            className={`absolute w-14 h-14 rounded-full border transition-colors duration-200 ${
              isOptimalZone
                ? 'border-emerald-400/50'
                : isFatigued
                ? 'border-red-500/40'
                : isDrawing
                ? 'border-amber-300/35'
                : 'border-amber-400/20'
            }`}
          />

          {/* Dynamic 'Breathe' Pulse Visualizer Ring */}
          {isDrawing && (
            <>
              {/* Expanding/Contracting Breath Cadence Ring */}
              <div
                className={`absolute w-14 h-14 rounded-full border-2 transition-colors duration-150 ${
                  isOptimalZone
                    ? 'border-emerald-400/85 shadow-[0_0_16px_rgba(52,211,153,0.45)]'
                    : isFatigued
                    ? 'border-red-500/75 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                    : 'border-amber-300/60'
                }`}
                style={{
                  transform: `scale(${outerRingScale.toFixed(3)})`,
                }}
              />

              {/* Subtle Harmonic Aura when Stamina is Stable (Optimal Release Timing) */}
              {isOptimalZone && (
                <div
                  className="absolute w-16 h-16 rounded-full border border-emerald-300/40 bg-emerald-400/5"
                  style={{
                    transform: `scale(${(0.9 + Math.sin(breathSeconds * 4.5) * 0.14).toFixed(3)})`,
                    opacity: 0.45 + breathHarmony * 0.45,
                  }}
                />
              )}

              {/* Four Traditional Corner Brackets (四方審固紋) that lock inward at optimal breath */}
              <div
                className="absolute w-16 h-16 transition-transform duration-150"
                style={{
                  transform: `scale(${
                    isOptimalZone
                      ? (0.86 + (1 - breathHarmony) * 0.1).toFixed(3)
                      : isFatigued
                      ? '1.22'
                      : (1.18 - drawTension * 0.2).toFixed(3)
                  })`,
                }}
              >
                <div
                  className={`absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 ${
                    isOptimalZone ? 'border-emerald-300' : isFatigued ? 'border-red-400' : 'border-amber-300/70'
                  }`}
                />
                <div
                  className={`absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 ${
                    isOptimalZone ? 'border-emerald-300' : isFatigued ? 'border-red-400' : 'border-amber-300/70'
                  }`}
                />
                <div
                  className={`absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 ${
                    isOptimalZone ? 'border-emerald-300' : isFatigued ? 'border-red-400' : 'border-amber-300/70'
                  }`}
                />
                <div
                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 ${
                    isOptimalZone ? 'border-emerald-300' : isFatigued ? 'border-red-400' : 'border-amber-300/70'
                  }`}
                />
              </div>
            </>
          )}

          {/* Core Sighting Bead & Crosshairs */}
          <div
            className={`relative flex items-center justify-center transition-transform duration-150 ${
              isDrawing ? 'scale-95 opacity-95' : 'scale-100 opacity-65'
            }`}
          >
            <div
              className={`w-2.5 h-2.5 rounded-full border transition-colors ${
                isOptimalZone
                  ? 'border-emerald-300 bg-emerald-400/30 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                  : isFatigued
                  ? 'border-red-400 bg-red-500/20'
                  : 'border-amber-400/80'
              }`}
            />
            <div
              className={`absolute -top-3.5 w-0.5 h-2 transition-colors ${
                isOptimalZone ? 'bg-emerald-300/90' : isFatigued ? 'bg-red-400/80' : 'bg-amber-400/60'
              }`}
            />
            <div
              className={`absolute -bottom-3.5 w-0.5 h-2 transition-colors ${
                isOptimalZone ? 'bg-emerald-300/90' : isFatigued ? 'bg-red-400/80' : 'bg-amber-400/60'
              }`}
            />
            <div
              className={`absolute -left-3.5 h-0.5 w-2 transition-colors ${
                isOptimalZone ? 'bg-emerald-300/90' : isFatigued ? 'bg-red-400/80' : 'bg-amber-400/60'
              }`}
            />
            <div
              className={`absolute -right-3.5 h-0.5 w-2 transition-colors ${
                isOptimalZone ? 'bg-emerald-300/90' : isFatigued ? 'bg-red-400/80' : 'bg-amber-400/60'
              }`}
            />
          </div>
        </div>

        {/* Breath & Draw Stamina Gauge (Appears while drawing) */}
        {isDrawing && (
          <div className="mt-2 flex flex-col items-center gap-1.5 w-56 pointer-events-auto">
            <div className="flex items-center justify-between w-full text-[11px] font-medium">
              <span className="text-stone-300">
                {isFatigued ? (
                  <span className="text-red-400 font-bold">氣息散亂 · 劇烈晃動</span>
                ) : isOptimalZone ? (
                  <span className="text-emerald-400 font-bold">氣息歸一 · 圈合即發</span>
                ) : (
                  <span className="text-amber-200">調息凝神中...</span>
                )}
              </span>
              <span className="font-mono tabular-nums text-stone-400">
                {breathSeconds.toFixed(1)}s
              </span>
            </div>

            {/* Stamina bar with Optimal Window Highlight */}
            <div className="relative w-full h-2.5 bg-stone-900/90 border border-stone-700/80 rounded-full overflow-hidden p-0.5">
              {/* Target sweet-spot indicator band (1.2s to 3.5s on a 5.5s scale => ~36% to 78% stamina remaining) */}
              <div
                className="absolute top-0 bottom-0 bg-emerald-500/20 border-x border-emerald-400/40 pointer-events-none"
                style={{ left: '36%', width: '42%' }}
                title="最佳屏息區間"
              />
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  isFatigued
                    ? 'bg-red-500'
                    : isOptimalZone
                    ? 'bg-emerald-400 shadow-xs shadow-emerald-400/50'
                    : 'bg-amber-400'
                }`}
                style={{ width: `${Math.max(5, staminaPercent * 100)}%` }}
              />
            </div>

            {/* Optimal zone guide markers */}
            <div className="flex justify-between w-full text-[9px] text-stone-400 px-1">
              <span>力竭</span>
              <span className="text-emerald-400/90 font-semibold">▲ 最佳調息區 (1.2s–3.5s)</span>
              <span>滿弦</span>
            </div>

            {/* Interactive Release Button */}
            <button
              onClick={onActionClick}
              className={`mt-2.5 px-6 py-2 text-xs font-bold rounded-full shadow-lg transition-all active:scale-95 cursor-pointer pointer-events-auto border ${
                isOptimalZone
                  ? 'text-emerald-950 bg-emerald-400 hover:bg-emerald-300 border-emerald-200'
                  : 'text-amber-950 bg-amber-400 hover:bg-amber-300 border-amber-300'
              }`}
            >
              {isOptimalZone ? '絕佳時機 · 立即發矢！' : '發矢射出 (點擊或鬆開空白鍵)'}
            </button>
          </div>
        )}

        {/* Idle guidance prompt and Action Button */}
        {gameState === 'idle' && (
          <div className="mt-4 flex flex-col items-center gap-2 pointer-events-auto">
            <button
              onClick={onActionClick}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-amber-100 bg-amber-900/85 hover:bg-amber-800 border border-amber-600/80 rounded-full shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <ArrowUpCircle className="w-4 h-4 text-amber-400" />
              <span>引弦審固 (長按/點擊左鍵或空白鍵)</span>
            </button>
            <span className="text-[11px] text-stone-400 tracking-wide bg-black/50 px-3 py-1 rounded">
              長按蓄力觀察呼吸光圈收攏，或單擊進入瞄準
            </span>
          </div>
        )}
      </div>

      {/* Bottom spacer for dock clearance */}
      <div className="h-16" />
    </div>
  );
};
