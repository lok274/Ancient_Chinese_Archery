/**
 * Stage Gate Modal & Peripheral Review Drawer (知識准入探究測驗與史料標註視窗)
 * Educational Objectives: OBJ-TECH, OBJ-IDENTITY, OBJ-PEER, OBJ-HK
 *
 * Implements Section 5, 8.1, 8.2, 8.3 & 8.9:
 * - Spatial Rule (Section 5):
 *   - While `gatePassed === false` (and not the optional `heritage-hk` quiz), renders as a centred modal (`閱讀資料 -> 完成MC測驗 -> 通過准入`).
 *   - Once `gatePassed === true` (or when opening the optional `heritage-hk` quiz), it MUST NEVER reopen in the centre;
 *     re-reading and the Section 8.9 `史料標註` worksheet open in a right-side peripheral drawer so the 50%,50% sightline stays clear.
 * - Left column (60% width): `SourceReader` scroll container.
 * - Right column (40% width): `QuizQuestionCard` list, progress indicator (`已答對 X / Y`), `本關卡准入已解鎖` banner,
 *   and deliberate `進入射箭場` button.
 */

import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  CheckCircle2,
  X,
  ArrowRight,
  Tag,
  Copy,
  Check,
  AlertTriangle,
  Users,
  Award,
} from 'lucide-react';
import { getQuizSourceForStage } from '../data/inquiry/stageQuizBank';
import { StageGate } from '../state/useGateProgress';
import { SourceReader } from './SourceReader';
import { QuizQuestionCard } from './QuizQuestionCard';
import { SOURCE_ANCHORS } from '../data/inquiry/sourceAnchors';
import { AICommentaryDraftState } from '../state/useInquiryProgress';

interface StageGateModalProps {
  isOpen: boolean;
  stageId: string;
  stageTitle: string;
  gate: StageGate;
  storageWarning: boolean;
  partnerPreviewBanner?: string | null;
  sourceAnnotations: Record<string, string[]>;
  aiCommentary: AICommentaryDraftState;
  onUpdateReadingProgress: (scrollPct?: number, deltaDwellMs?: number) => void;
  onRecordAttempt: (questionId: string, isCorrect: boolean) => void;
  onToggleSourceKeyword: (sourceId: string, keyword: string) => void;
  onUpdateAICommentary: (patch: Partial<AICommentaryDraftState>) => void;
  onClose: () => void;
}

const FACT_CHECK_LABELS: Array<{
  key: keyof AICommentaryDraftState['checklist'];
  label: string;
}> = [
  { key: 'traceableSource', label: '1. 來源是否可追溯？（是否標明博物館、典籍或奧運官方紀錄）' },
  { key: 'numbersMatchSource', label: '2. 數字是否與原始材料一致？（年份、距離、環數無誤）' },
  { key: 'noHyperbole', label: '3. 是否避免了誇大或情緒化表述？（以客觀事實陳述）' },
  { key: 'nationalHkLink', label: '4. 是否說明了與香港／國家的關聯？' },
];

