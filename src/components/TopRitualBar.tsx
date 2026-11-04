import React from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { MartialRank, TimeOfDayPhase } from '../types/archery';
import { Shield, BookOpen, Volume2, VolumeX, Sun, Sunset, Flame } from 'lucide-react';

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
      duration: 0.65,
      ease: [0.22, 1, 0.36, 1],
      when: 'beforeChildren',
      staggerChildren: 0.085,
      delayChildren: 0.08,
    },
  },
  exit: {
    y: -52,
    opacity: 0,
    transition: {
      duration: 0.42,
      ease: [0.4, 0, 0.2, 1],
      staggerChildren: 0.04,
      staggerDirection: -1,
    },
  },
};

const ritualItemVariants: Variants = {
  hidden: {
    y: -14,
    opacity: 0,
    scale: 0.96,
    filter: 'blur(3px)',
  },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.52,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    y: -10,
    opacity: 0,
    scale: 0.96,
    filter: 'blur(2px)',
    transition: {
      duration: 0.28,
      ease: 'easeIn',
    },
  },
};

const tallyContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.055,
      delayChildren: 0.18,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
};

const tallyArrowVariants: Variants = {
  hidden: {
    scaleY: 0,
    opacity: 0,
    originY: 1,
  },
  visible: {
    scaleY: 1,
    opacity: 1,
    originY: 1,
    transition: {
      type: 'spring',
      stiffness: 320,
      damping: 22,
    },
  },
  exit: {
    scaleY: 0,
    opacity: 0,
    originY: 0,
    transition: {
      duration: 0.2,
    },
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

  // Unique key per round and rank so the ritual bar respectfully unfolds at the start of each round
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
          className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between gap-4 px-6 py-3 bg-black/65 backdrop-blur-md text-amber-50 overflow-visible"
        >
          {/* Unfurling Silk-Scroll Shimmer Sweep at Round Start (展卷金輝) */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <motion.div
              initial={{ x: '-110%', opacity: 0.85 }}
              animate={{ x: '220%', opacity: 0 }}
              transition={{ duration: 1.45, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              className="w-1/2 h-full bg-gradient-to-r from-transparent via-amber-500/15 to-transparent skew-x-12"
            />
          </div>

          {/* Ceremonial Center-Outward Unfolding Gilded Border Line (禮射金線展卷) */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ scaleX: 0, opacity: 0 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-[1px] origin-center bg-gradient-to-r from-amber-900/20 via-amber-500/60 to-amber-900/20"
          />

          {/* Zone 1: Single element brand wordmark with subtle imperial seal bar */}
          <motion.div
            variants={ritualItemVariants}
            className="flex items-center gap-3 shrink-0"
          >
            <motion.span
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.45, delay: 0.25 }}
              className="w-1 h-5 bg-red-700 border border-amber-400/50 rounded-xs origin-top"
              aria-hidden="true"
            />
            <span className="text-xl font-bold tracking-widest text-amber-200 uppercase whitespace-nowrap">
              邊關演武 · 中華傳統射箭
            </span>
          </motion.div>

          {/* Zone 2: Clean unboxed stats, Time-of-Day atmosphere & quiver status */}
          <div className="hidden lg:flex items-center gap-6 text-sm">
            {/* Martial Rank */}
            <motion.div
              variants={ritualItemVariants}
              className="flex items-center gap-2 text-stone-300"
            >
              <Shield className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-amber-100">{currentRank.title}</span>
              <span className="text-stone-500">/</span>
              <span className="text-xs text-stone-400">{currentRank.subtitle}</span>
            </motion.div>

            {/* Target Distance */}
            <motion.div
              variants={ritualItemVariants}
              className="flex items-center gap-1.5 text-stone-300"
            >
              <span className="text-stone-400">射距:</span>
              <span className="font-mono tabular-nums font-semibold text-amber-200">
                {currentRank.targetDistance}米 ({Math.round(currentRank.targetDistance * 0.7)}步)
              </span>
            </motion.div>

            {/* Dynamic Time-of-Day Indicator (時辰天象：破曉 -> 斜陽暮靄) */}
            <motion.div variants={ritualItemVariants} className="relative group">
              <button
                type="button"
                onClick={onCycleTimePhase}
                className="flex items-center gap-2 px-2.5 py-1 rounded-xs bg-stone-900/75 hover:bg-amber-950/70 border border-amber-700/35 transition-colors cursor-pointer"
              >
                {isGoldenOrSunset ? (
                  <Sunset className="w-4 h-4 text-orange-400 animate-pulse" />
                ) : isSunrise ? (
                  <Sunset className="w-4 h-4 text-rose-300" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-300" />
                )}
                <span className="text-xs font-bold tracking-wider text-amber-200">
                  {currentTimePhase.shichen} · {currentTimePhase.name}
                </span>
                {isGoldenOrSunset && (
                  <span title="演武火盆已點燃">
                    <Flame className="w-3.5 h-3.5 text-orange-400" />
                  </span>
                )}
                {isManualTimeOverride && (
                  <span className="text-[10px] px-1 py-0.2 bg-amber-800/60 text-amber-200 rounded-xs">
                    自選
                  </span>
                )}
              </button>

              {/* Subtle Hover Tooltip explaining lighting & target visibility impact */}
              <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 p-3 bg-stone-950/95 border border-amber-700/50 rounded-xs shadow-xl z-40 text-xs">
                <div className="flex items-center justify-between text-amber-300 font-bold mb-1">
                  <span>天象時辰：{currentTimePhase.shichen} ({currentTimePhase.name})</span>
                  <span className="text-[10px] text-stone-400 font-normal">
                    {isManualTimeOverride ? '點擊切換 / 恢復隨試演進' : '隨箭序由破曉演進至斜陽'}
                  </span>
                </div>
                <p className="text-stone-300 leading-relaxed">{currentTimePhase.visibilityNote}</p>
              </div>
            </motion.div>

            {/* Quiver Arrow Count (●●●○○○) with ceremonial staggered placement */}
            <motion.div
              variants={ritualItemVariants}
              className="flex items-center gap-2"
            >
              <span className="text-xs text-stone-400">箭囊:</span>
              <motion.div
                variants={tallyContainerVariants}
                className="flex items-center gap-1.5"
              >
                {Array.from({ length: totalArrows }).map((_, i) => {
                  const shot = i < shotScores.length;
                  const isCurrent = i === currentArrowIndex;
                  return (
                    <motion.div
                      key={i}
                      variants={tallyArrowVariants}
                      className={`w-2.5 h-6 rounded-xs transition-colors duration-300 ${
                        shot
                          ? 'bg-amber-500 shadow-xs shadow-amber-500/50'
                          : isCurrent
                          ? 'bg-amber-200 scale-110 ring-1 ring-amber-300'
                          : 'bg-stone-700/80 border border-stone-600'
                      }`}
                      title={`第 ${i + 1} 矢`}
                    />
                  );
                })}
              </motion.div>
            </motion.div>
          </div>

          {/* Zone 3: Cumulative Score & Action buttons */}
          <motion.div
            variants={ritualItemVariants}
            className="flex items-center gap-3 shrink-0"
          >
            <div className="flex items-baseline gap-1.5 px-3 py-1 bg-amber-950/60 border border-amber-800/40 rounded-sm">
              <span className="text-xs text-amber-300/80">總分:</span>
              <span className="font-mono tabular-nums text-lg font-bold text-amber-300">
                {totalScore}
              </span>
              <span className="text-xs text-stone-400">/ 60</span>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={onToggleMute}
              className="p-2 text-stone-300 hover:text-amber-300 hover:bg-stone-800/50 rounded-sm transition-colors"
              title={isMuted ? '開啟音效' : '靜音'}
              aria-label={isMuted ? '開啟音效' : '靜音'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Archery Knowledge / Cultural Guide */}
            <button
              onClick={onOpenGuide}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-100 bg-amber-900/40 hover:bg-amber-800/60 border border-amber-700/50 rounded-sm transition-colors whitespace-nowrap"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>射藝考典</span>
            </button>
          </motion.div>
        </motion.header>
      )}
    </AnimatePresence>
  );
};
