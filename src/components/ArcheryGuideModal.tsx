import React from 'react';
import { X, BookOpen, Compass, Award } from 'lucide-react';

interface ArcheryGuideModalProps {
  onClose: () => void;
}

export const ArcheryGuideModal: React.FC<ArcheryGuideModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-stone-900 border border-amber-700/80 rounded-lg p-6 shadow-2xl text-stone-200 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2 text-amber-300">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold tracking-wide">中華傳統射藝考典</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-amber-200 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 mt-4 text-xs leading-relaxed">
          {/* Section 1: Operation & Ballistics Guide */}
          <div className="p-4 bg-stone-950/70 border border-stone-800 rounded-md">
            <h3 className="text-sm font-semibold text-amber-300 mb-2 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>實戰操作與彈道要訣</span>
            </h3>
            <ul className="space-y-2 text-stone-300">
              <li>
                <strong className="text-amber-200">1. 長按引弦（審固）：</strong>
                按住滑鼠左鍵或空白鍵引弓蓄力。弓臂彎曲蓄能，弦線拉緊。
              </li>
              <li>
                <strong className="text-amber-200">2. 屏息定氣（最佳發矢區間）：</strong>
                引弦後約 1.5 秒至 3.2 秒為「神意凝固」期（綠色區間），準星晃動最微。拉弦過久（超過 3.8 秒）手臂肌肉將力竭酸顫，產生劇烈抖動。
              </li>
              <li>
                <strong className="text-amber-200">3. 風偏補償與拋物下墜：</strong>
                箭矢受真實重力與迎面空氣阻力影響，長射程（50米/80米/110米）需將瞄準點適當上抬；並根據上方風向與風速反向預留修正量。
              </li>
            </ul>
          </div>

          {/* Section 2: 六藝之射（五射法） */}
          <div>
            <h3 className="text-sm font-semibold text-amber-300 mb-2 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span>周禮 · 六藝之「五射」</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-stone-950/40 border border-stone-800/80 rounded">
                <div className="font-semibold text-amber-200">白矢</div>
                <p className="text-stone-400 mt-0.5">發矢貫穿靶心，鏃身通透露出白刃，顯發矢之力道深透。</p>
              </div>
              <div className="p-3 bg-stone-950/40 border border-stone-800/80 rounded">
                <div className="font-semibold text-amber-200">參連</div>
                <p className="text-stone-400 mt-0.5">發首矢之後，連發三矢相續而至，矢矢相連如連珠流星。</p>
              </div>
              <div className="p-3 bg-stone-950/40 border border-stone-800/80 rounded">
                <div className="font-semibold text-amber-200">剡注</div>
                <p className="text-stone-400 mt-0.5">箭行平直，頭低尾高，去疾如激流注水，迅烈不移。</p>
              </div>
              <div className="p-3 bg-stone-950/40 border border-stone-800/80 rounded">
                <div className="font-semibold text-amber-200">井儀</div>
                <p className="text-stone-400 mt-0.5">連發四矢皆中皮侯，分佈端正對稱如「井」字之方正。</p>
              </div>
            </div>
          </div>

          {/* Section 3: 傳統角弓「六材」 */}
          <div>
            <h3 className="text-sm font-semibold text-amber-300 mb-2">
              《考工記》傳統角弓六材工藝
            </h3>
            <p className="text-stone-300">
              古法複合角弓以「干、角、筋、膠、絲、漆」六材合成：
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 text-stone-300">
              <div className="p-2 bg-stone-950/30 border border-stone-800 rounded">
                <strong className="text-amber-200">干（木胎）：</strong>拓木或桑木，主射遠。
              </div>
              <div className="p-2 bg-stone-950/30 border border-stone-800 rounded">
                <strong className="text-amber-200">角（牛角）：</strong>水牛角貼內腹，主疾迅。
              </div>
              <div className="p-2 bg-stone-950/30 border border-stone-800 rounded">
                <strong className="text-amber-200">筋（牛鹿背筋）：</strong>鋪於弓背，蓄強力。
              </div>
              <div className="p-2 bg-stone-950/30 border border-stone-800 rounded">
                <strong className="text-amber-200">膠（魚鰾膠）：</strong>黏合六材，調和韌性。
              </div>
              <div className="p-2 bg-stone-950/30 border border-stone-800 rounded">
                <strong className="text-amber-200">絲（纏絲）：</strong>緊纏弓梢與節處以防爆裂。
              </div>
              <div className="p-2 bg-stone-950/30 border border-stone-800 rounded">
                <strong className="text-amber-200">漆（大漆）：</strong>封塗全弓以禦風霜雨露。
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-3 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded transition-colors"
          >
            知曉入列 · 返場射禮
          </button>
        </div>
      </div>
    </div>
  );
};
