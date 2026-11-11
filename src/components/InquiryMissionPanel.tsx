/**
 * Inquiry Mission Panel & Student-Authored Content Workspace (探究任務、史料標註與 AI 輔助解說詞工作紙)
 * Educational Objectives: OBJ-TECH, OBJ-IDENTITY, OBJ-PEER, OBJ-HK
 *
 * Implements the EDB Civic Education reading-to-output cycle:
 * 閱讀材料 → 提問 → 反思 → 產出
 * No auto-grading, no leaderboards.
 */

import React, { useState } from 'react';
import {
  BookOpen,
  HelpCircle,
  PenTool,
  Share2,
  CheckCircle2,
  Copy,
  Check,
  Tag,
  ClipboardCheck,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { INQUIRY_MISSIONS, InquiryMission } from '../data/inquiry/inquiryMissions';
import { SOURCE_ANCHORS } from '../data/inquiry/sourceAnchors';
import { AICommentaryDraftState, FactCheckChecklist } from '../state/useInquiryProgress';

interface InquiryMissionPanelProps {
  initialMissionId?: string;
  reflections: Record<string, string>;
  completedMissionIds: string[];
  sourceAnnotations: Record<string, string[]>;
  aiCommentary: AICommentaryDraftState;
  storageWarning: boolean;
  onSaveReflection: (missionId: string, text: string) => void;
  onToggleSourceKeyword: (sourceId: string, keyword: string) => void;
  onUpdateAICommentary: (patch: Partial<AICommentaryDraftState>) => void;
  onOpenPostureCoachComparison?: () => void;
}

type SubView = 'missions' | 'annotations' | 'ai_worksheet';

export const InquiryMissionPanel: React.FC<InquiryMissionPanelProps> = ({
  initialMissionId,
  reflections,
  completedMissionIds,
  sourceAnnotations,
  aiCommentary,
  storageWarning,
  onSaveReflection,
  onToggleSourceKeyword,
  onUpdateAICommentary,
  onOpenPostureCoachComparison,
}) => {
  const [subView, setSubView] = useState<SubView>('missions');
  const [selectedMissionId, setSelectedMissionId] = useState<string>(
    initialMissionId || INQUIRY_MISSIONS[0].id
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeMission: InquiryMission =
    INQUIRY_MISSIONS.find((m) => m.id === selectedMissionId) || INQUIRY_MISSIONS[0];
  const currentReflection = reflections[activeMission.id] || '';

  const selectedExhibit =
    SOURCE_ANCHORS.find((s) => s.id === aiCommentary.selectedExhibitId) || SOURCE_ANCHORS[0];

  const allChecklistPassed =
    aiCommentary.checklist.traceableSource &&
    aiCommentary.checklist.numbersMatchSource &&
    aiCommentary.checklist.noHyperbole &&
    aiCommentary.checklist.nationalHkLink;

  const generatedPrompt = `請根據以下可追溯史料，為「${selectedExhibit.title}」撰寫一段 120 字以內的博物館展品解說詞初稿：
【原始出處】：${selectedExhibit.institution}（${selectedExhibit.dateNote}）
【必答事實一】：${aiCommentary.fact1 || '（請先填寫必答事實一）'}
【必答事實二】：${aiCommentary.fact2 || '（請先填寫必答事實二）'}
【必答事實三】：${aiCommentary.fact3 || '（請先填寫必答事實三）'}
【撰寫要求】：嚴格依據上述事實與原始史料，避免誇大或未經證實之形容詞，並點出香港與國家射藝文化同源或交流之關聯。`;

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleCheckItem = (key: keyof FactCheckChecklist) => {
    onUpdateAICommentary({
      checklist: {
        ...aiCommentary.checklist,
        [key]: !aiCommentary.checklist[key],
      },
    });
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Storage Warning Banner if Private Browsing blocks localStorage */}
      {storageWarning && (
        <div className="p-2.5 rounded bg-amber-950/70 border border-amber-500/60 text-amber-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            目前瀏覽器處於無痕或限制儲存模式，探究筆記暫存於記憶體中，建議完成後複製產出保存。
          </span>
        </div>
      )}

      {/* Sub-navigation Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-950/90 border border-slate-800">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSubView('missions')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-bold cursor-pointer transition-colors ${
              subView === 'missions'
                ? 'bg-amber-400 text-slate-950'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>四步探究任務 ({completedMissionIds.length}/{INQUIRY_MISSIONS.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubView('annotations')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-bold cursor-pointer transition-colors ${
              subView === 'annotations'
                ? 'bg-sky-400 text-slate-950'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>8.7 史料關鍵詞標註 〔OBJ-PEER〕</span>
          </button>

          <button
            type="button"
            onClick={() => setSubView('ai_worksheet')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-bold cursor-pointer transition-colors ${
              subView === 'ai_worksheet'
                ? 'bg-emerald-400 text-slate-950'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>8.7 AI 輔助解說詞核查工作紙 〔OBJ-PEER〕</span>
          </button>
        </div>

        <span className="text-[11px] text-amber-300 font-mono">
          閱讀材料 → 提問 → 反思 → 產出（不設自動評分與排行榜）
        </span>
      </div>

      {/* SUBVIEW 1: 4-STEP INQUIRY MISSIONS */}
      {subView === 'missions' && (
        <div className="space-y-4">
          {/* Mission Selector Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {INQUIRY_MISSIONS.map((m) => {
              const isSelected = m.id === activeMission.id;
              const isDone = completedMissionIds.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMissionId(m.id)}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400 text-white shadow-md'
                      : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-amber-300 border border-amber-500/30">
                      {m.id} · {m.objective}
                    </span>
                    {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <div className="font-bold text-xs line-clamp-2 mt-1">{m.title}</div>
                </button>
              );
            })}
          </div>

          {/* Active Mission 4-Step Card */}
          <div className="p-4 rounded-xl bg-slate-950/90 border border-amber-500/40 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div>
                <span className="text-[10px] font-mono text-amber-400">
                  {activeMission.objectiveLabel}
                </span>
                <h3 className="text-sm font-bold text-white mt-0.5">{activeMission.title}</h3>
              </div>
              {activeMission.id === 'M-RIT-01' && onOpenPostureCoachComparison && (
                <button
                  type="button"
                  onClick={onOpenPostureCoachComparison}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-200 font-bold text-xs cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>開啟 3D 姿勢教練並列對照</span>
                </button>
              )}
            </div>

            {/* Step 1: 閱讀材料 (Source Excerpt) */}
            <div className="p-3.5 rounded-lg bg-slate-900/90 border-l-4 border-amber-400 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
                <span>【第一步 · 閱讀材料】原始文獻與賽事史料節錄</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  出處：{activeMission.sourceCitation}
                </span>
              </div>
              <p className="text-slate-200 leading-relaxed font-serif text-xs">
                「{activeMission.sourceExcerpt}」
              </p>
            </div>

            {/* Step 2: 提問 (Why Question & Thinking Clues) */}
            <div className="p-3.5 rounded-lg bg-sky-950/30 border border-sky-500/35 space-y-2">
              <div className="flex items-center gap-1.5 text-sky-300 font-bold">
                <HelpCircle className="w-4 h-4" />
                <span>【第二步 · 核心探究提問】</span>
              </div>
              <p className="text-sm font-bold text-white">{activeMission.question}</p>
              <div className="pt-1 space-y-1">
                <div className="text-[11px] text-sky-200/90 font-semibold">
                  思考方向提示（非評分標準）：
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                  {activeMission.rubricHint.map((hint, idx) => (
                    <li key={idx}>{hint}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Step 3: 反思 (Student Free-Text Reflection Input) */}
            <div className="space-y-1.5">
              <label className="flex items-center justify-between font-bold text-emerald-300">
                <span className="flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5" />
                  <span>【第三步 · 個人反思與論證記錄】</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  僅儲存於本機瀏覽器，不會上傳或編入公開網址
                </span>
              </label>
              <p className="text-[11px] text-slate-400">{activeMission.reflectionPrompt}</p>
              <textarea
                rows={4}
                value={currentReflection}
                onChange={(e) => onSaveReflection(activeMission.id, e.target.value)}
                placeholder="在此輸入你的探究分析、實測觀察與史料論證..."
                className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 focus:border-amber-400 focus:outline-hidden text-slate-100 text-xs leading-relaxed"
              />
            </div>

            {/* Step 4: 產出 (Shareable Inquiry Artefact Card) */}
            <div className="p-3.5 rounded-lg bg-slate-900/95 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-[10px] font-mono text-emerald-400">
                  【第四步 · 探究成果產出】
                </div>
                <div className="font-bold text-white text-xs">{activeMission.artefactTitle}</div>
                <div className="text-[11px] text-slate-400">
                  {currentReflection.trim().length >= 10
                    ? '已完成反思記錄，可複製成果卡片與同儕搭檔交流討論。'
                    : '撰寫至少 10 字反思後，即可生成可複製的探究成果小結。'}
                </div>
              </div>
              <button
                type="button"
                disabled={currentReflection.trim().length < 5}
                onClick={() =>
                  handleCopyText(
                    activeMission.id,
                    `${activeMission.artefactTitle}\n探究問題：${activeMission.question}\n我的探究反思：${currentReflection}\n史料根據：${activeMission.sourceCitation}`
                  )
                }
                className="flex items-center gap-1.5 px-3.5 py-2 rounded bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 text-slate-950 font-bold text-xs cursor-pointer transition-colors shrink-0"
              >
                {copiedId === activeMission.id ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>已複製探究產出</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>複製探究成果卡</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBVIEW 2: 8.7 HISTORICAL SOURCE KEYWORD ANNOTATION (史料標註) */}
      {subView === 'annotations' && (
        <div className="space-y-3">
          <div className="p-3.5 rounded-lg bg-slate-950/90 border border-sky-500/40 space-y-1">
            <div className="text-xs font-bold text-sky-300">
              8.7 史料標註任務：從原始史料提取關鍵詞並掛載至時間軸／3D 展板節點 〔OBJ-PEER + OBJ-HK〕
            </div>
            <p className="text-slate-300 text-[11px]">
              以下所有史料均附有明確館藏或文獻出處。請點選關鍵詞將其標註至對應的 3D 展板或歷史節點，標註統計將隨同儕接力碼分享予搭檔。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SOURCE_ANCHORS.map((src) => {
              const selectedTags = sourceAnnotations[src.id] || [];
              return (
                <div
                  key={src.id}
                  className="p-3.5 rounded-lg bg-slate-950/85 border border-slate-800 space-y-2.5 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded bg-sky-500/15 border border-sky-500/40 text-sky-300 font-mono text-[10px]">
                        {src.id} · {src.dateNote}
                      </span>
                      <span className="text-[10px] text-amber-300 font-mono">
                        掛載目標：{src.linkedTargetLabel}
                      </span>
                    </div>
                    <div className="font-bold text-white text-xs">{src.title}</div>
                    <p className="text-slate-300 text-[11px] leading-relaxed font-serif bg-slate-900/90 p-2.5 rounded border border-slate-800">
                      「{src.excerpt}」
                    </p>
                    <div className="text-[10px] text-slate-400">出處機構：{src.institution}</div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                    <div className="text-[10px] text-slate-400">
                      點擊關鍵詞標註至「{src.linkedTargetLabel}」：
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {src.suggestedKeywords.map((kw) => {
                        const active = selectedTags.includes(kw);
                        return (
                          <button
                            key={kw}
                            type="button"
                            onClick={() => onToggleSourceKeyword(src.id, kw)}
                            className={`px-2 py-1 rounded text-[11px] font-medium border cursor-pointer transition-colors ${
                              active
                                ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold'
                                : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-amber-500/50'
                            }`}
                          >
                            {active ? `✓ #${kw}` : `+ #${kw}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBVIEW 3: 8.7 AI-ASSISTED COMMENTARY WORKSHEET WITH MANDATORY HUMAN FACT-CHECK */}
      {subView === 'ai_worksheet' && (
        <div className="p-4 rounded-xl bg-slate-950/90 border border-emerald-500/40 space-y-4">
          <div className="border-b border-slate-800 pb-2.5">
            <div className="text-[10px] font-mono text-emerald-400">
              8.7 AI 輔助解說詞撰寫與人工事實核查工作紙 〔OBJ-PEER〕
            </div>
            <h3 className="text-sm font-bold text-white mt-0.5">
              展品選擇 → 三個必答事實 → 複製 AI 提示詞 → 強制人工核查清單 → 定稿發佈
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              本工作紙不直接調用模型代寫，而是訓練學生先提煉可驗證事實、再以四項核查標準審視 AI 草稿。
            </p>
          </div>

          {/* 1. Select Exhibit */}
          <div className="space-y-1.5">
            <label className="font-bold text-amber-300 block">
              步驟 1：選擇要撰寫解說詞的文物或歷史展品
            </label>
            <select
              value={aiCommentary.selectedExhibitId}
              onChange={(e) => onUpdateAICommentary({ selectedExhibitId: e.target.value })}
              className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white text-xs"
            >
              {SOURCE_ANCHORS.map((s) => (
                <option key={s.id} value={s.id}>
                  [{s.id}] {s.title}（{s.institution}）
                </option>
              ))}
            </select>
            <div className="p-2.5 rounded bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300">
              <strong>原始史料對照：</strong>「{selectedExhibit.excerpt}」
            </div>
          </div>

          {/* 2. Three Mandatory Facts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-200 mb-1">
                步驟 2A：必答事實一（年代／地點）
              </label>
              <input
                type="text"
                value={aiCommentary.fact1}
                onChange={(e) => onUpdateAICommentary({ fact1: e.target.value })}
                placeholder="例如：清代新界屏山鄧氏宗族..."
                className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-200 mb-1">
                步驟 2B：必答事實二（器物／技術特徵）
              </label>
              <input
                type="text"
                value={aiCommentary.fact2}
                onChange={(e) => onUpdateAICommentary({ fact2: e.target.value })}
                placeholder="例如：文物館藏清朝官兵箭與三棱鐵鏃..."
                className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-200 mb-1">
                步驟 2C：必答事實三（與國家／香港之關聯）
              </label>
              <input
                type="text"
                value={aiCommentary.fact3}
                onChange={(e) => onUpdateAICommentary({ fact3: e.target.value })}
                placeholder="例如：印證香港宗族參與國家武舉科考..."
                className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white text-xs"
              />
            </div>
          </div>

          {/* 3. Copyable AI Draft Prompt */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sky-300">
                步驟 3：AI 草稿提示詞（可複製至外部 AI 工具生成初稿）
              </span>
              <button
                type="button"
                onClick={() => handleCopyText('ai_prompt', generatedPrompt)}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/50 text-sky-200 font-bold text-[11px] cursor-pointer"
              >
                {copiedId === 'ai_prompt' ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>已複製提示詞</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>複製提示詞</span>
                  </>
                )}
              </button>
            </div>
            <pre className="whitespace-pre-wrap text-[11px] text-slate-300 font-mono bg-slate-950 p-2.5 rounded border border-slate-800">
              {generatedPrompt}
            </pre>
          </div>

          {/* 4. Mandatory Visible Fact-Check Checklist */}
          <div className="p-3.5 rounded-lg bg-amber-950/30 border border-amber-500/40 space-y-2">
            <div className="font-bold text-amber-300">
              步驟 4：強制人工核查清單（必須全部勾選確認後方可輸入定稿）
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiCommentary.checklist.traceableSource}
                  onChange={() => toggleCheckItem('traceableSource')}
                  className="accent-amber-400 w-4 h-4"
                />
                <span>來源是否可追溯？</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiCommentary.checklist.numbersMatchSource}
                  onChange={() => toggleCheckItem('numbersMatchSource')}
                  className="accent-amber-400 w-4 h-4"
                />
                <span>數字是否與原始材料一致？</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiCommentary.checklist.noHyperbole}
                  onChange={() => toggleCheckItem('noHyperbole')}
                  className="accent-amber-400 w-4 h-4"
                />
                <span>是否避免了誇大或情緒化表述？</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiCommentary.checklist.nationalHkLink}
                  onChange={() => toggleCheckItem('nationalHkLink')}
                  className="accent-amber-400 w-4 h-4"
                />
                <span>是否說明了與香港／國家的關聯？</span>
              </label>
            </div>
          </div>

          {/* 5. Final Verified Output Input */}
          <div className="space-y-1.5">
            <label className="font-bold text-emerald-300 block">
              步驟 5：人工核查後之展品解說詞定稿輸入
            </label>
            <textarea
              rows={3}
              disabled={!allChecklistPassed}
              value={aiCommentary.finalVerifiedText}
              onChange={(e) => onUpdateAICommentary({ finalVerifiedText: e.target.value })}
              placeholder={
                allChecklistPassed
                  ? '請貼上或輸入經你人工核查無誤後的展品解說詞定稿...'
                  : '請先完成上方 4 項「人工核查清單」勾選，以解鎖定稿輸入框。'
              }
              className="w-full p-2.5 rounded bg-slate-900 border border-slate-700 disabled:opacity-50 text-white text-xs"
            />
          </div>
        </div>
      )}
    </div>
  );
};
