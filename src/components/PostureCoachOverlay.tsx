import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Compass,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Eye,
  Layers,
  Award,
  MoveHorizontal,
  CheckCircle2,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { BowConfig, MartialRank } from '../types/archery';

interface PostureCoachOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  currentBow: BowConfig;
  currentRank: MartialRank;
}

type ViewPerspective = '3d_rig' | 'front_stance' | 'top_shoulder';
type PostureState = 'correct' | 'faulty';
type FocusJoint = 'stance' | 'shoulder' | 'spine' | 'release';

interface JointHotspot {
  id: FocusJoint;
  title: string;
  subtitle: string;
  classicQuote: string;
  correctDetail: string;
  faultyDetail: string;
  metricsCorrect: string;
  metricsFaulty: string;
}

interface BowHistoricalPostureData {
  qingLiUnit: string;
  manchuTerm: string;
  historicalSource: string;
  stanceRequirement: string;
  shoulderRequirement: string;
  historicalContext: string;
  stanceWidthCm: number;
  kneeBendDeg: number;
  scapularLoadPct: number;
  bowColor: string;
}

const BOW_POSTURE_CONTEXT: Record<string, BowHistoricalPostureData> = {
  ming_horn_45: {
    qingLiUnit: '40 lbs 奧運青訓標準反曲弓（承襲明代哨弓正架理念）',
    manchuTerm: 'Olympic T-Shape · 現代奧運 T 字骨架與中華正身傳統',
    historicalSource: '國家射箭隊訓練大綱 ＆ 明 · 高穎《射學正宗》',
    stanceRequirement:
      '雙足開立與肩同寬（開立式或平行式站位），雙腳重心均勻分佈（50%/50%），骨盆中立微收，如同傳統「四平立身」般穩固抗風。',
    shoulderRequirement:
      '現代奧運反曲弓與傳統射藝皆首重「前肩下沉鎖定」。推弓手指向靶心、拉弓肘水平後引，使兩肩與雙臂形成穩固的「T 字剛性骨架」。',
    historicalContext:
      '中國國家射箭隊在青訓階段極為重視「直線力與骨架支撐」，這與明代《射學正宗》所云「初學射者，先學立身，肩平肘直」一脈相承。',
    stanceWidthCm: 62,
    kneeBendDeg: 165,
    scapularLoadPct: 75,
    bowColor: '#38bdf8',
  },
  qing_horn_65: {
    qingLiUnit: '48 lbs 中國隊奧運奪金主力反曲弓（張娟娟/李佳蔓同級規格）',
    manchuTerm: 'Team China Elite · 奧運70米高壓直線力與過響片展開',
    historicalSource: '中國國家射箭隊奧運冠軍技術實錄 ＆《考工記 · 射義》',
    stanceRequirement:
      '70米室外賽場橫風多變，須強化核心腹壓（氣沉丹田），大腿與臀部微收鎖定下盤，確保在風雨中身體中軸線紋絲不動。',
    shoulderRequirement:
      '引弦靠位（下巴與鼻尖雙點定位）後，全憑背闊肌與菱形肌持續向後對稱擴張，在毫米級行程內清脆通過響片（Clicker）自然撒放。',
    historicalContext:
      '2008年北京奧運張娟娟在瓢潑大雨中連克三位韓國名將奪金，靠的正是千錘百煉的「順肩直線力」與古人所言「泰山崩於前而色不變」的審固心法。',
    stanceWidthCm: 68,
    kneeBendDeg: 158,
    scapularLoadPct: 88,
    bowColor: '#ef4444',
  },
  iron_wood_85: {
    qingLiUnit: '54 lbs 奧運旗艦重磅反曲弓 · 華夏禮射紀念版',
    manchuTerm: 'Master Recurve & Gabcuhiyan · 現代重磅反曲與清代順肩骨法合璧',
    historicalSource: '世界射箭總會高階生物力學 ＆ 清《八旗步射譜》',
    stanceRequirement:
      '駕馭 54 磅以上高磅數競技弓或傳統重弓，下盤必須如落地生根，微降重心、塌腰斂臀，以抵消強風與高初速回彈。',
    shoulderRequirement:
      '融合現代奧運「背肌楔入展開」與清代傳統「順肩骨法相撐」，前肩極度下沉內合，將 54 磅拉力完全導入骨骼橫樑而非手臂肌肉。',
    historicalContext:
      '從古代武舉力弓到現代奧運男子70米高磅數反曲弓（如戴小祥倫敦奧運摘銅），中華射藝數千年來對「以骨撐弓、以背開弓」的力學探索始終領先。',
    stanceWidthCm: 74,
    kneeBendDeg: 145,
    scapularLoadPct: 95,
    bowColor: '#f59e0b',
  },
};

