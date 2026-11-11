/**
 * Material Evolution Timeline Data (材質演化時間軸)
 * Educational Objective: OBJ-TECH — 探究創新科技以認識國家發展
 * Lets students investigate arrowheads and bow materials across 28,000 years as manipulable
 * ballistic parameters (massG, dragCoeff) to observe how materials science drives performance.
 */

export interface MaterialStage {
  id: string;
  era: string;
  label: string;
  materialSpec: string;
  massG: number;
  dragCoeff: number;
  flightNarrative: string;
  sourceRef: string;
  drivingFactor: string; // Required one-line "驅動因素" statement
  colorHex: string;
}

export const MATERIAL_TIMELINE_STAGES: MaterialStage[] = [
  {
    id: 'mat_shiyu_stone',
    era: '舊石器時代晚期（距今約 28,000 年）',
    label: '石鏃（峙峪遺址）',
    materialSpec: '打製燧石箭鏃 ＋ 天然韌木單體弓胎（無複合層）',
    massG: 46,
    dragCoeff: 2.15,
    flightNarrative:
      '打製石鏃表面粗糙且形制較寬厚，空氣阻力係數高（Cd ≈ 2.15），遠距飛行時速度衰減快、拋物線下墜明顯，有效精準射程集中於 20–30 米內。',
    sourceRef: '山西朔州峙峪遺址考古發掘報告（中國科學院古脊椎動物與古人類研究所）',
    drivingFactor:
      '驅動因素：早期人類為克服近身狩獵風險，利用燧石硬度與木材彈性實現遠距能量投射的最初突破。',
    colorHex: '#a8a29e',
  },
  {
    id: 'mat_shang_bronze',
    era: '商周青銅時代（約公元前 1600 — 前 256 年）',
    label: '青銅鏃（商周雙翼／三棱鏃）',
    materialSpec: '範鑄錫青銅三棱鏃 ＋《考工記》干角筋膠絲漆六材複合弓',
    massG: 38,
    dragCoeff: 1.68,
    flightNarrative:
      '模範鑄造使箭鏃具備對稱流線雙翼與脊線，氣動穩定性顯著提升；配合商周筋角複合弓儲存更高彈性勢能，中遠距抗風與貫穿力大幅躍升。',
    sourceRef: '《周禮·考工記·弓人》及河南安陽殷墟出土商代青銅鏃群',
    drivingFactor:
      '驅動因素：國家禮制（六藝射禮）與車戰工程需求，推動標準化冶鑄工藝與異質複合材料（角抗壓、筋抗拉）的系統結合。',
    colorHex: '#d97706',
  },
  {
    id: 'mat_han_iron',
    era: '秦漢至明清（公元前 221 — 1905 年）',
    label: '鐵鏃（漢代三棱鋼鐵鏃）',
    materialSpec: '鍛打滲碳鋼鐵鏃 ＋ 樺木竹胎筋角反曲弓',
    massG: 33,
    dragCoeff: 1.48,
    flightNarrative:
      '鐵器鍛造技術成熟後，箭鏃體積更緊湊、重心前移（FOC 提升），風阻進一步下降，在 50–70 米側風環境下能維持更平直的彈道軌跡。',
    sourceRef: '甘肅居延漢簡兵器冊及香港屏山鄧氏宗祠文物館藏清代武舉官兵箭實物',
    drivingFactor:
      '驅動因素：高溫冶鐵與鍛鋼普及降低了高強度箭鏃的製造成本，支撐起歷代邊防與唐宋明清武舉科考的規模化訓練標準。',
    colorHex: '#60a5fa',
  },
  {
    id: 'mat_modern_alloy',
    era: '近現代工業時期（1950 — 1990 年代）',
    label: '合金鋼鏃（精密鋁合金箭桿）',
    materialSpec: 'CNC 車削硬化不鏽鋼彈頭鏃 ＋ 7075 航空鋁合金空心管箭',
    massG: 26,
    dragCoeff: 1.26,
    flightNarrative:
      '空心薄壁航空鋁合金管使箭桿撓度（Spine）與質量分佈高度一致，同批箭矢重量誤差小於 0.1 克，顯著縮小 70 米靶面散佈半徑。',
    sourceRef: '國際射箭總會（WA）現代競技器材規範與中國射箭隊 1984 奧運參賽裝備檔案',
    drivingFactor:
      '驅動因素：現代精密冶金與數控加工技術，解決了天然竹木箭桿受溫濕度影響而彎曲變形的公差難題。',
    colorHex: '#38bdf8',
  },
  {
    id: 'mat_contemporary_carbon',
    era: '當代奧運科技（2000 年 — 至今）',
    label: '碳纖維／複合材料（鎢鋼頭碳鋁箭）',
    materialSpec: '高密度鎢合金箭頭 ＋ 高模量碳纖維包覆鋁芯空心箭桿 ＋ 碳纖泡沫芯弓片',
    massG: 22,
    dragCoeff: 1.08,
    flightNarrative:
      '極細直徑（約 4.5mm）碳鋁複合箭桿大幅削減橫風受風面積，配合高密度鎢鋼頭維持高前重心，在 70 米奧運強風賽場實現最高初速與最小風偏。',
    sourceRef: '現代奧運 70 米反曲弓標準競賽器材與國家體育科學裝備材料研究公開資料',
    drivingFactor:
      '驅動因素：國家在高性能碳纖維、航空複合材料與風洞空氣動力學領域的基礎研發積累，直接轉化為現代競技體育裝備的工程支撐。',
    colorHex: '#10b981',
  },
];