export const StageGateModal: React.FC<StageGateModalProps> = ({
  isOpen,
  stageId,
  stageTitle,
  gate,
  storageWarning,
  partnerPreviewBanner,
  sourceAnnotations,
  aiCommentary,
  onUpdateReadingProgress,
  onRecordAttempt,
  onToggleSourceKeyword,
  onUpdateAICommentary,
  onClose,
}) => {
  const [highlightedBlocks, setHighlightedBlocks] = useState<number[]>([]);
  const [activeRightMode, setActiveRightMode] = useState<'quiz' | 'annotation'>('quiz');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  if (!isOpen) return null;

  const source = getQuizSourceForStage(stageId);
  const totalQuestions = source.questions.length;
  const solvedCount = source.questions.filter((q) =>
    gate.solvedQuestionIds.includes(q.id)
  ).length;
  const isReadOrPassed = gate.state === 'read' || gate.state === 'passed';
  const isPassed = gate.state === 'passed';
  const isOptionalHeritageQuiz = stageId === 'heritage-hk';

  // Section 5 Rule: Once a stage gate is passed (or if it's the optional heritage-hk quiz),
  // it renders as a peripheral right-side drawer instead of a centred modal.
  const renderAsPeripheralDrawer = isPassed || isOptionalHeritageQuiz;

  const aiPromptTemplate = `請根據以下可查證史料，為「${stageTitle}」撰寫一段 100 字以內的客觀射藝解說：\n1. 引用《考工記》或奧運官方紀錄中的具體事實；\n2. 說明內地與香港射藝文化或科研發展的關聯；\n3. 嚴禁誇大或虛構數據。`;

  const handleCopyPrompt = () => {
    navigator.clipboard?.writeText(aiPromptTemplate);
    setCopiedPrompt(true);
    window.setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div
      className={
        renderAsPeripheralDrawer
          ? 'fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-slate-950/95 border-l-2 border-amber-500/70 shadow-2xl flex flex-col text-slate-100 animate-in slide-in-from-right duration-200'
          : 'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200'
      }
    >
      <div
        className={
          renderAsPeripheralDrawer
            ? 'flex flex-col w-full h-full overflow-hidden'
            : 'w-full max-w-6xl h-[88vh] bg-slate-900 border-2 border-amber-500/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100'
        }
      >
        {/* Top Modal / Drawer Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-red-950/80 via-slate-950 to-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-lg border ${
                isPassed
                  ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                  : 'bg-amber-500/20 border-amber-400/50 text-amber-300'
              }`}
            >
              {isPassed ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-amber-400 font-bold tracking-wider">
                  {isOptionalHeritageQuiz
                    ? '8.5 香港射藝選修測驗 〔OBJ-HK〕'
                    : renderAsPeripheralDrawer
                    ? '側欄重溫與史料標註工作紙（不遮擋中央準星）'
                    : '知識准入探究關卡 · 閱讀資料 → 完成MC測驗 → 通過准入'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isPassed
                      ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/50'
                      : gate.state === 'read'
                      ? 'bg-sky-500/25 text-sky-300 border border-sky-400/50'
                      : 'bg-amber-500/25 text-amber-300 border border-amber-400/50'
                  }`}
                >
                  {isPassed
                    ? '✓ 已通過准入'
                    : gate.state === 'read'
                    ? '資料已讀 · 待完成測驗'
                    : '未通過准入（拉弓已鎖定）'}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white mt-0.5">
                {stageTitle} — {source.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isPassed && !isOptionalHeritageQuiz && (
              <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveRightMode('quiz')}
                  className={`px-2.5 py-1 rounded-md font-bold cursor-pointer transition-colors ${
                    activeRightMode === 'quiz'
                      ? 'bg-amber-400 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  准入測驗 ({solvedCount}/{totalQuestions})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRightMode('annotation')}
                  className={`px-2.5 py-1 rounded-md font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                    activeRightMode === 'annotation'
                      ? 'bg-amber-400 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Tag className="w-3 h-3" />
                  <span>8.9 史料標註</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={isPassed ? '關閉側欄返回射箭場' : '暫時關閉（進度已保存，拉弓仍保持鎖定）'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Private Mode / localStorage Warning */}
        {storageWarning && (
          <div className="px-4 py-1.5 bg-amber-950/90 border-b border-amber-500/50 text-amber-200 text-[11px] flex items-center gap-2 shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              偵測到無痕模式或瀏覽器停用了 localStorage：本局准入進度將暫存於記憶體中，重新整理頁面後需重新作答。
            </span>
          </div>
        )}

        {/* Partner Relay Reading Preview Banner (Section 8.7: Student B has not passed yet) */}
        {partnerPreviewBanner && !isPassed && (
          <div className="px-4 py-2 bg-sky-950/90 border-b border-sky-400/60 text-sky-200 text-xs flex items-center gap-2 shrink-0">
            <Users className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="font-bold">{partnerPreviewBanner}</span>
          </div>
        )}

        {/* Main Body Split: Left 60% SourceReader, Right 40% Quiz / Annotation (stacks on <768px or when in narrow drawer) */}
        <div
          className={`flex-1 flex overflow-hidden ${
            renderAsPeripheralDrawer ? 'flex-col' : 'flex-col md:flex-row'
          }`}
        >
          {/* Left Column (60% width in modal mode): SourceReader */}
          <div
            className={
              renderAsPeripheralDrawer
                ? 'h-[45%] shrink-0 overflow-hidden'
                : 'w-full md:w-[60%] h-1/2 md:h-full overflow-hidden'
            }
          >
            <SourceReader
              source={source}
              gate={gate}
              highlightedBlockIndices={highlightedBlocks}
              onUpdateReadingProgress={onUpdateReadingProgress}
            />
          </div>

          {/* Right Column (40% width in modal mode): Quiz Panel or Section 8.9 Annotation Worksheet */}
          <div
            className={
              renderAsPeripheralDrawer
                ? 'flex-1 flex flex-col bg-slate-900 overflow-hidden'
                : 'w-full md:w-[40%] h-1/2 md:h-full flex flex-col bg-slate-900 overflow-hidden'
            }
          >
            {activeRightMode === 'quiz' ? (
              <>
                {/* Quiz Progress Header (`已答對 X / Y` + filled dots + live unlock status) */}
                <div className="px-4 py-3 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-300">
                      已答對 {solvedCount} / {totalQuestions}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {source.questions.map((q) => {
                        const solved = gate.solvedQuestionIds.includes(q.id);
                        return (
                          <span
                            key={q.id}
                            className={`w-2.5 h-2.5 rounded-full transition-colors ${
                              solved
                                ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
                                : 'bg-slate-700'
                            }`}
                            title={q.id}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {!isReadOrPassed ? (
                    <span className="text-[11px] text-amber-300 font-semibold animate-pulse">
                      {gate.sourceScrollPct >= 0.95
                        ? `細讀計時中（還需 ${Math.max(
                            1,
                            Math.ceil(
                              ((stageId === 'heritage-hk' ? 5000 : 20000) - gate.sourceDwellMs) /
                                1000
                            )
                          )} 秒自動解鎖作答）`
                        : '請先向下捲動閱讀左側資料至底部（≥95%）'}
                    </span>
                  ) : (
                    <span className="text-[11px] text-emerald-300 font-bold">
                      ✓ 作答已開啟（請點選各題正確選項）
                    </span>
                  )}
                </div>

                {/* Scrollable Question Cards */}
                <div
                  className={`flex-1 overflow-y-auto p-4 space-y-3.5 transition-opacity duration-300 ${
                    isReadOrPassed ? 'opacity-100' : 'opacity-75'
                  }`}
                >
                  {/* Passing Banner (Section 8.3: 本關卡准入已解鎖 + 進入射箭場) */}
                  {isPassed && (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/90 via-teal-950/80 to-slate-900 border-2 border-emerald-400 shadow-xl space-y-3 animate-in zoom-in-95 duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          <span>
                            {isOptionalHeritageQuiz
                              ? '恭喜獲頒「香港射藝探究徽章」！'
                              : '本關卡准入已解鎖'}
                          </span>
                        </div>
                        {isOptionalHeritageQuiz && (
                          <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-bold text-[10px] flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            香港射藝探究徽章
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        {isOptionalHeritageQuiz
                          ? '你已完成香港與內地同源射藝文化的選修探究測驗！徽章將顯示於完賽結算公報中。'
                          : '你已完成本關卡全部史料研讀與閱讀理解測驗。點擊下方按鈕即可正式拿起反曲弓／傳統角弓開始實彈射擊！'}
                      </p>
                      <button
                        type="button"
                        onClick={onClose}
                        className="w-full py-2.5 px-4 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-transform active:scale-98"
                      >
                        <span>進入射箭場</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {source.questions.map((q, idx) => (
                    <QuizQuestionCard
                      key={q.id}
                      index={idx}
                      question={q}
                      isSolved={gate.solvedQuestionIds.includes(q.id)}
                      attemptsCount={gate.attempts[q.id] || 0}
                      disabled={!isReadOrPassed}
                      onSelectOption={(qId, _optIdx, isCorrect) =>
                        onRecordAttempt(qId, isCorrect)
                      }
                      onHighlightSourceBlocks={(refs) => setHighlightedBlocks(refs)}
                    />
                  ))}
                </div>
              </>
            ) : (
              /* Section 8.9: Optional Student-Authored Extension — 史料標註 Worksheet after passing */
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                <div className="p-3.5 rounded-lg bg-slate-950 border border-amber-500/40 space-y-1.5">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5">
                    <Tag className="w-4 h-4" />
                    <span>8.9 延伸探究工作紙：原始史料關鍵詞標註 〔OBJ-PEER〕</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    通過關卡准入後，你可從原始史料錨點（`sourceAnchors.ts`）挑選關鍵詞標註，並可透過同儕接力碼與搭檔分享標註成果。
                  </p>
                </div>

                <div className="space-y-2.5">
                  {SOURCE_ANCHORS.map((anchor) => {
                    const activeTags = sourceAnnotations[anchor.id] || [];
                    return (
                      <div
                        key={anchor.id}
                        className="p-3 rounded-lg bg-slate-950/90 border border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-200">{anchor.title}</span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {anchor.dateNote}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {anchor.excerpt}
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {anchor.suggestedKeywords.map((kw) => {
                            const tagged = activeTags.includes(kw);
                            return (
                              <button
                                key={kw}
                                type="button"
                                onClick={() => onToggleSourceKeyword(anchor.id, kw)}
                                className={`px-2 py-0.5 rounded text-[11px] border cursor-pointer transition-colors ${
                                  tagged
                                    ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold'
                                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-amber-400/60'
                                }`}
                              >
                                {tagged ? `✓ #${kw}` : `+ #${kw}`}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Copyable Prompt Template + Mandatory 4-Item Human Fact-Check Checklist (Section 8.9) */}
                <div className="p-3.5 rounded-lg bg-slate-950 border border-sky-500/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sky-300">
                      AI 輔助解說提示詞模板與人工事實核查清單
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyPrompt}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/50 text-sky-200 text-[11px] font-bold cursor-pointer"
                    >
                      {copiedPrompt ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedPrompt ? '已複製提示詞' : '複製提示詞模板'}</span>
                    </button>
                  </div>

                  <div className="p-2 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300">
                    {aiPromptTemplate}
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] font-bold text-amber-300">
                      人工事實核查清單（必須逐項核對）：
                    </div>
                    {FACT_CHECK_LABELS.map((item) => (
                      <label
                        key={String(item.key)}
                        className="flex items-center gap-2 text-[11px] text-slate-200 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={aiCommentary.checklist[item.key]}
                          onChange={(e) =>
                            onUpdateAICommentary({
                              checklist: {
                                ...aiCommentary.checklist,
                                [item.key]: e.target.checked,
                              },
                            })
                          }
                          className="accent-amber-400"
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