const JOINT_HOTSPOTS: Record<FocusJoint, JointHotspot> = {
  stance: {
    id: 'stance',
    title: '四平馬步 · 落地生根',
    subtitle: 'Horse Stance & Lower-Body Rooting',
    classicQuote: '《射學正宗》：「雙足平立，膝微曲而外撐，氣沉丹田，如泰山之不可搖。」',
    correctDetail:
      '兩足開立約三尺（依弓力加深），足尖微內扣，雙膝外撐與足尖同向（膝不過趾），襠部撐圓如騎馬背，重心穩落足心湧泉穴，能抗塞外狂風而不晃。',
    faultyDetail:
      '雙腿僵直或兩膝內扣（夾膝），重心浮於腳尖或偏於後跟；拉滿重弓時下盤隨風搖擺，導致準星大幅漂移。',
    metricsCorrect: '膝角 105°–130° · 重心垂直落於雙足中心 (50% / 50%)',
    metricsFaulty: '膝角 >160° 僵直 · 重心前傾偏移 +18%（浮踵搖晃）',
  },
  shoulder: {
    id: 'shoulder',
    title: '兩肩一線 · 順肩骨法',
    subtitle: 'Qing Linear Shoulder & Scapular Alignment',
    classicQuote: '清《八旗步射訣》：「前肩下沉如落石，後肘平舉似懸衡，兩肩成一線，骨力自然生。」',
    correctDetail:
      '前手推弓時「沉肩墜肘」，將前肩關節囊完全下壓嵌入鎖骨窩，使前腕、前肩、後肩形成一條直線剛性骨橋（順肩），由骨骼支撐弓力而非三角肌死扛。',
    faultyDetail:
      '前肩受弓弦拉力壓迫而向上聳起（聳肩縮頸），前肘彎曲外翻，後肘過高或下垂（架肘/掉肘），不僅體力瞬間枯竭，撒放時更會被弓弦掃傷前臂。',
    metricsCorrect: '兩肩軸線夾角 178°（順肩一線）· 背闊肌張力 92%',
    metricsFaulty: '前肩上聳 +16°（三角肌代償過載）· 軸線折角 142°',
  },
  spine: {
    id: 'spine',
    title: '塌腰斂臀 · 脊柱中正',
    subtitle: 'Axial Spine Verticality & Dantian Core',
    classicQuote: '《武備志》：「身端體直，不可仰胸凸腹，亦不可駝背折腰，務令項背相連。」',
    correctDetail:
      '百會穴上領，尾閭下垂（塌腰斂臀），胸口微含（涵胸拔背），使脊椎呈垂直中軸線。配合「屏息凝神」深吸氣入丹田，腹腔內壓穩定全身骨架。',
    faultyDetail:
      '為借力拉開重弓而「挺胸仰身」或「扭腰斜倚」，導致脊柱偏離中垂線，身體後仰，出箭角度必定偏高且散佈極大。',
    metricsCorrect: '脊柱垂直偏差 < 1.2° · 丹田核心穩固度 96%',
    metricsFaulty: '脊柱後仰傾斜 14.5° · 腰椎剪應力過高',
  },
  release: {
    id: 'release',
    title: '前推後撤 · 審固絕倫',
    subtitle: 'Full Draw Expansion & Crisp Thumb Release',
    classicQuote: '《考工記 · 射義》：「持弓矢審固，然後可以言中；撒放如絕繩，前後自然分。」',
    correctDetail:
      '滿弓引至耳後（清代大拉距），前手向靶心微微前頂，後手扳指（韘）順著肩背擴張之勢向後寸勁頓開，雙手如斷繩般一前一後自然對稱分開。',
    faultyDetail:
      '撒放時後手向前鬆送（送弦），或前手隨之晃動下壓，致使弓弦推箭行程縮短，箭速驟降且尾羽劇烈擺動。',
    metricsCorrect: '拉距 33 吋（滿洲大拉距）· 前後雙向對稱寸勁',
    metricsFaulty: '拉距不足 27 吋（怯弓縮手）· 撒放鬆弦洩力 -24%',
  },
};

