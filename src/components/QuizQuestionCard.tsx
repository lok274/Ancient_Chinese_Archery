/**
 * Single Multiple-Choice Question Card with Immediate Explanation Feedback (單題探究測驗卡)
 * Educational Objectives: OBJ-TECH, OBJ-IDENTITY, OBJ-PEER, OBJ-HK
 *
 * Implements Section 8.3:
 * 1. Student selects an option -> locks in immediately.
 * 2. Inline feedback appears: `✓ 正確` or `✗ 再想想`, followed by `explanation` ("資料提到：「…」，因此…"),
 *    followed by `查看資料出處` button which scrolls the reader to `sourceBlockRefs` and highlights it.
 * 3. On a wrong answer, the option is greyed out and the student may try again; `attempts[qid]` increments.
 * 4. When `correctIndex` is chosen, the question is permanently solved for this session.
 */

import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, BookOpen, HelpCircle } from 'lucide-react';
import { QuizQuestion } from '../data/inquiry/stageQuizBank';

interface QuizQuestionCardProps {
  index: number;
  question: QuizQuestion;
  isSolved: boolean;
  attemptsCount: number;
  disabled: boolean;
  onSelectOption: (questionId: string, optionIndex: number, isCorrect: boolean) => void;
  onHighlightSourceBlocks: (blockIndices: number[]) => void;
}

export const QuizQuestionCard: React.FC<QuizQuestionCardProps> = ({
  index,
  question,
  isSolved,
  attemptsCount,
  disabled,
  onSelectOption,
  onHighlightSourceBlocks,
}) => {
  const [wrongSelectedIndices, setWrongSelectedIndices] = useState<number[]>([]);
  const [lastSelectedIdx, setLastSelectedIdx] = useState<number | null>(
    isSolved ? question.correctIndex : null
  );

  const handleOptionClick = (optIdx: number) => {
    if (disabled || isSolved) return;
    if (wrongSelectedIndices.includes(optIdx)) return;

    const isCorrect = optIdx === question.correctIndex;
    setLastSelectedIdx(optIdx);
    if (!isCorrect) {
      setWrongSelectedIndices((prev) => (prev.includes(optIdx) ? prev : [...prev, optIdx]));
    }
    onSelectOption(question.id, optIdx, isCorrect);
  };

  const hasAttempted = isSolved || lastSelectedIdx !== null;

  return (
    <div
      className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
        isSolved
          ? 'bg-emerald-950/25 border-emerald-500/60'
          : disabled
          ? 'bg-slate-900/40 border-slate-800/70 opacity-65'
          : 'bg-slate-900/90 border-slate-700/90'
      }`}
    >
      {/* Question Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-[10px] font-bold">
            第 {index + 1} 題 · {question.objective}
          </span>
          {attemptsCount > 0 && (
            <span className="text-[10px] font-mono text-slate-400">
              作答次數: {attemptsCount}
            </span>
          )}
        </div>

        {isSolved && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>✓ 正確</span>
          </span>
        )}
      </div>

      {/* Question Stem */}
      <div className="text-xs sm:text-sm font-bold text-white leading-snug">
        {question.stem}
      </div>

      {/* Options */}
      <div className="space-y-1.5">
        {question.options.map((optionText, optIdx) => {
          const isCorrectOption = optIdx === question.correctIndex;
          const isChosenCorrect = isSolved && isCorrectOption;
          const isChosenWrong = wrongSelectedIndices.includes(optIdx);
          const optionLetter = String.fromCharCode(65 + optIdx);

          return (
            <button
              key={optIdx}
              type="button"
              disabled={disabled || isSolved || isChosenWrong}
              onClick={() => handleOptionClick(optIdx)}
              className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-start gap-2 ${
                isChosenCorrect
                  ? 'bg-emerald-500/25 border-emerald-400 text-emerald-100 font-bold cursor-default'
                  : isChosenWrong
                  ? 'bg-slate-950/60 border-slate-800 text-slate-500 line-through cursor-not-allowed'
                  : disabled
                  ? 'bg-slate-950/50 border-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-950/85 hover:bg-slate-800 border-slate-700 hover:border-amber-400/70 text-slate-200 cursor-pointer'
              }`}
            >
              <span
                className={`w-5 h-5 rounded flex items-center justify-center font-mono text-[11px] font-bold shrink-0 mt-0.5 ${
                  isChosenCorrect
                    ? 'bg-emerald-400 text-slate-950'
                    : isChosenWrong
                    ? 'bg-slate-800 text-slate-500'
                    : 'bg-slate-800 text-amber-300'
                }`}
              >
                {optionLetter}
              </span>
              <span className="leading-relaxed">{optionText}</span>
            </button>
          );
        })}
      </div>

      {/* Immediate Inline Feedback & Source Citation (Section 8.3) */}
      {hasAttempted && (
        <div
          className={`p-3 rounded-lg border text-xs space-y-2 animate-in fade-in duration-200 ${
            isSolved
              ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-100'
              : 'bg-amber-950/50 border-amber-500/60 text-amber-100'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span
              className={`inline-flex items-center gap-1 font-bold ${
                isSolved ? 'text-emerald-300' : 'text-amber-300'
              }`}
            >
              {isSolved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>✓ 正確</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span>✗ 再想想（已灰階排除錯誤選項，請參考下方出處再試一次）</span>
                </>
              )}
            </span>

            <button
              type="button"
              onClick={() => onHighlightSourceBlocks(question.sourceBlockRefs)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-amber-400/60 text-amber-300 font-bold text-[11px] cursor-pointer shrink-0 transition-colors"
            >
              <BookOpen className="w-3 h-3" />
              <span>
                查看資料出處（段落 {question.sourceBlockRefs.map((i) => i + 1).join('、')}）
              </span>
            </button>
          </div>

          <p className="leading-relaxed text-slate-200">{question.explanation}</p>
        </div>
      )}

      {disabled && !hasAttempted && (
        <div className="flex items-center gap-1.5 text-[11px] text-amber-300/80 pt-1">
          <HelpCircle className="w-3.5 h-3.5 shrink-0" />
          <span>請先完成左側資料閱讀（捲動至底部 ≥95% 並停留滿 20 秒）以解鎖作答。</span>
        </div>
      )}
    </div>
  );
};
