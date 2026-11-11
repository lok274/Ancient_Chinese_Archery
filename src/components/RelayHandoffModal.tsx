/**
 * Peer Relay Collaboration Modal (同儕接力協作視窗)
 * Educational Objective: OBJ-PEER — 透過同儕協作推動認識國家
 *
 * Implements Section 8.7 flow:
 * 1. Student A generates a <=2KB privacy-safe base64url #relay=... handoff code containing
 *    `{ v, stageId, gateCertificate, shots: { count, avgScore, bestScore, avgDrift }, quizAttempts, telemetrySummary }`.
 * 2. Student B opens the link or pastes the code:
 *    - If B has already passed the same stage: skips straight to the comparison view.
 *    - If B has not passed: shows A's reading result as a preview (`你的搭檔已研讀此關卡，你可以先自行閱讀資料並作答`),
 *      while keeping B's reader and quiz locked until B completes them.
 * 3. After B's round, compares A's and B's telemetry side by side, both students' quiz attempt counts,
 *    and asks: `你們的協作如何改變了射擊結果？這與國家隊團體項目的分工有何相似之處？`
 */

import React, { useState } from 'react';
import {
  Users,
  Copy,
  Check,
  X,
  ArrowRightLeft,
  AlertCircle,
  Sparkles,
  Send,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import { MartialRank, BowConfig, ShotResult, MARTIAL_RANKS, BOW_PRESETS } from '../types/archery';
import { GateCertificate, RelayPayloadV2 } from '../state/useRelaySession';
import { StageGate } from '../state/useGateProgress';

interface RelayHandoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRank: MartialRank;
  currentBow: BowConfig;
  shotResults: ShotResult[];
  currentStageGate: StageGate;
  isPartnerStagePassedByMe: boolean;
  annotatedSourceCount: number;
  partnerPayload: RelayPayloadV2 | null;
  relayError: string | null;
  adjustmentReason: string;
  teamReflection: string;
  generatedCode: string;
  onGenerateCode: (
    stageId: string,
    bowId: string,
    shots: ShotResult[],
    gateCertificate: GateCertificate,
    quizAttempts: Record<string, number>,
    annotatedCount: number
  ) => string;
  onImportCode: (code: string) => boolean;
  onChangeAdjustmentReason: (reason: string) => void;
  onChangeTeamReflection: (text: string) => void;
  onClearPartner: () => void;
  onOpenStageGateForPartnerStage: (stageId: string) => void;
}

