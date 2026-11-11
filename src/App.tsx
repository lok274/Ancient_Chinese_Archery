import React, { useState, useCallback, useEffect } from 'react';
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
import { ArcheryGuideModal, GuideTab } from './components/ArcheryGuideModal';
import { Quiver3DHUD } from './components/Quiver3DHUD';
import { BullseyeCalligraphyEffect } from './components/BullseyeCalligraphyEffect';
import { MaterialEvolutionLab } from './components/MaterialEvolutionLab';
import { MechanicsOverlay } from './components/MechanicsOverlay';
import { RelayHandoffModal } from './components/RelayHandoffModal';
import { HKHeritagePanel } from './components/HKHeritagePanel';
import { MATERIAL_TIMELINE_STAGES } from './data/inquiry/materialTimeline';
import { useInquiryProgress } from './state/useInquiryProgress';
import { useRelaySession } from './state/useRelaySession';
import { archeryAudio } from './audio/ArcheryAudio';
import { createStaticHistoricalNote } from './data/staticHistoricalNotes';

type QueuedModalRequest =
  | { type: 'guide'; tab?: GuideTab; missionId?: string; openDrawer?: boolean }
  | { type: 'hk_heritage' }
  | { type: 'relay' };

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
  const [guideInitialTab, setGuideInitialTab] = useState<GuideTab>('china_olympic');
  const [guideInitialMissionId, setGuideInitialMissionId] = useState<string | undefined>(undefined);
  const [openGuideWithDrawer, setOpenGuideWithDrawer] = useState<boolean>(false);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [showHKHeritage, setShowHKHeritage] = useState<boolean>(false);
  const [showRelayModal, setShowRelayModal] = useState<boolean>(false);

  // v2 Material Evolution Lab Drawer State
  const [isMaterialLabOpen, setIsMaterialLabOpen] = useState<boolean>(false);
  const [materialGhostEnabled, setMaterialGhostEnabled] = useState<boolean>(false);

  // v2 Inquiry Progress & Peer Relay Hooks
  const {
    state: inquiryState,
    storageWarning,
    saveReflection,
    toggleSourceKeyword,
    toggleMechanicsOverlay,
    incrementOverlayShotCount,
    dismissTechPrompt,
    setSelectedMaterialStageId,
    updateAICommentary,
  } = useInquiryProgress();

  const {
    partnerPayload,
    relayError,
    adjustmentReason,
    teamReflection,
    generatedCode,
    generateRelayCode,
    importRelayCode,
    setAdjustmentReason,
    setTeamReflection,
    clearPartnerSession,
  } = useRelaySession();

  // Section 5 Interaction Locking:
  // Inquiry missions, heritage panels, and relay handoff must be unopenable while drawProgress > 0 or stamina < 30.
  const isInteractionLocked =
    drawTension > 0.01 ||
    staminaPercent * 100 < 30 ||
    gameState === 'drawing' ||
    gameState === 'aiming';

  const [queuedModal, setQueuedModal] = useState<QueuedModalRequest | null>(null);
  const [lockHintVisible, setLockHintVisible] = useState<boolean>(false);

  const requestOpenModal = useCallback(
    (req: QueuedModalRequest) => {
      if (isInteractionLocked) {
        setQueuedModal(req);
        setLockHintVisible(true);
        return;
      }
      if (req.type === 'guide') {
        setGuideInitialTab(req.tab || 'china_olympic');
        setGuideInitialMissionId(req.missionId);
        setOpenGuideWithDrawer(Boolean(req.openDrawer));
        setShowGuide(true);
      } else if (req.type === 'hk_heritage') {
        setShowHKHeritage(true);
      } else if (req.type === 'relay') {
        setShowRelayModal(true);
      }
    },
    [isInteractionLocked]
  );

  // Automatically flush queued modal once draw/release completes and stamina recovers
  useEffect(() => {
    if (!isInteractionLocked && queuedModal) {
      const req = queuedModal;
      setQueuedModal(null);
      setLockHintVisible(false);
      if (req.type === 'guide') {
        setGuideInitialTab(req.tab || 'china_olympic');
        setGuideInitialMissionId(req.missionId);
        setOpenGuideWithDrawer(Boolean(req.openDrawer));
        setShowGuide(true);
      } else if (req.type === 'hk_heritage') {
        setShowHKHeritage(true);
      } else if (req.type === 'relay') {
        setShowRelayModal(true);
      }
    }
  }, [isInteractionLocked, queuedModal]);

  // Open Relay Modal automatically if URL hash contains a partner relay code or error on initial load
  useEffect(() => {
    if ((partnerPayload || relayError) && !isInteractionLocked) {
      setShowRelayModal(true);
    }
  }, [partnerPayload, relayError]);

  // Gemini API / Static Fallback Historical Notes State (unlocked when hitting target)
  const [historicalNotes, setHistoricalNotes] = useState<HistoricalNote[]>([]);
  const [isFetchingNote, setIsFetchingNote] = useState<boolean>(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  // Dynamic Time-of-Day State (null = automatic progression from Sunrise to Golden Hour across the 6 arrows)
  const [manualTimePhaseIndex, setManualTimePhaseIndex] = useState<number | null>(null);
  const [roundKey, setRoundKey] = useState<number>(1);

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

  // Handle Shot Impact: when the user hits the target (score > 0), fetch context-aware facts & increment overlay shot counter
  const handleShotCompleted = useCallback(
    (result: ShotResult) => {
      setLastShotResult(result);
      setShotResults((prev) => [...prev, result]);
      incrementOverlayShotCount();

      if (result.score > 0) {
        fetchHistoricalNoteForHit(result);
      }
    },
    [fetchHistoricalNoteForHit, incrementOverlayShotCount]
  );

  // Handle Next Arrow or Exam Conclusion
  const handleNextArrow = useCallback(() => {
    setLastShotResult(null);

    if (currentArrowIndex < MAX_ARROWS_PER_ROUND - 1) {
      setCurrentArrowIndex((prev) => prev + 1);
      setGameState('idle');
      const event = new CustomEvent('ready_next_arrow');
      window.dispatchEvent(event);
    } else {
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
        return null;
      }
      return prev + 1;
    });
  }, [currentArrowIndex]);

  const activeMaterialGhostStage = materialGhostEnabled
    ? MATERIAL_TIMELINE_STAGES.find((s) => s.id === inquiryState.selectedMaterialStageId) ||
      MATERIAL_TIMELINE_STAGES[0]
    : null;

  const annotatedSourceCount = Object.values(inquiryState.sourceAnnotations).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

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
        mechanicsOverlayEnabled={inquiryState.mechanicsOverlayEnabled}
        materialGhostStage={activeMaterialGhostStage}
        onClickHKBoard={() => requestOpenModal({ type: 'hk_heritage' })}
      />

      {/* Interaction Lock Subtle Peripheral Hint (Section 5: 射箭中，完成本箭後開啟) */}
      {lockHintVisible && (
        <div className="fixed top-14 right-4 z-40 pointer-events-none px-3.5 py-2 rounded-lg bg-amber-950/90 border border-amber-400/70 text-amber-200 text-xs font-bold shadow-xl animate-pulse">
          射箭中，完成本箭後開啟
        </div>
      )}

      {/* 2. Top Bar Ritual Contract + v2 Mechanics Overlay & Inquiry Triggers */}
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
        mechanicsOverlayEnabled={inquiryState.mechanicsOverlayEnabled}
        onToggleMechanicsOverlay={toggleMechanicsOverlay}
        onOpenHKHeritage={() => requestOpenModal({ type: 'hk_heritage' })}
        onOpenInquiryMissions={() =>
          requestOpenModal({ type: 'guide', tab: 'inquiry_missions', openDrawer: false })
        }
        onOpenGuide={() =>
          requestOpenModal({
            type: 'guide',
            tab: 'china_olympic',
            openDrawer: historicalNotes.length > 0,
          })
        }
        roundKey={roundKey}
        isVisible={!showSummaryModal}
      />

      {/* 3. Minimal Floating Aim Sight, Windage Calculation & Breath Stamina HUD */}
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

      {/* 3b. v2 Mechanics Overlay (2D Draw-Force Curve + 3D Limb Stress Legend + 3-Shot Inquiry Prompt) */}
      <MechanicsOverlay
        enabled={inquiryState.mechanicsOverlayEnabled}
        drawTension={drawTension}
        currentBow={currentBow}
        overlayEnabledShotCount={inquiryState.overlayEnabledShotCount}
        dismissedTechPrompt={inquiryState.dismissedTechPrompt}
        onDismissTechPrompt={dismissTechPrompt}
        onOpenTechMission={() =>
          requestOpenModal({
            type: 'guide',
            tab: 'inquiry_missions',
            missionId: 'M-TECH-01',
            openDrawer: false,
          })
        }
      />

      {/* 3c. v2 Material Evolution Lab Upward Collapsible Drawer (Bottom-Left Peripheral) */}
      <MaterialEvolutionLab
        isOpen={isMaterialLabOpen}
        onToggleOpen={() => setIsMaterialLabOpen((prev) => !prev)}
        selectedStageId={inquiryState.selectedMaterialStageId}
        onSelectStageId={setSelectedMaterialStageId}
        ghostEnabled={materialGhostEnabled}
        onToggleGhost={setMaterialGhostEnabled}
        currentBow={currentBow}
        currentRank={currentRank}
        windState={windState}
        disabled={gameState !== 'idle'}
      />

      {/* 4. Real-Time 3D Quiver HUD Component */}
      <Quiver3DHUD
        totalArrows={MAX_ARROWS_PER_ROUND}
        currentArrowIndex={currentArrowIndex}
        shotCount={shotResults.length + (gameState === 'flight' ? 1 : 0)}
        gameState={gameState}
      />

      {/* 5. Animated Bullseye Celebration Banner */}
      <BullseyeCalligraphyEffect
        isActive={gameState === 'impact'}
        shotResult={lastShotResult}
        currentRank={currentRank}
        bullseyeCount={shotResults.filter((r) => r.score === 10).length}
        arrowIndex={currentArrowIndex + 1}
      />

      {/* 6. Top-Right Shot Score & National Sports-Tech Support Data Card Banner */}
      {gameState === 'impact' && (
        <ShotScoreBanner
          result={lastShotResult}
          arrowIndex={currentArrowIndex + 1}
          totalArrows={MAX_ARROWS_PER_ROUND}
          frontierPass={currentRank.frontierPass}
          isFetchingNote={isFetchingNote}
          onOpenHistoricalNotes={() =>
            requestOpenModal({ type: 'guide', tab: 'china_olympic', openDrawer: true })
          }
          onNextArrow={handleNextArrow}
        />
      )}

      {/* 7. Collapsible Bottom Control Dock */}
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

      {/* 8. End-of-Round Olympic Scorecard & Relay Handoff Trigger Modal */}
      {showSummaryModal && (
        <ExamSummaryModal
          currentRank={currentRank}
          shotResults={shotResults}
          onRetry={handleResetRound}
          onNextRank={handleNextRank}
          onOpenRelayModal={() => {
            setShowSummaryModal(false);
            setShowRelayModal(true);
          }}
        />
      )}

      {/* 9. 5-Tab Cultural, Historical & Civic Inquiry Guide Modal */}
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
          initialTab={guideInitialTab}
          initialMissionId={guideInitialMissionId}
          onRequestNewNote={() => fetchHistoricalNoteForHit(lastShotResult || undefined)}
          reflections={inquiryState.reflections}
          completedMissionIds={inquiryState.completedMissionIds}
          sourceAnnotations={inquiryState.sourceAnnotations}
          aiCommentary={inquiryState.aiCommentary}
          storageWarning={storageWarning}
          onSaveReflection={saveReflection}
          onToggleSourceKeyword={toggleSourceKeyword}
          onUpdateAICommentary={updateAICommentary}
        />
      )}

      {/* 10. v2 Hong Kong Archery Heritage Panel (Opened from 3D side-range exhibition board) */}
      <HKHeritagePanel
        isOpen={showHKHeritage}
        onClose={() => setShowHKHeritage(false)}
        sourceAnnotations={inquiryState.sourceAnnotations}
        onToggleSourceKeyword={toggleSourceKeyword}
        onOpenHKMission={() => {
          setShowHKHeritage(false);
          setGuideInitialTab('inquiry_missions');
          setGuideInitialMissionId('M-HK-01');
          setOpenGuideWithDrawer(false);
          setShowGuide(true);
        }}
      />

      {/* 11. v2 Peer Relay Collaboration Modal (#relay=<base64url>) */}
      <RelayHandoffModal
        isOpen={showRelayModal}
        onClose={() => setShowRelayModal(false)}
        currentRank={currentRank}
        currentBow={currentBow}
        shotResults={shotResults}
        missionsTouched={inquiryState.completedMissionIds}
        annotatedSourceCount={annotatedSourceCount}
        partnerPayload={partnerPayload}
        relayError={relayError}
        adjustmentReason={adjustmentReason}
        teamReflection={teamReflection}
        generatedCode={generatedCode}
        onGenerateCode={generateRelayCode}
        onImportCode={importRelayCode}
        onChangeAdjustmentReason={setAdjustmentReason}
        onChangeTeamReflection={setTeamReflection}
        onClearPartner={clearPartnerSession}
      />
    </div>
  );
}
