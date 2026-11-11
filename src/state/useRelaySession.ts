/**
 * Peer Relay Collaboration Session Hook (同儕接力協作狀態管理)
 * Educational Objective: OBJ-PEER — 透過同儕協作推動認識國家
 *
 * Implements Section 8.7:
 * - Handoff code: base64url(JSON) of `{ v: 2, stageId, gateCertificate, shots: { count, avgScore, bestScore, avgDrift }, quizAttempts, telemetrySummary }`.
 * - Payload cap 2 KB. Never encode full trajectories, personal data, names, or free-text reflections.
 * - Defensive parsing: malformed/foreign hashes show `接力碼無效` and clear the hash.
 */

import { useState, useEffect, useCallback } from 'react';
import { ShotResult } from '../types/archery';

export interface GateCertificate {
  stageId: string;
  passedAt: number;
  questionsSolved: string[];
}

export interface RelayNumericShotsSummary {
  count: number;
  avgScore: number;
  bestScore: number;
  avgDrift: number;
}

export interface RelayTelemetrySummary {
  rankId: string;
  bowId: string;
  totalScore: number;
  avgScore: number;
  bullseyes: number;
  avgWindSpeed: number;
  annotatedSourceCount: number;
}

export interface RelayPayloadV2 {
  v: 2;
  stageId: string;
  gateCertificate: GateCertificate;
  shots: RelayNumericShotsSummary;
  quizAttempts: Record<string, number>;
  telemetrySummary: RelayTelemetrySummary;
}

const RELAY_STORAGE_KEY = 'olympic_archery_relay_local_v2';
const MAX_PAYLOAD_BYTES = 2048;

