/**
 * Per-Stage Gate Progress Hook (知識准入三態狀態機)
 * Educational Objectives: OBJ-TECH, OBJ-IDENTITY, OBJ-PEER, OBJ-HK
 *
 * Implements Section 8.1 Gate Model:
 * - States: 'unread' -> 'read' -> 'passed'
 * - `unread -> read`: requires `sourceScrollPct >= 0.95` AND `sourceDwellMs >= 20000` (20s minimum). Both conditions required.
 * - `read -> passed`: requires every question in the stage's set answered correctly at least once.
 * - `passed` is sticky and persisted in `localStorage` under key `archery.gate.v2`.
 * - Degrades gracefully in private mode (in-memory state + visible warning).
 */

import { useState, useCallback, useEffect } from 'react';
import { STAGE_QUIZ_BANK } from '../data/inquiry/stageQuizBank';

export type GateState = 'unread' | 'read' | 'passed';

export interface StageGate {
  stageId: string;
  state: GateState;
  sourceScrollPct: number;
  sourceDwellMs: number;
  attempts: Record<string, number>;
  solvedQuestionIds: string[];
  passedAt?: number;
}

const GATE_STORAGE_KEY = 'archery.gate.v2';
export const REQUIRED_SCROLL_PCT = 0.95;
export const REQUIRED_DWELL_MS = 20000; // 20 seconds

function createDefaultGate(stageId: string): StageGate {
  // Optional pseudo-stage heritage-hk is short (20s) and can unlock quiz immediately upon reading or short scroll
  return {
    stageId,
    state: 'unread',
    sourceScrollPct: 0,
    sourceDwellMs: 0,
    attempts: {},
    solvedQuestionIds: [],
  };
}

function loadInitialGates(): { gates: Record<string, StageGate>; storageWarning: boolean } {
  const defaultMap: Record<string, StageGate> = {};
  for (const stageId of Object.keys(STAGE_QUIZ_BANK)) {
    defaultMap[stageId] = createDefaultGate(stageId);
  }

  try {
    const testKey = '__archery_gate_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);

    const raw = window.localStorage.getItem(GATE_STORAGE_KEY);
    if (!raw) {
      return { gates: defaultMap, storageWarning: false };
    }
    const parsed = JSON.parse(raw) as Record<string, StageGate>;
    if (!parsed || typeof parsed !== 'object') {
      return { gates: defaultMap, storageWarning: false };
    }

    const merged: Record<string, StageGate> = { ...defaultMap };
    for (const stageId of Object.keys(STAGE_QUIZ_BANK)) {
      const saved = parsed[stageId];
      if (saved && typeof saved === 'object') {
        merged[stageId] = {
          stageId,
          state:
            saved.state === 'passed' || saved.state === 'read' ? saved.state : 'unread',
          sourceScrollPct:
            typeof saved.sourceScrollPct === 'number'
              ? Math.max(0, Math.min(1, saved.sourceScrollPct))
              : 0,
          sourceDwellMs:
            typeof saved.sourceDwellMs === 'number' ? Math.max(0, saved.sourceDwellMs) : 0,
          attempts:
            saved.attempts && typeof saved.attempts === 'object' ? saved.attempts : {},
          solvedQuestionIds: Array.isArray(saved.solvedQuestionIds)
            ? saved.solvedQuestionIds
            : [],
          passedAt: typeof saved.passedAt === 'number' ? saved.passedAt : undefined,
        };
      }
    }
    return { gates: merged, storageWarning: false };
  } catch {
    return { gates: defaultMap, storageWarning: true };
  }
}

