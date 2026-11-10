import React, { useMemo, useState } from 'react';
import {
  WindState,
  GameState,
  MartialRank,
  BowConfig,
  MARTIAL_RANKS,
  BOW_PRESETS,
} from '../types/archery';
import { BallisticsEngine } from '../physics/BallisticsEngine';
import {
  Wind,
  ArrowUpCircle,
  Crosshair,
  MoveHorizontal,
  MoveVertical,
  RotateCcw,
  RotateCw,
  Heart,
  Minimize2,
  Maximize2,
} from 'lucide-react';

interface AimReticleHUDProps {
  gameState: GameState;
  drawTension: number;
  staminaPercent: number;
  isFatigued: boolean;
  breathSeconds: number;
  isDeepBreath?: boolean;
  windState: WindState;
  currentRank?: MartialRank;
  currentBow?: BowConfig;
  aimOffsetCm?: { x: number; y: number };
  thumbAngleDeg?: number;
  onActionClick?: () => void;
}

export const AimReticleHUD: React.FC<AimReticleHUDProps> = ({
  gameState,
  drawTension,
  staminaPercent,
  isFatigued,
  breathSeconds,
  isDeepBreath = false,
  windState,
  currentRank = MARTIAL_RANKS[0],
  currentBow = BOW_PRESETS[0],
  aimOffsetCm = { x: 0, y: 0 },
  thumbAngleDeg = 14,
  onActionClick,
}) => {
  const [isCompactHUD, setIsCompactHUD] = useState<boolean>(false);

  const isDrawing = gameState === 'drawing' || gameState === 'aiming';
  const isOptimalZone = isDrawing && !isFatigued && breathSeconds >= 1.2 && breathSeconds <= 3.5;
  const isDeepBreathActive = isDrawing && isDeepBreath && !isFatigued && staminaPercent > 0.05;

  // Deterministic Windage & Thumb-Grip Clearance Calculation
  const windage = useMemo(() => {
    return BallisticsEngine.calculateWindage(
      windState,
      currentRank.targetDistance,
      currentRank.targetRadius,
      currentBow,
      1.0,
      thumbAngleDeg
    );
  }, [windState, currentRank.targetDistance, currentRank.targetRadius, currentBow, thumbAngleDeg]);

  const gripEffect = windage.gripEffect;

  // Map thumb-draw release angle [-25°, +45°] to [0%, 100%] on the thumb-ring gauge bar
  const mapThumbAngleToPercent = (deg: number) =>
    Math.max(2, Math.min(98, ((deg + 25) / 70) * 100));
  const optimalThumbPercent = mapThumbAngleToPercent(gripEffect.optimalAngleDeg);
  const currentThumbPercent = mapThumbAngleToPercent(gripEffect.thumbAngleDeg);

  // Compare player's live manual off-center aim (aimOffsetCm) against required windage compensation
  const horizontalAimErrorCm = aimOffsetCm.x - windage.requiredAimXCm;
  const verticalAimErrorCm = aimOffsetCm.y - windage.requiredAimYCm;
  const isWindageAligned = Math.abs(horizontalAimErrorCm) <= 5.5;
  const isFullSolutionAligned =
    Math.abs(horizontalAimErrorCm) <= 5.5 && Math.abs(verticalAimErrorCm) <= 8.0;

  // Format signed centimeter string (e.g. "+24.6 cm" or "-18.2 cm")
  const formatSignedCm = (val: number) => `${val >= 0 ? '+' : ''}${val.toFixed(1)} cm`;

  // Map centimeters to percentage [0%, 100%] on the horizontal windage scale bar
  const scaleRangeCm = Math.max(55, Math.min(110, Math.abs(windage.requiredAimXCm) * 1.45));
  const targetMarkerPercent = Math.max(
    4,
    Math.min(96, 50 + (windage.requiredAimXCm / scaleRangeCm) * 50)
  );
  const currentAimMarkerPercent = Math.max(
    2,
    Math.min(98, 50 + (aimOffsetCm.x / scaleRangeCm) * 50)
  );

  // Subtle reticle ghost lead pip offset in pixels (clamped within the reticle ring)
  const reticleWindOffsetPxX = Math.max(-34, Math.min(34, windage.requiredAimXCm * 0.55));
  const reticleWindOffsetPxY = Math.max(-22, Math.min(22, -windage.requiredAimYCm * 0.36));

  // Physiological Heartbeat & Stamina Exertion Model
  const clampedStamina = Math.max(0, Math.min(1, isDrawing ? staminaPercent : 1));
  const bowWeightFactor = Math.max(0, (currentBow.drawWeightLbs - 50) / 110);
  const exertionLevel = isDrawing
    ? Math.min(
        1,
        Math.pow(1 - clampedStamina, 1.1) * (0.85 + bowWeightFactor * 0.25) +
          (isFatigued ? 0.28 : 0)
      )
    : 0;

  // Heart rate scales from 68 BPM (calm stance) -> 98-126 BPM (full draw) -> 148-184 BPM (fatigued exertion)
  const heartRateBpm = isDrawing
    ? Math.round(76 + drawTension * 16 + exertionLevel * 86 + (isFatigued ? 14 : 0))
    : 68;
  const heartbeatPeriodSec = Math.max(0.32, Math.min(0.92, 60 / heartRateBpm));

  // Continuous double-peak (lub-dub) systolic/diastolic wave synced with breathSeconds for reticle ring throb
  const beatPhase = isDrawing ? (breathSeconds / heartbeatPeriodSec) % 1 : 0;
  const lubPeak = Math.exp(-Math.pow((beatPhase - 0.14) / 0.065, 2));
  const dubPeak = 0.62 * Math.exp(-Math.pow((beatPhase - 0.38) / 0.075, 2));
  const lubDubWave = Math.min(1, lubPeak + dubPeak);
  const reticleHeartbeatThrob = isDrawing
    ? lubDubWave * (0.014 + exertionLevel * 0.055 + (isFatigued ? 0.025 : 0))
    : 0;

  const pulseStateLabel = !isDrawing
    ? '氣定神閒'
    : isFatigued
    ? '力竭脈急'
    : isDeepBreathActive
    ? '屏息鎖定'
    : clampedStamina < 0.42
    ? '氣血翻湧'
    : isOptimalZone
    ? '凝神審固'
    : '引氣蓄力';

  // Calculate continuous breathing rhythm phase synced with camera sway
  const breathCycle = isDrawing ? Math.sin(breathSeconds * 2.5) : 0;
  const breathHarmony = isOptimalZone
    ? 0.5 + 0.5 * Math.cos((breathSeconds - 2.3) * 2.8)
    : 0;

  // Dynamic ring scale for breathe visualizer + subtle physiological heartbeat throb
  const outerRingScale = isDrawing
    ? (isFatigued
        ? 1.14 + Math.sin(breathSeconds * 18) * 0.06
        : isDeepBreathActive
        ? 0.85
        : isOptimalZone
        ? 0.82 + (1 - breathHarmony) * 0.22
        : Math.max(0.85, 1.45 - drawTension * 0.45 + breathCycle * 0.06)) + reticleHeartbeatThrob
    : 1.0;

  // Reticle jitter effect when stamina is low or fatigued (damped by 82% during Deep Breath)
  const lowStaminaSeverity = isDrawing && staminaPercent < 0.4 ? (0.4 - staminaPercent) / 0.4 : 0;
  const fatigueSeverity =
    isDrawing && isFatigued ? Math.min(1.5, 0.65 + (breathSeconds - 3.8) * 0.5) : 0;
  const deepBreathJitterDamping = isDeepBreathActive ? 0.18 : 1.0;
  const jitterAmplitudePx =
    (lowStaminaSeverity * 5.5 + fatigueSeverity * 9.0) * deepBreathJitterDamping;

  const reticleJitterX =
    jitterAmplitudePx > 0
      ? Math.sin(breathSeconds * 34.0) * jitterAmplitudePx * 0.65 +
        Math.cos(breathSeconds * 51.0) * jitterAmplitudePx * 0.35
      : 0;
  const reticleJitterY =
    jitterAmplitudePx > 0
      ? Math.cos(breathSeconds * 39.0) * jitterAmplitudePx * 0.65 +
        Math.sin(breathSeconds * 57.0) * jitterAmplitudePx * 0.35
      : 0;

  const gustPhase = windState.gustPhase ?? (windState.isGusting ? 'peak' : 'calm');
  const gustIntensity = Math.max(0, Math.min(1, windState.gustIntensity ?? 0));
  const gustDeltaAngleDeg = ((windState.gustDeltaAngle ?? 0) * 180) / Math.PI;
  const windAngleDeg = (windState.directionAngle * 180) / Math.PI;
  const gustCountdown = Math.max(0, windState.nextGustCountdownSec ?? 0);

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      {/* =========================================================================
          TOP-LEFT PERIPHERAL HUD: Wind Conditions, Gust Forecast & Windage Offset
          Moved away from center so the central target sightline is 100% clear
         ========================================================================= */}
      <div className="absolute top-16 left-4 sm:left-5 flex flex-col gap-1.5 w-68 sm:w-74 transition-opacity duration-200">
        {/* Wind & Gust Status Bar */}
        <div
          className={`px-3 py-2 bg-black/55 backdrop-blur-xs border rounded-md text-amber-50 shadow-md transition-colors duration-200 ${
            windState.isGusting
              ? 'border-amber-500/85 shadow-[0_0_14px_rgba(245,158,11,0.28)]'
              : gustPhase === 'building'
              ? 'border-amber-600/65'
              : 'border-stone-700/65'
          }`}
        >
          {/* Row 1: Wind Speed, Direction, Compass & Gust Button */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Wind
                className={`w-3.5 h-3.5 transition-transform duration-300 ${
                  windState.isGusting
                    ? 'text-amber-400 animate-bounce'
                    : gustPhase === 'building'
                    ? 'text-amber-300 animate-pulse'
                    : 'text-cyan-400'
                }`}
              />
              <span className="text-xs font-medium text-amber-200">{windState.directionName}</span>
              <span
                className={`font-mono tabular-nums text-xs font-semibold ${
                  windState.isGusting ? 'text-amber-300' : 'text-cyan-300'
                }`}
              >
                {windState.speed.toFixed(1)} m/s
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Rotating Wind Vector Arrow */}
              <div
                className="w-4.5 h-4.5 rounded-full border border-stone-600 flex items-center justify-center bg-stone-900/80"
                title="即時風向擺動羅盤"
              >
                <div
                  className={`text-[9px] leading-none transition-transform duration-150 ${
                    windState.isGusting ? 'text-amber-300' : 'text-cyan-300'
                  }`}
                  style={{ transform: `rotate(${windAngleDeg.toFixed(1)}deg)` }}
                >
                  ➤
                </div>
              </div>

              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('trigger_wind_gust'))}
                className="pointer-events-auto px-1.5 py-0.5 text-[10px] font-medium rounded bg-stone-800/85 hover:bg-amber-900/70 text-stone-300 hover:text-amber-200 border border-stone-600/70 transition-colors cursor-pointer whitespace-nowrap"
                title="立即觸發塞外突發陣風"
              >
                試煉陣風
              </button>

              <button
                type="button"
                onClick={() => setIsCompactHUD((prev) => !prev)}
                className="pointer-events-auto p-1 rounded bg-stone-800/80 hover:bg-stone-700 text-stone-300 border border-stone-700/70 cursor-pointer"
                title={isCompactHUD ? '展開完整輔助儀表' : '收合為極簡模式'}
              >
                {isCompactHUD ? (
                  <Maximize2 className="w-3 h-3 text-amber-300" />
                ) : (
                  <Minimize2 className="w-3 h-3 text-stone-400" />
                )}
              </button>
            </div>
          </div>

          {/* Row 2: Periodic Wind Gust Indicator */}
          <div className="mt-1.5 pt-1.5 border-t border-stone-800/80 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              <div className="flex items-end gap-0.5 h-3">
                {[0.35, 0.55, 0.8, 0.65, 1.0].map((barWeight, idx) => {
                  const waveLevel = Math.min(
                    1,
                    Math.max(0.22, (windState.speed / 6.5) * barWeight + gustIntensity * 0.45)
                  );
                  return (
                    <span
                      key={idx}
                      className={`w-1 rounded-xs transition-all duration-150 ${
                        windState.isGusting
                          ? 'bg-amber-400'
                          : gustPhase === 'building'
                          ? 'bg-amber-300/85'
                          : 'bg-cyan-400/75'
                      }`}
                      style={{ height: `${Math.round(waveLevel * 12)}px` }}
                    />
                  );
                })}
              </div>

              {windState.isGusting ? (
                <span className="font-bold text-amber-200">
                  {windState.gustLabel || '陣風湧動'} +{(windState.gustDeltaSpeed ?? 0).toFixed(1)}m/s
                </span>
              ) : gustPhase === 'building' ? (
                <span className="font-medium text-amber-300">
                  朔風將起 ({gustCountdown.toFixed(1)}s)
                </span>
              ) : (
                <span className="text-stone-300">
                  風息微瀾 {gustCountdown > 0 ? `(${gustCountdown.toFixed(1)}s)` : ''}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 text-[10px]">
              <MoveHorizontal className="w-3 h-3 text-amber-400" />
              <span className="font-mono tabular-nums text-amber-300">
                {Math.abs(windage.driftXCm) < 1.0
                  ? '0.0cm'
                  : `${windage.driftXCm > 0 ? '右' : '左'}${formatSignedCm(windage.driftXCm)}`}
              </span>
            </div>
          </div>

          {/* Expandable Windage & Aim Offset Details */}
          {!isCompactHUD && (
            <div className="mt-1.5 pt-1.5 border-t border-stone-800/80 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1">
                  <Crosshair
                    className={`w-3 h-3 ${
                      isWindageAligned ? 'text-emerald-400' : 'text-cyan-400'
                    }`}
                  />
                  <span className="text-stone-300">逆風修正:</span>
                  <span
                    className={`font-mono tabular-nums font-bold ${
                      isWindageAligned ? 'text-emerald-300' : 'text-cyan-300'
                    }`}
                  >
                    {Math.abs(windage.requiredAimXCm) < 1.5
                      ? '0.0 cm'
                      : `${windage.requiredAimXCm > 0 ? '右' : '左'} ${formatSignedCm(
                          windage.requiredAimXCm
                        )}`}
                  </span>
                </div>

                <div className="flex items-center gap-0.5 text-stone-400">
                  <MoveVertical className="w-3 h-3 text-amber-400/80" />
                  <span>仰角:</span>
                  <span className="font-mono tabular-nums text-amber-200 font-semibold">
                    +{windage.requiredAimYCm.toFixed(0)}cm
                  </span>
                </div>
              </div>

              {/* Horizontal Windage Alignment Scale Bar */}
              <div className="relative h-2 w-full bg-stone-900/95 rounded-xs border border-stone-700/80 overflow-hidden">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-stone-500/70 -translate-x-1/2" />
                <div
                  className={`absolute top-0 bottom-0 w-3 -translate-x-1/2 rounded-xs transition-all duration-150 ${
                    isWindageAligned
                      ? 'bg-emerald-400/45 border-x border-emerald-300'
                      : 'bg-cyan-400/30 border-x border-cyan-300/80'
                  }`}
                  style={{ left: `${targetMarkerPercent}%` }}
                />
                <div
                  className={`absolute top-0 bottom-0 w-1.5 -translate-x-1/2 rounded-full transition-all duration-75 ${
                    isWindageAligned ? 'bg-emerald-300' : 'bg-amber-400'
                  }`}
                  style={{ left: `${currentAimMarkerPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px]">
                <span className="text-stone-400 font-mono tabular-nums">
                  準星 X:{formatSignedCm(aimOffsetCm.x)} Y:{formatSignedCm(aimOffsetCm.y)}
                </span>
                <span
                  className={`font-semibold ${
                    isWindageAligned ? 'text-emerald-400' : 'text-amber-300/90'
                  }`}
                >
                  {isWindageAligned
                    ? '✓ 風偏已對齊'
                    : horizontalAimErrorCm > 0
                    ? `← 左移 ${Math.abs(horizontalAimErrorCm).toFixed(0)}cm`
                    : `→ 右移 ${Math.abs(horizontalAimErrorCm).toFixed(0)}cm`}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          TOP-RIGHT PERIPHERAL HUD: Stamina Heartbeat, Deep Breath & Thumb-Grip
          Positioned in the top-right corner to keep the center completely open
         ========================================================================= */}
      <div className="absolute top-16 right-4 sm:right-5 flex flex-col gap-1.5 w-68 sm:w-74">
        <div
          className={`px-3 py-2 rounded-md bg-black/55 backdrop-blur-xs border shadow-md transition-colors duration-200 ${
            isFatigued
              ? 'border-red-500/85 shadow-[0_0_16px_rgba(239,68,68,0.25)]'
              : isDeepBreathActive
              ? 'border-cyan-400/85 shadow-[0_0_16px_rgba(34,211,238,0.25)]'
              : isFullSolutionAligned
              ? 'border-emerald-500/70'
              : 'border-stone-700/65'
          }`}
        >
          {/* Row 1: Stamina & Accelerating Heartbeat Pulse HUD */}
          <div className="flex items-center justify-between text-[11px] mb-1">
            <div className="flex items-center gap-1.5">
              <div className="relative flex items-center justify-center w-3.5 h-3.5">
                {isDrawing && (exertionLevel > 0.35 || isFatigued) && (
                  <span
                    className={`absolute inset-0 rounded-full animate-ping ${
                      isFatigued ? 'bg-red-500/55' : 'bg-amber-400/45'
                    }`}
                    style={{
                      animationDuration: `${heartbeatPeriodSec.toFixed(2)}s`,
                    }}
                  />
                )}
                <Heart
                  className={`w-3 h-3 animate-heartbeat-lub-dub transition-colors duration-200 ${
                    isFatigued
                      ? 'text-red-400 fill-red-500/80'
                      : clampedStamina < 0.42
                      ? 'text-amber-400 fill-amber-400/70'
                      : isOptimalZone
                      ? 'text-emerald-400 fill-emerald-400/65'
                      : 'text-rose-400/85 fill-rose-500/40'
                  }`}
                  style={
                    {
                      animationDuration: `${heartbeatPeriodSec.toFixed(2)}s`,
                      '--hb-scale-lub': (1.16 + exertionLevel * 0.24).toFixed(2),
                      '--hb-scale-dub': (1.08 + exertionLevel * 0.14).toFixed(2),
                    } as React.CSSProperties
                  }
                />
              </div>
              <span className="text-stone-300 font-medium">氣力:</span>
              <span
                className={`font-semibold ${
                  isFatigued
                    ? 'text-red-400'
                    : isDeepBreathActive
                    ? 'text-cyan-300'
                    : clampedStamina < 0.42
                    ? 'text-amber-300'
                    : isOptimalZone
                    ? 'text-emerald-300'
                    : 'text-stone-200'
                }`}
              >
                {pulseStateLabel}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <svg
                viewBox="0 0 48 12"
                className="w-10 h-2.5 overflow-visible opacity-90"
                aria-hidden="true"
              >
                <path
                  d="M 0 6 L 10 6 L 13 2 L 16 10.5 L 19.5 1 L 23 9.5 L 26 4.5 L 29 6 L 48 6"
                  fill="none"
                  stroke={
                    isFatigued
                      ? '#f87171'
                      : isDeepBreathActive
                      ? '#22d3ee'
                      : clampedStamina < 0.42
                      ? '#fbbf24'
                      : isOptimalZone
                      ? '#34d399'
                      : '#fb7185'
                  }
                  strokeWidth="1.35"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-heartbeat-lub-dub origin-center"
                  style={
                    {
                      animationDuration: `${heartbeatPeriodSec.toFixed(2)}s`,
                      '--hb-scale-lub': (1.06 + exertionLevel * 0.2).toFixed(2),
                      '--hb-scale-dub': (1.03 + exertionLevel * 0.12).toFixed(2),
                    } as React.CSSProperties
                  }
                />
              </svg>
              <span className="font-mono tabular-nums font-semibold text-stone-300">
                {heartRateBpm}<span className="text-[9px] text-stone-400 ml-0.5">BPM</span>
              </span>
              <span className="font-mono tabular-nums text-stone-400">
                {Math.round(clampedStamina * 100)}%
              </span>
            </div>
          </div>

          {/* Stamina Bar */}
          <div
            className={`relative h-2 w-full bg-stone-900/95 rounded-xs border overflow-hidden transition-colors duration-200 ${
              isFatigued
                ? 'border-red-500/80'
                : isDeepBreathActive
                ? 'border-cyan-400/85'
                : clampedStamina < 0.42
                ? 'border-amber-500/65'
                : isOptimalZone
                ? 'border-emerald-500/65'
                : 'border-stone-700/75'
            }`}
          >
            <div
              className="absolute top-0 bottom-0 bg-emerald-400/15 border-x border-emerald-400/40 z-10 pointer-events-none"
              style={{ left: '36%', width: '42%' }}
              title="絕佳屏息發矢區間"
            />
            <div
              className={`h-full rounded-xs transition-all duration-100 animate-stamina-bar-throb ${
                isFatigued
                  ? 'bg-gradient-to-r from-red-600 via-red-500 to-rose-400'
                  : isDeepBreathActive
                  ? 'bg-gradient-to-r from-cyan-600 via-cyan-400 to-amber-300'
                  : clampedStamina < 0.42
                  ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-300'
                  : isOptimalZone
                  ? 'bg-gradient-to-r from-emerald-600 via-emerald-400 to-teal-300'
                  : 'bg-gradient-to-r from-amber-700 via-amber-500 to-emerald-400'
              }`}
              style={
                {
                  width: `${Math.max(4, Math.round(clampedStamina * 100))}%`,
                  animationDuration: `${heartbeatPeriodSec.toFixed(2)}s`,
                  '--hb-bright-lub': (1.18 + exertionLevel * 0.35).toFixed(2),
                  '--hb-bright-dub': (1.1 + exertionLevel * 0.22).toFixed(2),
                  '--hb-bar-scale': (1.06 + exertionLevel * 0.24).toFixed(2),
                } as React.CSSProperties
              }
            />
          </div>

          {/* Deep Breath (Spacebar Hold) Tactical Trade-Off Row */}
          <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px]">
            <span
              className={
                isDeepBreathActive ? 'text-cyan-200 font-semibold' : 'text-stone-400'
              }
            >
              {isDeepBreathActive
                ? '屏息凝神中：晃動 -86% · 耗氣 x2.2'
                : '按住 [Space] 屏息穩準'}
            </span>

            <button
              type="button"
              onMouseDown={() =>
                window.dispatchEvent(new CustomEvent('ui_set_deep_breath', { detail: true }))
              }
              onMouseUp={() =>
                window.dispatchEvent(new CustomEvent('ui_set_deep_breath', { detail: false }))
              }
              onMouseLeave={() => {
                if (isDeepBreath) {
                  window.dispatchEvent(new CustomEvent('ui_set_deep_breath', { detail: false }));
                }
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('ui_set_deep_breath', { detail: true }));
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('ui_set_deep_breath', { detail: false }));
              }}
              className={`pointer-events-auto px-2 py-0.5 rounded font-mono text-[10px] border transition-colors cursor-pointer whitespace-nowrap ${
                isDeepBreathActive
                  ? 'bg-cyan-500/30 border-cyan-300 text-cyan-100'
                  : 'bg-stone-800/90 hover:bg-stone-700 border-stone-600/80 text-stone-300'
              }`}
              title="按住空白鍵 (Space) 暫時鎖定準星晃動，但體力消耗加倍"
            >
              {isDeepBreathActive ? '屏息中 [Space]' : '屏息 [Space]'}
            </button>
          </div>

          {/* Expandable Thumb-Grip Release Angle Control */}
          {!isCompactHUD && (
            <div className="mt-1.5 pt-1.5 border-t border-stone-800/80">
              <div className="flex items-center justify-between gap-1 text-[10px]">
                <div className="flex items-center gap-1">
                  <span className="text-stone-300">扳指 (Q/E):</span>
                  <span
                    className={`font-mono tabular-nums font-bold ${
                      gripEffect.isCrispRelease ? 'text-emerald-300' : 'text-amber-300'
                    }`}
                  >
                    {gripEffect.thumbAngleDeg >= 0 ? '+' : ''}
                    {gripEffect.thumbAngleDeg.toFixed(0)}°
                  </span>
                  <span className="text-stone-400 truncate max-w-[85px]">
                    ({gripEffect.techniqueLabel.split(' · ')[0]})
                  </span>
                </div>

                <div className="flex items-center gap-1 pointer-events-auto">
                  <button
                    type="button"
                    onClick={() =>
                      window.dispatchEvent(new CustomEvent('adjust-thumb-grip', { detail: -2 }))
                    }
                    className="px-1.5 py-0.5 rounded bg-stone-800/90 hover:bg-stone-700 text-stone-200 border border-stone-600/70 cursor-pointer flex items-center gap-0.5"
                    title="內扣扳指 (Q)"
                  >
                    <RotateCcw className="w-2.5 h-2.5 text-cyan-300" />
                    <span>Q</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('reset-thumb-grip'))}
                    className="px-1.5 py-0.5 rounded bg-stone-800/90 hover:bg-amber-900/60 text-amber-200 border border-stone-600/70 cursor-pointer font-mono"
                    title="重置最佳角度 +14° (R)"
                  >
                    R
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      window.dispatchEvent(new CustomEvent('adjust-thumb-grip', { detail: 2 }))
                    }
                    className="px-1.5 py-0.5 rounded bg-stone-800/90 hover:bg-stone-700 text-stone-200 border border-stone-600/70 cursor-pointer flex items-center gap-0.5"
                    title="外旋撇放 (E)"
                  >
                    <span>E</span>
                    <RotateCw className="w-2.5 h-2.5 text-amber-300" />
                  </button>
                </div>
              </div>

              <div className="relative h-1.5 w-full bg-stone-900/95 rounded-xs border border-stone-700/70 overflow-hidden mt-1">
                <div
                  className="absolute top-0 bottom-0 w-3 -translate-x-1/2 bg-emerald-400/35 border-x border-emerald-300/80"
                  style={{ left: `${optimalThumbPercent}%` }}
                />
                <div
                  className={`absolute top-0 bottom-0 w-1.5 -translate-x-1/2 rounded-full transition-all duration-75 ${
                    gripEffect.isCrispRelease ? 'bg-emerald-300' : 'bg-amber-400'
                  }`}
                  style={{ left: `${currentThumbPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          CENTER: Clean, Unobstructed Minimal Aim Reticle
         ========================================================================= */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="relative w-24 h-24 flex items-center justify-center transition-transform duration-75"
          style={{
            transform: `translate(${reticleJitterX.toFixed(2)}px, ${reticleJitterY.toFixed(2)}px)`,
          }}
        >
          {/* Subtle Peripheral Wind-Gust Directional Vane & Shear Arc around Reticle */}
          <svg
            viewBox="0 0 120 120"
            className="absolute -inset-2 w-28 h-28 pointer-events-none transition-transform duration-150"
            style={{
              transform: `rotate(${(windAngleDeg - 90).toFixed(1)}deg)`,
            }}
          >
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke={
                windState.isGusting
                  ? 'rgba(251, 191, 36, 0.65)'
                  : gustPhase === 'building'
                  ? 'rgba(252, 211, 77, 0.42)'
                  : 'rgba(56, 189, 248, 0.25)'
              }
              strokeWidth={windState.isGusting ? '1.8' : '1.2'}
              strokeDasharray={`${Math.min(95, Math.round(20 + windState.speed * 10))} 360`}
              strokeDashoffset="20"
              strokeLinecap="round"
            />
            <path
              d="M 111 56 L 116 60 L 111 64"
              fill="none"
              stroke={windState.isGusting ? '#fbbf24' : '#38bdf8'}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={windState.isGusting ? 0.9 : 0.55}
            />
          </svg>

          {/* Outer Contracting Breath & Stamina Ring */}
          <div
            className={`absolute inset-0 rounded-full border transition-colors duration-200 ${
              isFatigued
                ? 'border-red-500/80 shadow-[0_0_16px_rgba(239,68,68,0.45)]'
                : isDeepBreathActive
                ? 'border-cyan-300/90 shadow-[0_0_20px_rgba(34,211,238,0.55)]'
                : isDrawing && clampedStamina < 0.42
                ? 'border-amber-400/85'
                : isOptimalZone
                ? 'border-emerald-400/85 shadow-[0_0_18px_rgba(52,211,153,0.4)]'
                : isDrawing
                ? 'border-amber-400/65'
                : 'border-stone-400/25'
            }`}
            style={{
              transform: `scale(${outerRingScale.toFixed(3)})`,
            }}
          />

          {/* Cardinal Focus Lock Brackets when holding Deep Breath (Spacebar) */}
          {isDeepBreathActive && (
            <div className="absolute inset-1 rounded-full border border-cyan-300/45 border-dashed pointer-events-none" />
          )}

          {/* Subtle Ghost Windage Lead Pip inside Reticle */}
          {Math.abs(windage.requiredAimXCm) >= 1.5 && (
            <div
              className="absolute pointer-events-none transition-all duration-150 flex items-center justify-center"
              style={{
                transform: `translate(${reticleWindOffsetPxX.toFixed(1)}px, ${reticleWindOffsetPxY.toFixed(1)}px)`,
              }}
            >
              <div
                className={`w-2 h-2 rounded-full border ${
                  isWindageAligned
                    ? 'border-emerald-300 bg-emerald-400/40'
                    : windState.isGusting
                    ? 'border-amber-300 bg-amber-400/35'
                    : 'border-cyan-300/80 bg-cyan-400/20 border-dashed'
                }`}
              />
            </div>
          )}

          {/* Inner Crisp Sight Crosshair */}
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="absolute w-full h-px bg-amber-200/40" />
            <div className="absolute h-full w-px bg-amber-200/40" />
            <div
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                isWindageAligned || isOptimalZone
                  ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
                  : isFatigued
                  ? 'bg-red-500'
                  : 'bg-amber-300'
              }`}
            />
          </div>
        </div>
      </div>

      {/* =========================================================================
          BOTTOM-RIGHT PERIPHERAL ACTION BUTTON
          Moved out of the bottom-center bow sightline to the bottom-right flank
         ========================================================================= */}
      <div className="absolute bottom-20 right-5 flex flex-col items-end gap-2">
        {isDrawing ? (
          <button
            onClick={onActionClick}
            className={`px-4 py-2 text-xs font-bold rounded-md shadow-lg transition-all active:scale-95 cursor-pointer pointer-events-auto border whitespace-nowrap ${
              isOptimalZone
                ? 'text-emerald-950 bg-emerald-400 hover:bg-emerald-300 border-emerald-200'
                : 'text-amber-950 bg-amber-400 hover:bg-amber-300 border-amber-300'
            }`}
          >
            {isOptimalZone ? '絕佳時機 · 放箭' : '放箭射出'}
          </button>
        ) : (
          gameState === 'idle' && (
            <button
              onClick={onActionClick}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-amber-100 bg-amber-900/80 hover:bg-amber-800 border border-amber-600/75 rounded-md shadow-lg transition-all active:scale-95 cursor-pointer pointer-events-auto whitespace-nowrap"
            >
              <ArrowUpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>引弦審固 (長按滑鼠)</span>
            </button>
          )
        )}
      </div>
    </div>
  );
};
