import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { MartialRank, ShotResult } from '../types/archery';

interface BullseyeCalligraphyEffectProps {
  isActive: boolean;
  shotResult: ShotResult | null;
  currentRank: MartialRank;
  bullseyeCount: number;
  arrowIndex: number;
}

interface RankCalligraphyMeta {
  rankVerticalTitle: string;      // Main vertical ranking title
  bullseyeAccolade: string;       // Four-character classical bullseye praise
  imperialSubInscription: string; // Vertical subtitle column
  sealCharacters: string;         // 4-char vermilion seal stamp
  leftCouplet: string;            // Left flank ritual archery verse
}

const RANK_CALLIGRAPHY_MAP: Record<string, RankCalligraphyMeta> = {
  rank_wusheng: {
    rankVerticalTitle: '奧運資格魁首',
    bullseyeAccolade: '十環貫心',
    imperialSubInscription: '北京奧運射箭場 · 滿環精準命中',
    sealCharacters: '中國射箭',
    leftCouplet: '承六藝禮射揚威奧運場',
  },
  rank_xiucai: {
    rankVerticalTitle: '奧運八強神射',
    bullseyeAccolade: '破風十環',
    imperialSubInscription: '東京濱海賽場 · 逆風正中靶心',
    sealCharacters: '百步穿楊',
    leftCouplet: '聽海風判微毫矢出應弦',
  },
  rank_juren: {
    rankVerticalTitle: '國家隊衝金先鋒',
    bullseyeAccolade: '五環奪標',
    imperialSubInscription: '巴黎榮軍院 · 七十米滿環絕殺',
    sealCharacters: '為國爭光',
    leftCouplet: '挽反曲鎮賽場七十穿心',
  },
  rank_zhuangyuan: {
    rankVerticalTitle: '奧林匹克冠軍',
    bullseyeAccolade: '金殿奪魁',
    imperialSubInscription: '奧運金牌決賽 · 華夏射藝登巔',
    sealCharacters: '奧運金牌',
    leftCouplet: '繼千年射道傳奇冠絕五環',
  },
};

const INK_DROPLETS = [
  { id: 1, top: '20%', right: '14%', size: 7, delay: 0.18, blur: 1 },
  { id: 2, top: '34%', right: '6%', size: 5, delay: 0.32, blur: 0.5 },
  { id: 3, top: '56%', right: '15%', size: 10, delay: 0.46, blur: 1.5 },
  { id: 4, top: '72%', right: '8%', size: 6, delay: 0.58, blur: 0.8 },
  { id: 5, top: '26%', left: '12%', size: 7, delay: 0.28, blur: 1.2 },
  { id: 6, top: '64%', left: '9%', size: 8, delay: 0.52, blur: 1.4 },
];

const containerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
      when: 'beforeChildren',
      staggerChildren: 0.08,
    },
  },
  exit: {
    opacity: 0,
    filter: 'blur(6px)',
    transition: {
      duration: 0.65,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

const inkWashBackdropVariants: Variants = {
  hidden: {
    scaleY: 0.15,
    scaleX: 0.75,
    opacity: 0,
    filter: 'blur(14px)',
  },
  visible: {
    scaleY: 1,
    scaleX: 1,
    opacity: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.85,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    scaleY: 1.05,
    opacity: 0,
    filter: 'blur(12px)',
    transition: {
      duration: 0.55,
    },
  },
};

const charBrushVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 1.42,
    y: -10,
    filter: 'blur(8px)',
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.48,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.94,
    filter: 'blur(4px)',
    transition: {
      duration: 0.3,
    },
  },
};

const sealStampVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 2.1,
    rotate: -8,
    filter: 'blur(4px)',
  },
  visible: {
    opacity: 0.92,
    scale: 1,
    rotate: -2,
    filter: 'blur(0px)',
    transition: {
      delay: 0.78,
      duration: 0.36,
      type: 'spring',
      stiffness: 280,
      damping: 18,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.25 },
  },
};

