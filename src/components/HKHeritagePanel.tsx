/**
 * Hong Kong Archery Heritage Anchor Modal (香港射藝文化與內地同源考據視窗)
 * Educational Objective: OBJ-HK — 認識內地與香港系出同源的關係
 *
 * Triggered by clicking the 3D side-range exhibition board prop inside ArcheryScene
 * (or the peripheral quick button) ONLY when the bow is not drawn.
 * Portrays Hong Kong as an active participant in an ongoing cultural exchange within
 * the national tradition, pairing every HK entry with its mainland counterpart.
 */

import React from 'react';
import { X, MapPin, Landmark, Tag, ArrowUpRight, BookOpen } from 'lucide-react';
import { HK_HERITAGE_NOTES } from '../data/inquiry/hkHeritageNotes';
import { SOURCE_ANCHORS } from '../data/inquiry/sourceAnchors';

interface HKHeritagePanelProps {
  isOpen: boolean;
  onClose: () => void;
  sourceAnnotations: Record<string, string[]>;
  onToggleSourceKeyword: (sourceId: string, keyword: string) => void;
  onOpenHKMission: () => void;
}

export const HKHeritagePanel: React.FC<HKHeritagePanelProps> = ({
  isOpen,
  onClose,
  sourceAnnotations,
  onToggleSourceKeyword,
  onOpenHKMission,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border-2 border-amber-500/70 rounded-xl shadow-2xl text-slate-100 flex flex-col overflow-hidden text-xs">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-red-950/70 via-slate-950 to-slate-950 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-300">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-amber-400">
                8.6 場邊 3D 展板 · 認識內地與香港系出同源的關係 〔OBJ-HK〕
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                香江射藝尋根：從新界武舉文物到當代兩地文化共融
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenHKMission}
              className="flex items-center gap-1 px-3 py-1.5 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>前往 M-HK-01 探究任務</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded text-slate-400 hover:text-white cursor-pointer"
              aria-label="關閉展板"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="p-3.5 rounded-lg bg-slate-950/90 border border-amber-500/35 text-slate-200 leading-relaxed">
            香港並非中華射藝傳統的旁觀者，而是自秦漢器物、清代新界宗族武舉科考，乃至當代傳統弓工藝復原與全國青年賽事交流中<strong>積極參與的一分子</strong>。以下五則可查證史料呈現香港與內地一脈相承的文化紐帶：
          </div>

          <div className="space-y-3">
            {HK_HERITAGE_NOTES.map((item) => {
              const anchor = SOURCE_ANCHORS.find((a) => a.id === item.sourceAnchorId);
              const activeTags = anchor ? sourceAnnotations[anchor.id] || [] : [];

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-slate-950/85 border border-slate-800 hover:border-amber-500/40 transition-colors space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-red-950/90 border border-red-500/40 text-amber-300 font-bold text-[11px]">
                        {item.category}
                      </span>
                      <span className="font-bold text-sm text-white">{item.title}</span>
                    </div>
                    <span className="font-mono text-[11px] text-amber-400">{item.yearOrEra}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-amber-300">
                        <MapPin className="w-3.5 h-3.5 text-red-400" />
                        <span>香港本地實證與參與</span>
                      </div>
                      <p className="text-slate-200 leading-relaxed">{item.hkFact}</p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
                      <div className="text-[11px] font-bold text-sky-300">
                        【內地歷史制度／非遺機構對照】
                      </div>
                      <p className="text-slate-300 leading-relaxed">{item.mainlandCounterpart}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                    <div className="text-[11px] text-emerald-300">
                      <strong>同源脈絡：</strong>
                      {item.culturalConnection}
                    </div>

                    {anchor && (
                      <div className="flex flex-wrap items-center gap-1">
                        <Tag className="w-3 h-3 text-amber-400 mr-0.5" />
                        {anchor.suggestedKeywords.map((kw) => {
                          const tagged = activeTags.includes(kw);
                          return (
                            <button
                              key={kw}
                              type="button"
                              onClick={() => onToggleSourceKeyword(anchor.id, kw)}
                              className={`px-2 py-0.5 rounded text-[10px] border cursor-pointer transition-colors ${
                                tagged
                                  ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold'
                                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                              }`}
                            >
                              {tagged ? `✓ #${kw}` : `+ #${kw}`}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400">
            提示：你在賽場左側看到的 3D 實體展板可隨時於未拉弓狀態下點擊開啟本面板。
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs cursor-pointer"
          >
            返回 3D 射箭賽場
          </button>
        </div>
      </div>
    </div>
  );
};