function encodeBase64Url(jsonStr: string): string {
  const bytes = new TextEncoder().encode(jsonStr);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeBase64Url(b64url: string): string {
  const base64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '==='.slice((base64.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function isValidRelayPayload(obj: unknown): obj is RelayPayloadV2 {
  if (!obj || typeof obj !== 'object') return false;
  const candidate = obj as Partial<RelayPayloadV2>;
  if (candidate.v !== 2) return false;
  if (typeof candidate.stageId !== 'string' || !candidate.stageId) return false;

  const cert = candidate.gateCertificate;
  if (
    !cert ||
    typeof cert !== 'object' ||
    typeof cert.stageId !== 'string' ||
    typeof cert.passedAt !== 'number' ||
    !Array.isArray(cert.questionsSolved) ||
    !cert.questionsSolved.every((q) => typeof q === 'string')
  ) {
    return false;
  }

  const shots = candidate.shots;
  if (
    !shots ||
    typeof shots !== 'object' ||
    typeof shots.count !== 'number' ||
    typeof shots.avgScore !== 'number' ||
    typeof shots.bestScore !== 'number' ||
    typeof shots.avgDrift !== 'number'
  ) {
    return false;
  }

  if (!candidate.quizAttempts || typeof candidate.quizAttempts !== 'object') {
    return false;
  }
  for (const [k, v] of Object.entries(candidate.quizAttempts)) {
    if (typeof k !== 'string' || typeof v !== 'number') return false;
  }

  const ts = candidate.telemetrySummary;
  if (
    !ts ||
    typeof ts !== 'object' ||
    typeof ts.rankId !== 'string' ||
    typeof ts.bowId !== 'string' ||
    typeof ts.totalScore !== 'number' ||
    typeof ts.avgScore !== 'number'
  ) {
    return false;
  }

  return true;
}

export function useRelaySession() {
  const [partnerPayload, setPartnerPayload] = useState<RelayPayloadV2 | null>(null);
  const [relayError, setRelayError] = useState<string | null>(null);
  const [adjustmentReason, setAdjustmentReasonState] = useState<string>('');
  const [teamReflection, setTeamReflectionState] = useState<string>('');
  const [generatedCode, setGeneratedCode] = useState<string>('');

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RELAY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.adjustmentReason === 'string') {
          setAdjustmentReasonState(parsed.adjustmentReason);
        }
        if (typeof parsed.teamReflection === 'string') {
          setTeamReflectionState(parsed.teamReflection);
        }
      }
    } catch {
      // Ignore private mode errors
    }
  }, []);

  const parseCurrentHash = useCallback(() => {
    const hash = window.location.hash || '';
    if (!hash.startsWith('#relay=')) return;

    const rawCode = hash.slice('#relay='.length).trim();
    if (!rawCode) return;

    try {
      if (rawCode.length > MAX_PAYLOAD_BYTES) {
        throw new Error('Payload exceeds 2KB cap');
      }
      const jsonStr = decodeBase64Url(rawCode);
      if (new TextEncoder().encode(jsonStr).length > MAX_PAYLOAD_BYTES) {
        throw new Error('Decoded payload exceeds 2KB cap');
      }
      const parsed = JSON.parse(jsonStr);
      if (!isValidRelayPayload(parsed)) {
        throw new Error('Invalid schema');
      }
      setPartnerPayload(parsed);
      setRelayError(null);
    } catch {
      setPartnerPayload(null);
      setRelayError('接力碼無效');
      try {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      } catch {
        window.location.hash = '';
      }
    }
  }, []);

  useEffect(() => {
    parseCurrentHash();
    window.addEventListener('hashchange', parseCurrentHash);
    return () => window.removeEventListener('hashchange', parseCurrentHash);
  }, [parseCurrentHash]);

  const importRelayCode = useCallback((input: string): boolean => {
    const trimmed = input.trim();
    const extracted = trimmed.includes('#relay=')
      ? trimmed.split('#relay=')[1].trim()
      : trimmed.replace(/^relay=/i, '').trim();

    if (!extracted) {
      setRelayError('接力碼無效');
      return false;
    }

    try {
      if (extracted.length > MAX_PAYLOAD_BYTES) {
        throw new Error('Payload too large');
      }
      const jsonStr = decodeBase64Url(extracted);
      if (new TextEncoder().encode(jsonStr).length > MAX_PAYLOAD_BYTES) {
        throw new Error('Decoded payload exceeds 2KB cap');
      }
      const parsed = JSON.parse(jsonStr);
      if (!isValidRelayPayload(parsed)) {
        throw new Error('Schema mismatch');
      }
      setPartnerPayload(parsed);
      setRelayError(null);
      window.location.hash = `relay=${extracted}`;
      return true;
    } catch {
      setPartnerPayload(null);
      setRelayError('接力碼無效');
      try {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      } catch {
        window.location.hash = '';
      }
      return false;
    }
  }, []);

  const generateRelayCode = useCallback(
    (
      stageId: string,
      bowId: string,
      shotResults: ShotResult[],
      gateCertificate: GateCertificate,
      quizAttempts: Record<string, number>,
      annotatedSourceCount: number
    ): string => {
      const count = shotResults.length;
      const totalScore = shotResults.reduce((acc, r) => acc + r.score, 0);
      const avgScore = count > 0 ? Math.round((totalScore / count) * 10) / 10 : 0;
      const bestScore = count > 0 ? Math.max(...shotResults.map((r) => r.score)) : 0;
      const avgDrift =
        count > 0
          ? Math.round(
              (shotResults.reduce((acc, r) => acc + r.distanceFromCenter * 100, 0) / count) * 10
            ) / 10
          : 0;
      const bullseyes = shotResults.filter((r) => r.score === 10).length;
      const avgWindSpeed =
        count > 0
          ? Math.round(
              (shotResults.reduce((acc, r) => acc + r.windSpeed, 0) / count) * 10
            ) / 10
          : 0;

      // Sanitize quizAttempts to integer counts only
      const cleanAttempts: Record<string, number> = {};
      for (const [k, v] of Object.entries(quizAttempts)) {
        if (typeof v === 'number' && Number.isFinite(v)) {
          cleanAttempts[k] = Math.round(v);
        }
      }

      const payload: RelayPayloadV2 = {
        v: 2,
        stageId,
        gateCertificate: {
          stageId: gateCertificate.stageId,
          passedAt: gateCertificate.passedAt || Date.now(),
          questionsSolved: gateCertificate.questionsSolved.slice(0, 10),
        },
        shots: {
          count,
          avgScore,
          bestScore,
          avgDrift,
        },
        quizAttempts: cleanAttempts,
        telemetrySummary: {
          rankId: stageId,
          bowId,
          totalScore,
          avgScore,
          bullseyes,
          avgWindSpeed,
          annotatedSourceCount,
        },
      };

      const jsonStr = JSON.stringify(payload);
      const code = encodeBase64Url(jsonStr);
      setGeneratedCode(code);
      try {
        window.location.hash = `relay=${code}`;
      } catch {
        // Ignore if blocked
      }
      return code;
    },
    []
  );

  const setAdjustmentReason = useCallback((reason: string) => {
    setAdjustmentReasonState(reason);
    try {
      const raw = window.localStorage.getItem(RELAY_STORAGE_KEY);
      const prev = raw ? JSON.parse(raw) : {};
      window.localStorage.setItem(
        RELAY_STORAGE_KEY,
        JSON.stringify({ ...prev, adjustmentReason: reason })
      );
    } catch {
      // Ignore private mode errors
    }
  }, []);

  const setTeamReflection = useCallback((reflection: string) => {
    setTeamReflectionState(reflection);
    try {
      const raw = window.localStorage.getItem(RELAY_STORAGE_KEY);
      const prev = raw ? JSON.parse(raw) : {};
      window.localStorage.setItem(
        RELAY_STORAGE_KEY,
        JSON.stringify({ ...prev, teamReflection: reflection })
      );
    } catch {
      // Ignore private mode errors
    }
  }, []);

  const clearPartnerSession = useCallback(() => {
    setPartnerPayload(null);
    setRelayError(null);
    try {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    } catch {
      window.location.hash = '';
    }
  }, []);

  return {
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
    dismissRelayError: () => setRelayError(null),
  };
}
