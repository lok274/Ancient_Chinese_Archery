/**
 * Peer Relay Collaboration Session Hook (同儕接力協作狀態管理)
 * Educational Objective: OBJ-PEER — 透過同儕協作推動認識國家
 *
 * Constraints:
 * - Browser-only: localStorage + URL hash (#relay=<base64url>).
 * - Payload cap 2 KB (truncates shots to compact numeric records if needed).
 * - ZERO personal data or free-text reflections in the URL hash.
 * - Defensive parsing: malformed/foreign hashes show "接力碼無效" and clear the hash.
 */

import { useState, useEffect, useCallback } from 'react';
import { ShotResult } from '../types/archery';

export interface CompactShotRecord {
  idx: number;
  s: number;      // score (0-10)
  dCm: number;    // distanceFromCenter in cm
  wSpd: number;   // windSpeed m/s
  tAng: number;   // thumbAngleDeg
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
  shots: CompactShotRecord[];
  telemetrySummary: RelayTelemetrySummary;
  missionsTouched: string[];
  keywordTagIndices?: Record<string, number[]>; // sourceId -> indices of suggestedKeywords (no free text!)
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
  if (!Array.isArray(candidate.shots)) return false;
  if (!candidate.telemetrySummary || typeof candidate.telemetrySummary !== 'object') return false;
  const ts = candidate.telemetrySummary;
  if (
    typeof ts.rankId !== 'string' ||
    typeof ts.bowId !== 'string' ||
    typeof ts.totalScore !== 'number' ||
    typeof ts.avgScore !== 'number'
  ) {
    return false;
  }
  if (!Array.isArray(candidate.missionsTouched)) return false;
  return true;
}

export function useRelaySession() {
  const [partnerPayload, setPartnerPayload] = useState<RelayPayloadV2 | null>(null);
  const [relayError, setRelayError] = useState<string | null>(null);
  const [adjustmentReason, setAdjustmentReasonState] = useState<string>('');
  const [teamReflection, setTeamReflectionState] = useState<string>('');
  const [generatedCode, setGeneratedCode] = useState<string>('');

  // Load local adjustment reason & reflection from localStorage (never put into URL hash)
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

  // Parse URL hash #relay=<base64url> defensively on mount & hashchange
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

  // Manually import a relay code or full URL pasted by Student B
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

  // Generate a privacy-safe, <=2KB relay handoff code for Student A
  const generateRelayCode = useCallback(
    (
      rankId: string,
      bowId: string,
      shotResults: ShotResult[],
      missionsTouched: string[],
      annotatedSourceCount: number
    ): string => {
      const compactShots: CompactShotRecord[] = shotResults.slice(0, 12).map((r, i) => ({
        idx: i + 1,
        s: r.score,
        dCm: Math.round(Math.min(999, r.distanceFromCenter * 100) * 10) / 10,
        wSpd: Math.round(r.windSpeed * 10) / 10,
        tAng: Math.round(r.thumbAngleDeg ?? 14),
      }));

      const totalScore = shotResults.reduce((acc, r) => acc + r.score, 0);
      const avgScore =
        shotResults.length > 0 ? Math.round((totalScore / shotResults.length) * 10) / 10 : 0;
      const bullseyes = shotResults.filter((r) => r.score === 10).length;
      const avgWindSpeed =
        shotResults.length > 0
          ? Math.round(
              (shotResults.reduce((acc, r) => acc + r.windSpeed, 0) / shotResults.length) * 10
            ) / 10
          : 0;

      const payload: RelayPayloadV2 = {
        v: 2,
        shots: compactShots,
        telemetrySummary: {
          rankId,
          bowId,
          totalScore,
          avgScore,
          bullseyes,
          avgWindSpeed,
          annotatedSourceCount,
        },
        missionsTouched: missionsTouched.slice(0, 8),
      };

      let jsonStr = JSON.stringify(payload);
      // Enforce 2KB cap: truncate shots to numeric summary if needed
      if (new TextEncoder().encode(jsonStr).length > MAX_PAYLOAD_BYTES) {
        payload.shots = [];
        jsonStr = JSON.stringify(payload);
      }

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
