/**
 * Archery Types & Constants
 * Traditional Chinese Martial Archery (中華禮射与武舉之射)
 */

export type GameState = 
  | 'idle'       // Ready to draw
  | 'drawing'    // Pulling the bowstring
  | 'aiming'     // Full draw, managing breath stamina
  | 'released'   // Arrow just released
  | 'flight'     // Arrow in aerodynamic flight
  | 'impact'     // Arrow struck target or terrain
  | 'round_end'; // Finished set of arrows, awaiting exam evaluation

export type CameraViewMode = 'first_person' | 'flight_chase' | 'target_view';

export interface MartialRank {
  id: string;
  title: string;        // e.g. 武生, 武秀才, 武舉人, 武狀元
  subtitle: string;     // Historical exam stage
  description: string;
  targetDistance: number; // in meters (30m ~ 20步, 50m ~ 35步, 80m ~ 55步, 110m ~ 75步)
  windRange: [number, number]; // min and max wind speed in m/s
  qualifyScore: number; // Score needed out of 60 to pass
  targetRadius: number; // Target face radius in meters
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
  ringName: string;     // 鵠心, 穿正, 命中, 擦邊, 脫靶
  distanceFromCenter: number; // meters from bullseye
  flightTime: number;   // seconds
  flightDistance: number; // meters
  hitPosition: { x: number; y: number; z: number };
  windSpeed: number;    // m/s at launch
  windDirectionAngle: number; // radians
}

export interface WindState {
  speed: number;       // m/s
  directionAngle: number; // radians (0 = headwind, PI/2 = crosswind from right, etc.)
  directionName: string;  // e.g. 東南微風, 西北大風
}

export const MARTIAL_RANKS: MartialRank[] = [
  {
    id: 'rank_wusheng',
    title: '童試 · 武生',
    subtitle: '入泮初階 · 試步射二十步',
    description: '明代武童應考初階，射平場二十步。風勢平緩，驗其定力與發矢正法。',
    targetDistance: 30,
    windRange: [0.5, 2.0],
    qualifyScore: 36, // 6 arrows average 6+
    targetRadius: 0.65,
  },
  {
    id: 'rank_xiucai',
    title: '歲科 · 武秀才',
    subtitle: '提學策試 · 試步射三十五步',
    description: '列名郡邑庠序，邊塞要隘風起，射距增至三十五步，考較引弓之沉穩。',
    targetDistance: 50,
    windRange: [1.5, 3.8],
    qualifyScore: 42, // average 7+
    targetRadius: 0.60,
  },
  {
    id: 'rank_juren',
    title: '鄉試 · 武舉人',
    subtitle: '省城大比 · 試步射五十五步',
    description: '巡撫總兵親試，邊關烈風呼嘯，射距達五十五步，考驗聽風判位、審固命中。',
    targetDistance: 80,
    windRange: [2.5, 5.5],
    qualifyScore: 48, // average 8+
    targetRadius: 0.55,
  },
  {
    id: 'rank_zhuangyuan',
    title: '殿試 · 武狀元',
    subtitle: '天子親閱 · 試步射七十五步',
    description: '紫禁城太和殿或邊防重鎮大閱，強風陣作，遠射七十五步穿楊取鵠，奪魁天下！',
    targetDistance: 110,
    windRange: [3.5, 7.5],
    qualifyScore: 52, // average 8.6+
    targetRadius: 0.50,
  },
];

export const BOW_PRESETS: BowConfig[] = [
  {
    id: 'ming_horn_45',
    name: '明代 樺皮樺木角弓 (四十磅)',
    dynasty: '明代軍制',
    drawWeightLbs: 45,
    drawLengthInches: 28,
    initialVelocity: 54, // ~194 km/h
    arrowMassGrams: 32,
    staminaDrainRate: 0.22,
    description: '以干、角、筋、膠、絲、漆六材精造，拉感柔順，適合定點審固引弦。',
  },
  {
    id: 'qing_horn_65',
    name: '清代 大梢牛角戰弓 (六十五磅)',
    dynasty: '清代八旗武備',
    drawWeightLbs: 65,
    drawLengthInches: 32,
    initialVelocity: 64, // ~230 km/h
    arrowMassGrams: 42,
    staminaDrainRate: 0.32,
    description: '長梢大反曲，初速猛烈，抗風偏能力出眾，武舉殿試之利器。',
  },
  {
    id: 'iron_wood_85',
    name: '邊關 鐵力木重戰弓 (八十五磅)',
    dynasty: '邊防精銳',
    drawWeightLbs: 85,
    drawLengthInches: 33,
    initialVelocity: 74, // ~266 km/h
    arrowMassGrams: 48,
    staminaDrainRate: 0.45,
    description: '百煉沉勁，箭出如雷霆霹靂，需極強臂力與氣息方可駕馭。',
  },
];

export const MAX_ARROWS_PER_ROUND = 6;

export interface TimeOfDayPhase {
  id: string;
  shichen: string;       // e.g. 卯時, 辰時, 巳時, 午未, 申時, 酉時
  name: string;          // e.g. 破曉晨霧, 旭日初升, 晴空朗照, 塞上驕陽, 斜陽金暉, 長河落日
  progress: number;      // 0.0 (sunrise) to 1.0 (deep golden hour / sunset)
  visibilityNote: string; // Effect on target visibility & atmosphere
}

export const TIME_OF_DAY_PHASES: TimeOfDayPhase[] = [
  {
    id: 'sunrise_mist',
    shichen: '卯時',
    name: '破曉晨霧',
    progress: 0.0,
    visibilityNote: '晨靄微茫，東昇曉日斜照，遠靶隱現於薄霧之中',
  },
  {
    id: 'morning_clear',
    shichen: '辰時',
    name: '旭日初升',
    progress: 0.2,
    visibilityNote: '朝陽漸高，塞上晨霧初散，皮侯鵠心輪廓轉明',
  },
  {
    id: 'forenoon_bright',
    shichen: '巳時',
    name: '晴空朗照',
    progress: 0.4,
    visibilityNote: '天朗氣清，日光充沛，演武場視野最為澄澈分明',
  },
  {
    id: 'high_sun',
    shichen: '午未',
    name: '塞上驕陽',
    progress: 0.6,
    visibilityNote: '烈日當空，戈壁微泛熱浪浮塵，光影對比強烈',
  },
  {
    id: 'golden_hour',
    shichen: '申時',
    name: '斜陽金暉',
    progress: 0.8,
    visibilityNote: '西山日斜，萬道金暉染透塵煙，長影橫斜、靶面漸暗',
  },
  {
    id: 'frontier_sunset',
    shichen: '酉時',
    name: '長河落日',
    progress: 1.0,
    visibilityNote: '殘陽如血，暮靄沉沉，演武場燃起火盆照亮遠方皮侯',
  },
];

