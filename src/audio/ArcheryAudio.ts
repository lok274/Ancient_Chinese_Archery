/**
 * Procedural Archery Audio Synthesizer
 * Uses Web Audio API to create authentic historical Chinese archery sound effects
 * with draw-weight-specific acoustics (45lb Silk-String vs. 65lb Manchu Siyah vs. 85lb Heavy War Bow)
 * and zero external 404 dependencies.
 */

class ArcheryAudioEngine {
  private ctx: AudioContext | null = null;
  private whistleOsc: OscillatorNode | null = null;
  private whistleHarmonicOsc: OscillatorNode | null = null;
  private whistleGain: GainNode | null = null;

  // Dynamic Breathing & Heartbeat Audio Nodes
  private breathNoiseSource: AudioBufferSourceNode | null = null;
  private breathFilter: BiquadFilterNode | null = null;
  private breathGain: GainNode | null = null;
  private isBreathingActive: boolean = false;
  private lastBreathPhase: number = 0;
  private lastHeartbeatTime: number = 0;

  private isMuted: boolean = false;
  private currentDrawWeightLbs: number = 45;

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.ctx) {
      this.stopArrowWhistle();
      this.stopBreathing(false);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setBowDrawWeight(drawWeightLbs: number) {
    this.currentDrawWeightLbs = drawWeightLbs;
  }

  /**
   * Starts the continuous procedural airflow node used for dynamic rhythmic breathing
   * while drawing and holding the bow.
   */
  public startBreathing() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || this.isBreathingActive) return;

    const t = this.ctx.currentTime;
    // Create a 3-second loopable pink-tinted airflow noise buffer
    const bufferSize = this.ctx.sampleRate * 3;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.997 * b0 + white * 0.029;
      b1 = 0.985 * b1 + white * 0.032;
      b2 = 0.950 * b2 + white * 0.045;
      output[i] = (b0 + b1 + b2 + white * 0.08) * 1.6;
    }

    this.breathNoiseSource = this.ctx.createBufferSource();
    this.breathNoiseSource.buffer = noiseBuffer;
    this.breathNoiseSource.loop = true;

    this.breathFilter = this.ctx.createBiquadFilter();
    this.breathFilter.type = 'bandpass';
    this.breathFilter.frequency.setValueAtTime(520, t);
    this.breathFilter.Q.setValueAtTime(3.2, t);

    this.breathGain = this.ctx.createGain();
    this.breathGain.gain.setValueAtTime(0.001, t);

    this.breathNoiseSource.connect(this.breathFilter);
    this.breathFilter.connect(this.breathGain);
    this.breathGain.connect(this.ctx.destination);

    this.breathNoiseSource.start(t);
    this.isBreathingActive = true;
    this.lastBreathPhase = 0;
    this.lastHeartbeatTime = 0;
  }

  /**
   * Updates the rhythmic breathing sound and somatic heartbeat in real time,
   * synced with breathSeconds, staminaPercent, and isFatigued:
   * - Initial Draw (0s–1.2s): Deep steady nasal inhalation (引氣入丹田)
   * - Optimal Focus Window (1.2s–3.5s): Slow, calm rhythmic breath cadence synced with HUD visualizer + quiet steady heartbeat
   * - Low Stamina / Fatigue (>3.5s or staminaPercent < 0.35): Strained, rapid heavy gasps + accelerating double-thump heartbeat
   */
  public updateBreathing(breathSeconds: number, staminaPercent: number, isFatigued: boolean) {
    if (this.isMuted) return;
    if (!this.isBreathingActive) {
      this.startBreathing();
    }
    if (!this.ctx || !this.breathFilter || !this.breathGain) return;

    const t = this.ctx.currentTime;
    const lowStaminaFactor = staminaPercent < 0.4 ? (0.4 - staminaPercent) / 0.4 : 0;
    const fatigueSeverity = isFatigued ? Math.min(1.0, 0.5 + (breathSeconds - 3.8) * 0.35) : 0;
    const strainLevel = Math.min(1.0, lowStaminaFactor * 0.65 + fatigueSeverity * 0.85);

    // 1. Rhythmic Breath Cadence (Inhale / Exhale formant & gain modulation)
    // Syncs with the 2.5 rad/s HUD breathe visualizer during optimal window, and speeds up when fatigued
    const cadenceSpeed = isFatigued ? 6.2 : staminaPercent < 0.35 ? 4.4 : 2.5;
    this.lastBreathPhase += cadenceSpeed * 0.016;
    const wave = Math.sin(this.lastBreathPhase); // > 0 inhale, < 0 exhale
    const cycleIntensity = Math.pow(Math.abs(wave), 0.75);

    let targetGain = 0.025;
    let targetFreq = 540;
    let targetQ = 3.2;

    if (breathSeconds < 1.2) {
      // Deep initial draw inhalation (吸氣蓄力)
      const inhaleEnv = Math.sin((breathSeconds / 1.2) * Math.PI);
      targetGain = 0.055 * inhaleEnv;
      targetFreq = 480 + inhaleEnv * 220;
      targetQ = 2.8;
    } else if (!isFatigued && staminaPercent >= 0.35) {
      // Optimal stable stamina window: calm, centered, meditative breathing rhythm
      targetGain = 0.018 + cycleIntensity * 0.032;
      targetFreq = wave >= 0 ? 520 + cycleIntensity * 140 : 390 + cycleIntensity * 90;
      targetQ = 3.6;
    } else {
      // Low stamina / fatigued: heavy, strained, rapid gasping breath
      targetGain = (0.045 + strainLevel * 0.085) * (0.35 + cycleIntensity * 0.65);
      targetFreq = wave >= 0
        ? 680 + strainLevel * 420 * cycleIntensity
        : 460 + strainLevel * 260 * cycleIntensity;
      targetQ = 2.0 - strainLevel * 0.6;
    }

    this.breathGain.gain.setTargetAtTime(targetGain, t, 0.04);
    this.breathFilter.frequency.setTargetAtTime(targetFreq, t, 0.04);
    this.breathFilter.Q.setTargetAtTime(Math.max(1.1, targetQ), t, 0.04);

    // 2. Somatic Heartbeat Pulse ("Lub-Dub" 胸腔心跳共鳴)
    // Quiet and slow during optimal focus; loud and rapid as stamina depletes or archer fatigues
    const heartInterval = isFatigued
      ? Math.max(0.36, 0.52 - fatigueSeverity * 0.14)
      : staminaPercent < 0.4
      ? 0.68 - lowStaminaFactor * 0.16
      : 0.92;

    if (breathSeconds - this.lastHeartbeatTime >= heartInterval) {
      this.lastHeartbeatTime = breathSeconds;
      const pulseStrength = isFatigued
        ? 0.22 + fatigueSeverity * 0.14
        : staminaPercent < 0.4
        ? 0.11 + lowStaminaFactor * 0.10
        : 0.065;
      this.playHeartbeatPulse(pulseStrength);
    }
  }

  /**
   * Stops the continuous breathing node, optionally emitting a crisp release exhalation puff (發矢吐氣聲)
   */
  public stopBreathing(playExhaleOnRelease: boolean = false) {
    if (this.breathNoiseSource && this.breathGain && this.ctx) {
      const t = this.ctx.currentTime;
      try {
        if (playExhaleOnRelease && !this.isMuted) {
          // Brief sharp martial exhalation ("喝/吐氣") on arrow release
          this.breathFilter?.frequency.setValueAtTime(620, t);
          this.breathFilter?.frequency.exponentialRampToValueAtTime(280, t + 0.16);
          this.breathGain.gain.setValueAtTime(0.075, t);
          this.breathGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
          this.breathNoiseSource.stop(t + 0.19);
        } else {
          this.breathGain.gain.setTargetAtTime(0.0001, t, 0.03);
          this.breathNoiseSource.stop(t + 0.08);
        }
      } catch {
        // Safe cleanup
      }
    }
    this.breathNoiseSource = null;
    this.breathFilter = null;
    this.breathGain = null;
    this.isBreathingActive = false;
  }

  /**
   * Synthesizes a low-frequency "lub-dub" somatic heartbeat pulse
   */
  private playHeartbeatPulse(intensity: number) {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;

    // First beat ("Lub")
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(68, t);
    osc1.frequency.exponentialRampToValueAtTime(34, t + 0.085);

    gain1.gain.setValueAtTime(0.001, t);
    gain1.gain.linearRampToValueAtTime(intensity, t + 0.015);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.095);

    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.1);

    // Second beat ("Dub" ~115ms later)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(58, t + 0.115);
    osc2.frequency.exponentialRampToValueAtTime(28, t + 0.195);

    gain2.gain.setValueAtTime(0.001, t + 0.115);
    gain2.gain.linearRampToValueAtTime(intensity * 0.72, t + 0.13);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.205);

    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(t + 0.115);
    osc2.stop(t + 0.21);
  }

  /**
   * Sound of drawing an arrow from the Ming waist quiver and nocking its ox-horn nock onto the silk string
   * (抽矢搭弦聲：雕翎摩擦與牛角扣入弦清脆喀聲)
   */
  public playArrowNock() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // 1. Feather & bamboo shaft sliding from leather quiver
    const slideSamples = Math.floor(this.ctx.sampleRate * 0.11);
    const slideBuf = this.ctx.createBuffer(1, slideSamples, this.ctx.sampleRate);
    const data = slideBuf.getChannelData(0);
    for (let i = 0; i < slideSamples; i++) {
      const env = Math.sin((i / slideSamples) * Math.PI);
      data[i] = (Math.random() * 2 - 1) * env * 0.35;
    }

    const slideSrc = this.ctx.createBufferSource();
    slideSrc.buffer = slideBuf;
    const slideFilter = this.ctx.createBiquadFilter();
    slideFilter.type = 'bandpass';
    slideFilter.frequency.setValueAtTime(2200, t);
    slideFilter.Q.setValueAtTime(2.5, t);

    const slideGain = this.ctx.createGain();
    slideGain.gain.setValueAtTime(0.08, t);
    slideGain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

    slideSrc.connect(slideFilter);
    slideFilter.connect(slideGain);
    slideGain.connect(this.ctx.destination);
    slideSrc.start(t);

    // 2. Crisp ox-horn nock click onto bowstring (搭弦脆響)
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(1450, t + 0.09);
    clickOsc.frequency.exponentialRampToValueAtTime(420, t + 0.125);

    clickGain.gain.setValueAtTime(0.001, t);
    clickGain.gain.setValueAtTime(0.16, t + 0.09);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);

    clickOsc.connect(clickGain);
    clickGain.connect(this.ctx.destination);
    clickOsc.start(t + 0.09);
    clickOsc.stop(t + 0.135);
  }

  /**
   * Draw-weight-differentiated bow limb flex, horn compression, and sinew/birch-bark creak
   * - 45lb Ming Birch-Bark Bow: Supple higher-pitched bamboo/silk tension
   * - 65lb Qing Manchu Horn Bow: Deep buffalo horn & deer sinew compression groan
   * - 85lb Heavy Iron-Wood War Bow: Heavy low-register timber & thick horn strain
   */
  public playDrawTension(intensity: number, drawWeightLbs: number = this.currentDrawWeightLbs) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    // Heavier draw weights shift the resonant horn/wood creak lower and richer
    const weightRatio = Math.max(0, Math.min(1, (drawWeightLbs - 45) / 40)); // 0 (45lb) -> 1 (85lb)
    const startFreq = (78 - weightRatio * 30) + intensity * (45 - weightRatio * 12);
    const endFreq = (165 - weightRatio * 55) + intensity * 50;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.16);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(380 - weightRatio * 140, t);
    filter.Q.setValueAtTime(4.2 + weightRatio * 1.8, t);

    const peakGain = (0.065 + weightRatio * 0.045) * Math.min(intensity, 1);
    gain.gain.setValueAtTime(0.005, t);
    gain.gain.linearRampToValueAtTime(peakGain, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.19);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.21);
  }

  /**
   * Distinct Historical Bow Release Acoustics based on Draw Weight (lbs) & Tension:
   * - 45lb Ming Silk-String Bow (明代絲弦樺皮弓): Crisp, high-pitched musical silk-string twang ("錚" 絲弦清音) + jade thumb-ring click
   * - 65lb Qing Manchu Horn Bow (清代大梢牛角戰弓): Pronounced wooden string-bridge slap (墊弦拍擊聲) + deep resonant thrum
   * - 85lb Heavy Frontier War Bow (八十五磅鐵力木重戰弓): Thunderous low-end boom ("霹靂弦驚"), heavy limb recoil, and fierce air-split whip
   */
  public playRelease(drawWeightLbs: number = this.currentDrawWeightLbs, tension: number = 1.0) {
    // Stop continuous breath-hold loop and emit martial release exhalation puff (撒放吐氣)
    this.stopBreathing(true);

    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const power = Math.max(0.45, Math.min(1.0, tension));

    // 1. Jade / Ivory Thumb Ring Click on Release (玉扳指脫弦脆響)
    const ringOsc = this.ctx.createOscillator();
    const ringGain = this.ctx.createGain();
    ringOsc.type = 'sine';
    ringOsc.frequency.setValueAtTime(2400, t);
    ringOsc.frequency.exponentialRampToValueAtTime(980, t + 0.022);
    ringGain.gain.setValueAtTime(0.14 * power, t);
    ringGain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
    ringOsc.connect(ringGain);
    ringGain.connect(this.ctx.destination);
    ringOsc.start(t);
    ringOsc.stop(t + 0.028);

    if (drawWeightLbs <= 50) {
      // === 45lb MING SILK-STRING BOW (絲弦清越錚鳴) ===
      // Fundamental bright silk twang
      const silkOsc = this.ctx.createOscillator();
      const silkGain = this.ctx.createGain();
      silkOsc.type = 'triangle';
      silkOsc.frequency.setValueAtTime(460 * power, t);
      silkOsc.frequency.exponentialRampToValueAtTime(115, t + 0.22);

      silkGain.gain.setValueAtTime(0.32 * power, t);
      silkGain.gain.exponentialRampToValueAtTime(0.001, t + 0.26);

      silkOsc.connect(silkGain);
      silkGain.connect(this.ctx.destination);
      silkOsc.start(t);
      silkOsc.stop(t + 0.28);

      // Harmonic overtone shimmer characteristic of twisted silk strings (絲弦泛音)
      const shimmerOsc = this.ctx.createOscillator();
      const shimmerGain = this.ctx.createGain();
      shimmerOsc.type = 'sine';
      shimmerOsc.frequency.setValueAtTime(920 * power, t);
      shimmerOsc.frequency.exponentialRampToValueAtTime(290, t + 0.16);

      shimmerGain.gain.setValueAtTime(0.16 * power, t);
      shimmerGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      shimmerOsc.connect(shimmerGain);
      shimmerGain.connect(this.ctx.destination);
      shimmerOsc.start(t);
      shimmerOsc.stop(t + 0.19);
    } else if (drawWeightLbs <= 72) {
      // === 65lb QING MANCHU HORN BOW (大梢墊弦拍擊與渾厚弦音) ===
      // Deep gut/sinew string fundamental
      const hornOsc = this.ctx.createOscillator();
      const hornGain = this.ctx.createGain();
      hornOsc.type = 'triangle';
      hornOsc.frequency.setValueAtTime(310 * power, t);
      hornOsc.frequency.exponentialRampToValueAtTime(62, t + 0.28);

      hornGain.gain.setValueAtTime(0.42 * power, t);
      hornGain.gain.exponentialRampToValueAtTime(0.001, t + 0.31);

      hornOsc.connect(hornGain);
      hornGain.connect(this.ctx.destination);
      hornOsc.start(t);
      hornOsc.stop(t + 0.32);

      // Signature Manchu String-Bridge Slap (弓弦拍擊骨木「弦墊」之清脆啪聲, ~18ms after release)
      const slapOsc = this.ctx.createOscillator();
      const slapGain = this.ctx.createGain();
      slapOsc.type = 'square';
      slapOsc.frequency.setValueAtTime(680, t + 0.018);
      slapOsc.frequency.exponentialRampToValueAtTime(160, t + 0.065);

      slapGain.gain.setValueAtTime(0.001, t);
      slapGain.gain.setValueAtTime(0.26 * power, t + 0.018);
      slapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

      slapOsc.connect(slapGain);
      slapGain.connect(this.ctx.destination);
      slapOsc.start(t + 0.018);
      slapOsc.stop(t + 0.075);
    } else {
      // === 85lb HEAVY FRONTIER IRON-WOOD WAR BOW (弓如霹靂弦驚 · 重弓沉雷破空) ===
      // Sub-bass limb shockwave thump
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(195 * power, t);
      subOsc.frequency.exponentialRampToValueAtTime(34, t + 0.34);

      subGain.gain.setValueAtTime(0.55 * power, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.36);

      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);
      subOsc.start(t);
      subOsc.stop(t + 0.38);

      // Heavy iron-wood & thick cord growl
      const growlOsc = this.ctx.createOscillator();
      const growlFilter = this.ctx.createBiquadFilter();
      const growlGain = this.ctx.createGain();
      growlOsc.type = 'sawtooth';
      growlOsc.frequency.setValueAtTime(240 * power, t);
      growlOsc.frequency.exponentialRampToValueAtTime(52, t + 0.25);

      growlFilter.type = 'lowpass';
      growlFilter.frequency.setValueAtTime(720, t);

      growlGain.gain.setValueAtTime(0.32 * power, t);
      growlGain.gain.exponentialRampToValueAtTime(0.001, t + 0.27);

      growlOsc.connect(growlFilter);
      growlFilter.connect(growlGain);
      growlGain.connect(this.ctx.destination);
      growlOsc.start(t);
      growlOsc.stop(t + 0.28);
    }

    // 2. High-speed air-shearing string whip (破空疾風噪聲，隨磅數調整頻段)
    const weightFactor = Math.max(0, Math.min(1, (drawWeightLbs - 45) / 40));
    const bufferSize = Math.floor(this.ctx.sampleRate * (0.075 + weightFactor * 0.035));
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] =
        (Math.random() * 2 - 1) *
        Math.exp(-i / (this.ctx.sampleRate * (0.018 + weightFactor * 0.012)));
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1650 - weightFactor * 650, t);
    noiseFilter.Q.setValueAtTime(1.4, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime((0.26 + weightFactor * 0.14) * power, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08 + weightFactor * 0.03);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    whiteNoise.start(t);
  }

  /**
   * Whistle of arrow fletching cutting through the air (鳴鏑 / 雕翎破空呼嘯)
   * Heavier war arrows produce a deeper, louder dual-tone aerodynamic howl.
   */
  public startArrowWhistle(speed: number, drawWeightLbs: number = this.currentDrawWeightLbs) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    this.stopArrowWhistle();

    const t = this.ctx.currentTime;
    const isHeavy = drawWeightLbs >= 60;

    this.whistleOsc = this.ctx.createOscillator();
    this.whistleGain = this.ctx.createGain();

    this.whistleOsc.type = 'sine';
    const baseFreq = Math.min(1900, (isHeavy ? 480 : 620) + speed * 14);
    this.whistleOsc.frequency.setValueAtTime(baseFreq, t);

    this.whistleGain.gain.setValueAtTime(0.01, t);
    this.whistleGain.gain.linearRampToValueAtTime(isHeavy ? 0.11 : 0.08, t + 0.06);

    this.whistleOsc.connect(this.whistleGain);

    // Add a fifth harmonic whistling overtone (鳴鏑雙音哨響) for heavy war bows
    if (isHeavy) {
      this.whistleHarmonicOsc = this.ctx.createOscillator();
      this.whistleHarmonicOsc.type = 'sine';
      this.whistleHarmonicOsc.frequency.setValueAtTime(baseFreq * 1.498, t);
      const harmGain = this.ctx.createGain();
      harmGain.gain.setValueAtTime(0.35, t);
      this.whistleHarmonicOsc.connect(harmGain);
      harmGain.connect(this.whistleGain);
      this.whistleHarmonicOsc.start(t);
    }

    this.whistleGain.connect(this.ctx.destination);
    this.whistleOsc.start(t);
  }

  public updateArrowWhistle(speed: number) {
    if (!this.whistleOsc || !this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const freq = Math.max(280, Math.min(2400, 480 + speed * 16));
    this.whistleOsc.frequency.setTargetAtTime(freq, t, 0.05);
    if (this.whistleHarmonicOsc) {
      this.whistleHarmonicOsc.frequency.setTargetAtTime(freq * 1.498, t, 0.05);
    }
  }

  public stopArrowWhistle() {
    if (this.whistleOsc && this.whistleGain && this.ctx) {
      const t = this.ctx.currentTime;
      try {
        this.whistleGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
        this.whistleOsc.stop(t + 0.05);
        if (this.whistleHarmonicOsc) {
          this.whistleHarmonicOsc.stop(t + 0.05);
        }
      } catch {
        // Safe cleanup
      }
      this.whistleOsc = null;
      this.whistleHarmonicOsc = null;
      this.whistleGain = null;
    }
  }

  /**
   * Target impact:
   * - Score 10 (中鵠): Deep leather penetration + bright bronze bell chime (金鐸清越) + ceremonial war drum beat
   * - Score 9 (穿正): Crisp target penetration + warm bronze bell chime
   * - Score 3-8: Solid leather & compressed straw target butt thud (貫革入侯聲)
   * - Score 0: Dry frontier earth / gravel thud (墜地入土聲)
   */
  public playImpact(score: number, drawWeightLbs: number = this.currentDrawWeightLbs) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    this.stopArrowWhistle();
    const t = this.ctx.currentTime;
    const weightBoost = Math.max(1.0, drawWeightLbs / 45);

    if (score === 0) {
      // Missed target -> Dry sandy earth impact thud
      const earthOsc = this.ctx.createOscillator();
      const earthGain = this.ctx.createGain();
      earthOsc.type = 'sine';
      earthOsc.frequency.setValueAtTime(95, t);
      earthOsc.frequency.exponentialRampToValueAtTime(28, t + 0.11);
      earthGain.gain.setValueAtTime(0.25, t);
      earthGain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
      earthOsc.connect(earthGain);
      earthGain.connect(this.ctx.destination);
      earthOsc.start(t);
      earthOsc.stop(t + 0.14);
      return;
    }

    // 1. Heavy leather & straw target butt thud (皮侯貫革悶響，隨弓重加深)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(155 / Math.sqrt(weightBoost), t);
    osc.frequency.exponentialRampToValueAtTime(32, t + 0.15);

    gain.gain.setValueAtTime(Math.min(0.6, 0.36 * weightBoost), t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.24);

    // 2. High-speed piercing leather/wood shaft impact crack
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.065);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.016));
    }
    const crack = this.ctx.createBufferSource();
    crack.buffer = noiseBuffer;
    const crackGain = this.ctx.createGain();
    crackGain.gain.setValueAtTime(Math.min(0.45, 0.28 * weightBoost), t);
    crackGain.gain.exponentialRampToValueAtTime(0.001, t + 0.065);

    crack.connect(crackGain);
    crackGain.connect(this.ctx.destination);
    crack.start(t);

    // 3. Resonant Bronze Bell / Chime (金鐸報彩) for 9 & 10 rings + Drum hit on 10-ring bullseye
    if (score >= 9) {
      const baseBellFreq = score === 10 ? 880 : 740;
      const partials = [1.0, 2.0, 2.76]; // Authentic bronze bell overtone ratios

      partials.forEach((ratio, idx) => {
        if (!this.ctx) return;
        const gongOsc = this.ctx.createOscillator();
        const gongGain = this.ctx.createGain();
        gongOsc.type = 'sine';
        gongOsc.frequency.setValueAtTime(baseBellFreq * ratio, t + 0.015);
        gongOsc.frequency.exponentialRampToValueAtTime(
          baseBellFreq * ratio * 0.994,
          t + (1.35 / (idx + 1))
        );

        const amp = (0.18 / (idx + 1)) * (score === 10 ? 1.25 : 0.9);
        gongGain.gain.setValueAtTime(0.001, t);
        gongGain.gain.linearRampToValueAtTime(amp, t + 0.025);
        gongGain.gain.exponentialRampToValueAtTime(0.0008, t + (1.35 / (idx + 1)));

        gongOsc.connect(gongGain);
        gongGain.connect(this.ctx.destination);
        gongOsc.start(t + 0.015);
        gongOsc.stop(t + (1.4 / (idx + 1)));
      });

      // Ceremonial bullseye drum accent (中鵠擊鼓助威)
      if (score === 10) {
        this.playDrum();
      }
    }
  }

  /**
   * Traditional martial drum roll (戰鼓 · 點將鼓)
   */
  public playDrum() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(125, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.38);

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.48);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.5);
  }
}

export const archeryAudio = new ArcheryAudioEngine();