export const BullseyeCalligraphyEffect: React.FC<BullseyeCalligraphyEffectProps> = ({
  isActive,
  shotResult,
  currentRank,
  bullseyeCount,
  arrowIndex,
}) => {
  const [replayCount, setReplayCount] = useState(0);
  const [manualPreview, setManualPreview] = useState(false);

  // Allow manual replay/preview of the ink-wash calligraphy effect via custom event
  useEffect(() => {
    const handleReplay = () => {
      setReplayCount((c) => c + 1);
      setManualPreview(true);
    };
    window.addEventListener('replay-bullseye-calligraphy', handleReplay);
    return () => window.removeEventListener('replay-bullseye-calligraphy', handleReplay);
  }, []);

  // Reset manual preview when moving out of impact state
  useEffect(() => {
    if (!isActive) {
      setManualPreview(false);
    }
  }, [isActive]);

  const isBullseye = Boolean(
    isActive && shotResult && (shotResult.score === 10 || manualPreview)
  );

  const meta = useMemo(() => {
    const base =
      RANK_CALLIGRAPHY_MAP[currentRank.id] || RANK_CALLIGRAPHY_MAP.rank_wusheng;

    // Elevate the accolade when player achieves consecutive/multiple bullseyes in a round
    let accolade = base.bullseyeAccolade;
    if (bullseyeCount >= 3) {
      accolade = '三箭定山';
    } else if (bullseyeCount === 2) {
      accolade = '連中雙鵠';
    }

    return {
      ...base,
      bullseyeAccolade: accolade,
    };
  }, [currentRank.id, bullseyeCount]);

  // Split strings into individual characters for sequential vertical brush-stroke animation
  const primaryTitleChars = useMemo(
    () => Array.from(`${meta.rankVerticalTitle}·${meta.bullseyeAccolade}`),
    [meta.rankVerticalTitle, meta.bullseyeAccolade]
  );

  const leftCoupletChars = useMemo(
    () => Array.from(meta.leftCouplet),
    [meta.leftCouplet]
  );

  const sealChars = useMemo(
    () => Array.from(meta.sealCharacters),
    [meta.sealCharacters]
  );

  return (
    <AnimatePresence mode="wait">
      {isBullseye && shotResult && (
        <motion.div
          key={`bullseye-calligraphy-${currentRank.id}-arrow-${arrowIndex}-${replayCount}`}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="pointer-events-none fixed inset-0 z-25 overflow-hidden select-none"
          aria-hidden="true"
        >
          {/* Shared SVG Filters for Wet-Ink Bleed (水墨宣紙暈染) and Flying-White Brush Texture (飛白) */}
          <svg className="absolute w-0 h-0" aria-hidden="true">
            <defs>
              <filter id="ink-wash-bleed" x="-20%" y="-20%" width="140%" height="140%">
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.035"
                  numOctaves="3"
                  seed="17"
                  result="noise"
                />
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="noise"
                  scale="11"
                  xChannelSelector="R"
                  yChannelSelector="G"
                />
              </filter>
              <filter id="calligraphy-feibai" x="-10%" y="-10%" width="120%" height="120%">
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.065 0.02"
                  numOctaves="2"
                  seed="8"
                  result="brushGrain"
                />
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="brushGrain"
                  scale="2.2"
                  xChannelSelector="R"
                  yChannelSelector="G"
                />
              </filter>
            </defs>
          </svg>

          {/* Subtle Center Bullseye Ink-Halo Ripple */}
          <motion.div
            initial={{ scale: 0.45, opacity: 0.75 }}
            animate={{ scale: 2.35, opacity: 0 }}
            transition={{ duration: 1.55, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full border border-amber-300/35 shadow-[0_0_60px_rgba(217,119,6,0.25)]"
            style={{ filter: 'url(#ink-wash-bleed)' }}
          />

          {/* Subtle Floating Sumi-Ink Droplets (墨韻飛白微粒) */}
          {INK_DROPLETS.map((drop) => (
            <motion.div
              key={drop.id}
              initial={{ opacity: 0, scale: 0, y: 8 }}
              animate={{
                opacity: [0, 0.45, 0.2],
                scale: [0.2, 1.3, 1],
                y: [8, 0, -4],
              }}
              transition={{
                duration: 1.8,
                delay: drop.delay,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="absolute rounded-full bg-stone-950/90 ring-1 ring-amber-400/25"
              style={{
                top: drop.top,
                right: drop.right,
                left: drop.left,
                width: `${drop.size}px`,
                height: `${drop.size}px`,
                filter: `blur(${drop.blur}px)`,
              }}
            />
          ))}

          {/* LEFT FLANK: Classical Ritual Archery Vertical Inscription (水墨副聯) */}
          <div className="hidden md:flex absolute left-10 top-1/2 -translate-y-1/2 items-center gap-3">
            <motion.div
              variants={inkWashBackdropVariants}
              style={{
                transformOrigin: 'top center',
                filter: 'url(#ink-wash-bleed)',
              }}
              className="relative py-8 px-4 rounded-sm bg-gradient-to-b from-stone-950/85 via-stone-900/75 to-stone-950/60 border-x border-amber-500/20 shadow-[0_12px_40px_rgba(0,0,0,0.65)]"
            >
              {/* Ink Splatter Accents */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-3 rounded-full bg-stone-950/80 blur-[2px]" />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-2.5 rounded-full bg-stone-950/70 blur-[2px]" />

              {/* Vertical Classical Verse */}
              <motion.div
                className="flex flex-col items-center gap-1.5 text-amber-100/85"
                style={{
                  writingMode: 'vertical-rl',
                  textOrientation: 'upright',
                  fontFamily: "'Ma Shan Zheng', 'Noto Serif TC', serif",
                  filter: 'url(#calligraphy-feibai)',
                }}
              >
                {leftCoupletChars.map((ch, idx) => (
                  <motion.span
                    key={`left-char-${idx}`}
                    variants={charBrushVariants}
                    className="text-xl tracking-[0.22em] drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]"
                  >
                    {ch}
                  </motion.span>
                ))}
              </motion.div>
            </motion.div>
          </div>

          {/* RIGHT FLANK: Primary Ink-Wash Calligraphy Scroll with Traditional Ranking Title (正階武職題名) */}
          <div className="absolute right-8 md:right-12 top-1/2 -translate-y-1/2 flex items-start gap-3.5">
            {/* Vertical Subtitle Column (Frontier Pass & Arrow Record) */}
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 0.85, y: 0 }}
              transition={{ delay: 0.42, duration: 0.6 }}
              className="pt-6 text-xs text-amber-200/80 font-serif tracking-[0.25em] drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]"
              style={{
                writingMode: 'vertical-rl',
                textOrientation: 'upright',
                fontFamily: "'Noto Serif TC', serif",
              }}
            >
              {meta.imperialSubInscription} · 第{arrowIndex}矢正中紅心
            </motion.div>

            {/* Main Sumi-e Brush Stroke Column */}
            <div className="relative flex flex-col items-center">
              {/* Organic Ink-Wash Brush Stroke SVG Backdrop */}
              <motion.div
                variants={inkWashBackdropVariants}
                style={{
                  transformOrigin: 'top center',
                }}
                className="relative px-6 py-9 flex flex-col items-center"
              >
                {/* Hand-crafted SVG Sumi-e Vertical Brush Wash */}
                <svg
                  viewBox="0 0 120 520"
                  preserveAspectRatio="none"
                  className="absolute inset-0 w-full h-full -z-10 overflow-visible"
                  style={{ filter: 'url(#ink-wash-bleed)' }}
                >
                  {/* Outer pale Xuan-paper gold-ink aura */}
                  <path
                    d="M60,6 C94,10 112,38 109,95 C106,185 113,310 105,425 C100,478 82,508 58,514 C32,509 16,476 13,420 C8,305 14,180 11,90 C9,36 28,8 60,6 Z"
                    fill="rgba(28, 25, 23, 0.86)"
                    stroke="rgba(217, 119, 6, 0.32)"
                    strokeWidth="1.5"
                  />
                  {/* Inner deep sumi-ink core stroke */}
                  <path
                    d="M60,18 C86,22 98,48 96,102 C93,190 99,305 92,412 C88,462 75,492 59,498 C40,492 27,460 25,408 C21,300 26,185 23,98 C21,46 36,20 60,18 Z"
                    fill="rgba(12, 10, 9, 0.92)"
                  />
                  {/* Subtle gold-leaf dry-brush streaks */}
                  <path
                    d="M36,42 Q62,250 42,468"
                    stroke="rgba(245, 158, 11, 0.16)"
                    strokeWidth="2.5"
                    fill="none"
                    strokeDasharray="18 9 6 12"
                  />
                  <path
                    d="M84,54 Q58,260 78,458"
                    stroke="rgba(245, 158, 11, 0.12)"
                    strokeWidth="1.8"
                    fill="none"
                    strokeDasharray="12 14 22 8"
                  />
                </svg>

                {/* Vertical Traditional Ranking Title & Bullseye Accolade Characters */}
                <motion.div
                  className="flex flex-col items-center gap-1"
                  style={{
                    writingMode: 'vertical-rl',
                    textOrientation: 'upright',
                    fontFamily: "'Ma Shan Zheng', 'Noto Serif TC', serif",
                    filter: 'url(#calligraphy-feibai)',
                  }}
                >
                  {primaryTitleChars.map((ch, idx) => {
                    const isSeparator = ch === '·';
                    const isAccoladePart = idx > meta.rankVerticalTitle.length;
                    return (
                      <motion.span
                        key={`right-char-${idx}`}
                        variants={charBrushVariants}
                        className={
                          isSeparator
                            ? 'my-0.5 text-lg text-amber-500/80 font-bold'
                            : isAccoladePart
                            ? 'text-3xl md:text-4xl text-amber-300 tracking-[0.14em] drop-shadow-[0_2px_10px_rgba(245,158,11,0.45)]'
                            : 'text-3xl md:text-4xl text-amber-50 tracking-[0.14em] drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]'
                        }
                      >
                        {ch}
                      </motion.span>
                    );
                  })}
                </motion.div>

                {/* Traditional Cinnabar Seal Stamp (硃砂欽定印鑑) */}
                <motion.div
                  variants={sealStampVariants}
                  className="mt-4 w-11 h-11 p-1 rounded-xs bg-red-800/90 border-2 border-red-400/80 shadow-[0_0_16px_rgba(220,38,38,0.45)] grid grid-cols-2 grid-rows-2 items-center justify-items-center"
                >
                  {sealChars.map((sChar, sIdx) => (
                    <span
                      key={`seal-${sIdx}`}
                      className="text-[11px] leading-none font-serif font-bold text-amber-100/95"
                    >
                      {sChar}
                    </span>
                  ))}
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
