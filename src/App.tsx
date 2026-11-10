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
  HistoricalNote,
} from './types/archery';
import { ArcheryCanvas } from './components/ArcheryCanvas';
import { TopRitualBar } from './components/TopRitualBar';
import { AimReticleHUD } from './components/AimReticleHUD';
import { BottomControlDock } from './components/BottomControlDock';
import { ShotScoreBanner } from './components/ShotScoreBanner';
import { ExamSummaryModal } from './components/ExamSummaryModal';
import { ArcheryGuideModal } from './components/ArcheryGuideModal';
import { Quiver3DHUD } from './components/Quiver3DHUD';
import { BullseyeCalligraphyEffect } from './components/BullseyeCalligraphyEffect';
import { archeryAudio } from './audio/ArcheryAudio';
import { createStaticHistoricalNote } from './data/staticHistoricalNotes';

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

  // Dynamic Draw, Breath Stamina & Deep Breath Stabilization State
  const [drawTension, setDrawTension] = useState<number>(0);
  const [staminaPercent, setStaminaPercent] = useState<number>(1.0);
  const [isFatigued, setIsFatigued] = useState<boolean>(false);
  const [breathSeconds, setBreathSeconds] = useState<number>(0);
  const [isDeepBreath, setIsDeepBreath] = useState<boolean>(false);

  // Wind State, Live Manual Aim Offset (in cm on target plane) & Manual Thumb-Draw Grip Angle (degrees)
  const [windState, setWindState] = useState<WindState>({
    speed: 1.8,
    directionAngle: Math.PI * 0.25,
    directionName: '東南側風',
  });
  const [aimOffsetCm, setAimOffsetCm] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [thumbAngleDeg, setThumbAngleDeg] = useState<number>(8);

  // Audio & Modals
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [openGuideWithDrawer, setOpenGuideWithDrawer] = useState<boolean>(false);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);

  // Gemini API / Static Fallback Historical Notes State (unlocked when hitting target)
  const [historicalNotes, setHistoricalNotes] = useState<HistoricalNote[]>([]);
  const [isFetchingNote, setIsFetchingNote] = useState<boolean>(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  // Dynamic Time-of-Day State (null = automatic progression from Sunrise to Golden Hour across the 6 arrows)
  const [manualTimePhaseIndex, setManualTimePhaseIndex] = useState<number | null>(null);
  const [roundKey, setRoundKey] = useState<number>(1);

  // Canvas trigger ref to ready next arrow
  const sceneResetRef = useRef<(() => void) | null>(null);

  // Determine active Time-of-Day phase (shifts from Sunrise on Arrow 1 to Golden Hour / Sunset on Arrows 5–6)
  const activeTimePhaseIndex =
    manualTimePhaseIndex !== null
      ? manualTimePhaseIndex
      : Math.min(TIME_OF_DAY_PHASES.length - 1, currentArrowIndex);
  const currentTimePhase = TIME_OF_DAY_PHASES[activeTimePhaseIndex];

  // Fetch context-aware Olympic Team China & Chinese Archery History notes from server-side Gemini API,
  // with automatic local fallback when hosted on pure static hosting such as GitHub Pages.
  const fetchHistoricalNoteForHit = useCallback(
    async (hitResult?: ShotResult) => {
      setIsFetchingNote(true);
      setNoteError(null);

      const payload = {
        frontierPass: currentRank.frontierPass,
        frontierRegion: currentRank.frontierRegion,
        rankTitle: currentRank.title,
        bowName: currentBow.name,
        bowDynasty: currentBow.dynasty,
        targetDistance: currentRank.targetDistance,
        ringName: hitResult ? hitResult.ringName : '9環！黃金內圈',
        score: hitResult ? hitResult.score : 9,
        windName: windState.directionName,
        timeOfDay: `${currentTimePhase.shichen} · ${currentTimePhase.name}`,
        arrowIndex: hitResult ? hitResult.arrowIndex : currentArrowIndex + 1,
      };

      try {
        const response = await fetch('/api/historical-notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const contentType = response.headers.get('content-type') || '';
        if (!response.ok || !contentType.includes('application/json')) {
          throw new Error('Static host fallback');
        }

        const data = await response.json();
        if (!data.success || !data.note) {
          throw new Error('Static host fallback');
        }

        setHistoricalNotes((prev) => [data.note as HistoricalNote, ...prev]);
      } catch {
        // Seamless static fallback for GitHub Pages (where /api/* Express routes do not run)
        const fallbackNote = createStaticHistoricalNote(payload);
        setHistoricalNotes((prev) => [fallbackNote, ...prev]);
      } finally {
        setIsFetchingNote(false);
      }
    },
    [currentRank, currentBow, windState.directionName, currentTimePhase, currentArrowIndex]
  );

  // Toggle Mute
  const handleToggleMute = useCallback(() => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    archeryAudio.setMuted(nextMute);
  }, [isMuted]);

  // Handle Shot Impact: when the user hits the target (score > 0), fetch context-aware facts for the frontier pass
  const handleShotCompleted = useCallback(
    (result: ShotResult) => {
      setLastShotResult(result);
      setShotResults((prev) => [...prev, result]);

      if (result.score > 0) {
        fetchHistoricalNoteForHit(result);
      }
    },
    [fetchHistoricalNoteForHit]
  );

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
  const handleNextRank = useCallback(
    (nextRank: MartialRank) => {
      setCurrentRank(nextRank);
      handleResetRound();
    },
    [handleResetRound]
  );

  // Change Bow
  const handleSelectBow = useCallback(
    (bow: BowConfig) => {
      setCurrentBow(bow);
      handleResetRound();
    },
    [handleResetRound]
  );

  // Change Rank manually
  const handleSelectRank = useCallback(
    (rank: MartialRank) => {
      setCurrentRank(rank);
      handleResetRound();
    },
    [handleResetRound]
  );

  // Handle Draw state updates from ArcheryCanvas
  const handleDrawStateChange = useCallback(
    (
      tension: number,
      stamina: number,
      fatigued: boolean,
      breathSec: number,
      deepBreath: boolean
    ) => {
      setDrawTension(tension);
      setStaminaPercent(stamina);
      setIsFatigued(fatigued);
      setBreathSeconds(breathSec);
      setIsDeepBreath(deepBreath);
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

  const handleOpenGuideWithDrawer = useCallback(() => {
    setOpenGuideWithDrawer(true);
    setShowGuide(true);
  }, []);

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
        thumbAngleDeg={thumbAngleDeg}
        setGameState={setGameState}
        onShotCompleted={handleShotCompleted}
        onDrawStateChange={handleDrawStateChange}
        onNextArrowRequest={handleNextArrow}
        onWindChange={setWindState}
        onAimOffsetChange={setAimOffsetCm}
        onThumbAngleChange={setThumbAngleDeg}
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
        onOpenGuide={() => {
          setOpenGuideWithDrawer(historicalNotes.length > 0);
          setShowGuide(true);
        }}
        roundKey={roundKey}
        isVisible={!showSummaryModal}
      />

      {/* 3. Minimal Floating Aim Sight, Windage Calculation, Manual Grip Control & Breath Stamina HUD */}
      <AimReticleHUD
        gameState={gameState}
        drawTension={drawTension}
        staminaPercent={staminaPercent}
        isFatigued={isFatigued}
        breathSeconds={breathSeconds}
        isDeepBreath={isDeepBreath}
        windState={windState}
        currentRank={currentRank}
        currentBow={currentBow}
        aimOffsetCm={aimOffsetCm}
        thumbAngleDeg={thumbAngleDeg}
        onActionClick={handleHUDAction}
      />

      {/* 4. Real-Time 3D Ming-Era Quiver HUD Component */}
      <Quiver3DHUD
        totalArrows={MAX_ARROWS_PER_ROUND}
        currentArrowIndex={currentArrowIndex}
        shotCount={shotResults.length + (gameState === 'flight' ? 1 : 0)}
        gameState={gameState}
      />

      {/* 5. Animated Ink-Wash Calligraphy Effect on Bullseye Hit */}
      <BullseyeCalligraphyEffect
        isActive={gameState === 'impact'}
        shotResult={lastShotResult}
        currentRank={currentRank}
        bullseyeCount={shotResults.filter((r) => r.score === 10).length}
        arrowIndex={currentArrowIndex + 1}
      />

      {/* 6. Shot Score Callout Banner upon impact */}
      {gameState === 'impact' && (
        <ShotScoreBanner
          result={lastShotResult}
          arrowIndex={currentArrowIndex + 1}
          totalArrows={MAX_ARROWS_PER_ROUND}
          frontierPass={currentRank.frontierPass}
          isFetchingNote={isFetchingNote}
          onOpenHistoricalNotes={handleOpenGuideWithDrawer}
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

      {/* 7. End-of-Round Martial Exam Modal */}
      {showSummaryModal && (
        <ExamSummaryModal
          currentRank={currentRank}
          shotResults={shotResults}
          onRetry={handleResetRound}
          onNextRank={handleNextRank}
        />
      )}

      {/* 8. Cultural & Historical Knowledge Guide Modal with Gemini 'Historical Notes' Drawer */}
      {showGuide && (
        <ArcheryGuideModal
          onClose={() => {
            setShowGuide(false);
            setOpenGuideWithDrawer(false);
          }}
          currentRank={currentRank}
          currentBow={currentBow}
          historicalNotes={historicalNotes}
          isFetchingNote={isFetchingNote}
          noteError={noteError}
          initialOpenDrawer={openGuideWithDrawer}
          onRequestNewNote={() => fetchHistoricalNoteForHit(lastShotResult || undefined)}
        />
      )}
    </div>
  );
}