export function useGateProgress() {
  const [{ gates, storageWarning }, setStore] = useState(loadInitialGates);

  useEffect(() => {
    if (storageWarning) return;
    try {
      window.localStorage.setItem(GATE_STORAGE_KEY, JSON.stringify(gates));
    } catch {
      setStore((prev) => ({ ...prev, storageWarning: true }));
    }
  }, [gates, storageWarning]);

  const getStageGate = useCallback(
    (stageId: string): StageGate => {
      return gates[stageId] || createDefaultGate(stageId);
    },
    [gates]
  );

  const isGatePassed = useCallback(
    (stageId: string): boolean => {
      return (gates[stageId]?.state ?? 'unread') === 'passed';
    },
    [gates]
  );

  /**
   * Updates scroll percentage (0..1) and accumulated dwell time (ms) for a stage.
   * Transitions `unread -> read` ONLY when BOTH `sourceScrollPct >= 0.95` AND `sourceDwellMs >= 20000`.
   * (For the optional `heritage-hk` 2-question bonus quiz, reading is shorter: scroll >= 0.95 and dwell >= 5000ms).
   */
  const updateReadingProgress = useCallback(
    (stageId: string, newScrollPct?: number, deltaDwellMs?: number) => {
      setStore((prev) => {
        const current = prev.gates[stageId] || createDefaultGate(stageId);
        const nextScrollPct =
          newScrollPct !== undefined
            ? Math.max(current.sourceScrollPct, Math.min(1, newScrollPct))
            : current.sourceScrollPct;
        const nextDwellMs =
          deltaDwellMs !== undefined
            ? current.sourceDwellMs + Math.max(0, deltaDwellMs)
            : current.sourceDwellMs;

        const minDwell = stageId === 'heritage-hk' ? 5000 : REQUIRED_DWELL_MS;
        const meetsReadCriteria =
          nextScrollPct >= REQUIRED_SCROLL_PCT && nextDwellMs >= minDwell;

        const quizSource = STAGE_QUIZ_BANK[stageId];
        const allQuestionIds = quizSource ? quizSource.questions.map((q) => q.id) : [];
        const allSolved =
          allQuestionIds.length > 0 &&
          allQuestionIds.every((id) => current.solvedQuestionIds.includes(id));

        let nextState: GateState = current.state;
        let nextPassedAt = current.passedAt;

        if (current.state === 'unread' && meetsReadCriteria) {
          nextState = allSolved ? 'passed' : 'read';
          if (nextState === 'passed' && !nextPassedAt) {
            nextPassedAt = Date.now();
          }
        } else if (current.state === 'read' && allSolved) {
          nextState = 'passed';
          if (!nextPassedAt) {
            nextPassedAt = Date.now();
          }
        }

        if (
          nextScrollPct === current.sourceScrollPct &&
          nextDwellMs === current.sourceDwellMs &&
          nextState === current.state
        ) {
          return prev;
        }

        return {
          ...prev,
          gates: {
            ...prev.gates,
            [stageId]: {
              ...current,
              state: nextState,
              sourceScrollPct: nextScrollPct,
              sourceDwellMs: nextDwellMs,
              passedAt: nextPassedAt,
            },
          },
        };
      });
    },
    []
  );

  /**
   * Records an answer attempt for a question in `stageId`.
   * Increments `attempts[questionId]`. If `isCorrect` is true, adds `questionId` to `solvedQuestionIds`.
   * When state is `'read'` (or already `'passed'`) and all questions in the stage are solved, transitions to `'passed'`.
   */
  const recordQuestionAttempt = useCallback(
    (stageId: string, questionId: string, isCorrect: boolean) => {
      setStore((prev) => {
        const current = prev.gates[stageId] || createDefaultGate(stageId);
        const prevAttempts = current.attempts[questionId] || 0;
        const nextAttempts = {
          ...current.attempts,
          [questionId]: prevAttempts + 1,
        };

        const nextSolved =
          isCorrect && !current.solvedQuestionIds.includes(questionId)
            ? [...current.solvedQuestionIds, questionId]
            : current.solvedQuestionIds;

        const quizSource = STAGE_QUIZ_BANK[stageId];
        const allQuestionIds = quizSource ? quizSource.questions.map((q) => q.id) : [];
        const allSolved =
          allQuestionIds.length > 0 &&
          allQuestionIds.every((id) => nextSolved.includes(id));

        let nextState: GateState = current.state;
        let nextPassedAt = current.passedAt;

        if (current.state === 'read' && allSolved) {
          nextState = 'passed';
          if (!nextPassedAt) {
            nextPassedAt = Date.now();
          }
        }

        return {
          ...prev,
          gates: {
            ...prev.gates,
            [stageId]: {
              ...current,
              state: nextState,
              attempts: nextAttempts,
              solvedQuestionIds: nextSolved,
              passedAt: nextPassedAt,
            },
          },
        };
      });
    },
    []
  );

  /**
   * Resets a specific stage's gate back to `unread` (triggered via BottomControlDock `重設本關卡` with confirm click).
   */
  const resetStageGate = useCallback((stageId: string) => {
    setStore((prev) => ({
      ...prev,
      gates: {
        ...prev.gates,
        [stageId]: createDefaultGate(stageId),
      },
    }));
  }, []);

  /**
   * Section 8.7 Integrity Rule:
   * Re-verifies `questionsSolved` from a peer's `gateCertificate` against the local question bank
   * and marks only those specific verified question IDs as solved — NEVER auto-passing a stage
   * that the local student has not read (`state === 'unread'` remains `'unread'`).
   */
  const mergePartnerSolvedQuestions = useCallback(
    (stageId: string, partnerQuestionIds: string[]) => {
      const quizSource = STAGE_QUIZ_BANK[stageId];
      if (!quizSource || !Array.isArray(partnerQuestionIds)) return;

      const validLocalIds = new Set(quizSource.questions.map((q) => q.id));
      const verifiedIds = partnerQuestionIds.filter((id) => validLocalIds.has(id));
      if (verifiedIds.length === 0) return;

      setStore((prev) => {
        const current = prev.gates[stageId] || createDefaultGate(stageId);
        const mergedSolved = Array.from(
          new Set([...current.solvedQuestionIds, ...verifiedIds])
        );
        // Never transition unread -> passed from a certificate alone; student must still read!
        return {
          ...prev,
          gates: {
            ...prev.gates,
            [stageId]: {
              ...current,
              solvedQuestionIds: mergedSolved,
            },
          },
        };
      });
    },
    []
  );

  return {
    gates,
    storageWarning,
    getStageGate,
    isGatePassed,
    updateReadingProgress,
    recordQuestionAttempt,
    resetStageGate,
    mergePartnerSolvedQuestions,
  };
}
