import React, { useEffect, useRef, useCallback } from 'react';
import { ArcheryScene } from '../three/ArcheryScene';
import {
  BowConfig,
  MartialRank,
  ShotResult,
  CameraViewMode,
  GameState,
  WindState,
} from '../types/archery';
import { BallisticsEngine } from '../physics/BallisticsEngine';
import { archeryAudio } from '../audio/ArcheryAudio';
import { MaterialStage } from '../data/inquiry/materialTimeline';

interface ArcheryCanvasProps {
  currentBow: BowConfig;
  currentRank: MartialRank;
  cameraMode: CameraViewMode;
  gameState: GameState;
  remainingArrows: number;
  timeOfDayProgress: number;
  thumbAngleDeg: number;
  setGameState: (state: GameState) => void;
  onShotCompleted: (result: ShotResult) => void;
  onDrawStateChange: (
    tension: number,
    staminaPercent: number,
    isFatigued: boolean,
    breathSec: number,
    isDeepBreath: boolean
  ) => void;
  onNextArrowRequest: () => void;
  onWindChange?: (wind: WindState) => void;
  onAimOffsetChange?: (aimOffsetCm: { x: number; y: number }) => void;
  onThumbAngleChange?: (angleDeg: number) => void;
  mechanicsOverlayEnabled?: boolean;
  materialGhostStage?: MaterialStage | null;
  onClickHKBoard?: () => void;
  gatePassed?: boolean;
  onLockedDrawAttempt?: () => void;
}

const GUST_LABELS = [
  '塞外狂飆突襲',
  '關隘橫風驟變',
  '朔北旋風切變',
  '峽谷疾風突襲',
];

function resolveWindDirectionName(angle: number): string {
  if (angle > 0.85) return '東北勁風';
  if (angle > 0.45) return '東風橫吹';
  if (angle > 0.12) return '東南側風';
  if (angle < -0.85) return '西北朔風';
  if (angle < -0.45) return '西風橫吹';
  if (angle < -0.12) return '西南側風';
  return '正北迎風';
}