export const RelayHandoffModal: React.FC<RelayHandoffModalProps> = ({
  isOpen,
  onClose,
  currentRank,
  currentBow,
  shotResults,
  currentStageGate,
  isPartnerStagePassedByMe,
  annotatedSourceCount,
  partnerPayload,
  relayError,
  adjustmentReason,
  teamReflection,
  generatedCode,
  onGenerateCode,
  onImportCode,
  onChangeAdjustmentReason,
  onChangeTeamReflection,
  onClearPartner,
  onOpenStageGateForPartnerStage,
}) => {
  const [pasteInput, setPasteInput] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const myTotalScore = shotResults.reduce((s, r) => s + r.score, 0);
  const myAvgScore =
    shotResults.length > 0 ? (myTotalScore / shotResults.length).toFixed(1) : '0.0';
  const myBestScore =
    shotResults.length > 0 ? Math.max(...shotResults.map((r) => r.score)) : 0;
  const myAvgDrift =
    shotResults.length > 0
      ? (
          shotResults.reduce((acc, r) => acc + r.distanceFromCenter * 100, 0) /
          shotResults.length
        ).toFixed(1)
      : '0.0';
  const myTotalQuizAttempts = Object.values(currentStageGate.attempts).reduce(
    (sum, c) => sum + c,
    0
  );

  const handleGenerate = () => {
    const cert: GateCertificate = {
      stageId: currentRank.id,
      passedAt: currentStageGate.passedAt || Date.now(),
      questionsSolved: currentStageGate.solvedQuestionIds,
    };
    const code = onGenerateCode(
      currentRank.id,
      currentBow.id,
      shotResults,
      cert,
      currentStageGate.attempts,
      annotatedSourceCount
    );
    const fullUrl = `${window.location.origin}${window.location.pathname}#relay=${code}`;
    navigator.clipboard?.writeText(fullUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  };

  const partnerRank = partnerPayload
    ? MARTIAL_RANKS.find((r) => r.id === partnerPayload.stageId)
    : null;
  const partnerBow = partnerPayload
    ? BOW_PRESETS.find((b) => b.id === partnerPayload.telemetrySummary.bowId)
    : null;
  const partnerTotalQuizAttempts = partnerPayload
    ? Object.values(partnerPayload.quizAttempts).reduce((sum, c) => sum + c, 0)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-2 border-sky-500/70 rounded-xl p-5 shadow-2xl text-slate-100 space-y-4 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-500/20 border border-sky-400/40 text-sky-300">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-sky-400">
                8.7 同儕接力協作系統 〔OBJ-PEER〕
              </span>
              <h2 className="text-base font-bold text-white">
                雙人團體接力：准入憑證交接與遙測對照
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert when Hash is Malformed */}
        {relayError && (
          <div className="p-3 rounded-lg bg-red-950/80 border border-red-500/60 text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="font-bold">{relayError}</span>
            <span className="text-[11px] text-red-300">
              （系統已自動攔截並清除異常雜湊值，請確認搭檔提供的接力碼是否完整）
            </span>
          </div>
        )}

        {/* Section A: Generate My Handoff Code (Student A) */}
        <div className="p-4 rounded-lg bg-slate-950/90 border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="font-bold text-amber-300 text-xs">
                【第一棒／發起接力】生成本局准入憑證與遙測接力碼（上限 2KB · 不含個人姓名與自由文本）
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                本局成績：{shotResults.length} 箭共 {myTotalScore} 環（均分 {myAvgScore} 環 · 最高{' '}
                {myBestScore} 環 · 平均風偏 {myAvgDrift}cm）· 測驗作答 {myTotalQuizAttempts} 次
              </p>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs cursor-pointer transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '已複製接力網址' : '生成並複製接力碼'}</span>
            </button>
          </div>

          {generatedCode && (
            <div className="p-2.5 rounded bg-slate-900 border border-amber-500/40 font-mono text-[10px] space-y-1">
              <div className="text-amber-300 font-bold">
                短接力碼預覽（已寫入網址 #relay=...）：
              </div>
              <div className="break-all text-slate-300 select-all">
                #relay={generatedCode.slice(0, 56)}...（共 {generatedCode.length} 字元）
              </div>
            </div>
          )}
        </div>

        {/* Section B: Import Partner's Handoff Code (Student B) */}
        <div className="p-4 rounded-lg bg-slate-950/90 border border-slate-800 space-y-2.5">
          <div className="font-bold text-sky-300 text-xs">
            【第二棒／接收接力】貼上搭檔（Student A）的接力網址或 #relay= 編碼
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={pasteInput}
              onChange={(e) => setPasteInput(e.target.value)}
              placeholder="貼上包含 #relay=... 的網址或 base64url 字串"
              className="flex-1 p-2 rounded bg-slate-900 border border-slate-700 text-white text-xs font-mono"
            />
            <button
              type="button"
              onClick={() => onImportCode(pasteInput)}
              className="flex items-center gap-1 px-3 py-2 rounded bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>載入搭檔報告</span>
            </button>
          </div>
        </div>

        {/* Section C: Partner Gate Certificate & Paired Comparison (Section 8.7 Two Cases) */}
        {partnerPayload && (
          <div className="p-4 rounded-lg bg-sky-950/30 border border-sky-500/50 space-y-3.5">
            <div className="flex items-center justify-between border-b border-sky-800/60 pb-2">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-sky-400" />
                <span className="font-bold text-sky-200 text-xs">
                  已載入搭檔（第一棒）報告：{partnerRank?.title || partnerPayload.stageId} ·{' '}
                  {partnerBow?.name || partnerPayload.telemetrySummary.bowId}
                </span>
              </div>
              <button
                type="button"
                onClick={onClearPartner}
                className="text-[11px] text-slate-400 hover:text-rose-300 cursor-pointer"
              >
                清除接力狀態
              </button>
            </div>

            {/* Case 1 vs Case 2: Has Student B passed this stage yet? */}
            {!isPartnerStagePassedByMe ? (
              <div className="p-3.5 rounded-xl bg-amber-950/75 border-2 border-amber-400/80 space-y-2.5">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                  <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    你的搭檔已研讀此關卡，你可以先自行閱讀資料並作答
                  </span>
                </div>
                <p className="text-[11px] text-slate-200 leading-relaxed">
                  搭檔已完成「{partnerRank?.title || partnerPayload.stageId}」的{' '}
                  {partnerPayload.gateCertificate.questionsSolved.length} 道准入題目（總作答{' '}
                  {partnerTotalQuizAttempts} 次）。為確保每位同學皆親自參與史料與科研閱讀，系統已為你預先核對搭檔答對的題號，但你仍須親自閱讀資料滿 20 秒並捲動至底以解鎖本關卡准入！
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenStageGateForPartnerStage(partnerPayload.stageId);
                  }}
                  className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>前往閱讀本關卡資料並完成准入</span>
                </button>
              </div>
            ) : (
              <div className="px-3 py-2 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 flex items-center gap-2 text-[11px]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  你與搭檔皆已通過本關卡知識准入！可直接對比雙方遙測數據與測驗作答表現（無需重複測驗）。
                </span>
              </div>
            )}

            {/* Side-by-Side Telemetry & Quiz Attempt Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded bg-slate-950/85 border border-sky-500/40 space-y-1">
                <div className="text-[10px] text-sky-300 font-bold">第一棒（搭檔 A）數據</div>
                <div className="text-lg font-bold font-mono text-amber-300">
                  均分 {partnerPayload.shots.avgScore} 環（最高 {partnerPayload.shots.bestScore} 環）
                </div>
                <div className="text-[11px] text-slate-300 font-mono">
                  射箭數 {partnerPayload.shots.count} 支 · 平均偏移 {partnerPayload.shots.avgDrift}cm
                </div>
                <div className="text-[10px] text-sky-200 font-mono pt-1 border-t border-slate-800">
                  准入測驗作答總次數：{partnerTotalQuizAttempts} 次（已解鎖{' '}
                  {partnerPayload.gateCertificate.questionsSolved.length} 題）
                </div>
              </div>

              <div className="p-3 rounded bg-slate-950/85 border border-emerald-500/40 space-y-1">
                <div className="text-[10px] text-emerald-300 font-bold">第二棒（我的本局）數據</div>
                <div className="text-lg font-bold font-mono text-emerald-300">
                  均分 {myAvgScore} 環（最高 {myBestScore} 環）
                </div>
                <div className="text-[11px] text-slate-300 font-mono">
                  射箭數 {shotResults.length} 支 · 平均偏移 {myAvgDrift}cm
                </div>
                <div className="text-[10px] text-emerald-200 font-mono pt-1 border-t border-slate-800">
                  准入測驗作答總次數：{myTotalQuizAttempts} 次（已解鎖{' '}
                  {currentStageGate.solvedQuestionIds.length} 題）
                </div>
              </div>
            </div>

            {/* One-line 調整理由 before/during shooting */}
            <div className="space-y-1">
              <label className="block font-bold text-amber-300 text-xs">
                【戰術交接記錄】根據第一棒的風偏與落點數據，記錄你本輪的一句話「調整理由」（僅存於本機）：
              </label>
              <input
                type="text"
                value={adjustmentReason}
                onChange={(e) => onChangeAdjustmentReason(e.target.value)}
                placeholder="例如：見搭檔平均偏移達 18cm，故本輪預先逆風多修 15cm 並於第 2 秒屏息放箭..."
                className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white text-xs"
              />
            </div>

            {/* Paired Reflection Prompt (Section 8.7 exact prompt) */}
            <div className="p-3 rounded bg-slate-950/90 border border-amber-500/40 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <Sparkles className="w-4 h-4" />
                <span>【雙人協作反思提問】</span>
              </div>
              <p className="text-white font-bold text-xs">
                你們的協作如何改變了射擊結果？這與國家隊團體項目的分工有何相似之處？
              </p>
              <textarea
                rows={3}
                value={teamReflection}
                onChange={(e) => onChangeTeamReflection(e.target.value)}
                placeholder="思考奧運團體賽中「第一棒探風報點、第二棒穩定銜接、第三棒壓軸定音」的戰術協作..."
                className="w-full p-2.5 rounded bg-slate-900 border border-slate-700 text-slate-100 text-xs"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs cursor-pointer"
          >
            確認並返回賽場
          </button>
        </div>
      </div>
    </div>
  );
};
