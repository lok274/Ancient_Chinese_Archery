/**
 * Archery Types & Constants
 * Modern Olympic Games Archery Competition & Chinese Archery Heritage
 * (現代奧林匹克運動會射箭比賽 · 中國國家射箭隊榮耀與中華千年射藝傳承)
 */

export type GameState =
  | 'idle'       // Ready to draw
  | 'drawing'    // Pulling the bowstring
  | 'aiming'     // Full draw, managing breath stamina & clicker expansion
  | 'released'   // Arrow just released
  | 'flight'     // Arrow in aerodynamic flight
  | 'impact'     // Arrow struck target or turf
  | 'round_end'; // Finished set of 6 arrows, awaiting match evaluation

export type CameraViewMode = 'first_person' | 'flight_chase' | 'target_view';

export interface MartialRank {
  id: string;
  title: string;          // Olympic Competition Round (e.g. 奧運資格排名賽, 1/4淘汰賽, 半決賽, 金牌決賽)
  subtitle: string;       // World Archery / Olympic match format
  frontierPass: string;   // Iconic Olympic Archery Venue (e.g. 北京奧林匹克公園射箭場)
  frontierRegion: string; // Olympic Host & Team China Milestone Context
  description: string;
  targetDistance: number; // in meters (30m warm-up, 50m, 70m Olympic standard)
  windRange: [number, number]; // min and max wind speed in m/s
  qualifyScore: number;   // Score needed out of 60 (6-arrow end) to advance
  targetRadius: number;   // Target face radius in meters (Olympic 122cm face = 0.61m radius)
}

export interface HistoricalNote {
  id: string;
  frontierPass: string;
  frontierRegion: string;
  rankTitle: string;
  bowName: string;
  targetDistance: number;
  ringName: string;
  score: number;
  timeOfDay: string;
  windName: string;
  arrowIndex: number;
  headline: string;
  dynastyEra: string;
  passGeographyAndHistory: string;
  archeryTacticalInsight: string;
  classicalCitation: string;
  timestamp: number;
}

export interface BowConfig {
  id: string;
  name: string;
  dynasty: string;
  drawWeightLbs: number;
  drawLengthInches: number;
  initialVelocity: number; // m/s at full draw
  arrowMassGrams: number;  // grams
  staminaDrainRate: number; // per second
  description: string;
}

export interface ShotResult {
  arrowIndex: number;
  score: number;        // 0 to 10
  ringName: string;     // X-10環, 9環, 8環...
  distanceFromCenter: number; // meters from center pinhole
  flightTime: number;   // seconds
  flightDistance: number; // meters
  hitPosition: { x: number; y: number; z: number };
  windSpeed: number;    // m/s at launch
  windDirectionAngle: number; // radians
  thumbAngleDeg?: number;     // release clearance angle at launch
  gripTechniqueLabel?: string;
}

export interface ThumbGripState {
  /** Player-controlled release clearance angle in degrees (-25° to +45°) */
  thumbAngleDeg: number;
  /** Ideal release clearance angle in degrees for the active bow & draw tension */
  optimalAngleDeg: number;
  /** Angular deviation (thumbAngleDeg - optimalAngleDeg) in degrees */
  angleErrorDeg: number;
  /** Horizontal arrow-pass clearance deflection at target plane in cm */
  clearanceDriftXCm: number;
  /** Vertical pitch deflection at target plane in cm */
  clearanceDriftYCm: number;
  /** Release technique diagnosis (Olympic Clicker / Traditional Thumb-Ring) */
  techniqueLabel: string;
  /** True when |angleErrorDeg| <= 3.5° (clean arrow pass clearance) */
  isCrispRelease: boolean;
}

export interface WindState {
  speed: number;          // m/s
  directionAngle: number; // radians
  directionName: string;  // e.g. 東南側風
  isGusting?: boolean;
  gustIntensity?: number;
  gustDeltaSpeed?: number;
  gustDeltaAngle?: number;
  gustLabel?: string;
  gustPhase?: 'calm' | 'building' | 'peak' | 'subsiding';
  nextGustCountdownSec?: number;
}

