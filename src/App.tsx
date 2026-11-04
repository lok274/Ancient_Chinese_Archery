import React, { useState, useCallback, useRef } from 'react';
import {
  MARTIAL_RANKS,
  BOW_PRESETS,
  MAX_ARROWS_PER_ROUND,
  TIME_OF_DAY_PHASES,
  MartialRank,
  BowConfig,
  CameraViewMode,
  GameState,
  ShotResult,
  WindState,
} from './types/archery';
import { ArcheryCanvas } from './components/ArcheryCanvas';
import { TopRitualBar } from './components/TopRitualBar';
import { AimReticleHUD } from './components/AimReticleHUD';
import { BottomControlDock } from './components/BottomControlDock';
import { ShotScoreBanner } from './components/ShotScoreBanner';
import { ExamSummaryModal } from './components/ExamSummaryModal';
import { ArcheryGuideModal } from './components/ArcheryGuideModal';
import { Quiver3DHUD } from './components/Quiver3DHUD';
import { archeryAudio } from './audio/ArcheryAudio';

export default function App() {
  // Game Setup State
  const [currentRank, setCurrentRank] = useState<MartialRank>(MARTIAL_RANKS[0]);
  const [currentBow, setCurrentBow] = useState<BowConfig>(BOW_PRESETS[0]);
  const [cameraMode, setCameraMode] = useState<CameraViewMode>('first_person');
  const [gameState, setGameState] = useState<GameState>('idle');

  // Round & Shot Progression State
  const [currentArrowIndex, setCurrentArrowIndex] = useState<number>(0);
  const [shotResults, setShotResults] = useState<ShotResult[]>([]);
  const [lastShotResult, setLastShotResult] = useState<ShotResult | null>(null);

  // Dynamic Draw & Breath Stamina
  const [drawTension, setDrawTension] = useState<number>(0);
  const [staminaPercent, setStaminaPercent] = useState<number>(1.0);
  const [isFatigued, setIsFatigued] = useState<boolean>(false);
  const [breathSeconds, setBreathSeconds] = useState<number>(0);

  // Wind State
  const [windState, setWindState] = useState<WindState>({
    speed: 1.8,
    directionAngle: Math.PI * 0.25,
    directionName: '東南微風 二級',
  });

  // Audio & Modals
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);

  // Dynamic Time-of-Day State (null = automatic progression from Sunrise to Golden Hour across the 6 arrows)
  const [manualTimePhaseIndex, setManualTimePhaseIndex] = useState<number | null>(null);
  const [roundKey, setRoundKey] = useState<number>(1);

  // Canvas trigger ref to ready next arrow
  const sceneResetRef = useRef<(() => void) | null>(null);

  // Toggle Mute
  const handleToggleMute = useCallback(() => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    archeryAudio.setMuted(nextMute);
  }, [isMuted]);

  // Handle Shot Impact
  const handleShotCompleted = useCallback((result: ShotResult) => {
    setLastShotResult(result);
    setShotResults((prev) => [...prev, result]);
  }, []);

  // Handle Next Arrow or Exam Conclusion
  const handleNextArrow = useCallback(() => {
    setLastShotResult(null);

    if (currentArrowIndex < MAX_ARROWS_PER_ROUND - 1) {
      setCurrentArrowIndex((prev) => prev + 1);
      setGameState('idle');
      // Ready next arrow in canvas
      const event = new CustomEvent('ready_next_arrow');
      window.dispatchEvent(event);
    } else {
      // Completed all 6 arrows of martial exam round
      setGameState('round_end');
      setShowSummaryModal(true);
    }
  }, [currentArrowIndex]);

  // Reset current round
  const handleResetRound = useCallback(() => {
    setCurrentArrowIndex(0);
    setShotResults([]);
    setLastShotResult(null);
    setGameState('idle');
    setShowSummaryModal(false);
    setManualTimePhaseIndex(null);
    setRoundKey((prev) => prev + 1);

    // Trigger canvas reset
    const event = new CustomEvent('reset_round');
    window.dispatchEvent(event);
  }, []);

  // Advance to next Martial Exam Rank
  const handleNextRank = useCallback((nextRank: MartialRank) => {
    setCurrentRank(nextRank);
    handleResetRound();
  }, [handleResetRound]);

  // Change Bow
  const handleSelectBow = useCallback((bow: BowConfig) => {
    setCurrentBow(bow);
    handleResetRound();
  }, [handleResetRound]);

  // Change Rank manually
  const handleSelectRank = useCallback((rank: MartialRank) => {
    setCurrentRank(rank);
    handleResetRound();
  }, [handleResetRound]);

  // Handle Draw state updates from ArcheryCanvas
  const handleDrawStateChange = useCallback(
    (tension: number, stamina: number, fatigued: boolean, breathSec: number) => {
      setDrawTension(tension);
      setStaminaPercent(stamina);
      setIsFatigued(fatigued);
      setBreathSeconds(breathSec);
    },
    []
  );

  // Handle HUD on-screen action click
  const handleHUDAction = useCallback(() => {
    if (gameState === 'idle') {
      window.dispatchEvent(new CustomEvent('ui_trigger_draw'));
    } else if (gameState === 'drawing' || gameState === 'aiming') {
      window.dispatchEvent(new CustomEvent('ui_trigger_fire'));
    } else if (gameState === 'impact') {
      handleNextArrow();
    }
  }, [gameState, handleNextArrow]);

  // Remaining arrows in the quiver (excluding arrows already fired and the one currently in flight)
  const remainingInQuiver = Math.max(
    0,
    MAX_ARROWS_PER_ROUND - shotResults.length - (gameState === 'flight' ? 1 : 0)
  );

  // Determine active Time-of-Day phase (shifts from Sunrise on Arrow 1 to Golden Hour / Sunset on Arrows 5–6)
  const activeTimePhaseIndex =
    manualTimePhaseIndex !== null
      ? manualTimePhaseIndex
      : Math.min(TIME_OF_DAY_PHASES.length - 1, currentArrowIndex);
  const currentTimePhase = TIME_OF_DAY_PHASES[activeTimePhaseIndex];

  const handleCycleTimePhase = useCallback(() => {
    setManualTimePhaseIndex((prev) => {
      if (prev === null) {
        return (currentArrowIndex + 1) % TIME_OF_DAY_PHASES.length;
      }
      if (prev === TIME_OF_DAY_PHASES.length - 1) {
        return null; // Return to automatic exam progression
      }
      return prev + 1;
    });
  }, [currentArrowIndex]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-stone-950 font-serif select-none">
      {/* 1. 3D Archery Viewport Canvas */}
      <ArcheryCanvas
        currentBow={currentBow}
        currentRank={currentRank}
        cameraMode={cameraMode}
        gameState={gameState}
        remainingArrows={remainingInQuiver}
        timeOfDayProgress={currentTimePhase.progress}
        setGameState={setGameState}
        onShotCompleted={handleShotCompleted}
        onDrawStateChange={handleDrawStateChange}
        onNextArrowRequest={handleNextArrow}
        onWindChange={setWindState}
      />

      {/* 2. Top Bar Ritual Contract */}
      <TopRitualBar
        currentRank={currentRank}
        currentArrowIndex={currentArrowIndex}
        totalArrows={MAX_ARROWS_PER_ROUND}
        shotScores={shotResults.map((r) => r.score)}
        currentTimePhase={currentTimePhase}
        isManualTimeOverride={manualTimePhaseIndex !== null}
        onCycleTimePhase={handleCycleTimePhase}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenGuide={() => setShowGuide(true)}
        roundKey={roundKey}
        isVisible={!showSummaryModal}
      />

      {/* 3. Minimal Floating Aim Sight & Breath Stamina HUD */}
      <AimReticleHUD
        gameState={gameState}
        drawTension={drawTension}
        staminaPercent={staminaPercent}
        isFatigued={isFatigued}
        breathSeconds={breathSeconds}
        windState={windState}
        onActionClick={handleHUDAction}
      />

      {/* 4. Real-Time 3D Ming-Era Quiver HUD Component */}
      <Quiver3DHUD
        totalArrows={MAX_ARROWS_PER_ROUND}
        currentArrowIndex={currentArrowIndex}
        shotCount={shotResults.length + (gameState === 'flight' ? 1 : 0)}
        gameState={gameState}
      />

      {/* 5. Shot Score Callout Banner upon impact */}
      {gameState === 'impact' && (
        <ShotScoreBanner
          result={lastShotResult}
          arrowIndex={currentArrowIndex + 1}
          totalArrows={MAX_ARROWS_PER_ROUND}
          onNextArrow={handleNextArrow}
        />
      )}

      {/* 6. Collapsible Bottom Control Dock (Zero Viewport Occlusion) */}
      <BottomControlDock
        currentBow={currentBow}
        onSelectBow={handleSelectBow}
        currentRank={currentRank}
        onSelectRank={handleSelectRank}
        cameraMode={cameraMode}
        onSelectCameraMode={setCameraMode}
        onResetRound={handleResetRound}
        disabled={gameState !== 'idle'}
      />

      {/* 6. End-of-Round Martial Exam Modal */}
      {showSummaryModal && (
        <ExamSummaryModal
          currentRank={currentRank}
          shotResults={shotResults}
          onRetry={handleResetRound}
          onNextRank={handleNextRank}
        />
      )}

      {/* 7. Cultural & Historical Knowledge Guide Modal */}
      {showGuide && <ArcheryGuideModal onClose={() => setShowGuide(false)} />}
    </div>
  );
}