export const ArcheryCanvas: React.FC<ArcheryCanvasProps> = ({
  currentBow,
  currentRank,
  cameraMode,
  gameState,
  remainingArrows,
  timeOfDayProgress,
  thumbAngleDeg,
  setGameState,
  onShotCompleted,
  onDrawStateChange,
  onNextArrowRequest,
  onWindChange,
  onAimOffsetChange,
  onThumbAngleChange,
  mechanicsOverlayEnabled = false,
  materialGhostStage = null,
  onClickHKBoard,
  gatePassed = true,
  onLockedDrawAttempt,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ArcheryScene | null>(null);

  // Drawing & Deep Breath state tracking via refs to avoid React closure lag
  const isHoldingRef = useRef<boolean>(false);
  const isDrawnReadyRef = useRef<boolean>(false);
  const isDeepBreathRef = useRef<boolean>(false);
  const drawStartTimeRef = useRef<number>(0);
  const lastDrawTickTimeRef = useRef<number>(0);
  const effectiveBreathSecRef = useRef<number>(0);
  const drawAnimationTimerRef = useRef<number>(0);
  const pointerPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const gameStateRef = useRef<GameState>(gameState);
  gameStateRef.current = gameState;
  const gatePassedRef = useRef<boolean>(gatePassed);
  gatePassedRef.current = gatePassed;

  const currentBowRef = useRef<BowConfig>(currentBow);
  currentBowRef.current = currentBow;
  const currentRankRef = useRef<MartialRank>(currentRank);
  currentRankRef.current = currentRank;
  const timeOfDayProgressRef = useRef<number>(timeOfDayProgress);
  timeOfDayProgressRef.current = timeOfDayProgress;
  const thumbAngleRef = useRef<number>(thumbAngleDeg);
  thumbAngleRef.current = thumbAngleDeg;

  // Adjust manual thumb-draw release angle (扳指控弦 · 轉決撇弓角)
  const adjustThumbGripAngle = useCallback(
    (deltaDeg?: number, exactDeg?: number, silent: boolean = false) => {
      const current = thumbAngleRef.current;
      const rawNext = exactDeg !== undefined ? exactDeg : current + (deltaDeg ?? 0);
      const nextAngle = Math.max(-25, Math.min(45, Math.round(rawNext)));
      thumbAngleRef.current = nextAngle;

      if (sceneRef.current) {
        sceneRef.current.setThumbGripAngle(nextAngle);
      }
      if (onThumbAngleChange) {
        onThumbAngleChange(nextAngle);
      }
      if (!silent) {
        const optimal = BallisticsEngine.getOptimalThumbAngleDeg(currentBowRef.current, 1.0);
        const isOptimal = Math.abs(nextAngle - optimal) <= 3.5;
        archeryAudio.playThumbRingAdjust(isOptimal);
      }
    },
    [onThumbAngleChange]
  );

  // Baseline wind state & Stochastic Wind Gust Generator state
  const baseWindRef = useRef<{ speed: number; directionAngle: number; directionName: string }>({
    speed: 1.8,
    directionAngle: 0.65,
    directionName: '東風橫吹',
  });

  const gustRef = useRef<{
    active: boolean;
    startTime: number;
    durationMs: number;
    peakDeltaSpeed: number;
    peakDeltaAngle: number;
    gustLabel: string;
    nextAutoTriggerTime: number;
    midDrawTimerId: number | null;
    triggeredMidDrawThisArrow: boolean;
  }>({
    active: false,
    startTime: 0,
    durationMs: 2800,
    peakDeltaSpeed: 0,
    peakDeltaAngle: 0,
    gustLabel: '塞外狂飆突襲',
    nextAutoTriggerTime: performance.now() + 4800,
    midDrawTimerId: null,
    triggeredMidDrawThisArrow: false,
  });

  // Helper to roll a fresh baseline wind for the current martial rank
  const establishBaselineWind = useCallback((rank: MartialRank) => {
    const [minW, maxW] = rank.windRange;
    const speed = minW + Math.random() * (maxW - minW);
    const sign = Math.random() < 0.5 ? -1 : 1;
    const angle = sign * (0.35 + Math.random() * 0.85);
    const dirName = resolveWindDirectionName(angle);

    baseWindRef.current = {
      speed,
      directionAngle: angle,
      directionName: dirName,
    };

    if (gustRef.current.midDrawTimerId !== null) {
      window.clearTimeout(gustRef.current.midDrawTimerId);
      gustRef.current.midDrawTimerId = null;
    }
    gustRef.current.active = false;
    gustRef.current.triggeredMidDrawThisArrow = false;
    gustRef.current.nextAutoTriggerTime = performance.now() + 4200 + Math.random() * 3200;

    if (sceneRef.current) {
      sceneRef.current.setWind(speed, angle, dirName, {
        isGusting: false,
        gustIntensity: 0,
        gustDeltaSpeed: 0,
      });
      archeryAudio.setAmbientEnvironment(
        timeOfDayProgressRef.current,
        speed,
        rank.targetDistance
      );
    }
  }, []);

  // Triggers a transient, strong stochastic Wind Gust event
  const triggerStochasticWindGust = useCallback((isMidDraw: boolean = false) => {
    if (!sceneRef.current || gameStateRef.current === 'impact') return;

    const rank = currentRankRef.current;
    const rankFactor = Math.max(0, Math.min(1, (rank.targetDistance - 30) / 60));

    // Strong transient surge in wind speed (+1.5 to +3.8 m/s)
    const peakDeltaSpeed = 1.5 + rankFactor * 1.25 + Math.random() * 1.1;

    // Transient shift in wind direction angle (±0.34 to ±0.82 rad) requiring manual aim correction
    const shiftSign = Math.random() < 0.55 ? (baseWindRef.current.directionAngle >= 0 ? 1 : -1) : (baseWindRef.current.directionAngle >= 0 ? -1 : 1);
    const peakDeltaAngle = shiftSign * (0.34 + Math.random() * 0.46);

    const durationMs = isMidDraw
      ? 2800 + Math.random() * 900
      : 2500 + Math.random() * 1000;

    const label = GUST_LABELS[Math.floor(Math.random() * GUST_LABELS.length)];

    gustRef.current.active = true;
    gustRef.current.startTime = performance.now();
    gustRef.current.durationMs = durationMs;
    gustRef.current.peakDeltaSpeed = peakDeltaSpeed;
    gustRef.current.peakDeltaAngle = peakDeltaAngle;
    gustRef.current.gustLabel = label;

    archeryAudio.playWindGustSurge(
      baseWindRef.current.speed + peakDeltaSpeed,
      0.78 + rankFactor * 0.22
    );
  }, []);

  // Initialize Scene
  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new ArcheryScene(
      mountRef.current,
      currentBow,
      currentRank.targetDistance,
      (result) => {
        isHoldingRef.current = false;
        isDrawnReadyRef.current = false;
        setGameState('impact');
        onShotCompleted(result);
      },
      undefined,
      (wind) => {
        if (onWindChange) onWindChange(wind);
      },
      (aimOffsetCm) => {
        if (onAimOffsetChange) onAimOffsetChange(aimOffsetCm);
      }
    );
    sceneRef.current = scene;

    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Stochastic Wind Gust Envelope & Periodic Fluctuation Scheduler Loop
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (!sceneRef.current) return;
      const now = performance.now();
      const g = gustRef.current;
      const base = baseWindRef.current;

      if (g.active) {
        const elapsed = now - g.startTime;
        const tNorm = elapsed / g.durationMs;

        if (tNorm >= 1.0) {
          // Gust subsided: smoothly restore baseline wind and schedule next periodic cycle
          g.active = false;
          g.nextAutoTriggerTime = now + 4800 + Math.random() * 3400;
          const nextCountdown = Math.max(0, (g.nextAutoTriggerTime - now) / 1000);
          sceneRef.current.setWind(base.speed, base.directionAngle, base.directionName, {
            isGusting: false,
            gustIntensity: 0,
            gustDeltaSpeed: 0,
            gustDeltaAngle: 0,
            gustPhase: 'calm',
            nextGustCountdownSec: nextCountdown,
          });
          archeryAudio.setAmbientEnvironment(
            timeOfDayProgressRef.current,
            base.speed,
            currentRankRef.current.targetDistance
          );
        } else {
          // Fast-attack, turbulent sustain, smooth-decay gust envelope
          let env = 0;
          if (tNorm < 0.22) {
            env = Math.sin((tNorm / 0.22) * (Math.PI / 2));
          } else if (tNorm < 0.68) {
            env = 1.0 + Math.sin(tNorm * 20.0) * 0.07;
          } else {
            env = Math.cos(((tNorm - 0.68) / 0.32) * (Math.PI / 2));
          }
          const clampedEnv = Math.max(0, Math.min(1.08, env));

          // Add high-frequency directional & speed micro-shears during the gust
          const microTurbulenceSpeed = Math.sin(now * 0.0085) * 0.22 * clampedEnv;
          const microTurbulenceAngle = Math.cos(now * 0.0068) * 0.06 * clampedEnv;

          const instSpeed = Math.max(
            0.4,
            base.speed + g.peakDeltaSpeed * clampedEnv + microTurbulenceSpeed
          );
          const instAngle = Math.max(
            -1.45,
            Math.min(1.45, base.directionAngle + g.peakDeltaAngle * clampedEnv + microTurbulenceAngle)
          );
          const instDirName = resolveWindDirectionName(instAngle);
          const remainingSec = Math.max(0, (g.durationMs - elapsed) / 1000);
          const phase: 'peak' | 'subsiding' = tNorm < 0.68 ? 'peak' : 'subsiding';

          sceneRef.current.setWind(instSpeed, instAngle, instDirName, {
            isGusting: true,
            gustIntensity: Math.min(1, clampedEnv),
            gustDeltaSpeed: instSpeed - base.speed,
            gustDeltaAngle: instAngle - base.directionAngle,
            gustLabel: g.gustLabel,
            gustPhase: phase,
            nextGustCountdownSec: remainingSec,
          });
          archeryAudio.setAmbientEnvironment(
            timeOfDayProgressRef.current,
            instSpeed,
            currentRankRef.current.targetDistance
          );
        }
      } else {
        // Continuous periodic mountain-pass wind oscillation between gusts
        const timeSec = now * 0.001;
        const timeUntilNextGustSec = Math.max(0, (g.nextAutoTriggerTime - now) / 1000);
        const isBuildingUp = timeUntilNextGustSec <= 1.5;

        // Pre-gust swell rises smoothly in the final 1.5 seconds before a gust hits
        const preSwellFactor = isBuildingUp ? Math.pow(1 - timeUntilNextGustSec / 1.5, 1.6) : 0;

        // Subtle periodic fluctuation in speed (±0.32 m/s + pre-swell) and angle (±0.12 rad)
        const periodicSpeedWave =
          Math.sin(timeSec * 1.15) * 0.22 +
          Math.cos(timeSec * 0.65) * 0.1 +
          preSwellFactor * 0.55;
        const periodicAngleWave =
          Math.sin(timeSec * 0.85) * 0.09 +
          Math.cos(timeSec * 1.45) * 0.04 +
          (base.directionAngle >= 0 ? 1 : -1) * preSwellFactor * 0.12;

        const instSpeed = Math.max(0.3, base.speed + periodicSpeedWave);
        const instAngle = Math.max(-1.42, Math.min(1.42, base.directionAngle + periodicAngleWave));
        const instDirName = resolveWindDirectionName(instAngle);

        sceneRef.current.setWind(instSpeed, instAngle, instDirName, {
          isGusting: false,
          gustIntensity: isBuildingUp ? preSwellFactor * 0.38 : Math.abs(periodicSpeedWave) * 0.45,
          gustDeltaSpeed: instSpeed - base.speed,
          gustDeltaAngle: instAngle - base.directionAngle,
          gustPhase: isBuildingUp ? 'building' : 'calm',
          nextGustCountdownSec: timeUntilNextGustSec,
        });

        if (
          (gameStateRef.current === 'idle' ||
            gameStateRef.current === 'drawing' ||
            gameStateRef.current === 'aiming') &&
          now >= g.nextAutoTriggerTime
        ) {
          triggerStochasticWindGust(
            gameStateRef.current === 'drawing' || gameStateRef.current === 'aiming'
          );
        }
      }
    }, 80);

    const onManualGust = () => triggerStochasticWindGust(true);
    window.addEventListener('trigger_wind_gust', onManualGust);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('trigger_wind_gust', onManualGust);
      if (gustRef.current.midDrawTimerId !== null) {
        window.clearTimeout(gustRef.current.midDrawTimerId);
      }
    };
  }, [triggerStochasticWindGust]);

  // Update target distance & wind when martial rank changes
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.buildTarget(currentRank.targetDistance, currentRank.targetRadius);
      establishBaselineWind(currentRank);
      sceneRef.current.readyNextArrow();
      sceneRef.current.clearEmbeddedArrows();
      sceneRef.current.setRemainingArrows(6);
      sceneRef.current.emitAimOffset();
      isHoldingRef.current = false;
      isDrawnReadyRef.current = false;
    }
  }, [currentRank, establishBaselineWind]);

  // Sync remaining arrows in the 3D waist quiver
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.setRemainingArrows(remainingArrows);
    }
  }, [remainingArrows]);

  // Sync bow draw weight & thumb-grip angle with ArcheryAudio & 3D scene
  useEffect(() => {
    archeryAudio.setBowDrawWeight(currentBow.drawWeightLbs);
    const optimal = BallisticsEngine.getOptimalThumbAngleDeg(currentBow, 1.0);
    // Start each bow selection with a slight natural thumb-hook offset (-6° or +6°) so player can feel and tune it
    const initialHookOffset = (Math.random() < 0.5 ? -1 : 1) * 6;
    adjustThumbGripAngle(undefined, optimal + initialHookOffset, true);
  }, [currentBow, adjustThumbGripAngle]);

  // Sync external thumbAngleDeg prop with 3D scene
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.setThumbGripAngle(thumbAngleDeg);
    }
  }, [thumbAngleDeg]);

  // Sync dynamic Time-of-Day lighting progression & modulate environmental background audio
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.setTimeOfDayProgress(timeOfDayProgress);
      archeryAudio.setAmbientEnvironment(
        timeOfDayProgress,
        sceneRef.current.windState.speed,
        currentRank.targetDistance
      );
    }
  }, [timeOfDayProgress, currentRank.targetDistance]);

  // Sync v2 Mechanics Overlay (3D bow limb stress heatmap)
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.setMechanicsOverlayEnabled(mechanicsOverlayEnabled);
    }
  }, [mechanicsOverlayEnabled]);

  // Sync v2 Material Evolution Ghost Trajectory (歷史對照軌跡（模擬）)
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.setMaterialGhostStage(materialGhostStage, currentBow);
    }
  }, [materialGhostStage, currentBow, currentRank.targetDistance]);

  // Event listeners for resetting or advancing arrow
  useEffect(() => {
    const onReadyNext = () => {
      if (sceneRef.current) {
        gustRef.current.triggeredMidDrawThisArrow = false;
        // Introduce a subtle natural thumb-hook variation (-8° to +8° from optimal) when nocking the next arrow
        const optimal = BallisticsEngine.getOptimalThumbAngleDeg(currentBowRef.current, 1.0);
        const sign = Math.random() < 0.55 ? -1 : 1;
        const naturalHookVariance = sign * (4 + Math.floor(Math.random() * 5) * 2);
        adjustThumbGripAngle(undefined, optimal + naturalHookVariance, true);

        sceneRef.current.readyNextArrow();
        isHoldingRef.current = false;
        isDrawnReadyRef.current = false;
        setGameState('idle');
      }
    };
    const onReset = () => {
      if (sceneRef.current) {
        establishBaselineWind(currentRankRef.current);
        const optimal = BallisticsEngine.getOptimalThumbAngleDeg(currentBowRef.current, 1.0);
        adjustThumbGripAngle(undefined, optimal - 6, true);
        sceneRef.current.readyNextArrow();
        sceneRef.current.clearEmbeddedArrows();
        isHoldingRef.current = false;
        isDrawnReadyRef.current = false;
        setGameState('idle');
      }
    };

    window.addEventListener('ready_next_arrow', onReadyNext);
    window.addEventListener('reset_round', onReset);
    return () => {
      window.removeEventListener('ready_next_arrow', onReadyNext);
      window.removeEventListener('reset_round', onReset);
    };
  }, [setGameState, establishBaselineWind, adjustThumbGripAngle]);

  // Update camera mode
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.setCameraMode(cameraMode);
    }
  }, [cameraMode]);

  // Drawing animation loop with frame-integrated Deep Breath stamina trade-off
  const updateDrawing = useCallback(() => {
    if (!sceneRef.current) return;

    const now = performance.now();
    const rawElapsedSec = (now - drawStartTimeRef.current) / 1000;
    const dt = Math.min(0.1, Math.max(0, (now - lastDrawTickTimeRef.current) / 1000));
    lastDrawTickTimeRef.current = now;

    // Tension smoothly rises to 1.0 within 0.6 seconds of physical draw
    const tension = Math.min(1.0, rawElapsedSec / 0.6);

    // If stamina is nearly exhausted (< 6%), Deep Breath automatically breaks (氣竭破息)
    if (isDeepBreathRef.current && effectiveBreathSecRef.current >= 5.15) {
      isDeepBreathRef.current = false;
      sceneRef.current.setDeepBreath(false);
      archeryAudio.playDeepBreathEngage(false);
    }

    // Stamina drain rate: holding Spacebar for Deep Breath stabilizes aim sway by 86%
    // at the cost of 2.2x faster stamina depletion
    const bowDrainFactor = (currentBowRef.current.staminaDrainRate || 0.22) / 0.22;
    const deepBreathDrainMultiplier = isDeepBreathRef.current ? 2.2 : 1.0;
    effectiveBreathSecRef.current += dt * bowDrainFactor * deepBreathDrainMultiplier;

    const effectiveBreathSec = effectiveBreathSecRef.current;
    const stamina = Math.max(0, 1 - effectiveBreathSec / 5.5);
    const isFatigued = effectiveBreathSec > 3.8;

    sceneRef.current.updateDrawTension(tension, effectiveBreathSec, isDeepBreathRef.current);
    onDrawStateChange(tension, stamina, isFatigued, effectiveBreathSec, isDeepBreathRef.current);

    // Continue loop as long as held or drawn
    if (isHoldingRef.current || isDrawnReadyRef.current) {
      drawAnimationTimerRef.current = requestAnimationFrame(updateDrawing);
    }
  }, [onDrawStateChange]);

  // Launch the arrow
  const fireArrow = useCallback(() => {
    if (!sceneRef.current) return;

    if (gustRef.current.midDrawTimerId !== null) {
      window.clearTimeout(gustRef.current.midDrawTimerId);
      gustRef.current.midDrawTimerId = null;
    }

    cancelAnimationFrame(drawAnimationTimerRef.current);
    isHoldingRef.current = false;
    isDrawnReadyRef.current = false;
    isDeepBreathRef.current = false;
    effectiveBreathSecRef.current = 0;

    setGameState('flight');
    sceneRef.current.releaseArrow(currentBow, thumbAngleRef.current);
    onDrawStateChange(0, 1, false, 0, false);
  }, [currentBow, onDrawStateChange, setGameState]);

  // Start Drawing action
  const startDraw = useCallback(() => {
    if (!sceneRef.current) return;

    // Section 6 Gate Lock (CRITICAL): Refuse to begin a draw when gatePassed(stageId) === false
    if (!gatePassedRef.current) {
      if (onLockedDrawAttempt) {
        onLockedDrawAttempt();
      }
      return;
    }

    // If arrow already struck, clicking advances to next arrow
    if (gameStateRef.current === 'impact') {
      onNextArrowRequest();
      return;
    }

    // If in flight, don't interrupt
    if (gameStateRef.current === 'flight') return;

    // If already fully drawn (toggle mode), fire now!
    if (isDrawnReadyRef.current) {
      fireArrow();
      return;
    }

    // Begin drawing
    setGameState('drawing');
    isHoldingRef.current = true;
    isDrawnReadyRef.current = false;
    const now = performance.now();
    drawStartTimeRef.current = now;
    lastDrawTickTimeRef.current = now;
    effectiveBreathSecRef.current = 0;

    // Stochastic Mid-Draw Wind Gust Check: high probability of triggering a sudden gust
    // 0.45s to 1.15s into the draw, requiring the player to reactively adjust aim mid-draw
    if (!gustRef.current.active && !gustRef.current.triggeredMidDrawThisArrow) {
      const rankFactor = Math.max(0, Math.min(1, (currentRankRef.current.targetDistance - 30) / 60));
      const gustChance = 0.65 + rankFactor * 0.22;
      if (Math.random() < gustChance) {
        if (gustRef.current.midDrawTimerId !== null) {
          window.clearTimeout(gustRef.current.midDrawTimerId);
        }
        const delayMs = 450 + Math.random() * 680;
        gustRef.current.midDrawTimerId = window.setTimeout(() => {
          gustRef.current.midDrawTimerId = null;
          if (isHoldingRef.current || isDrawnReadyRef.current) {
            gustRef.current.triggeredMidDrawThisArrow = true;
            triggerStochasticWindGust(true);
          }
        }, delayMs);
      }
    }

    cancelAnimationFrame(drawAnimationTimerRef.current);
    drawAnimationTimerRef.current = requestAnimationFrame(updateDrawing);
  }, [fireArrow, onLockedDrawAttempt, onNextArrowRequest, setGameState, triggerStochasticWindGust, updateDrawing]);

  // End holding (mouse up)
  const stopHolding = useCallback(() => {
    if (!isHoldingRef.current || !sceneRef.current) return;

    const now = performance.now();
    const elapsedSec = (now - drawStartTimeRef.current) / 1000;

    if (elapsedSec < 0.15) {
      // User tapped quickly: keep bow drawn in ready-to-aim stance (Click-to-Draw style)
      // Stamina continues draining and tremor builds if held too long
      isHoldingRef.current = false;
      isDrawnReadyRef.current = true;
      setGameState('aiming');
      cancelAnimationFrame(drawAnimationTimerRef.current);
      drawAnimationTimerRef.current = requestAnimationFrame(updateDrawing);
    } else {
      // User held and released: Shoot!
      fireArrow();
    }
  }, [fireArrow, setGameState, updateDrawing]);

  // Engage or disengage 'Deep Breath' (屏息凝神) when holding Spacebar
  const setDeepBreathActive = useCallback(
    (active: boolean) => {
      if (!sceneRef.current) return;

      if (active) {
        if (!gatePassedRef.current) {
          if (onLockedDrawAttempt) {
            onLockedDrawAttempt();
          }
          return;
        }
        if (gameStateRef.current === 'flight' || gameStateRef.current === 'round_end') return;
        if (gameStateRef.current === 'impact') {
          onNextArrowRequest();
          return;
        }

        // If player presses & holds Spacebar from idle, automatically draw into aiming stance + engage Deep Breath
        if (!isHoldingRef.current && !isDrawnReadyRef.current) {
          startDraw();
          isHoldingRef.current = false;
          isDrawnReadyRef.current = true;
          setGameState('aiming');
        }

        if (!isDeepBreathRef.current && effectiveBreathSecRef.current < 5.0) {
          isDeepBreathRef.current = true;
          sceneRef.current.setDeepBreath(true);
          archeryAudio.playDeepBreathEngage(true);
        }
      } else {
        if (isDeepBreathRef.current) {
          isDeepBreathRef.current = false;
          sceneRef.current.setDeepBreath(false);
          archeryAudio.playDeepBreathEngage(false);
        }
      }
    },
    [onLockedDrawAttempt, onNextArrowRequest, setGameState, startDraw]
  );

  // Window event listeners for UI buttons, manual thumb-grip controls & Deep Breath button
  useEffect(() => {
    const onUiDraw = () => startDraw();
    const onUiFire = () => fireArrow();
    const onUiThumbAdjust = (e: Event) => {
      const custom = e as CustomEvent<{ delta?: number; exact?: number }>;
      if (custom.detail) {
        adjustThumbGripAngle(custom.detail.delta, custom.detail.exact);
      }
    };
    const onAdjustThumbGrip = (e: Event) => {
      const custom = e as CustomEvent<number>;
      if (typeof custom.detail === 'number') {
        adjustThumbGripAngle(custom.detail);
      }
    };
    const onResetThumbGrip = () => {
      const optimal = BallisticsEngine.getOptimalThumbAngleDeg(currentBowRef.current, 1.0);
      adjustThumbGripAngle(undefined, optimal);
    };
    const onUiDeepBreath = (e: Event) => {
      const custom = e as CustomEvent<boolean>;
      setDeepBreathActive(Boolean(custom.detail));
    };

    window.addEventListener('ui_trigger_draw', onUiDraw);
    window.addEventListener('ui_trigger_fire', onUiFire);
    window.addEventListener('ui_adjust_thumb_angle', onUiThumbAdjust);
    window.addEventListener('adjust-thumb-grip', onAdjustThumbGrip);
    window.addEventListener('reset-thumb-grip', onResetThumbGrip);
    window.addEventListener('ui_set_deep_breath', onUiDeepBreath);
    return () => {
      window.removeEventListener('ui_trigger_draw', onUiDraw);
      window.removeEventListener('ui_trigger_fire', onUiFire);
      window.removeEventListener('ui_adjust_thumb_angle', onUiThumbAdjust);
      window.removeEventListener('adjust-thumb-grip', onAdjustThumbGrip);
      window.removeEventListener('reset-thumb-grip', onResetThumbGrip);
      window.removeEventListener('ui_set_deep_breath', onUiDeepBreath);
    };
  }, [startDraw, fireArrow, adjustThumbGripAngle, setDeepBreathActive]);

  // Mouse & Touch events
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // Only primary button
    // Check if the user clicked the 3D side-range Hong Kong Heritage exhibition board while not drawing
    if (
      gameStateRef.current === 'idle' &&
      !isHoldingRef.current &&
      !isDrawnReadyRef.current &&
      sceneRef.current?.checkHKBoardClick(e.clientX, e.clientY)
    ) {
      e.preventDefault();
      if (onClickHKBoard) onClickHKBoard();
      return;
    }

    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Safe fallback
    }
    pointerPosRef.current = { x: e.clientX, y: e.clientY };
    startDraw();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!sceneRef.current) return;
    const dx = e.movementX ?? (e.clientX - pointerPosRef.current.x);
    const dy = e.movementY ?? (e.clientY - pointerPosRef.current.y);
    pointerPosRef.current = { x: e.clientX, y: e.clientY };

    sceneRef.current.applyAimOffset(dx, dy);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Safe fallback
    }
    stopHolding();
  };

  // Keyboard shortcuts:
  // - Hold Spacebar: 'Deep Breath' (屏息凝神) - stabilizes aiming sway by 86% at 2.2x stamina cost
  // - Q / A / ArrowLeft: Rotate thumb-ring inward (-2° 內扣收腕)
  // - E / D / ArrowRight: Rotate thumb-ring outward (+2° 轉決撇弓)
  // - R: Snap thumb-ring to optimal crisp release angle (正法決角)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setDeepBreathActive(true);
      } else if (e.code === 'KeyQ' || e.code === 'KeyA' || e.code === 'ArrowLeft') {
        e.preventDefault();
        adjustThumbGripAngle(-2);
      } else if (e.code === 'KeyE' || e.code === 'KeyD' || e.code === 'ArrowRight') {
        e.preventDefault();
        adjustThumbGripAngle(2);
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        const optimal = BallisticsEngine.getOptimalThumbAngleDeg(currentBowRef.current, 1.0);
        adjustThumbGripAngle(undefined, optimal);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setDeepBreathActive(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setDeepBreathActive, adjustThumbGripAngle]);

  return (
    <div
      ref={mountRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      tabIndex={0}
      className="absolute inset-0 w-full h-full cursor-crosshair overflow-hidden select-none touch-none focus:outline-hidden"
    />
  );
};
