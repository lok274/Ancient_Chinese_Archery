/**
 * Scroll-Tracked Source Material Reader (知識准入閱讀器)
 * Educational Objectives: OBJ-TECH, OBJ-IDENTITY, OBJ-PEER, OBJ-HK
 *
 * Implements Section 8.2:
 * - Uses `IntersectionObserver` on a sentinel `<div>` at the end of the content + scroll position to compute `sourceScrollPct`.
 * - Accumulates `sourceDwellMs` via a `visibilitychange`-aware timer (pauses when tab is hidden).
 * - Uses a stable ref for `onUpdateReadingProgress` so frequent parent re-renders (e.g. 3D wind updates)
 *   never reset the interval timer.
 * - Displays `✓ 資料已閱讀` badge when `unread -> read` conditions (`scroll >= 95%` AND `dwell >= 20s`) are met.
 */

import React, { useEffect, useRef } from 'react';
import { BookOpen, CheckCircle2, Clock, ScrollText, Quote, Sparkles } from 'lucide-react';
import { QuizSource } from '../data/inquiry/stageQuizBank';
import { StageGate, REQUIRED_SCROLL_PCT, REQUIRED_DWELL_MS } from '../state/useGateProgress';

interface SourceReaderProps {
  source: QuizSource;
  gate: StageGate;
  highlightedBlockIndices: number[];
  onUpdateReadingProgress: (scrollPct?: number, deltaDwellMs?: number) => void;
}

