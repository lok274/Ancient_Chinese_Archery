/**
 * Inquiry Progress & Reflection Persistence Hook (探究學習進度與反思儲存)
 * Educational Objectives: OBJ-TECH, OBJ-IDENTITY, OBJ-PEER, OBJ-HK
 *
 * Uses localStorage with graceful fallback to in-memory state when localStorage
 * is unavailable (e.g., private browsing mode), surfacing a visible warning flag.
 */

import { useState, useCallback, useEffect } from 'react';

export interface FactCheckChecklist {
  traceableSource: boolean;     // 來源是否可追溯？
  numbersMatchSource: boolean;  // 數字是否與原始材料一致？
  noHyperbole: boolean;         // 是否避免了誇大或情緒化表述？
  nationalHkLink: boolean;      // 是否說明了與香港／國家的關聯？
}

export interface AICommentaryDraftState {
  selectedExhibitId: string;
  fact1: string;
  fact2: string;
  fact3: string;
  checklist: FactCheckChecklist;
  finalVerifiedText: string;
}

export interface InquiryProgressState {
  reflections: Record<string, string>;
  completedMissionIds: string[];
  sourceAnnotations: Record<string, string[]>; // sourceAnchorId -> selected keyword tags
  mechanicsOverlayEnabled: boolean;
  overlayEnabledShotCount: number;
  dismissedTechPrompt: boolean;
  selectedMaterialStageId: string;
  aiCommentary: AICommentaryDraftState;
}

const STORAGE_KEY = 'olympic_archery_civic_inquiry_v2';

const DEFAULT_STATE: InquiryProgressState = {
  reflections: {},
  completedMissionIds: [],
  sourceAnnotations: {
    'SRC-HK-01': ['屏山鄧氏', '清代武舉人'],
  },
  mechanicsOverlayEnabled: false,
  overlayEnabledShotCount: 0,
  dismissedTechPrompt: false,
  selectedMaterialStageId: 'mat_contemporary_carbon',
  aiCommentary: {
    selectedExhibitId: 'SRC-HK-01',
    fact1: '',
    fact2: '',
    fact3: '',
    checklist: {
      traceableSource: false,
      numbersMatchSource: false,
      noHyperbole: false,
      nationalHkLink: false,
    },
    finalVerifiedText: '',
  },
};

export function useInquiryProgress() {
  const [storageWarning, setStorageWarning] = useState<boolean>(false);
  const [state, setState] = useState<InquiryProgressState>(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_STATE,
          ...parsed,
          aiCommentary: {
            ...DEFAULT_STATE.aiCommentary,
            ...(parsed.aiCommentary || {}),
            checklist: {
              ...DEFAULT_STATE.aiCommentary.checklist,
              ...(parsed.aiCommentary?.checklist || {}),
            },
          },
        };
      }
    } catch {
      // Graceful fallback when localStorage is blocked or unavailable
      setStorageWarning(true);
    }
    return DEFAULT_STATE;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      setStorageWarning(true);
    }
  }, [state]);

  const saveReflection = useCallback((missionId: string, text: string) => {
    setState((prev) => {
      const trimmed = text.trim();
      const completed =
        trimmed.length >= 10 && !prev.completedMissionIds.includes(missionId)
          ? [...prev.completedMissionIds, missionId]
          : prev.completedMissionIds;
      return {
        ...prev,
        reflections: { ...prev.reflections, [missionId]: text },
        completedMissionIds: completed,
      };
    });
  }, []);

  const toggleSourceKeyword = useCallback((sourceId: string, keyword: string) => {
    setState((prev) => {
      const current = prev.sourceAnnotations[sourceId] || [];
      const exists = current.includes(keyword);
      const next = exists ? current.filter((k) => k !== keyword) : [...current, keyword];
      return {
        ...prev,
        sourceAnnotations: {
          ...prev.sourceAnnotations,
          [sourceId]: next,
        },
      };
    });
  }, []);

  const toggleMechanicsOverlay = useCallback(() => {
    setState((prev) => ({
      ...prev,
      mechanicsOverlayEnabled: !prev.mechanicsOverlayEnabled,
    }));
  }, []);

  const incrementOverlayShotCount = useCallback(() => {
    setState((prev) => {
      if (!prev.mechanicsOverlayEnabled) return prev;
      return {
        ...prev,
        overlayEnabledShotCount: prev.overlayEnabledShotCount + 1,
      };
    });
  }, []);

  const dismissTechPrompt = useCallback(() => {
    setState((prev) => ({
      ...prev,
      dismissedTechPrompt: true,
    }));
  }, []);

  const setSelectedMaterialStageId = useCallback((stageId: string) => {
    setState((prev) => ({
      ...prev,
      selectedMaterialStageId: stageId,
    }));
  }, []);

  const updateAICommentary = useCallback((patch: Partial<AICommentaryDraftState>) => {
    setState((prev) => ({
      ...prev,
      aiCommentary: {
        ...prev.aiCommentary,
        ...patch,
      },
    }));
  }, []);

  return {
    state,
    storageWarning,
    saveReflection,
    toggleSourceKeyword,
    toggleMechanicsOverlay,
    incrementOverlayShotCount,
    dismissTechPrompt,
    setSelectedMaterialStageId,
    updateAICommentary,
  };
}
