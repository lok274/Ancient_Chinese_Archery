import React from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { MartialRank, TimeOfDayPhase } from '../types/archery';
import {
  Trophy,
  BookOpen,
  Volume2,
  VolumeX,
  Sun,
  Sunset,
  Flame,
  Activity,
  Landmark,
  Compass,
} from 'lucide-react';

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
  mechanicsOverlayEnabled?: boolean;
  onToggleMechanicsOverlay?: () => void;
  onOpenInquiryMissions?: () => void;
  onOpenHKHeritage?: () => void;
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
  onCycleTimePhase,
  isMuted,
  onToggleMute,
  onOpenGuide,
  mechanicsOverlayEnabled = false,
  onToggleMechanicsOverlay,
  onOpenInquiryMissions,
  onOpenHKHeritage,
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
          className="absolute top-0 left-0 right-0 z-20 h-11 flex items-center justify-between gap-3 px-4 bg-slate-950/80 backdrop-blur-md text-amber-50 border-b border-amber-500/35"
        >
          {/* Zone 1: Brand Title with Team China Red-Gold & Olympic 5-Color Bar */}
          <motion.div
            variants={ritualItemVariants}
            className="flex items-center gap-2 shrink-0"
          >
            <div className="flex items-center gap-0.5" aria-hidden="true">
              <span className="w-1.5 h-3.5 bg-sky-500 rounded-xs" />
              <span className="w-1.5 h-3.5 bg-amber-400 rounded-xs" />
              <span className="w-1.5 h-3.5 bg-slate-200 rounded-xs" />
              <span className="w-1.5 h-3.5 bg-emerald-500 rounded-xs" />
              <span className="w-1.5 h-3.5 bg-red-600 rounded-xs" />
            </div>
            <span className="text-sm sm:text-base font-bold tracking-wider text-amber-200 whitespace-nowrap">
              奧林匹克射箭錦標賽 · 中國射箭榮耀與歷史
            </span>
          </motion.div>

          {/* Zone 2: Clean Unboxed Olympic Match Telemetry */}
          <div className="hidden xl:flex items-center gap-4 text-xs">
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
                {currentRank.frontierPass} ({currentRank.targetDistance}m)
              </span>
            </motion.div>

            <span className="text-stone-700">|</span>

            {/* Match Session / Lighting Switcher */}
            <motion.div variants={ritualItemVariants} className="relative group">
              <button
                type="button"
                onClick={onCycleTimePhase}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 transition-colors cursor-pointer whitespace-nowrap"
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
            </motion.div>

            <span className="text-stone-700">|</span>

            {/* 6-Arrow End Progress */}
            <motion.div variants={ritualItemVariants} className="flex items-center gap-1.5">
              <span className="text-stone-400 whitespace-nowrap">箭序:</span>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalArrows }).map((_, i) => {
                  const shot = i < shotScores.length;
                  const isCurrent = i === currentArrowIndex;
                  return (
                    <span
                      key={i}
                      className={`w-2 h-3.5 rounded-xs transition-colors ${
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

          {/* Zone 3: Scoreboard, Mechanics Overlay Toggle (v2), HK Board & Guide Buttons */}
          <motion.div
            variants={ritualItemVariants}
            className="flex items-center gap-1.5 shrink-0"
          >
            <div className="flex items-baseline gap-1 px-2 py-0.5 bg-red-950/70 border border-red-500/40 rounded">
              <span className="text-[11px] text-amber-200 font-semibold">CHN:</span>
              <span className="font-mono tabular-nums text-sm font-bold text-amber-300">
                {totalScore}
              </span>
              <span className="text-[10px] text-stone-400">/60</span>
            </div>

            {/* v2 Mechanics Overlay Toggle Icon (力學疊加層) */}
            {onToggleMechanicsOverlay && (
              <button
                type="button"
                onClick={onToggleMechanicsOverlay}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap ${
                  mechanicsOverlayEnabled
                    ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                    : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:text-emerald-300'
                }`}
                title="切換 3D 弓臂應力熱圖與即時拉弓力曲線疊加層 〔OBJ-TECH〕"
              >
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline">力學疊加層</span>
              </button>
            )}

            {/* v2 HK Heritage Panel Quick Trigger */}
            {onOpenHKHeritage && (
              <button
                type="button"
                onClick={onOpenHKHeritage}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-slate-900/80 hover:bg-slate-800 border border-amber-500/40 text-amber-200 transition-colors cursor-pointer whitespace-nowrap"
                title="查閱場邊香港射藝文化與內地同源展板 〔OBJ-HK〕"
              >
                <Landmark className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">香港展板</span>
              </button>
            )}

            {/* v2 Inquiry Missions Direct Trigger */}
            {onOpenInquiryMissions && (
              <button
                type="button"
                onClick={onOpenInquiryMissions}
                className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/50 text-sky-200 transition-colors cursor-pointer whitespace-nowrap"
                title="開啟公民科四步探究任務與史料標註"
              >
                <Compass className="w-3.5 h-3.5 text-sky-300" />
                <span>探究任務</span>
              </button>
            )}

            <button
              onClick={onToggleMute}
              className="p-1 text-stone-300 hover:text-amber-300 hover:bg-slate-800/60 rounded transition-colors cursor-pointer"
              title={isMuted ? '開啟音效' : '靜音'}
              aria-label={isMuted ? '開啟音效' : '靜音'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onOpenGuide}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded shadow-sm transition-colors whitespace-nowrap cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-red-800" />
              <span className="hidden sm:inline">中國隊成就與歷史</span>
              <span className="sm:hidden">史館</span>
            </button>
          </motion.div>
        </motion.header>
      )}
    </AnimatePresence>
  );
};
