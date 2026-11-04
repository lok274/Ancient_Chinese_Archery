import React, { useEffect, useRef, useCallback } from 'react';
import { ArcheryScene } from '../three/ArcheryScene';
import { BowConfig, MartialRank, ShotResult, CameraViewMode, GameState } from '../types/archery';
import { archeryAudio } from '../audio/ArcheryAudio';

interface ArcheryCanvasProps {
  currentBow: BowConfig;
  currentRank: MartialRank;
  cameraMode: CameraViewMode;
  gameState: GameState;
  remainingArrows: number;
  timeOfDayProgress: number;
  setGameState: (state: GameState) => void;
  onShotCompleted: (result: ShotResult) => void;
  onDrawStateChange: (tension: number, staminaPercent: number, isFatigued: boolean, breathSec: number) => void;
  onNextArrowRequest: () => void;
  onWindChange?: (wind: { speed: number; directionAngle: number; directionName: string }) => void;
}

export const ArcheryCanvas: React.FC<ArcheryCanvasProps> = ({
  currentBow,
  currentRank,
  cameraMode,
  gameState,
  remainingArrows,
  timeOfDayProgress,
  setGameState,
  onShotCompleted,
  onDrawStateChange,
  onNextArrowRequest,
  onWindChange,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ArcheryScene | null>(null);

  // Drawing state tracking via refs to avoid React closure lag
  const isHoldingRef = useRef<boolean>(false);
  const isDrawnReadyRef = useRef<boolean>(false);
  const drawStartTimeRef = useRef<number>(0);
  const drawAnimationTimerRef = useRef<number>(0);
  const pointerPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const gameStateRef = useRef<GameState>(gameState);
  gameStateRef.current = gameState;

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
      }
    );
    sceneRef.current = scene;

    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Update target distance when martial rank changes
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.buildTarget(currentRank.targetDistance, currentRank.targetRadius);
      const [minW, maxW] = currentRank.windRange;
      const speed = minW + Math.random() * (maxW - minW);
      const angle = (Math.random() - 0.5) * Math.PI * 0.8;
      const dirName = angle > 0.2 ? '東南陣風' : angle < -0.2 ? '西北陣風' : '正面穿堂風';
      sceneRef.current.setWind(speed, angle, dirName);
      sceneRef.current.readyNextArrow();
      sceneRef.current.clearEmbeddedArrows();
      sceneRef.current.setRemainingArrows(6);
      isHoldingRef.current = false;
      isDrawnReadyRef.current = false;
    }
  }, [currentRank]);

  // Sync remaining arrows in the 3D waist quiver
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.setRemainingArrows(remainingArrows);
    }
  }, [remainingArrows]);

  // Sync bow draw weight with ArcheryAudio engine
  useEffect(() => {
    archeryAudio.setBowDrawWeight(currentBow.drawWeightLbs);
  }, [currentBow.drawWeightLbs]);

  // Sync dynamic Time-of-Day lighting progression (Sunrise -> Golden Hour)
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.setTimeOfDayProgress(timeOfDayProgress);
    }
  }, [timeOfDayProgress]);

  // Event listeners for resetting or advancing arrow
  useEffect(() => {
    const onReadyNext = () => {
      if (sceneRef.current) {
        sceneRef.current.readyNextArrow();
        isHoldingRef.current = false;
        isDrawnReadyRef.current = false;
        setGameState('idle');
      }
    };
    const onReset = () => {
      if (sceneRef.current) {
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
  }, [setGameState]);

  // Update camera mode
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.setCameraMode(cameraMode);
    }
  }, [cameraMode]);

  // Drawing animation loop
  const updateDrawing = useCallback(() => {
    if (!sceneRef.current) return;

    const now = performance.now();
    const elapsedSec = (now - drawStartTimeRef.current) / 1000;

    // Tension smoothly rises to 1.0 within 0.6 seconds
    const tension = Math.min(1.0, elapsedSec / 0.6);

    // Calculate stamina & fatigue
    const stamina = Math.max(0, 1 - elapsedSec / 5.5);
    const isFatigued = elapsedSec > 3.8;

    sceneRef.current.updateDrawTension(tension, elapsedSec);
    onDrawStateChange(tension, stamina, isFatigued, elapsedSec);

    // Continue loop as long as held or drawn
    if (isHoldingRef.current || isDrawnReadyRef.current) {
      drawAnimationTimerRef.current = requestAnimationFrame(updateDrawing);
    }
  }, [onDrawStateChange]);

  // Launch the arrow
  const fireArrow = useCallback(() => {
    if (!sceneRef.current) return;

    cancelAnimationFrame(drawAnimationTimerRef.current);
    isHoldingRef.current = false;
    isDrawnReadyRef.current = false;

    setGameState('flight');
    sceneRef.current.releaseArrow(currentBow);
    onDrawStateChange(0, 1, false, 0);
  }, [currentBow, onDrawStateChange, setGameState]);

  // Start Drawing action
  const startDraw = useCallback(() => {
    if (!sceneRef.current) return;

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
    drawStartTimeRef.current = performance.now();

    cancelAnimationFrame(drawAnimationTimerRef.current);
    drawAnimationTimerRef.current = requestAnimationFrame(updateDrawing);
  }, [fireArrow, onNextArrowRequest, setGameState, updateDrawing]);

  // End holding (mouse up / key up)
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

  // Window event listeners for UI buttons
  useEffect(() => {
    const onUiDraw = () => startDraw();
    const onUiFire = () => fireArrow();

    window.addEventListener('ui_trigger_draw', onUiDraw);
    window.addEventListener('ui_trigger_fire', onUiFire);
    return () => {
      window.removeEventListener('ui_trigger_draw', onUiDraw);
      window.removeEventListener('ui_trigger_fire', onUiFire);
    };
  }, [startDraw, fireArrow]);

  // Mouse & Touch events
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // Only primary button
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

  // Keyboard shortcut (Space key to draw/release)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        startDraw();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        stopHolding();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [startDraw, stopHolding]);

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