export const SourceReader: React.FC<SourceReaderProps> = ({
  source,
  gate,
  highlightedBlockIndices,
  onUpdateReadingProgress,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const blockRefs = useRef<Array<HTMLDivElement | null>>([]);

  // Keep latest callback in a ref so parent re-renders (from 80ms wind ticks) never restart our interval
  const onUpdateRef = useRef(onUpdateReadingProgress);
  onUpdateRef.current = onUpdateReadingProgress;

  const minDwellMs = source.stageId === 'heritage-hk' ? 5000 : REQUIRED_DWELL_MS;
  const isReadOrPassed = gate.state === 'read' || gate.state === 'passed';
  const dwellSeconds = Math.min(
    Math.round(minDwellMs / 1000),
    Math.floor(gate.sourceDwellMs / 1000)
  );
  const requiredDwellSeconds = Math.round(minDwellMs / 1000);
  const remainingSeconds = Math.max(0, requiredDwellSeconds - dwellSeconds);
  const scrollPctDisplay = Math.min(100, Math.round(gate.sourceScrollPct * 100));
  const isScrollMet = gate.sourceScrollPct >= REQUIRED_SCROLL_PCT;
  const isDwellMet = gate.sourceDwellMs >= minDwellMs;

  // 1. Visibility-aware dwell timer (only depends on stageId and isReadOrPassed)
  useEffect(() => {
    if (isReadOrPassed) return;

    let lastTick = performance.now();

    const tick = () => {
      const now = performance.now();
      if (document.visibilityState !== 'hidden') {
        const delta = now - lastTick;
        if (delta > 0) {
          onUpdateRef.current(undefined, delta);
        }
      }
      lastTick = now;
    };

    const intervalId = window.setInterval(tick, 250);
    const handleVisibilityChange = () => {
      lastTick = performance.now();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [source.stageId, isReadOrPassed]);

  // 2. IntersectionObserver on sentinel <div> at the end of content + scroll ratio tracking
  useEffect(() => {
    const container = scrollContainerRef.current;
    const sentinel = sentinelRef.current;
    if (!container || !sentinel) return;

    const computeScrollRatio = () => {
      const maxScroll = container.scrollHeight - container.clientHeight;
      if (maxScroll <= 16) {
        onUpdateRef.current(1.0, undefined);
      } else {
        const ratio = Math.min(1, Math.max(0, container.scrollTop / maxScroll));
        onUpdateRef.current(ratio >= 0.95 ? 1.0 : ratio, undefined);
      }
    };

    computeScrollRatio();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            onUpdateRef.current(1.0, undefined);
          }
        }
      },
      {
        root: container,
        threshold: 0.2,
      }
    );

    observer.observe(sentinel);
    container.addEventListener('scroll', computeScrollRatio, { passive: true });

    return () => {
      observer.disconnect();
      container.removeEventListener('scroll', computeScrollRatio);
    };
  }, [source.stageId]);

  // 3. Scroll to referenced block when student clicks "查看資料出處"
  useEffect(() => {
    if (highlightedBlockIndices.length > 0) {
      const firstIndex = highlightedBlockIndices[0];
      const el = blockRefs.current[firstIndex];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedBlockIndices]);

  return (
    <div className="flex flex-col h-full bg-slate-950/90 border-b md:border-b-0 md:border-r border-slate-800 overflow-hidden">
      {/* Reader Header Bar */}
      <div className="px-4 py-3 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold">
                {source.objective}
              </span>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-sky-400" />
                預計閱讀時間：約 {source.estimatedReadSeconds} 秒（需細讀滿 {requiredDwellSeconds} 秒並捲動至底）
              </span>
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-white mt-0.5">{source.title}</h3>
          </div>
        </div>

        {/* Visual Completion Signal (Section 8.2: ✓ 資料已閱讀) */}
        {isReadOrPassed ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-950/90 border border-emerald-400/70 text-emerald-300 text-xs font-bold shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>✓ 資料已閱讀（右側測驗已開啟）</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[11px] font-mono bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-slate-300">
            <span className={isScrollMet ? 'text-emerald-400 font-bold' : 'text-amber-300'}>
              {isScrollMet ? '✓ 捲動 100%' : `捲動進度 ${scrollPctDisplay}%`}
            </span>
            <span className="text-slate-600">|</span>
            <span className={isDwellMet ? 'text-emerald-400 font-bold' : 'text-sky-300 font-bold'}>
              {isDwellMet
                ? `✓ 細讀 ${requiredDwellSeconds}s`
                : `細讀計時 ${dwellSeconds}s / ${requiredDwellSeconds}s`}
            </span>
          </div>
        )}
      </div>

      {/* Scrollable Reading Blocks Container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs sm:text-sm leading-relaxed select-text"
      >
        {source.blocks.map((block, idx) => {
          const isHighlighted = highlightedBlockIndices.includes(idx);

          return (
            <div
              key={idx}
              ref={(el) => {
                blockRefs.current[idx] = el;
              }}
              className={`rounded-lg p-3.5 transition-all duration-300 border ${
                isHighlighted
                  ? 'bg-amber-950/60 border-amber-400 ring-2 ring-amber-400/50 shadow-lg'
                  : 'bg-slate-900/75 border-slate-800/90'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono text-slate-400">
                  【段落 {idx + 1}】
                </span>
                {isHighlighted && (
                  <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    題目答案出處段落
                  </span>
                )}
              </div>

              {block.type === 'para' && (
                <p className="text-slate-200 leading-relaxed">{block.text}</p>
              )}

              {block.type === 'quote' && (
                <div className="pl-3 border-l-2 border-amber-400 space-y-1.5 bg-slate-950/60 p-2.5 rounded">
                  <div className="flex items-start gap-1.5 text-amber-200 font-serif italic">
                    <Quote className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>「{block.text}」</span>
                  </div>
                  <div className="text-[11px] text-amber-400/90 text-right font-mono">
                    —— {block.attribution}
                  </div>
                </div>
              )}

              {block.type === 'fact' && (
                <div className="p-3 rounded bg-sky-950/40 border border-sky-500/40 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sky-300">
                    <ScrollText className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>{block.label}</span>
                  </div>
                  <p className="text-slate-200 text-xs leading-relaxed">{block.value}</p>
                </div>
              )}

              {block.type === 'image' && (
                <figure className="space-y-1.5">
                  <img
                    src={block.src}
                    alt={block.caption}
                    className="w-full max-h-48 object-cover rounded border border-slate-700"
                  />
                  <figcaption className="text-[11px] text-slate-400 text-center">
                    {block.caption}
                  </figcaption>
                </figure>
              )}
            </div>
          );
        })}

        {/* Sentinel div at the bottom of the reader for IntersectionObserver */}
        <div
          ref={sentinelRef}
          className={`py-3.5 px-4 rounded-lg border text-center text-xs space-y-2 transition-colors ${
            isReadOrPassed
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
              : isScrollMet
              ? 'bg-sky-950/50 border-sky-400/60 text-sky-100'
              : 'bg-slate-900/50 border-dashed border-slate-800 text-slate-400'
          }`}
        >
          {isReadOrPassed ? (
            <div className="font-bold text-emerald-300">
              ✓ 已完成史料與科研文獻細讀，請於右側面板作答選擇題！
            </div>
          ) : isScrollMet ? (
            <div className="space-y-1.5">
              <div className="font-bold text-sky-300">
                ✓ 已捲動至文末（100%）· 正在累計細讀時間：{dwellSeconds} 秒 / {requiredDwellSeconds} 秒（還需 {remainingSeconds} 秒自動開啟作答）
              </div>
              <div className="w-full max-w-md mx-auto h-2 bg-slate-900 rounded-full overflow-hidden border border-sky-500/40">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.round((gate.sourceDwellMs / minDwellMs) * 100))}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <div>
              請向下捲動至此處（≥95%）並細讀滿 {requiredDwellSeconds} 秒以解鎖右側准入測驗（目前停留 {dwellSeconds} 秒）。
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
