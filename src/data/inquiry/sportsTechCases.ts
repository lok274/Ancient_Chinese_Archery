/**
 * National Sports-Tech Support Data Cards (國家隊體育科研支援數據卡)
 * Educational Objectives:
 * - OBJ-TECH — 探究創新科技以認識國家發展
 * - OBJ-IDENTITY — 深化對祖國的認識，培養國家觀念與國民身份認同
 *
 * Copy rules: Factual, sourced, non-hyperbolic. Attributes methods generically and encodes
 * the causal chain: 科技投入 → 競技突破 → 國家榮耀.
 */

export interface SportsTechCase {
  id: string;
  headline: string;
  oneLineFact: string;
  methodTag: '生物力學動作分析' | '高速攝影回饋' | '低速風洞氣動測試' | '生理心率與肌電監測';
  causalChain: string; // Explicitly encodes 科技投入 → 競技突破 → 國家榮耀
}

export const SPORTS_TECH_CASES: SportsTechCase[] = [
  {
    id: 'tech_biomechanics_ksl',
    headline: '三維光學動作捕捉與骨肌力學建模',
    oneLineFact:
      '透過紅外線反光標記點與測力台同步採集射手開弓時兩肩角度、骨盆重心偏移與背闊肌肌電訊號，將毫米級動作誤差轉化為量化調整指標。',
    methodTag: '生物力學動作分析',
    causalChain:
      '科技投入（三維運動生物力學實驗室分析） → 競技突破（提升滿弓過響片階段的骨架一致性） → 國家榮耀（支撐國家隊在 70 米奧運團體與個人賽穩定發揮）',
  },
  {
    id: 'tech_high_speed_video',
    headline: '千幀級高速攝影與「箭支撓度悖論」調校',
    oneLineFact:
      '利用每秒 1,000 幀以上的高速攝影機記錄撒放瞬間弓弦推箭與箭桿彎曲擺動（Archer’s Paradox），精準匹配選手拉距、箭桿撓度與箭側墊彈性係數。',
    methodTag: '高速攝影回饋',
    causalChain:
      '科技投入（高速視覺影像與器材參數配對） → 競技突破（消除撒放擦把干擾、縮小 70 米靶面群聚散佈） → 國家榮耀（助力中國選手在國際大賽高壓決賽中精準命中 10 環）',
  },
  {
    id: 'tech_wind_tunnel',
    headline: '體育低速風洞與橫風環境模擬訓練',
    oneLineFact:
      '借鑑航空工程低速風洞測試方法，量化不同直徑碳鋁箭桿與尾羽形狀在 2–7 m/s 側風下的橫向漂移曲線，並於訓練場建立人工造風干擾適應機制。',
    methodTag: '低速風洞氣動測試',
    causalChain:
      '科技投入（跨學科空氣動力學風洞實測與抗風訓練） → 競技突破（掌握複雜濱海與河畔賽場的風偏修正規律） → 國家榮耀（在奧運室外多變風場中展現紮實抗風險能力）',
  },
  {
    id: 'tech_biofeedback_hrv',
    headline: '心率變異度（HRV）與呼吸神經生物回饋',
    oneLineFact:
      '穿戴式感測器即時監測選手瞄準階段的心跳間期與腹式呼吸節律，協助運動員在「一箭決生死（Shoot-off）」高壓情境下快速回落至最佳擊發心率區間。',
    methodTag: '生理心率與肌電監測',
    causalChain:
      '科技投入（運動生理與心理神經回饋系統） → 競技突破（高壓決賽中維持屏息凝神的穩定擊發節奏） → 國家榮耀（傳承「內志正、外體直」傳統定力並轉化為現代大賽抗壓表現）',
  },
];
