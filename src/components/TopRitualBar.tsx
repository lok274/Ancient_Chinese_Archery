import React from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { MartialRank, TimeOfDayPhase } from '../types/archery';
import { Trophy, BookOpen, Volume2, VolumeX, Sun, Sunset, Flame } from 'lucide-react';

interface TopRitualBarProps {
  currentRank: MartialRank;
  currentArrowIndex: number;
  totalArrows: number;
  shotScores: number[];
  currentTimePhase: TimeOfDayPhase;
  isManualTimeOverride: boolean;
  onCycleTimePhase: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenGuide: () => void;
  roundKey?: number;
  isVisible?: boolean;
}

const barContainerVariants: Variants = {
  hidden: {
    y: -64,
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
      when: 'beforeChildren',
      staggerChildren: 0.06,
    },
  },
  exit: {
    y: -52,
    opacity: 0,
    transition: {
      duration: 0.35,
    },
  },
};

const ritualItemVariants: Variants = {
  hidden: {
    y: -10,
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    y: -8,
    opacity: 0,
  },
};

export const TopRitualBar: React.FC<TopRitualBarProps> = ({
  currentRank,
  currentArrowIndex,
  totalArrows,
  shotScores,
  currentTimePhase,
  isManualTimeOverride,
  onCycleTimePhase,
  isMuted,
  onToggleMute,
  onOpenGuide,
  roundKey = 0,
  isVisible = true,
}) => {
  const totalScore = shotScores.reduce((sum, s) => sum + s, 0);
  const isGoldenOrSunset = currentTimePhase.progress >= 0.75;
  const isSunrise = currentTimePhase.progress <= 0.15;

  const ritualUnfoldKey = `${currentRank.id}-round-${roundKey}`;

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.header
          key={ritualUnfoldKey}
          variants={barContainerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between gap-4 px-5 py-2.5 bg-slate-950/75 backdrop-blur-md text-amber-50 border-b border-amber-500/35"
        >
          {/* Zone 1: Brand Title with Team China Red-Gold & Olympic 5-Color Bar */}
          <motion.div
            variants={ritualItemVariants}
            className="flex items-center gap-2.5 shrink-0"
          >
            <div className="flex items-center gap-0.5" aria-hidden="true">
              <span className="w-1.5 h-4 bg-sky-500 rounded-xs" />
              <span className="w-1.5 h-4 bg-amber-400 rounded-xs" />
              <span className="w-1.5 h-4 bg-slate-200 rounded-xs" />
              <span className="w-1.5 h-4 bg-emerald-500 rounded-xs" />
              <span className="w-1.5 h-4 bg-red-600 rounded-xs" />
            </div>
            <span className="text-base sm:text-lg font-bold tracking-wider text-amber-200 whitespace-nowrap">
              奧林匹克射箭錦標賽 · 中國射箭榮耀與歷史
            </span>
          </motion.div>

          {/* Zone 2: Clean Unboxed Olympic Match Telemetry */}
          <div className="hidden lg:flex items-center gap-5 text-xs">
            {/* Active Olympic Stage & Venue */}
            <motion.div
              variants={ritualItemVariants}
              className="flex items-center gap-1.5 text-stone-200"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-amber-200 whitespace-nowrap">
                {currentRank.title}
              </span>
              <span className="text-stone-500">·</span>
              <span className="text-stone-300 whitespace-nowrap">
                {currentRank.frontierPass}
              </span>
            </motion.div>

            <span className="text-stone-700">|</span>

            {/* Olympic Target Distance */}
            <motion.div
              variants={ritualItemVariants}
              className="flex items-center gap-1 text-stone-300 whitespace-nowrap"
            >
              <span className="text-stone-400">距離:</span>
              <span className="font-mono tabular-nums font-bold text-amber-300">
                {currentRank.targetDistance}m
              </span>
            </motion.div>

            <span className="text-stone-700">|</span>

            {/* Match Session / Lighting Switcher */}
            <motion.div variants={ritualItemVariants} className="relative group">
              <button
                type="button"
                onClick={onCycleTimePhase}
                className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 transition-colors cursor-pointer whitespace-nowrap"
              >
                {isGoldenOrSunset ? (
                  <Sunset className="w-3.5 h-3.5 text-orange-400" />
                ) : isSunrise ? (
                  <Sunset className="w-3.5 h-3.5 text-rose-300" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-300" />
                )}
                <span className="text-xs font-medium text-amber-100">
                  {currentTimePhase.shichen} · {currentTimePhase.name}
                </span>
                {isGoldenOrSunset && <Flame className="w-3 h-3 text-orange-400" />}
              </button>

              <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 p-2.5 bg-slate-950/95 border border-amber-500/40 rounded shadow-xl z-40 text-xs space-y-1">
                <div className="font-bold text-amber-300">
                  賽程時段：{currentTimePhase.shichen} ({currentTimePhase.name})
                </div>
                <p className="text-stone-300 leading-relaxed">{currentTimePhase.visibilityNote}</p>
                <div className="text-[10px] text-stone-400">
                  {isManualTimeOverride ? '點擊切換時段 / 恢復隨箭序推進' : '點擊可手動切換賽場時段光影'}
                </div>
              </div>
            </motion.div>

            <span className="text-stone-700">|</span>

            {/* 6-Arrow End Progress */}
            <motion.div variants={ritualItemVariants} className="flex items-center gap-1.5">
              <span className="text-stone-400 whitespace-nowrap">本局箭序:</span>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalArrows }).map((_, i) => {
                  const shot = i < shotScores.length;
                  const isCurrent = i === currentArrowIndex;
                  return (
                    <span
                      key={i}
                      className={`w-2 h-4 rounded-xs transition-colors ${
                        shot
                          ? 'bg-amber-400'
                          : isCurrent
                          ? 'bg-red-500 ring-1 ring-amber-300'
                          : 'bg-slate-700'
                      }`}
                      title={`第 ${i + 1} 箭`}
                    />
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Zone 3: Scoreboard & Team China / History Guide Button */}
          <motion.div
            variants={ritualItemVariants}
            className="flex items-center gap-2.5 shrink-0"
          >
            <div className="flex items-baseline gap-1 px-2.5 py-1 bg-red-950/70 border border-red-500/40 rounded">
              <span className="text-[11px] text-amber-200 font-semibold">CHN 總環數:</span>
              <span className="font-mono tabular-nums text-base font-bold text-amber-300">
                {totalScore}
              </span>
              <span className="text-[11px] text-stone-400">/ 60</span>
            </div>

            <button
              onClick={onToggleMute}
              className="p-1.5 text-stone-300 hover:text-amber-300 hover:bg-slate-800/60 rounded transition-colors cursor-pointer"
              title={isMuted ? '開啟音效' : '靜音'}
              aria-label={isMuted ? '開啟音效' : '靜音'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onOpenGuide}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded shadow-sm transition-colors whitespace-nowrap cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-red-800" />
              <span>中國隊成就與射箭歷史</span>
            </button>
          </motion.div>
        </motion.header>
      )}
    </AnimatePresence>
  );
};