export const PostureCoachOverlay: React.FC<PostureCoachOverlayProps> = ({
  isOpen,
  onClose,
  currentBow,
  currentRank,
}) => {
  const [perspective, setPerspective] = useState<ViewPerspective>('3d_rig');
  const [postureState, setPostureState] = useState<PostureState>('correct');
  const [selectedJoint, setSelectedJoint] = useState<FocusJoint>('shoulder');
  const [yawDeg, setYawDeg] = useState<number>(-28);
  const [pitchDeg, setPitchDeg] = useState<number>(14);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [breathPhase, setBreathPhase] = useState<number>(0);

  const isDraggingRef = useRef(false);
  const lastMouseXRef = useRef(0);
  const lastMouseYRef = useRef(0);

  const bowData = BOW_POSTURE_CONTEXT[currentBow.id] || BOW_POSTURE_CONTEXT.ming_horn_45;
  const activeHotspot = JOINT_HOTSPOTS[selectedJoint];

  // Subtle breathing & auto-rotation animation loop for the 3D skeletal rig
  useEffect(() => {
    if (!isOpen) return;
    let animId: number;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      setBreathPhase((prev) => (prev + dt * 2.2) % (Math.PI * 2));
      if (autoRotate && perspective === '3d_rig' && !isDraggingRef.current) {
        setYawDeg((prev) => {
          const next = prev + dt * 14;
          return next > 180 ? next - 360 : next;
        });
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, autoRotate, perspective]);

  if (!isOpen) return null;

  // 3D projection helper for the Interactive 3D Skeletal Posture Rig
  const project3DPoint = (x: number, y: number, z: number) => {
    const radYaw = (yawDeg * Math.PI) / 180;
    const radPitch = (pitchDeg * Math.PI) / 180;

    // Rotate around Y axis (yaw)
    const x1 = x * Math.cos(radYaw) + z * Math.sin(radYaw);
    const z1 = -x * Math.sin(radYaw) + z * Math.cos(radYaw);

    // Rotate around X axis (pitch)
    const y2 = y * Math.cos(radPitch) - z1 * Math.sin(radPitch);
    const z2 = y * Math.sin(radPitch) + z1 * Math.cos(radPitch);

    // Perspective projection onto 560x400 viewport
    const fov = 420;
    const viewerDist = 340;
    const scale = fov / Math.max(120, viewerDist + z2);

    return {
      px: 280 + x1 * scale,
      py: 215 - y2 * scale,
      scale,
      depth: z2,
    };
  };

  // Compute 3D anatomical coordinates based on `postureState` and `currentBow`
  const isCorrect = postureState === 'correct';
  const swayOffset = isCorrect ? Math.sin(breathPhase) * 1.2 : Math.sin(breathPhase * 2.4) * 8.5;
  const stanceHalfWidth = isCorrect ? bowData.stanceWidthCm * 0.72 : 34;
  const pelvisY = isCorrect ? (currentBow.id === 'manchu_bow' ? -12 : -4) : 18;
  const spineLeanX = isCorrect ? 0 : 18 + swayOffset * 0.6;
  const frontShoulderY = isCorrect ? 64 : 84; // Faulty = shrugged shoulder (聳肩)
  const frontShoulderZ = isCorrect ? 0 : 18; // Faulty = out of line
  const rearShoulderY = isCorrect ? 64 : 56;
  const rearElbowY = isCorrect ? 66 : 42; // Faulty = dropped/disconnected elbow
  const rearElbowZ = isCorrect ? -2 : 28; // Faulty = flared elbow out of line

  // Key 3D skeletal joints (Target is to the LEFT: -X direction)
  const joints3D = {
    leftFoot: { x: -stanceHalfWidth, y: -115, z: 10 },
    rightFoot: { x: stanceHalfWidth, y: -115, z: -10 },
    leftKnee: {
      x: isCorrect ? -stanceHalfWidth * 0.96 : -stanceHalfWidth * 0.6,
      y: isCorrect ? -62 : -55,
      z: isCorrect ? 16 : -6,
    },
    rightKnee: {
      x: isCorrect ? stanceHalfWidth * 0.96 : stanceHalfWidth * 0.6,
      y: isCorrect ? -62 : -55,
      z: isCorrect ? -6 : 12,
    },
    pelvis: { x: spineLeanX * 0.3, y: pelvisY, z: 0 },
    dantian: { x: spineLeanX * 0.45, y: pelvisY + 18, z: 0 },
    thorax: { x: spineLeanX * 0.75, y: 42, z: 0 },
    neck: { x: spineLeanX, y: 68, z: 0 },
    head: { x: spineLeanX * 1.1, y: 96, z: 0 },
    frontShoulder: { x: -28 + spineLeanX, y: frontShoulderY, z: frontShoulderZ },
    rearShoulder: { x: 28 + spineLeanX, y: rearShoulderY, z: -frontShoulderZ * 0.5 },
    frontElbow: {
      x: -68 + spineLeanX,
      y: isCorrect ? 64 : 72,
      z: isCorrect ? 2 : 22,
    },
    bowHand: {
      x: -112 + spineLeanX,
      y: isCorrect ? 64 : 70 + swayOffset * 0.5,
      z: isCorrect ? 0 : 12,
    },
    drawHand: {
      x: isCorrect ? 18 + spineLeanX : 4 + spineLeanX,
      y: isCorrect ? 66 : 58,
      z: isCorrect ? -6 : 16,
    },
    rearElbow: {
      x: isCorrect ? 68 + spineLeanX : 54 + spineLeanX,
      y: rearElbowY,
      z: rearElbowZ,
    },
    bowTopTip: {
      x: -106 + spineLeanX,
      y: 138,
      z: isCorrect ? 0 : 14,
    },
    bowBottomTip: {
      x: -106 + spineLeanX,
      y: -10,
      z: isCorrect ? 0 : 10,
    },
    arrowTip: {
      x: -126 + spineLeanX,
      y: isCorrect ? 64 : 71 + swayOffset * 0.5,
      z: isCorrect ? 0 : 12,
    },
  };

  // Projected 2D coordinates for the 3D viewport
  const p = {
    leftFoot: project3DPoint(joints3D.leftFoot.x, joints3D.leftFoot.y, joints3D.leftFoot.z),
    rightFoot: project3DPoint(joints3D.rightFoot.x, joints3D.rightFoot.y, joints3D.rightFoot.z),
    leftKnee: project3DPoint(joints3D.leftKnee.x, joints3D.leftKnee.y, joints3D.leftKnee.z),
    rightKnee: project3DPoint(joints3D.rightKnee.x, joints3D.rightKnee.y, joints3D.rightKnee.z),
    pelvis: project3DPoint(joints3D.pelvis.x, joints3D.pelvis.y, joints3D.pelvis.z),
    dantian: project3DPoint(joints3D.dantian.x, joints3D.dantian.y, joints3D.dantian.z),
    thorax: project3DPoint(joints3D.thorax.x, joints3D.thorax.y, joints3D.thorax.z),
    neck: project3DPoint(joints3D.neck.x, joints3D.neck.y, joints3D.neck.z),
    head: project3DPoint(joints3D.head.x, joints3D.head.y, joints3D.head.z),
    frontShoulder: project3DPoint(
      joints3D.frontShoulder.x,
      joints3D.frontShoulder.y,
      joints3D.frontShoulder.z
    ),
    rearShoulder: project3DPoint(
      joints3D.rearShoulder.x,
      joints3D.rearShoulder.y,
      joints3D.rearShoulder.z
    ),
    frontElbow: project3DPoint(
      joints3D.frontElbow.x,
      joints3D.frontElbow.y,
      joints3D.frontElbow.z
    ),
    bowHand: project3DPoint(joints3D.bowHand.x, joints3D.bowHand.y, joints3D.bowHand.z),
    drawHand: project3DPoint(joints3D.drawHand.x, joints3D.drawHand.y, joints3D.drawHand.z),
    rearElbow: project3DPoint(joints3D.rearElbow.x, joints3D.rearElbow.y, joints3D.rearElbow.z),
    bowTopTip: project3DPoint(joints3D.bowTopTip.x, joints3D.bowTopTip.y, joints3D.bowTopTip.z),
    bowBottomTip: project3DPoint(
      joints3D.bowBottomTip.x,
      joints3D.bowBottomTip.y,
      joints3D.bowBottomTip.z
    ),
    arrowTip: project3DPoint(joints3D.arrowTip.x, joints3D.arrowTip.y, joints3D.arrowTip.z),
  };

  // Ground grid projection for 3D space
  const groundGridLines = [-120, -80, -40, 0, 40, 80, 120];

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (perspective !== '3d_rig') return;
    isDraggingRef.current = true;
    setAutoRotate(false);
    lastMouseXRef.current = e.clientX;
    lastMouseYRef.current = e.clientY;
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDraggingRef.current || perspective !== '3d_rig') return;
    const dx = e.clientX - lastMouseXRef.current;
    const dy = e.clientY - lastMouseYRef.current;
    lastMouseXRef.current = e.clientX;
    lastMouseYRef.current = e.clientY;

    setYawDeg((prev) => {
      const next = prev + dx * 0.65;
      return next > 180 ? next - 360 : next < -180 ? next + 360 : next;
    });
    setPitchDeg((prev) => Math.max(-15, Math.min(55, prev + dy * 0.45)));
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl max-h-[92vh] bg-stone-950 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-stone-100">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-gradient-to-r from-stone-900 via-stone-900/95 to-amber-950/40 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold tracking-wider text-amber-400 font-serif">
                  清代步射審固身法教習 · Posture & Biomechanics Coach
                </h3>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[11px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded">
                  {bowData.manchuTerm}
                </span>
              </div>
              <p className="text-xs text-stone-400">
                結合《射學正宗》與清代《八旗通志》步射圖譜 · 針對當前配弓「
                <span className="text-amber-300 font-semibold">{currentBow.name}</span>（
                {currentBow.drawWeightLbs} lbs）」解析四平馬步與順肩骨法
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Posture State Comparison Toggle */}
            <div className="flex items-center bg-stone-900 p-1 rounded-lg border border-stone-800">
              <button
                onClick={() => setPostureState('correct')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  postureState === 'correct'
                    ? 'bg-emerald-600/25 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                正法：四平順肩勢
              </button>
              <button
                onClick={() => setPostureState('faulty')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  postureState === 'faulty'
                    ? 'bg-rose-600/25 text-rose-300 border border-rose-500/40 shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                弊病：聳肩浮踵勢
              </button>
            </div>

            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
              返回指南
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-stone-800">
          {/* Left 7 Cols: Interactive 3D & Multi-Angle Biomechanical Viewport */}
          <div className="lg:col-span-7 flex flex-col bg-stone-950/90 p-4 sm:p-5">
            {/* Perspective Mode Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-1.5 bg-stone-900/90 p-1 rounded-lg border border-stone-800">
                <button
                  onClick={() => setPerspective('3d_rig')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    perspective === '3d_rig'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  3D 骨架審固視角 (360°)
                </button>
                <button
                  onClick={() => setPerspective('front_stance')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    perspective === 'front_stance'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  正面四平馬步圖
                </button>
                <button
                  onClick={() => setPerspective('top_shoulder')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    perspective === 'top_shoulder'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <MoveHorizontal className="w-3.5 h-3.5" />
                  俯視兩肩一線圖
                </button>
              </div>

              {perspective === '3d_rig' && (
                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => setAutoRotate(!autoRotate)}
                    className={`px-2.5 py-1 rounded border text-[11px] font-mono transition-colors cursor-pointer ${
                      autoRotate
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                        : 'bg-stone-900 border-stone-800 text-stone-400'
                    }`}
                  >
                    {autoRotate ? '● 自動環視中' : '○ 暫停環視'}
                  </button>
                  <button
                    onClick={() => {
                      setYawDeg(-28);
                      setPitchDeg(14);
                      setAutoRotate(false);
                    }}
                    className="p-1.5 rounded bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-stone-200 cursor-pointer"
                    title="重置 3D 角度"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* SVG / 3D Canvas Viewport */}
            <div className="relative flex-1 min-h-[340px] sm:min-h-[390px] rounded-xl bg-gradient-to-b from-stone-900/90 via-stone-950 to-stone-900/95 border border-stone-800/90 overflow-hidden flex items-center justify-center select-none">
              {/* Top-left HUD Overlay inside Viewport */}
              <div className="absolute top-3 left-3 z-10 pointer-events-none space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      isCorrect ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500 animate-ping'
                    }`}
                  />
                  <span className="text-xs font-bold tracking-wider text-stone-200 font-serif">
                    {isCorrect
                      ? '清代八旗正統身法：四平馬步 · 順肩塌腰'
                      : '常見錯姿警示：前肩高聳 · 馬步虛浮折腰'}
                  </span>
                </div>
                <div className="text-[11px] text-stone-400 font-mono">
                  配弓：{currentBow.name} ({bowData.qingLiUnit}) · 駐防：{currentRank.frontierPass}
                </div>
              </div>

              {/* Bottom-left Interactive Joint Pill Selector */}
              <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5 bg-stone-950/90 backdrop-blur-md p-1.5 rounded-lg border border-stone-800">
                  <span className="text-[11px] text-stone-400 px-1.5">點擊部位審視：</span>
                  {(Object.keys(JOINT_HOTSPOTS) as FocusJoint[]).map((jointKey) => {
                    const item = JOINT_HOTSPOTS[jointKey];
                    const active = selectedJoint === jointKey;
                    return (
                      <button
                        key={jointKey}
                        onClick={() => setSelectedJoint(jointKey)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                          active
                            ? 'bg-amber-500 text-stone-950 shadow-sm'
                            : 'bg-stone-900 text-stone-300 hover:bg-stone-800'
                        }`}
                      >
                        {item.title.split(' · ')[0]}
                      </button>
                    );
                  })}
                </div>

                {perspective === '3d_rig' && (
                  <div className="hidden sm:flex items-center gap-2 bg-stone-950/85 px-2.5 py-1 rounded-lg border border-stone-800 text-[11px] text-stone-400 font-mono">
                    <span>拖拽畫面旋轉 3D 骨架</span>
                    <span className="text-amber-400">
                      Yaw {Math.round(yawDeg)}° / Pitch {Math.round(pitchDeg)}°
                    </span>
                  </div>
                )}
              </div>

              {/* VIEW 1: 3D SKELETAL POSTURE RIG */}
              {perspective === '3d_rig' && (
                <svg
                  viewBox="0 0 560 400"
                  className="w-full h-full cursor-grab active:cursor-grabbing"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                >
                  <defs>
                    <radialGradient id="dantianGlow" cx="50%" cy="50%" r="50%">
                      <stop
                        offset="0%"
                        stopColor={isCorrect ? '#10b981' : '#f43f5e'}
                        stopOpacity="0.55"
                      />
                      <stop
                        offset="100%"
                        stopColor={isCorrect ? '#10b981' : '#f43f5e'}
                        stopOpacity="0"
                      />
                    </radialGradient>
                  </defs>

                  {/* 3D Perspective Ground Grid (Horse Stance Footing Plane) */}
                  <g opacity="0.32">
                    {groundGridLines.map((gx) => {
                      const start = project3DPoint(gx, -115, -120);
                      const end = project3DPoint(gx, -115, 120);
                      return (
                        <line
                          key={`gx-${gx}`}
                          x1={start.px}
                          y1={start.py}
                          x2={end.px}
                          y2={end.py}
                          stroke={gx === 0 ? '#f59e0b' : '#57534e'}
                          strokeWidth={gx === 0 ? 1.5 : 1}
                          strokeDasharray={gx === 0 ? '4 3' : undefined}
                        />
                      );
                    })}
                    {groundGridLines.map((gz) => {
                      const start = project3DPoint(-120, -115, gz);
                      const end = project3DPoint(120, -115, gz);
                      return (
                        <line
                          key={`gz-${gz}`}
                          x1={start.px}
                          y1={start.py}
                          x2={end.px}
                          y2={end.py}
                          stroke={gz === 0 ? '#10b981' : '#57534e'}
                          strokeWidth={gz === 0 ? 1.5 : 1}
                        />
                      );
                    })}
                  </g>

                  {/* Vertical Center Plumb Line (天心垂線 - Spine & Center of Gravity) */}
                  {(() => {
                    const topPlumb = project3DPoint(0, 125, 0);
                    const bottomPlumb = project3DPoint(0, -115, 0);
                    return (
                      <g>
                        <line
                          x1={topPlumb.px}
                          y1={topPlumb.py}
                          x2={bottomPlumb.px}
                          y2={bottomPlumb.py}
                          stroke="#fbbf24"
                          strokeWidth="1.2"
                          strokeDasharray="5 5"
                          opacity="0.55"
                        />
                        <circle
                          cx={bottomPlumb.px}
                          cy={bottomPlumb.py}
                          r="6"
                          fill="none"
                          stroke="#fbbf24"
                          strokeWidth="1.5"
                          opacity="0.7"
                        />
                      </g>
                    );
                  })()}

                  {/* Shoulder Alignment Axis Line (兩肩一線軸) */}
                  {(() => {
                    const axisStart = project3DPoint(-145, 64, 0);
                    const axisEnd = project3DPoint(95, 64, 0);
                    return (
                      <line
                        x1={axisStart.px}
                        y1={axisStart.py}
                        x2={axisEnd.px}
                        y2={axisEnd.py}
                        stroke={isCorrect ? '#34d399' : '#f43f5e'}
                        strokeWidth="1.8"
                        strokeDasharray="6 4"
                        opacity="0.75"
                      />
                    );
                  })()}

                  {/* Dantian Energy Core Glow */}
                  <circle
                    cx={p.dantian.px}
                    cy={p.dantian.py}
                    r={28 * p.dantian.scale}
                    fill="url(#dantianGlow)"
                  />

                  {/* Lower Body: Horse Stance Legs (四平馬步) */}
                  <g
                    stroke={
                      selectedJoint === 'stance'
                        ? '#fbbf24'
                        : isCorrect
                        ? '#d6d3d1'
                        : '#fda4af'
                    }
                    strokeWidth={selectedJoint === 'stance' ? 5.5 : 4.5}
                    strokeLinecap="round"
                  >
                    {/* Left Leg */}
                    <line
                      x1={p.pelvis.px}
                      y1={p.pelvis.py}
                      x2={p.leftKnee.px}
                      y2={p.leftKnee.py}
                    />
                    <line
                      x1={p.leftKnee.px}
                      y1={p.leftKnee.py}
                      x2={p.leftFoot.px}
                      y2={p.leftFoot.py}
                    />
                    {/* Right Leg */}
                    <line
                      x1={p.pelvis.px}
                      y1={p.pelvis.py}
                      x2={p.rightKnee.px}
                      y2={p.rightKnee.py}
                    />
                    <line
                      x1={p.rightKnee.px}
                      y1={p.rightKnee.py}
                      x2={p.rightFoot.px}
                      y2={p.rightFoot.py}
                    />
                  </g>

                  {/* Foot Rooting Anchors */}
                  <circle
                    cx={p.leftFoot.px}
                    cy={p.leftFoot.py}
                    r="5.5"
                    fill={isCorrect ? '#10b981' : '#f43f5e'}
                  />
                  <circle
                    cx={p.rightFoot.px}
                    cy={p.rightFoot.py}
                    r="5.5"
                    fill={isCorrect ? '#10b981' : '#f43f5e'}
                  />

                  {/* Axial Spine (脊柱中軸) */}
                  <g
                    stroke={
                      selectedJoint === 'spine'
                        ? '#fbbf24'
                        : isCorrect
                        ? '#34d399'
                        : '#fb7185'
                    }
                    strokeWidth={selectedJoint === 'spine' ? 6 : 5}
                    strokeLinecap="round"
                  >
                    <line
                      x1={p.pelvis.px}
                      y1={p.pelvis.py}
                      x2={p.thorax.px}
                      y2={p.thorax.py}
                    />
                    <line
                      x1={p.thorax.px}
                      y1={p.thorax.py}
                      x2={p.neck.px}
                      y2={p.neck.py}
                    />
                  </g>

                  {/* Shoulder Girdle & Bow/Draw Arms (兩肩一線與前後臂) */}
                  <g
                    stroke={
                      selectedJoint === 'shoulder'
                        ? '#fbbf24'
                        : isCorrect
                        ? '#6ee7b7'
                        : '#f43f5e'
                    }
                    strokeWidth={selectedJoint === 'shoulder' ? 5.5 : 4.5}
                    strokeLinecap="round"
                  >
                    {/* Clavicle / Scapular Bridge */}
                    <line
                      x1={p.frontShoulder.px}
                      y1={p.frontShoulder.py}
                      x2={p.neck.px}
                      y2={p.neck.py}
                    />
                    <line
                      x1={p.neck.px}
                      y1={p.neck.py}
                      x2={p.rearShoulder.px}
                      y2={p.rearShoulder.py}
                    />
                    {/* Front Bow Arm (前手推山) */}
                    <line
                      x1={p.frontShoulder.px}
                      y1={p.frontShoulder.py}
                      x2={p.frontElbow.px}
                      y2={p.frontElbow.py}
                    />
                    <line
                      x1={p.frontElbow.px}
                      y1={p.frontElbow.py}
                      x2={p.bowHand.px}
                      y2={p.bowHand.py}
                    />
                    {/* Rear Draw Arm (後肘平舉) */}
                    <line
                      x1={p.rearShoulder.px}
                      y1={p.rearShoulder.py}
                      x2={p.rearElbow.px}
                      y2={p.rearElbow.py}
                    />
                    <line
                      x1={p.rearElbow.px}
                      y1={p.rearElbow.py}
                      x2={p.drawHand.px}
                      y2={p.drawHand.py}
                    />
                  </g>

                  {/* The Bow (依當前弓具造型渲染：木弓 / 角弓 / 清代大弰滿洲力弓) */}
                  <path
                    d={`M ${p.bowTopTip.px} ${p.bowTopTip.py} Q ${
                      p.bowHand.px - (currentBow.id === 'manchu_bow' ? 26 : 16)
                    } ${p.bowHand.py} ${p.bowBottomTip.px} ${p.bowBottomTip.py}`}
                    fill="none"
                    stroke={bowData.bowColor}
                    strokeWidth={currentBow.id === 'manchu_bow' ? 4.5 : 3.5}
                    strokeLinecap="round"
                  />

                  {/* Bowstring (弓弦) */}
                  <polyline
                    points={`${p.bowTopTip.px},${p.bowTopTip.py} ${p.drawHand.px},${p.drawHand.py} ${p.bowBottomTip.px},${p.bowBottomTip.py}`}
                    fill="none"
                    stroke="#e7e5e4"
                    strokeWidth="1.5"
                    opacity="0.9"
                  />

                  {/* Drawn Arrow (滿弓待發之箭) */}
                  <line
                    x1={p.drawHand.px}
                    y1={p.drawHand.py}
                    x2={p.arrowTip.px}
                    y2={p.arrowTip.py}
                    stroke="#fbbf24"
                    strokeWidth="2.4"
                  />
                  <polygon
                    points={`${p.arrowTip.px - 6},${p.arrowTip.py} ${p.arrowTip.px + 3},${
                      p.arrowTip.py - 3.5
                    } ${p.arrowTip.px + 3},${p.arrowTip.py + 3.5}`}
                    fill="#fbbf24"
                  />

                  {/* Archer Head & Qing Tassel Hat Silhouette */}
                  <circle
                    cx={p.head.px}
                    cy={p.head.py}
                    r={13 * p.head.scale}
                    fill="#292524"
                    stroke={isCorrect ? '#f59e0b' : '#f43f5e'}
                    strokeWidth="2"
                  />
                  {/* Red Tassel on Qing Hat */}
                  <path
                    d={`M ${p.head.px} ${p.head.py - 14 * p.head.scale} L ${
                      p.head.px + 8
                    } ${p.head.py - 5 * p.head.scale}`}
                    stroke="#ef4444"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Interactive Clickable Hotspot Nodes on 3D Skeleton */}
                  {/* 1. Front Shoulder Hotspot */}
                  <g
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedJoint('shoulder');
                    }}
                  >
                    <circle
                      cx={p.frontShoulder.px}
                      cy={p.frontShoulder.py}
                      r={selectedJoint === 'shoulder' ? 9 : 6}
                      fill={isCorrect ? '#10b981' : '#f43f5e'}
                      stroke="#1c1917"
                      strokeWidth="2"
                    />
                    <text
                      x={p.frontShoulder.px - 12}
                      y={p.frontShoulder.py - 12}
                      textAnchor="end"
                      className="text-[10px] fill-amber-300 font-bold"
                    >
                      {isCorrect ? '前肩下沉(順肩)' : '前肩高聳(弊病)'}
                    </text>
                  </g>

                  {/* 2. Dantian / Spine Hotspot */}
                  <g
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedJoint('spine');
                    }}
                  >
                    <circle
                      cx={p.dantian.px}
                      cy={p.dantian.py}
                      r={selectedJoint === 'spine' ? 9 : 6}
                      fill={isCorrect ? '#10b981' : '#f43f5e'}
                      stroke="#1c1917"
                      strokeWidth="2"
                    />
                    <text
                      x={p.dantian.px + 14}
                      y={p.dantian.py + 4}
                      className="text-[10px] fill-emerald-300 font-bold"
                    >
                      {isCorrect ? '氣沉丹田 · 塌腰' : '脊柱後仰折腰'}
                    </text>
                  </g>

                  {/* 3. Horse Stance Knee Hotspot */}
                  <g
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedJoint('stance');
                    }}
                  >
                    <circle
                      cx={p.leftKnee.px}
                      cy={p.leftKnee.py}
                      r={selectedJoint === 'stance' ? 9 : 6}
                      fill={isCorrect ? '#f59e0b' : '#f43f5e'}
                      stroke="#1c1917"
                      strokeWidth="2"
                    />
                    <text
                      x={p.leftKnee.px - 12}
                      y={p.leftKnee.py + 4}
                      textAnchor="end"
                      className="text-[10px] fill-amber-200 font-bold"
                    >
                      {isCorrect
                        ? `四平馬步 (${bowData.kneeBendDeg}°)`
                        : '夾膝浮踵'}
                    </text>
                  </g>

                  {/* 4. Draw Hand / Rear Elbow Hotspot */}
                  <g
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedJoint('release');
                    }}
                  >
                    <circle
                      cx={p.rearElbow.px}
                      cy={p.rearElbow.py}
                      r={selectedJoint === 'release' ? 9 : 6}
                      fill={isCorrect ? '#38bdf8' : '#f43f5e'}
                      stroke="#1c1917"
                      strokeWidth="2"
                    />
                    <text
                      x={p.rearElbow.px + 12}
                      y={p.rearElbow.py - 8}
                      className="text-[10px] fill-sky-300 font-bold"
                    >
                      {isCorrect ? '後肘平舉 · 滿弓過耳' : '掉肘怯弓'}
                    </text>
                  </g>
                </svg>
              )}

              {/* VIEW 2: FRONT ELEVATION BIOMECHANICAL HORSE STANCE DIAGRAM (正面四平馬步開弓圖) */}
              {perspective === 'front_stance' && (
                <svg viewBox="0 0 560 400" className="w-full h-full">
                  {/* Reference Grid */}
                  <line
                    x1="280"
                    y1="25"
                    x2="280"
                    y2="345"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                    strokeDasharray="6 4"
                    opacity="0.5"
                  />
                  <line
                    x1="70"
                    y1="335"
                    x2="490"
                    y2="335"
                    stroke="#78716c"
                    strokeWidth="2"
                  />

                  {/* Horizontal Shoulder Force Vector Line */}
                  <line
                    x1="90"
                    y1="125"
                    x2="440"
                    y2="125"
                    stroke={isCorrect ? '#10b981' : '#f43f5e'}
                    strokeWidth="1.8"
                    strokeDasharray="5 3"
                  />
                  <text
                    x="445"
                    y="129"
                    className="text-[11px] fill-emerald-400 font-mono"
                  >
                    兩肩水平軸線
                  </text>

                  {/* Horse Stance Width Dimension */}
                  <line
                    x1={isCorrect ? 185 : 230}
                    y1="355"
                    x2={isCorrect ? 375 : 330}
                    y2="355"
                    stroke="#fbbf24"
                    strokeWidth="1.5"
                  />
                  <text
                    x="280"
                    y="372"
                    textAnchor="middle"
                    className="text-[11px] fill-amber-300 font-mono"
                  >
                    {isCorrect
                      ? `四平馬步跨距：約 ${bowData.stanceWidthCm} cm（依 ${currentBow.drawWeightLbs} lbs 弓力加深）`
                      : '跨距過窄 (42 cm)：下盤無根、遇風即晃'}
                  </text>

                  {/* Lower Body Geometry */}
                  <path
                    d={
                      isCorrect
                        ? 'M 190 335 L 185 265 L 280 215 L 375 265 L 370 335'
                        : 'M 235 335 L 245 260 L 295 200 L 325 260 L 325 335'
                    }
                    fill="none"
                    stroke={isCorrect ? '#e7e5e4' : '#fda4af'}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Outward Knee Force Arrows (雙膝外撐力) */}
                  {isCorrect && (
                    <g stroke="#10b981" strokeWidth="2">
                      <line x1="180" y1="265" x2="152" y2="265" />
                      <polygon points="152,261 144,265 152,269" fill="#10b981" />
                      <line x1="380" y1="265" x2="408" y2="265" />
                      <polygon points="408,261 416,265 408,269" fill="#10b981" />
                      <text x="145" y="254" className="text-[10px] fill-emerald-300" stroke="none">
                        膝外撐
                      </text>
                      <text x="385" y="254" className="text-[10px] fill-emerald-300" stroke="none">
                        圓襠扣趾
                      </text>
                    </g>
                  )}

                  {/* Torso & Spine */}
                  <line
                    x1={isCorrect ? 280 : 295}
                    y1={isCorrect ? 215 : 200}
                    x2={isCorrect ? 280 : 312}
                    y2="125"
                    stroke={isCorrect ? '#34d399' : '#f43f5e'}
                    strokeWidth="7"
                    strokeLinecap="round"
                  />

                  {/* Shoulders & Arms */}
                  <polyline
                    points={
                      isCorrect
                        ? '135,125 245,125 280,125 315,125 375,125 298,125'
                        : '145,112 252,102 312,125 342,135 368,162 296,138'
                    }
                    fill="none"
                    stroke={isCorrect ? '#6ee7b7' : '#fb7185'}
                    strokeWidth="5.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Head */}
                  <circle
                    cx={isCorrect ? 280 : 316}
                    cy="92"
                    r="16"
                    fill="#292524"
                    stroke={isCorrect ? '#fbbf24' : '#f43f5e'}
                    strokeWidth="2.5"
                  />

                  {/* Bow & Arrow */}
                  <path
                    d="M 142 52 Q 112 125 142 198"
                    fill="none"
                    stroke={bowData.bowColor}
                    strokeWidth="4.5"
                  />
                  <polyline
                    points={`142,52 ${isCorrect ? '298,125' : '296,138'} 142,198`}
                    fill="none"
                    stroke="#d6d3d1"
                    strokeWidth="1.5"
                  />
                  <line
                    x1={isCorrect ? 298 : 296}
                    y1={isCorrect ? 125 : 138}
                    x2="105"
                    y2={isCorrect ? 125 : 112}
                    stroke="#fbbf24"
                    strokeWidth="2.5"
                  />

                  {/* Diagnostic Callout Labels */}
                  <g className="text-[11px] font-bold">
                    <rect
                      x="38"
                      y="198"
                      width="125"
                      height="42"
                      rx="6"
                      fill="#1c1917"
                      stroke={isCorrect ? '#10b981' : '#f43f5e'}
                      strokeWidth="1"
                    />
                    <text x="48" y="215" fill={isCorrect ? '#6ee7b7' : '#fda4af'}>
                      {isCorrect ? '✓ 前肩下沉內合' : '✗ 前肩聳起受壓'}
                    </text>
                    <text x="48" y="231" fill="#a8a29e" className="text-[10px] font-normal">
                      {isCorrect ? '骨力直傳前腕' : '三角肌代償易顫抖'}
                    </text>

                    <rect
                      x="385"
                      y="185"
                      width="138"
                      height="42"
                      rx="6"
                      fill="#1c1917"
                      stroke={isCorrect ? '#10b981' : '#f43f5e'}
                      strokeWidth="1"
                    />
                    <text x="395" y="202" fill={isCorrect ? '#6ee7b7' : '#fda4af'}>
                      {isCorrect ? '✓ 氣沉丹田 · 塌腰' : '✗ 挺胸仰身 · 折腰'}
                    </text>
                    <text x="395" y="218" fill="#a8a29e" className="text-[10px] font-normal">
                      {isCorrect ? '脊柱中正垂直如碑' : '重心後傾導致高射'}
                    </text>
                  </g>
                </svg>
              )}

              {/* VIEW 3: TOP-DOWN AXIAL SHOULDER ALIGNMENT DIAGRAM (俯視兩肩一線十字軸線圖) */}
              {perspective === 'top_shoulder' && (
                <svg viewBox="0 0 560 400" className="w-full h-full">
                  {/* Ideal Bone Alignment Line (順肩一字軸線) */}
                  <line
                    x1="65"
                    y1="195"
                    x2="495"
                    y2="195"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeDasharray="7 5"
                    opacity="0.7"
                  />
                  <text x="75" y="178" className="text-[11px] fill-emerald-400 font-mono">
                    ◀ 前手推弓方向（指向靶心）
                  </text>
                  <text
                    x="485"
                    y="178"
                    textAnchor="end"
                    className="text-[11px] fill-emerald-400 font-mono"
                  >
                    後肘引弦方向（背肌擴張）▶
                  </text>

                  {/* Sagittal Body Centerline */}
                  <line
                    x1="280"
                    y1="55"
                    x2="280"
                    y2="345"
                    stroke="#fbbf24"
                    strokeWidth="1.2"
                    strokeDasharray="4 4"
                    opacity="0.45"
                  />

                  {/* Top-Down Foot Stance Silhouettes */}
                  <ellipse
                    cx={isCorrect ? 210 : 240}
                    cy="225"
                    rx="14"
                    ry="28"
                    fill="#292524"
                    stroke="#78716c"
                    strokeWidth="1.5"
                  />
                  <ellipse
                    cx={isCorrect ? 350 : 320}
                    cy="225"
                    rx="14"
                    ry="28"
                    fill="#292524"
                    stroke="#78716c"
                    strokeWidth="1.5"
                  />

                  {/* Top-Down Torso & Scapulae */}
                  <ellipse
                    cx="280"
                    cy={isCorrect ? 198 : 212}
                    rx="56"
                    ry="26"
                    fill="#1c1917"
                    stroke={isCorrect ? '#34d399' : '#f43f5e'}
                    strokeWidth="2.5"
                  />

                  {/* Skeletal Bone Bridge (Top-Down View of Bow Hand -> Front Shoulder -> Rear Shoulder -> Draw Elbow) */}
                  <polyline
                    points={
                      isCorrect
                        ? '115,195 182,195 232,195 328,195 415,198 310,192'
                        : '125,222 188,236 234,218 326,208 395,252 302,226'
                    }
                    fill="none"
                    stroke={isCorrect ? '#6ee7b7' : '#fb7185'}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Joint Circles */}
                  <circle
                    cx={isCorrect ? 232 : 234}
                    cy={isCorrect ? 195 : 218}
                    r="8"
                    fill={isCorrect ? '#10b981' : '#f43f5e'}
                  />
                  <circle
                    cx={isCorrect ? 328 : 326}
                    cy={isCorrect ? 195 : 208}
                    r="8"
                    fill={isCorrect ? '#10b981' : '#f43f5e'}
                  />
                  <circle
                    cx={isCorrect ? 415 : 395}
                    cy={isCorrect ? 198 : 252}
                    r="7"
                    fill={isCorrect ? '#38bdf8' : '#f43f5e'}
                  />

                  {/* Top-Down Head */}
                  <circle
                    cx="280"
                    cy={isCorrect ? 195 : 212}
                    r="20"
                    fill="#292524"
                    stroke="#fbbf24"
                    strokeWidth="2"
                  />

                  {/* Top-Down Bow & Arrow */}
                  <line
                    x1={isCorrect ? 115 : 125}
                    y1={isCorrect ? 155 : 182}
                    x2={isCorrect ? 115 : 125}
                    y2={isCorrect ? 235 : 262}
                    stroke={bowData.bowColor}
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                  <line
                    x1={isCorrect ? 310 : 302}
                    y1={isCorrect ? 192 : 226}
                    x2="85"
                    y2={isCorrect ? 192 : 218}
                    stroke="#fbbf24"
                    strokeWidth="2.5"
                  />

                  {/* Top-Down Explanation Box */}
                  <rect
                    x="95"
                    y="285"
                    width="370"
                    height="56"
                    rx="8"
                    fill="#1c1917"
                    stroke={isCorrect ? '#10b981' : '#f43f5e'}
                    strokeWidth="1.2"
                  />
                  <text
                    x="280"
                    y="307"
                    textAnchor="middle"
                    fill={isCorrect ? '#6ee7b7' : '#fda4af'}
                    className="text-xs font-bold"
                  >
                    {isCorrect
                      ? '俯視正法：前腕、前肩、後肩、後肘連成「一字剛性骨橋」（178°）'
                      : '俯視弊病：前肘外折、後肘脫離軸線（142°），弓弦極易掃傷前臂'}
                  </text>
                  <text
                    x="280"
                    y="327"
                    textAnchor="middle"
                    fill="#a8a29e"
                    className="text-[11px]"
                  >
                    {isCorrect
                      ? `雙肩骨鎖直接承受 ${currentBow.drawWeightLbs} 磅弓力，肩袖肌群零內耗`
                      : '力線斷裂，全靠三角肌與二頭肌死拉，滿弓3秒即劇烈手抖'}
                  </text>
                </svg>
              )}
            </div>

            {/* 3D Angle Slider Bar (Only shown in 3D rig mode) */}
            {perspective === '3d_rig' && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-4 px-3 py-2 rounded-lg bg-stone-900/80 border border-stone-800 text-xs">
                <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                  <span className="text-stone-400 font-mono whitespace-nowrap">
                    水平環視角度 (Yaw):
                  </span>
                  <input
                    type="range"
                    min={-180}
                    max={180}
                    value={yawDeg}
                    onChange={(e) => {
                      setAutoRotate(false);
                      setYawDeg(Number(e.target.value));
                    }}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-3 flex-1 min-w-[180px]">
                  <span className="text-stone-400 font-mono whitespace-nowrap">
                    俯仰視角 (Pitch):
                  </span>
                  <input
                    type="range"
                    min={-10}
                    max={55}
                    value={pitchDeg}
                    onChange={(e) => {
                      setAutoRotate(false);
                      setPitchDeg(Number(e.target.value));
                    }}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right 5 Cols: Historical Bow Context & Selected Joint Coaching Panel */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-stone-900/50 p-4 sm:p-5 space-y-4">
            {/* Section 1: Current Bow Historical & Biomechanical Requirements */}
            <div className="rounded-xl bg-stone-900/90 border border-amber-500/30 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-bold text-amber-300 font-serif">
                    當前弓具考證：{currentBow.name}
                  </h4>
                </div>
                <span className="px-2 py-0.5 text-[11px] font-mono rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {bowData.qingLiUnit}
                </span>
              </div>

              <p className="text-xs text-stone-300 leading-relaxed">
                {bowData.historicalContext}
              </p>

              {/* Key Biomechanical Metrics for Current Bow */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="bg-stone-950/80 border border-stone-800 rounded-lg p-2 text-center">
                  <div className="text-[10px] text-stone-400">建議馬步跨距</div>
                  <div className="text-sm font-bold text-amber-400 font-mono">
                    {bowData.stanceWidthCm} cm
                  </div>
                </div>
                <div className="bg-stone-950/80 border border-stone-800 rounded-lg p-2 text-center">
                  <div className="text-[10px] text-stone-400">蹲襠膝關節角</div>
                  <div className="text-sm font-bold text-emerald-400 font-mono">
                    {bowData.kneeBendDeg}°
                  </div>
                </div>
                <div className="bg-stone-950/80 border border-stone-800 rounded-lg p-2 text-center">
                  <div className="text-[10px] text-stone-400">順肩背肌負荷比</div>
                  <div className="text-sm font-bold text-sky-400 font-mono">
                    {bowData.scapularLoadPct}%
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-1 text-xs">
                <div className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold shrink-0">【下盤馬步】</span>
                  <span className="text-stone-300">{bowData.stanceRequirement}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold shrink-0">【順肩骨法】</span>
                  <span className="text-stone-300">{bowData.shoulderRequirement}</span>
                </div>
              </div>

              <div className="text-[11px] text-stone-400 italic border-t border-stone-800/80 pt-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>典籍依據：{bowData.historicalSource}</span>
              </div>
            </div>

            {/* Section 2: Active Joint Deep-Dive Coaching Card */}
            <div className="rounded-xl bg-stone-900/90 border border-stone-800 p-4 space-y-3 flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-amber-400/90 font-mono">
                    {activeHotspot.subtitle}
                  </span>
                  <h4 className="text-base font-bold text-stone-100 font-serif">
                    {activeHotspot.title}
                  </h4>
                </div>
                <span
                  className={`px-2.5 py-1 rounded text-xs font-bold ${
                    isCorrect
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {isCorrect ? '正統身法要領' : '常見弊病剖析'}
                </span>
              </div>

              <blockquote className="px-3 py-2 rounded-lg bg-amber-950/25 border-l-2 border-amber-500 text-xs text-amber-200/90 font-serif">
                {activeHotspot.classicQuote}
              </blockquote>

              {/* Comparison Cards */}
              <div className="space-y-2.5 text-xs">
                <div
                  className={`p-3 rounded-lg border transition-all ${
                    isCorrect
                      ? 'bg-emerald-950/30 border-emerald-500/50 text-stone-200'
                      : 'bg-stone-950/60 border-stone-800/80 text-stone-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>正法審固（清代八旗標準）</span>
                  </div>
                  <p className="leading-relaxed">{activeHotspot.correctDetail}</p>
                  <div className="mt-1.5 text-[11px] font-mono text-emerald-300/90">
                    數據指標：{activeHotspot.metricsCorrect}
                  </div>
                </div>

                <div
                  className={`p-3 rounded-lg border transition-all ${
                    !isCorrect
                      ? 'bg-rose-950/30 border-rose-500/50 text-stone-200'
                      : 'bg-stone-950/60 border-stone-800/80 text-stone-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-rose-400 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>弊病戒律（聳肩 / 浮踵 / 折腰）</span>
                  </div>
                  <p className="leading-relaxed">{activeHotspot.faultyDetail}</p>
                  <div className="mt-1.5 text-[11px] font-mono text-rose-300/90">
                    風險指標：{activeHotspot.metricsFaulty}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Practical In-Game Tactical Tip */}
            <div className="rounded-xl bg-gradient-to-r from-amber-950/40 via-stone-900 to-stone-900 border border-amber-500/30 p-3.5 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <div className="font-bold text-amber-300">
                  實戰連動提示：身法審固與「屏息凝神 (Space)」
                </div>
                <p className="text-stone-300 leading-relaxed">
                  在實戰拉弓時，當開弓達 <span className="text-amber-300 font-semibold">85%–100%</span>{' '}
                  並按住 <kbd className="px-1.5 py-0.5 bg-stone-800 rounded border border-stone-700 font-mono text-[10px]">Space</kbd>{' '}
                  進入「氣沉丹田 · 屏息凝神」，即模擬清代步射「四平馬步 + 順肩鎖骨」之審固狀態，可消除 86% 準星晃動以精準貫中紅心。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
