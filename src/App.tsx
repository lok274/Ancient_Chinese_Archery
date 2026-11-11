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
import { BullseyeCalligraphyEffect } from './components/BullseyeCalligraphyEffect';
import { MaterialEvolutionLab } from './components/MaterialEvolutionLab';
import { MechanicsOverlay } from './components/MechanicsOverlay';
import { RelayHandoffModal } from './components/RelayHandoffModal';
import { HKHeritagePanel } from './components/HKHeritagePanel';
import { StageGateModal } from './components/StageGateModal';
import { MATERIAL_TIMELINE_STAGES } from './data/inquiry/materialTimeline';
import { useInquiryProgress } from './state/useInquiryProgress';
import { useGateProgress } from './state/useGateProgress';
import { useRelaySession } from './state/useRelaySession';
import { archeryAudio } from './audio/ArcheryAudio';
import { createStaticHistoricalNote } from './data/staticHistoricalNotes';

type QueuedModalRequest =
  | { type: 'guide'; tab?: GuideTab; openDrawer?: boolean }
  | { type: 'hk_heritage' }
  | { type: 'relay' }
  | { type: 'stage_gate'; stageId?: string };

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
  const [openGuideWithDrawer, setOpenGuideWithDrawer] = useState<boolean>(false);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [showHKHeritage, setShowHKHeritage] = useState<boolean>(false);
  const [showRelayModal, setShowRelayModal] = useState<boolean>(false);

  // v2 Stage Gate Modal / Drawer State (`閱讀資料 -> 完成MC測驗 -> 通過准入`)
  const [isStageGateOpen, setIsStageGateOpen] = useState<boolean>(true);
  const [activeGateStageId, setActiveGateStageId] = useState<string>(MARTIAL_RANKS[0].id);
  const [gateLockToastVisible, setGateLockToastVisible] = useState<boolean>(false);

  // v2 Material Evolution Lab Drawer State
  const [isMaterialLabOpen, setIsMaterialLabOpen] = useState<boolean>(false);
  const [materialGhostEnabled, setMaterialGhostEnabled] = useState<boolean>(false);

  // v2 Gate Progress, Inquiry Progress & Peer Relay Hooks
  const {
    storageWarning: gateStorageWarning,
    getStageGate,
    isGatePassed,
    updateReadingProgress,
    recordQuestionAttempt,
    resetStageGate,
    mergePartnerSolvedQuestions,
  } = useGateProgress();

  const {
    state: inquiryState,
    storageWarning: inquiryStorageWarning,
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

  const currentStageGatePassed = isGatePassed(currentRank.id);
  const isHeritageBadgeEarned = isGatePassed('heritage-hk');
  const passed50mQuiz = isGatePassed('rank_xiucai');

  // Section 5 Interaction Locking:
  // Any panel (including the gate) MUST be unopenable while drawProgress > 0 or stamina < 30.
  const isInteractionLocked =
    drawTension > 0.01 ||
    staminaPercent * 100 < 30 ||
    gameState === 'drawing' ||
    gameState === 'aiming';

  const [queuedModal, setQueuedModal] = useState<QueuedModalRequest | null>(null);
  const [lockHintVisible, setLockHintVisible] = useState<boolean>(false);

  const openModalImmediate = useCallback(
    (req: QueuedModalRequest) => {
      if (req.type === 'guide') {
        setGuideInitialTab(req.tab || 'china_olympic');
        setOpenGuideWithDrawer(Boolean(req.openDrawer));
        setShowGuide(true);
      } else if (req.type === 'hk_heritage') {
        setShowHKHeritage(true);
      } else if (req.type === 'relay') {
        setShowRelayModal(true);
      } else if (req.type === 'stage_gate') {
        setActiveGateStageId(req.stageId || currentRank.id);
        setIsStageGateOpen(true);
      }
    },
    [currentRank.id]
  );

  const requestOpenModal = useCallback(
    (req: QueuedModalRequest) => {
      if (isInteractionLocked) {
        setQueuedModal(req);
        setLockHintVisible(true);
        return;
      }
      openModalImmediate(req);
    },
    [isInteractionLocked, openModalImmediate]
  );

  // Automatically flush queued modal once draw/release completes and stamina recovers
  useEffect(() => {
    if (!isInteractionLocked && queuedModal) {
      const req = queuedModal;
      setQueuedModal(null);
      setLockHintVisible(false);
      openModalImmediate(req);
    }
  }, [isInteractionLocked, queuedModal, openModalImmediate]);

  // Section 8.7: When a partner relay payload is loaded, verify `questionsSolved` against the local question bank
  // and open the RelayHandoffModal (never auto-passing an unread stage).
  useEffect(() => {
    if (partnerPayload) {
      mergePartnerSolvedQuestions(
        partnerPayload.gateCertificate.stageId,
        partnerPayload.gateCertificate.questionsSolved
      );
      if (!isInteractionLocked) {
        setShowRelayModal(true);
      }
    } else if (relayError && !isInteractionLocked) {
      setShowRelayModal(true);
    }
  }, [partnerPayload, relayError, mergePartnerSolvedQuestions]);

  // Trigger peripheral toast when user attempts to draw while gatePassed === false (Section 6)
  const handleLockedDrawAttempt = useCallback(() => {
    setGateLockToastVisible(true);
    window.setTimeout(() => {
      setGateLockToastVisible(false);
    }, 2600);
  }, []);

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

  // Handle Shot Impact
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

  // Switch or advance to another Martial Exam Rank
  const handleSelectRank = useCallback(
    (rank: MartialRank) => {
      setCurrentRank(rank);
      handleResetRound();
      setActiveGateStageId(rank.id);
      if (!isGatePassed(rank.id)) {
        setIsStageGateOpen(true);
      }
    },
    [handleResetRound, isGatePassed]
  );

  const handleNextRank = useCallback(
    (nextRank: MartialRank) => {
      handleSelectRank(nextRank);
    },
    [handleSelectRank]
  );

  // Change Bow
  const handleSelectBow = useCallback(
    (bow: BowConfig) => {
      setCurrentBow(bow);
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
      if (!currentStageGatePassed) {
        handleLockedDrawAttempt();
        return;
      }
      window.dispatchEvent(new CustomEvent('ui_trigger_draw'));
    } else if (gameState === 'drawing' || gameState === 'aiming') {
      window.dispatchEvent(new CustomEvent('ui_trigger_fire'));
    } else if (gameState === 'impact') {
      handleNextArrow();
    }
  }, [gameState, currentStageGatePassed, handleLockedDrawAttempt, handleNextArrow]);

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

  const currentRankIndex = MARTIAL_RANKS.findIndex((r) => r.id === currentRank.id);
  const nextRankObj =
    currentRankIndex < MARTIAL_RANKS.length - 1 ? MARTIAL_RANKS[currentRankIndex + 1] : null;
  const isNextStageGatePassed = nextRankObj ? isGatePassed(nextRankObj.id) : false;

  const activeGateRankTitle =
    activeGateStageId === 'heritage-hk'
      ? '香港射藝文化與內地同源展板'
      : MARTIAL_RANKS.find((r) => r.id === activeGateStageId)?.title || currentRank.title;

  const partnerPreviewBanner =
    partnerPayload &&
    partnerPayload.stageId === activeGateStageId &&
    !isGatePassed(activeGateStageId)
      ? '你的搭檔已研讀此關卡，你可以先自行閱讀資料並作答'
      : null;

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
        gatePassed={currentStageGatePassed}
        onLockedDrawAttempt={handleLockedDrawAttempt}
      />

      {/* Section 5 Interaction Lock Subtle Peripheral Hint (`射箭中，完成本箭後開啟`) */}
      {lockHintVisible && (
        <div className="fixed top-14 right-4 z-40 pointer-events-none px-3.5 py-2 rounded-lg bg-amber-950/90 border border-amber-400/70 text-amber-200 text-xs font-bold shadow-xl animate-pulse">
          射箭中，完成本箭後開啟
        </div>
      )}

      {/* Section 6 Gate-Locked Draw Attempt Peripheral Toast (`請先完成本關卡閱讀與測驗`) */}
      {gateLockToastVisible && (
        <div
          onClick={() =>
            requestOpenModal({ type: 'stage_gate', stageId: currentRank.id })
          }
          className="fixed top-14 right-4 z-40 pointer-events-auto cursor-pointer px-4 py-2.5 rounded-lg bg-red-950/95 border-2 border-amber-400 text-amber-200 text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce"
        >
          <span>請先完成本關卡閱讀與測驗</span>
          <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-bold">
            點擊開啟
          </span>
        </div>
      )}

      {/* 2. Top Bar Ritual Contract + v2 Gate Status Badge & Mechanics Overlay Toggle */}
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
        gatePassed={currentStageGatePassed}
        onOpenStageGate={() =>
          requestOpenModal({ type: 'stage_gate', stageId: currentRank.id })
        }
        onOpenHKHeritage={() => requestOpenModal({ type: 'hk_heritage' })}
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
        gatePassed={currentStageGatePassed}
        onOpenStageGate={() =>
          requestOpenModal({ type: 'stage_gate', stageId: currentRank.id })
        }
        onActionClick={handleHUDAction}
      />

      {/* 3b. v2 Mechanics Overlay (2D Draw-Force Curve + 3D Limb Stress Legend + Dynamic 50m Prompt) */}
      <MechanicsOverlay
        enabled={inquiryState.mechanicsOverlayEnabled}
        drawTension={drawTension}
        currentBow={currentBow}
        passed50mQuiz={passed50mQuiz}
        overlayEnabledShotCount={inquiryState.overlayEnabledShotCount}
        dismissedTechPrompt={inquiryState.dismissedTechPrompt}
        onDismissTechPrompt={dismissTechPrompt}
        onOpen50mQuiz={() =>
          requestOpenModal({ type: 'stage_gate', stageId: 'rank_xiucai' })
        }
        onOpenMaterialLab={() => setIsMaterialLabOpen(true)}
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

      {/* 4. Animated Bullseye Celebration Banner */}
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

      {/* 7. Collapsible Bottom Control Dock with Stage Gate Reset (`重設本關卡`) */}
      <BottomControlDock
        currentBow={currentBow}
        onSelectBow={handleSelectBow}
        currentRank={currentRank}
        onSelectRank={handleSelectRank}
        cameraMode={cameraMode}
        onSelectCameraMode={setCameraMode}
        onResetRound={handleResetRound}
        onResetCurrentStageGate={() => {
          resetStageGate(currentRank.id);
          setActiveGateStageId(currentRank.id);
          setIsStageGateOpen(true);
        }}
        isCurrentStageGatePassed={currentStageGatePassed}
        isStageGatePassed={isGatePassed}
        onOpenStageGate={() =>
          requestOpenModal({ type: 'stage_gate', stageId: currentRank.id })
        }
        disabled={gameState !== 'idle'}
      />

      {/* 8. End-of-Round Olympic Scorecard & Relay Handoff Trigger Modal */}
      {showSummaryModal && (
        <ExamSummaryModal
          currentRank={currentRank}
          shotResults={shotResults}
          isHeritageBadgeEarned={isHeritageBadgeEarned}
          isNextStageGatePassed={isNextStageGatePassed}
          onRetry={handleResetRound}
          onNextRank={handleNextRank}
          onOpenNextStageQuiz={(nextRank) => {
            setShowSummaryModal(false);
            handleSelectRank(nextRank);
          }}
          onOpenRelayModal={() => {
            setShowSummaryModal(false);
            setShowRelayModal(true);
          }}
        />
      )}

      {/* 9. 4-Tab Cultural & Historical Guide Modal */}
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
          onRequestNewNote={() => fetchHistoricalNoteForHit(lastShotResult || undefined)}
        />
      )}

      {/* 10. v2 Hong Kong Archery Heritage Panel (with Section 8.5 `測驗你的認識` trigger) */}
      <HKHeritagePanel
        isOpen={showHKHeritage}
        onClose={() => setShowHKHeritage(false)}
        isHeritageBadgeEarned={isHeritageBadgeEarned}
        sourceAnnotations={inquiryState.sourceAnnotations}
        onToggleSourceKeyword={toggleSourceKeyword}
        onOpenHeritageQuiz={() => {
          setShowHKHeritage(false);
          setActiveGateStageId('heritage-hk');
          setIsStageGateOpen(true);
        }}
      />

      {/* 11. v2 Peer Relay Collaboration Modal (#relay=<base64url>) */}
      <RelayHandoffModal
        isOpen={showRelayModal}
        onClose={() => setShowRelayModal(false)}
        currentRank={currentRank}
        currentBow={currentBow}
        shotResults={shotResults}
        currentStageGate={getStageGate(currentRank.id)}
        isPartnerStagePassedByMe={
          partnerPayload ? isGatePassed(partnerPayload.stageId) : currentStageGatePassed
        }
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
        onOpenStageGateForPartnerStage={(partnerStageId) => {
          const targetRank = MARTIAL_RANKS.find((r) => r.id === partnerStageId);
          if (targetRank && targetRank.id !== currentRank.id) {
            setCurrentRank(targetRank);
            handleResetRound();
          }
          setActiveGateStageId(partnerStageId);
          setIsStageGateOpen(true);
        }}
      />

      {/* 12. v2 Knowledge-Gated Inquiry Modal / Peripheral Drawer (Read -> Quiz -> Pass) */}
      <StageGateModal
        isOpen={isStageGateOpen && !isInteractionLocked}
        stageId={activeGateStageId}
        stageTitle={activeGateRankTitle}
        gate={getStageGate(activeGateStageId)}
        storageWarning={gateStorageWarning || inquiryStorageWarning}
        partnerPreviewBanner={partnerPreviewBanner}
        sourceAnnotations={inquiryState.sourceAnnotations}
        aiCommentary={inquiryState.aiCommentary}
        onUpdateReadingProgress={(scrollPct, deltaDwellMs) =>
          updateReadingProgress(activeGateStageId, scrollPct, deltaDwellMs)
        }
        onRecordAttempt={(questionId, isCorrect) =>
          recordQuestionAttempt(activeGateStageId, questionId, isCorrect)
        }
        onToggleSourceKeyword={toggleSourceKeyword}
        onUpdateAICommentary={updateAICommentary}
        onClose={() => setIsStageGateOpen(false)}
      />
    </div>
  );
}