export const MARTIAL_RANKS: MartialRank[] = [
  {
    id: 'rank_wusheng',
    title: '奧運資格賽 · 排名輪',
    subtitle: 'World Archery 資格排位賽 · 30米校準輪 (6箭制)',
    frontierPass: '北京奧林匹克公園射箭場',
    frontierRegion: '2008 北京奧運會 · 張娟娟奪得中國射箭奧運歷史首金福地',
    description:
      '重返 2008 北京奧運主賽場進行資格排名輪。風勢平穩，考驗現代反曲弓 T 字靠位、光學準星校準與穩定撒放基本功。',
    targetDistance: 30,
    windRange: [0.5, 2.0],
    qualifyScore: 42, // 6 arrows average 7.0+
    targetRadius: 0.65,
  },
  {
    id: 'rank_xiucai',
    title: '奧運淘汰賽 · 八強戰',
    subtitle: '奧運積分淘汰賽制 · 50米抗風對決',
    frontierPass: '東京夢之島公園射箭場',
    frontierRegion: '2020 東京奧運會 · 東京灣濱海側風考驗區',
    description:
      '進入奧運 1/4 決賽階段，賽場鄰近海灣，側風與陣風交替出現。須精確計算風偏修正量並在體力黃金期果斷過響片放箭。',
    targetDistance: 50,
    windRange: [1.5, 3.6],
    qualifyScore: 46, // average 7.7+
    targetRadius: 0.61,
  },
  {
    id: 'rank_juren',
    title: '奧運半決賽 · 團體衝金戰',
    subtitle: '國際標準 70米反曲弓 · 高壓團體決戰',
    frontierPass: '巴黎榮軍院射箭場',
    frontierRegion: '2024 巴黎奧運會 · 中國女團（李佳蔓/楊曉蕾/安琦軒）奪銀賽場',
    description:
      '踏上國際標準 70 米奧運射道！塞納河畔陣風多變，重現 2024 巴黎奧運中國女團頂住全場壓力、連續射出 10 環晉級決賽之經典戰役。',
    targetDistance: 70,
    windRange: [2.2, 5.0],
    qualifyScore: 50, // average 8.3+
    targetRadius: 0.61,
  },
  {
    id: 'rank_zhuangyuan',
    title: '奧運金牌決賽 · 巔峰對決',
    subtitle: '奧林匹克最高殿堂 · 70米強風金牌決戰',
    frontierPass: '洛杉磯奧運決賽主場館',
    frontierRegion: '1984 李玲娟首奪奧運銀牌 — 2028 奧運衝金巔峰傳承',
    description:
      '奧運金牌決賽最後一輪（6箭定勝負）！70 米標準距離配強勁陣風，重溫張娟娟連克強敵奪金之傳奇心態，瞄準 X-10 環奪取奧運金牌！',
    targetDistance: 70,
    windRange: [3.2, 6.8],
    qualifyScore: 54, // average 9.0+
    targetRadius: 0.55,
  },
];

export const BOW_PRESETS: BowConfig[] = [
  {
    id: 'ming_horn_45',
    name: '國家隊青訓標準反曲弓 (40磅)',
    dynasty: '現代奧運 ILF 鋁鎂合金弓把',
    drawWeightLbs: 40,
    drawLengthInches: 28,
    initialVelocity: 58, // ~208 km/h
    arrowMassGrams: 24,
    staminaDrainRate: 0.21,
    description:
      '採用 CNC 航空鋁合金弓把、玻璃纖維複合弓片與長短平衡桿系統，拉感順滑穩定，適合熟悉奧運三指靠位與響片節奏。',
  },
  {
    id: 'qing_horn_65',
    name: '中國隊奧運奪金主力反曲弓 (48磅)',
    dynasty: '奧運國家隊主力競技配置',
    drawWeightLbs: 48,
    drawLengthInches: 29.5,
    initialVelocity: 68, // ~245 km/h
    arrowMassGrams: 22,
    staminaDrainRate: 0.30,
    description:
      '張娟娟、李佳蔓等奧運國手同級高模量碳纖維泡沫芯弓片，搭配鎢鋼頭 X10 碳鋁箭，初速極高、70米抗風偏性能卓越。',
  },
  {
    id: 'iron_wood_85',
    name: '奧運旗艦重磅反曲弓 · 華夏禮射紀念版 (54磅)',
    dynasty: '現代碳纖科技 × 考工六材美學',
    drawWeightLbs: 54,
    drawLengthInches: 30.5,
    initialVelocity: 75, // ~270 km/h
    arrowMassGrams: 23,
    staminaDrainRate: 0.42,
    description:
      '專為 70 米強風決賽打造的 54 磅男子奧運頂級反曲弓，塗裝融入中國紅與傳統角弓紋飾，箭速凌厲，對核心與背肌耐力要求極高。',
  },
];

export const MAX_ARROWS_PER_ROUND = 6;

export interface TimeOfDayPhase {
  id: string;
  shichen: string;       // Match Session label
  name: string;          // Lighting & weather condition
  progress: number;      // 0.0 to 1.0
  visibilityNote: string;
}

export const TIME_OF_DAY_PHASES: TimeOfDayPhase[] = [
  {
    id: 'sunrise_mist',
    shichen: '晨間場',
    name: '早場資格賽',
    progress: 0.0,
    visibilityNote: '清晨賽場微霧初散，柔和晨光斜照草坪，風速最為平緩',
  },
  {
    id: 'morning_clear',
    shichen: '上午場',
    name: '淘汰賽開賽',
    progress: 0.2,
    visibilityNote: '日光漸盛，五色十環靶面色彩鮮明，適合穩定發揮',
  },
  {
    id: 'forenoon_bright',
    shichen: '正午場',
    name: '晴空標準賽場',
    progress: 0.4,
    visibilityNote: '陽光充沛，70米射道視野最為清晰，氣流開始微幅湧動',
  },
  {
    id: 'high_sun',
    shichen: '午後場',
    name: '八強對決時段',
    progress: 0.6,
    visibilityNote: '午後日照強烈，賽場草坪熱對流引發周期性側風變化',
  },
  {
    id: 'golden_hour',
    shichen: '傍晚場',
    name: '半決賽金暉',
    progress: 0.8,
    visibilityNote: '夕陽斜照奧運看台，金色逆光考驗射手對準星光斑的專注度',
  },
  {
    id: 'frontier_sunset',
    shichen: '決賽夜場',
    name: '金牌戰聚光燈',
    progress: 1.0,
    visibilityNote: '暮色降臨，決賽射道聚光燈點亮 70 米靶面，萬眾矚目決戰金牌',
  },
];
