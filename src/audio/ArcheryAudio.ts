/**
 * Procedural Archery Audio Synthesizer
 * Uses Web Audio API to create authentic historical Chinese archery sound effects
 * with draw-weight-specific acoustics (45lb Silk-String vs. 65lb Manchu Siyah vs. 85lb Heavy War Bow),
 * dynamic rhythmic breathing, and Time-of-Day modulated Ming-Qing frontier environmental soundscapes.
 */

class ArcheryAudioEngine {
  private ctx: AudioContext | null = null;
  private whistleOsc: OscillatorNode | null = null;
  private whistleHarmonicOsc: OscillatorNode | null = null;
  private whistleGain: GainNode | null = null;

  // Dynamic Breathing & Heartbeat Audio Nodes (Airflow + Low-Frequency Rhythmic Diaphragm Resonance)
  private breathNoiseSource: AudioBufferSourceNode | null = null;
  private breathFilter: BiquadFilterNode | null = null;
  private breathGain: GainNode | null = null;
  private breathLowFilter: BiquadFilterNode | null = null;
  private breathLowGain: GainNode | null = null;
  private breathSubOsc: OscillatorNode | null = null;
  private breathSubFilter: BiquadFilterNode | null = null;
  private breathSubGain: GainNode | null = null;
  private isBreathingActive: boolean = false;
  private lastBreathPhase: number = 0;
  private lastHeartbeatTime: number = 0;

  // Dynamic Environmental Background Audio Nodes (Mountain Pass Howling Wind & Distant Garrison)
  private envNoiseSource: AudioBufferSourceNode | null = null;
  private envSubWindFilter: BiquadFilterNode | null = null;
  private envSubWindGain: GainNode | null = null;
  private envHowlFilter: BiquadFilterNode | null = null;
  private envHowlGain: GainNode | null = null;
  private envMasterGain: GainNode | null = null;
  private isAmbientRunning: boolean = false;
  private ambientTimerId: number | null = null;
  private ambientPhase: number = 0;

  // Tracked Environmental State for Time-of-Day & Wind Modulation
  private currentTimeOfDayProgress: number = 0.0; // 0.0 (Sunrise) -> 0.5 (Midday) -> 1.0 (Sunset)
  private currentWindSpeed: number = 1.8;         // m/s
  private currentPassIntensity: number = 0.25;    // 0.0 (Juyong Pass) -> 1.0 (Jiayuguan Pass)

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
      if (this.envMasterGain) {
        this.envMasterGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.08);
      }
    } else if (!muted) {
      this.initContext();
      if (!this.isAmbientRunning) {
        this.startAmbientSoundscape();
      } else {
        this.modulateAmbientNodes();
      }
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setBowDrawWeight(drawWeightLbs: number) {
    this.currentDrawWeightLbs = drawWeightLbs;
  }

  /**
   * Updates the environmental audio parameters (Time-of-Day phase, wind speed, and frontier pass elevation)
   * and smoothly modulates the background howling wind & distant garrison volume profiles.
   */
  public setAmbientEnvironment(
    timeOfDayProgress: number,
    windSpeed: number = this.currentWindSpeed,
    targetDistance: number = 30
  ) {
    this.currentTimeOfDayProgress = Math.max(0, Math.min(1, timeOfDayProgress));
    this.currentWindSpeed = Math.max(0.2, windSpeed);
    // Higher exam ranks (50m/80m/110m) sit at more exposed mountain/desert passes
    this.currentPassIntensity = Math.max(0, Math.min(1, (targetDistance - 30) / 80));

    if (!this.isMuted && this.ctx && this.ctx.state === 'running') {
      if (!this.isAmbientRunning) {
        this.startAmbientSoundscape();
      } else {
        this.modulateAmbientNodes();
      }
    }
  }

  /**
   * Initializes and starts the continuous procedural environmental background soundscape:
   * 1. Low-frequency mountain pass canyon wind rumble (山隘穿堂低頻風吟)
   * 2. Resonant battlement howling wind (城堞呼嘯風聲)
   * 3. Periodic distant frontier garrison events (遠處戍卒甲葉兵刃微鳴、演武火盆噼啪、戍樓晨鐘暮鼓)
   *    whose volume and frequency of occurrence modulate with the active Time-of-Day phase.
   */
  public startAmbientSoundscape() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || this.isAmbientRunning) return;

    const t = this.ctx.currentTime;

    // Generate a 5-second seamless brown/pink noise buffer for natural mountain wind
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * 5;
    const windBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = windBuffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.025 * white) / 1.025;
      // Crossfade loop ends smoothly
      const fadeEdge =
        i < sampleRate * 0.1
          ? i / (sampleRate * 0.1)
          : i > bufferSize - sampleRate * 0.1
          ? (bufferSize - i) / (sampleRate * 0.1)
          : 1.0;
      data[i] = lastOut * 2.4 * fadeEdge + white * 0.06;
    }

    this.envNoiseSource = this.ctx.createBufferSource();
    this.envNoiseSource.buffer = windBuffer;
    this.envNoiseSource.loop = true;

    // Layer A: Deep Low-Frequency Canyon Rumble (70Hz - 160Hz)
    this.envSubWindFilter = this.ctx.createBiquadFilter();
    this.envSubWindFilter.type = 'lowpass';
    this.envSubWindFilter.frequency.setValueAtTime(115, t);
    this.envSubWindFilter.Q.setValueAtTime(1.4, t);

    this.envSubWindGain = this.ctx.createGain();
    this.envSubWindGain.gain.setValueAtTime(0.04, t);

    // Layer B: Resonant Mountain Pass Howl (210Hz - 540Hz)
    this.envHowlFilter = this.ctx.createBiquadFilter();
    this.envHowlFilter.type = 'bandpass';
    this.envHowlFilter.frequency.setValueAtTime(280, t);
    this.envHowlFilter.Q.setValueAtTime(4.8, t);

    this.envHowlGain = this.ctx.createGain();
    this.envHowlGain.gain.setValueAtTime(0.015, t);

    // Master Environmental Bus
    this.envMasterGain = this.ctx.createGain();
    this.envMasterGain.gain.setValueAtTime(0.001, t);

    this.envNoiseSource.connect(this.envSubWindFilter);
    this.envSubWindFilter.connect(this.envSubWindGain);
    this.envSubWindGain.connect(this.envMasterGain);

    this.envNoiseSource.connect(this.envHowlFilter);
    this.envHowlFilter.connect(this.envHowlGain);
    this.envHowlGain.connect(this.envMasterGain);

    this.envMasterGain.connect(this.ctx.destination);
    this.envNoiseSource.start(t);
    this.isAmbientRunning = true;

    this.modulateAmbientNodes();

    // Start background scheduler for organic wind gusts & Time-of-Day garrison micro-events
    if (this.ambientTimerId !== null) {
      window.clearInterval(this.ambientTimerId);
    }
    this.ambientTimerId = window.setInterval(() => {
      this.tickAmbientSoundscape();
    }, 380);
  }

  /**
   * Computes Time-of-Day & Wind envelope weights and applies them to the environmental audio filters/gains:
   * - Sunrise (0.0 - 0.15): Cool misty pass drone, moderate wind howl, quiet awakening garrison
   * - Daytime Drill (0.2 - 0.65): Clearer breeze, active distant soldier armor/weapon clatter
   * - Golden Hour & Sunset (0.75 - 1.0): Intensified katabatic mountain pass howling wind + torch brazier crackle
   */
  private modulateAmbientNodes() {
    if (!this.ctx || !this.isAmbientRunning || this.isMuted) return;
    if (
      !this.envMasterGain ||
      !this.envSubWindFilter ||
      !this.envSubWindGain ||
      !this.envHowlFilter ||
      !this.envHowlGain
    ) {
      return;
    }

    const t = this.ctx.currentTime;
    const tod = this.currentTimeOfDayProgress;
    const windNorm = Math.min(1.5, this.currentWindSpeed / 5.0);

    // Time-of-Day wind intensity curve:
    // High in early dawn mist (0.0) and strongest during late afternoon / sunset mountain pass katabatic winds (0.8 - 1.0)
    const dawnMistFactor = Math.max(0, 1 - tod * 4.5); // 1.0 at 0.0 -> 0 at 0.22
    const duskGaleFactor = Math.max(0, (tod - 0.6) / 0.4); // 0 at 0.6 -> 1.0 at 1.0
    const todWindMultiplier = 0.72 + dawnMistFactor * 0.28 + duskGaleFactor * 0.55;

    // Slow organic gust undulation
    this.ambientPhase += 0.24;
    const gustWave = 0.5 + 0.5 * Math.sin(this.ambientPhase) * Math.cos(this.ambientPhase * 0.63);

    // 1. Sub-bass canyon wind drone
    const subCutoff = 85 + windNorm * 65 + duskGaleFactor * 30 + gustWave * 28;
    const subVol =
      (0.032 + windNorm * 0.048 + this.currentPassIntensity * 0.022) *
      todWindMultiplier *
      (0.82 + gustWave * 0.36);

    this.envSubWindFilter.frequency.setTargetAtTime(subCutoff, t, 0.32);
    this.envSubWindGain.gain.setTargetAtTime(Math.min(0.14, subVol), t, 0.32);

    // 2. Mountain pass resonant howling wind
    const howlFreq =
      215 +
      windNorm * 145 +
      this.currentPassIntensity * 60 +
      duskGaleFactor * 45 +
      Math.sin(this.ambientPhase * 1.3) * 55;
    const howlQ = 4.2 + duskGaleFactor * 2.2 + this.currentPassIntensity * 1.5;
    const howlVol =
      (0.01 + windNorm * 0.028 + this.currentPassIntensity * 0.014) *
      todWindMultiplier *
      (0.65 + gustWave * 0.65);

    this.envHowlFilter.frequency.setTargetAtTime(howlFreq, t, 0.35);
    this.envHowlFilter.Q.setTargetAtTime(howlQ, t, 0.35);
    this.envHowlGain.gain.setTargetAtTime(Math.min(0.075, howlVol), t, 0.35);

    // 3. Master environmental bus level (smoothly modulated by Time-of-Day)
    const masterLevel = 0.68 + dawnMistFactor * 0.15 + duskGaleFactor * 0.28;
    this.envMasterGain.gain.setTargetAtTime(masterLevel, t, 0.25);
  }

  /**
   * Periodic scheduler tick (every 380ms) that updates wind gust LFOs and triggers
   * subtle distant garrison audio cues whose likelihood and volume depend on the active Time-of-Day phase.
   */
  private tickAmbientSoundscape() {
    if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;

    this.modulateAmbientNodes();

    const tod = this.currentTimeOfDayProgress;
    // Daytime garrison drill activity curve: peaks between辰時 (0.2) and 午未 (0.65), quieter at dawn (0.0) & sunset (1.0)
    const daytimeActivity = Math.max(0.18, Math.sin(tod * Math.PI));
    // Evening / Golden-hour brazier fire activity: active when progress >= 0.72 or early dawn <= 0.1
    const brazierActivity = tod >= 0.72 ? (tod - 0.7) / 0.3 : tod <= 0.12 ? 0.35 : 0;

    // 1. Subtle clatter of distant soldiers at the frontier garrison (遠處戍卒鐵甲葉與兵仗輕鳴)
    if (Math.random() < 0.22 * daytimeActivity) {
      const soldierVol = (0.012 + Math.random() * 0.016) * daytimeActivity;
      this.playDistantSoldierClatter(soldierVol);
    }

    // 2. Torch brazier ember crackle during Golden Hour & Sunset (演武火盆柴火噼啪聲)
    if (brazierActivity > 0 && Math.random() < 0.28 * brazierActivity) {
      this.playBrazierCrackle(0.015 + brazierActivity * 0.02);
    }

    // 3. Occasional distant watchtower drum / cadence beat at dawn muster or dusk curfew (戍樓遠鼓)
    const isDawnOrDusk = tod <= 0.15 || tod >= 0.8;
    if (isDawnOrDusk && Math.random() < 0.045) {
      this.playDistantWatchDrum(tod >= 0.8 ? 0.035 : 0.028);
    }
  }

  /**
   * Synthesizes the subtle, spatially distant clatter of lamellar armor plates (鐵甲葉相擊)
   * and halberd/spear shafts from soldiers drilling at the frontier garrison courtyard.
   */
  private playDistantSoldierClatter(volume: number) {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;

    // Double or triple metallic armor-scale / polearm clink burst
    const hits = Math.random() < 0.45 ? 2 : 1;
    for (let h = 0; h < hits; h++) {
      const offset = h * (0.065 + Math.random() * 0.05);
      const isArmorClink = Math.random() < 0.65;

      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      // Lamellar iron plates (~1850-2650Hz) vs wooden spear shaft clack (~680-980Hz)
      const baseFreq = isArmorClink
        ? 1850 + Math.random() * 820
        : 680 + Math.random() * 320;

      osc.type = isArmorClink ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(baseFreq, t + offset);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.72, t + offset + 0.045);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(baseFreq * 0.9, t + offset);
      filter.Q.setValueAtTime(3.5, t + offset);

      const hitVol = volume * (h === 0 ? 1.0 : 0.65);
      gain.gain.setValueAtTime(0.0005, t + offset);
      gain.gain.linearRampToValueAtTime(hitVol, t + offset + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0005, t + offset + 0.055);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + offset);
      osc.stop(t + offset + 0.06);
    }
  }

  /**
   * Synthesizes warm pine-resin torch brazier ember pops during Golden Hour / Sunset
   */
  private playBrazierCrackle(volume: number) {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;

    const samples = Math.floor(this.ctx.sampleRate * 0.025);
    const buf = this.ctx.createBuffer(1, samples, this.ctx.sampleRate);
    const out = buf.getChannelData(0);
    for (let i = 0; i < samples; i++) {
      out[i] = (Math.random() * 2 - 1) * Math.exp(-i / (samples * 0.28));
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2400 + Math.random() * 1100, t);
    filter.Q.setValueAtTime(2.4, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.025);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    src.start(t);
  }

  /**
   * Synthesizes a muffled, distant watchtower drum beat across the mountain pass at dawn or dusk
   */
  private playDistantWatchDrum(volume: number) {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(92, t);
    osc.frequency.exponentialRampToValueAtTime(46, t + 0.26);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.32);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.34);
  }

  /**
   * Synthesizes a transient, high-intensity frontier wind gust surge (突發狂飆 · 陣風呼嘯聲)
   * when the stochastic Wind Gust event generator triggers a sudden shift in wind speed and direction.
   */
  public playWindGustSurge(gustSpeed: number, intensity: number = 0.8) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.isAmbientRunning) {
      this.startAmbientSoundscape();
    }
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const duration = 1.65;
    const normSpeed = Math.max(0.3, Math.min(1.0, gustSpeed / 6.5));
    const amp = Math.min(0.16, (0.045 + normSpeed * 0.065) * Math.max(0.5, intensity));

    const sampleRate = this.ctx.sampleRate;
    const samples = Math.floor(sampleRate * (duration + 0.1));
    const gustBuffer = this.ctx.createBuffer(1, samples, sampleRate);
    const data = gustBuffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < samples; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.04 * white) / 1.04;
      data[i] = lastOut * 2.8;
    }

    // 1. Resonant canyon wind-shear howl (whistling bandpass sweep)
    const srcHowl = this.ctx.createBufferSource();
    srcHowl.buffer = gustBuffer;

    const howlFilter = this.ctx.createBiquadFilter();
    howlFilter.type = 'bandpass';
    howlFilter.frequency.setValueAtTime(190, t);
    howlFilter.frequency.exponentialRampToValueAtTime(480 + normSpeed * 220, t + 0.45);
    howlFilter.frequency.exponentialRampToValueAtTime(210, t + duration);
    howlFilter.Q.setValueAtTime(5.2, t);

    const howlGain = this.ctx.createGain();
    howlGain.gain.setValueAtTime(0.0005, t);
    howlGain.gain.linearRampToValueAtTime(amp * 0.85, t + 0.35);
    howlGain.gain.exponentialRampToValueAtTime(0.0005, t + duration);

    srcHowl.connect(howlFilter);
    howlFilter.connect(howlGain);
    howlGain.connect(this.ctx.destination);
    srcHowl.start(t);
    srcHowl.stop(t + duration + 0.05);

    // 2. Low-frequency pressure rush across the shooting platform (低頻朔風壓迫感)
    const srcSub = this.ctx.createBufferSource();
    srcSub.buffer = gustBuffer;

    const subFilter = this.ctx.createBiquadFilter();
    subFilter.type = 'lowpass';
    subFilter.frequency.setValueAtTime(110, t);
    subFilter.frequency.linearRampToValueAtTime(240 + normSpeed * 90, t + 0.4);
    subFilter.frequency.linearRampToValueAtTime(95, t + duration);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.0005, t);
    subGain.gain.linearRampToValueAtTime(amp * 1.15, t + 0.3);
    subGain.gain.exponentialRampToValueAtTime(0.0005, t + duration);

    srcSub.connect(subFilter);
    subFilter.connect(subGain);
    subGain.connect(this.ctx.destination);
    srcSub.start(t);
    srcSub.stop(t + duration + 0.05);
  }

  /**
   * Starts the continuous procedural airflow and low-frequency diaphragm resonance nodes
   * used for dynamic rhythmic breathing while drawing and holding the bow.
   */
  public startBreathing() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.isAmbientRunning) {
      this.startAmbientSoundscape();
    }
    if (!this.ctx || this.isBreathingActive) return;

    const t = this.ctx.currentTime;
    // Create a 3-second loopable pink/brown-tinted airflow noise buffer
    const bufferSize = this.ctx.sampleRate * 3;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0,
      b1 = 0,
      b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.997 * b0 + white * 0.029;
      b1 = 0.985 * b1 + white * 0.032;
      b2 = 0.95 * b2 + white * 0.045;
      output[i] = (b0 + b1 + b2 + white * 0.08) * 1.6;
    }

    this.breathNoiseSource = this.ctx.createBufferSource();
    this.breathNoiseSource.buffer = noiseBuffer;
    this.breathNoiseSource.loop = true;

    // 1. Mid-frequency respiratory airflow layer (nasal/tracheal formant)
    this.breathFilter = this.ctx.createBiquadFilter();
    this.breathFilter.type = 'bandpass';
    this.breathFilter.frequency.setValueAtTime(520, t);
    this.breathFilter.Q.setValueAtTime(3.2, t);

    this.breathGain = this.ctx.createGain();
    this.breathGain.gain.setValueAtTime(0.001, t);

    this.breathNoiseSource.connect(this.breathFilter);
    this.breathFilter.connect(this.breathGain);
    this.breathGain.connect(this.ctx.destination);

    // 2. Low-frequency chest/diaphragm breath resonance filter (75Hz–210Hz)
    this.breathLowFilter = this.ctx.createBiquadFilter();
    this.breathLowFilter.type = 'lowpass';
    this.breathLowFilter.frequency.setValueAtTime(115, t);
    this.breathLowFilter.Q.setValueAtTime(2.6, t);

    this.breathLowGain = this.ctx.createGain();
    this.breathLowGain.gain.setValueAtTime(0.001, t);

    this.breathNoiseSource.connect(this.breathLowFilter);
    this.breathLowFilter.connect(this.breathLowGain);
    this.breathLowGain.connect(this.ctx.destination);

    // 3. Sub-diaphragmatic rhythmic oscillator (52Hz–135Hz Dantian harmonic hum)
    this.breathSubOsc = this.ctx.createOscillator();
    this.breathSubOsc.type = 'triangle';
    this.breathSubOsc.frequency.setValueAtTime(68, t);

    this.breathSubFilter = this.ctx.createBiquadFilter();
    this.breathSubFilter.type = 'lowpass';
    this.breathSubFilter.frequency.setValueAtTime(150, t);
    this.breathSubFilter.Q.setValueAtTime(1.4, t);

    this.breathSubGain = this.ctx.createGain();
    this.breathSubGain.gain.setValueAtTime(0.001, t);

    this.breathSubOsc.connect(this.breathSubFilter);
    this.breathSubFilter.connect(this.breathSubGain);
    this.breathSubGain.connect(this.ctx.destination);

    this.breathNoiseSource.start(t);
    this.breathSubOsc.start(t);
    this.isBreathingActive = true;
    this.lastBreathPhase = 0;
    this.lastHeartbeatTime = 0;
  }

  /**
   * Updates the rhythmic breathing sound and somatic heartbeat in real time,
   * modulating both volume and pitch based on `drawTension` (0..1) and `isDeepBreath`,
   * alongside `breathSeconds`, `staminaPercent`, and `isFatigued`:
   * - Draw Tension Scaling (0.0 -> 1.0): Volume and base pitch swell with bow tension as the ribcage and diaphragm compress under load.
   * - Deep Breath Hold (`isDeepBreath = true`, Spacebar held): Upper airflow hushes while low-frequency Dantian resonance shifts down in pitch (~54–76Hz) and swells in warm sub-bass volume with a slow, grounded rhythm.
   * - Optimal Focus Window (1.2s–3.5s): Calm, centered rhythmic inhalation/exhalation cycle.
   * - Low Stamina / Fatigue (>3.5s or staminaPercent < 0.35): Strained, rapid heavy gasps + accelerating double-thump heartbeat.
   */
  public updateBreathing(
    breathSeconds: number,
    staminaPercent: number,
    isFatigued: boolean,
    isDeepBreath: boolean = false,
    drawTension: number = 1.0
  ) {
    if (this.isMuted) return;
    if (!this.isBreathingActive) {
      this.startBreathing();
    }
    if (!this.ctx || !this.breathFilter || !this.breathGain) return;

    const t = this.ctx.currentTime;
    const clampedTension = Math.max(0, Math.min(1, drawTension));
    // Smooth non-linear volume envelope scaled by bow draw tension (0..1)
    const tensionVolumeScale = 0.25 + 0.75 * Math.pow(clampedTension, 0.85);
    // Upward pitch shift as physical draw tension increases across the bow limbs
    const tensionPitchShift = clampedTension * 90;
    const lowTensionPitchShift = clampedTension * 28;

    const lowStaminaFactor = staminaPercent < 0.4 ? (0.4 - staminaPercent) / 0.4 : 0;
    const fatigueSeverity = isFatigued ? Math.min(1.0, 0.5 + (breathSeconds - 3.8) * 0.35) : 0;
    const strainLevel = Math.min(1.0, lowStaminaFactor * 0.65 + fatigueSeverity * 0.85);

    // 1. Rhythmic Breath Cadence (Inhale / Exhale formant, pitch & volume modulation)
    const cadenceSpeed = isFatigued
      ? 6.2
      : staminaPercent < 0.35
      ? 4.4
      : isDeepBreath
      ? 1.35
      : 1.85 + clampedTension * 0.75;
    this.lastBreathPhase += cadenceSpeed * 0.016;
    const wave = Math.sin(this.lastBreathPhase); // > 0 inhale, < 0 exhale
    const cycleIntensity = Math.pow(Math.abs(wave), 0.75);

    let targetGain = 0.025;
    let targetFreq = 540;
    let targetQ = 3.2;

    // Low-frequency diaphragm resonance & sub-oscillator targets
    let lowTargetGain = 0.028;
    let lowTargetFreq = 120;
    let lowTargetQ = 2.6;
    let subTargetGain = 0.018;
    let subTargetFreq = 72;

    if (isDeepBreath && !isFatigued) {
      // Deep Breath Hold (屏息凝神): upper airflow hushed while low-frequency Dantian breath drops in pitch and swells in sub-bass volume
      targetGain = (0.003 + cycleIntensity * 0.004) * tensionVolumeScale;
      targetFreq = 210 + tensionPitchShift * 0.45 + cycleIntensity * 35;
      targetQ = 5.2;

      lowTargetGain = (0.052 + cycleIntensity * 0.042) * tensionVolumeScale;
      lowTargetFreq = 82 + lowTensionPitchShift * 0.75 + (wave >= 0 ? cycleIntensity * 24 : cycleIntensity * 12);
      lowTargetQ = 3.6;

      subTargetGain = (0.04 + cycleIntensity * 0.035) * tensionVolumeScale;
      subTargetFreq = 54 + clampedTension * 14 + (wave >= 0 ? cycleIntensity * 8 : -cycleIntensity * 4);
    } else if (breathSeconds < 1.2) {
      // Deep initial draw inhalation (吸氣蓄力): pitch and volume climb with drawTension
      const inhaleEnv = Math.sin((breathSeconds / 1.2) * Math.PI);
      targetGain = (0.018 + 0.045 * inhaleEnv) * tensionVolumeScale;
      targetFreq = 430 + tensionPitchShift + inhaleEnv * 190;
      targetQ = 2.8;

      lowTargetGain = (0.025 + 0.045 * inhaleEnv) * tensionVolumeScale;
      lowTargetFreq = 105 + lowTensionPitchShift + inhaleEnv * 55;
      lowTargetQ = 2.4;

      subTargetGain = (0.018 + 0.03 * inhaleEnv) * tensionVolumeScale;
      subTargetFreq = 66 + clampedTension * 24 + inhaleEnv * 18;
    } else if (!isFatigued && staminaPercent >= 0.35) {
      // Optimal stable stamina window: calm, centered, meditative breathing rhythm modulated by drawTension
      targetGain = (0.016 + cycleIntensity * 0.032) * tensionVolumeScale;
      targetFreq =
        (wave >= 0 ? 470 + cycleIntensity * 130 : 350 + cycleIntensity * 85) + tensionPitchShift;
      targetQ = 3.6;

      lowTargetGain = (0.024 + cycleIntensity * 0.036) * tensionVolumeScale;
      lowTargetFreq =
        (wave >= 0 ? 115 + cycleIntensity * 42 : 95 + cycleIntensity * 25) + lowTensionPitchShift;
      lowTargetQ = 2.8;

      subTargetGain = (0.016 + cycleIntensity * 0.026) * tensionVolumeScale;
      subTargetFreq =
        68 + clampedTension * 22 + (wave >= 0 ? cycleIntensity * 14 : -cycleIntensity * 6);
    } else {
      // Low stamina / fatigued: heavy, strained, rapid gasping breath with elevated pitch & chest throb
      targetGain =
        (0.045 + strainLevel * 0.085) * (0.35 + cycleIntensity * 0.65) * tensionVolumeScale;
      targetFreq =
        (wave >= 0
          ? 620 + strainLevel * 380 * cycleIntensity
          : 430 + strainLevel * 240 * cycleIntensity) + tensionPitchShift;
      targetQ = 2.0 - strainLevel * 0.6;

      lowTargetGain =
        (0.038 + strainLevel * 0.055) * (0.4 + cycleIntensity * 0.6) * tensionVolumeScale;
      lowTargetFreq = 135 + lowTensionPitchShift + strainLevel * 65 * cycleIntensity;
      lowTargetQ = 2.2;

      subTargetGain = (0.024 + strainLevel * 0.032) * cycleIntensity * tensionVolumeScale;
      subTargetFreq = 78 + clampedTension * 26 + strainLevel * 28 * cycleIntensity;
    }

    this.breathGain.gain.setTargetAtTime(targetGain, t, 0.04);
    this.breathFilter.frequency.setTargetAtTime(targetFreq, t, 0.04);
    this.breathFilter.Q.setTargetAtTime(Math.max(1.1, targetQ), t, 0.04);

    if (this.breathLowGain && this.breathLowFilter) {
      this.breathLowGain.gain.setTargetAtTime(lowTargetGain, t, 0.045);
      this.breathLowFilter.frequency.setTargetAtTime(lowTargetFreq, t, 0.045);
      this.breathLowFilter.Q.setTargetAtTime(lowTargetQ, t, 0.045);
    }

    if (this.breathSubGain && this.breathSubOsc && this.breathSubFilter) {
      this.breathSubGain.gain.setTargetAtTime(subTargetGain, t, 0.05);
      this.breathSubOsc.frequency.setTargetAtTime(subTargetFreq, t, 0.05);
      this.breathSubFilter.frequency.setTargetAtTime(
        isDeepBreath ? 125 : 155 + clampedTension * 40,
        t,
        0.05
      );
    }

    // 2. Somatic Heartbeat Pulse ("Lub-Dub" 胸腔心跳共鳴)
    const heartInterval = isFatigued
      ? Math.max(0.36, 0.52 - fatigueSeverity * 0.14)
      : staminaPercent < 0.4
      ? 0.68 - lowStaminaFactor * 0.16
      : isDeepBreath
      ? 0.74
      : 0.92 - clampedTension * 0.08;

    if (breathSeconds - this.lastHeartbeatTime >= heartInterval) {
      this.lastHeartbeatTime = breathSeconds;
      const baseStrength = isFatigued
        ? 0.22 + fatigueSeverity * 0.14
        : staminaPercent < 0.4
        ? 0.11 + lowStaminaFactor * 0.1
        : 0.055 + clampedTension * 0.025;
      const pulseStrength = isDeepBreath && !isFatigued ? baseStrength + 0.065 : baseStrength;
      this.playHeartbeatPulse(pulseStrength);
    }
  }

  /**
   * Plays a focused deep-inhale lock cue when engaging 'Deep Breath' (屏息凝神)
   * or a controlled release breath when disengaging
   */
  public playDeepBreathEngage(engaging: boolean) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const duration = engaging ? 0.28 : 0.2;
    const sampleCount = Math.floor(this.ctx.sampleRate * duration);
    const buf = this.ctx.createBuffer(1, sampleCount, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < sampleCount; i++) {
      const env = Math.sin((i / sampleCount) * Math.PI);
      data[i] = (Math.random() * 2 - 1) * env * 0.35;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(engaging ? 4.2 : 2.8, t);
    if (engaging) {
      filter.frequency.setValueAtTime(340, t);
      filter.frequency.exponentialRampToValueAtTime(580, t + duration * 0.7);
      filter.frequency.exponentialRampToValueAtTime(260, t + duration);
    } else {
      filter.frequency.setValueAtTime(480, t);
      filter.frequency.exponentialRampToValueAtTime(240, t + duration);
    }

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(engaging ? 0.065 : 0.045, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(t);

    if (engaging) {
      // Subtle low Dantian focus lock resonance
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(92, t);
      subOsc.frequency.exponentialRampToValueAtTime(52, t + 0.22);

      subGain.gain.setValueAtTime(0.001, t);
      subGain.gain.linearRampToValueAtTime(0.08, t + 0.03);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);
      subOsc.start(t);
      subOsc.stop(t + 0.25);
    }
  }

  /**
   * Stops the continuous breathing nodes, optionally emitting a crisp release exhalation puff (發矢吐氣聲)
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

          if (this.breathLowFilter && this.breathLowGain) {
            this.breathLowFilter.frequency.setValueAtTime(160, t);
            this.breathLowFilter.frequency.exponentialRampToValueAtTime(75, t + 0.16);
            this.breathLowGain.gain.setValueAtTime(0.055, t);
            this.breathLowGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
          }

          if (this.breathSubOsc && this.breathSubGain) {
            this.breathSubOsc.frequency.setValueAtTime(88, t);
            this.breathSubOsc.frequency.exponentialRampToValueAtTime(48, t + 0.16);
            this.breathSubGain.gain.setValueAtTime(0.04, t);
            this.breathSubGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
            this.breathSubOsc.stop(t + 0.19);
          }

          this.breathNoiseSource.stop(t + 0.19);
        } else {
          this.breathGain.gain.setTargetAtTime(0.0001, t, 0.03);
          this.breathLowGain?.gain.setTargetAtTime(0.0001, t, 0.03);
          this.breathSubGain?.gain.setTargetAtTime(0.0001, t, 0.03);
          this.breathSubOsc?.stop(t + 0.08);
          this.breathNoiseSource.stop(t + 0.08);
        }
      } catch {
        // Safe cleanup
      }
    }
    this.breathNoiseSource = null;
    this.breathFilter = null;
    this.breathGain = null;
    this.breathLowFilter = null;
    this.breathLowGain = null;
    this.breathSubOsc = null;
    this.breathSubFilter = null;
    this.breathSubGain = null;
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
    if (!this.isAmbientRunning) {
      this.startAmbientSoundscape();
    }
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
   */
  public playDrawTension(intensity: number, drawWeightLbs: number = this.currentDrawWeightLbs) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.isAmbientRunning) {
      this.startAmbientSoundscape();
    }
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    const weightRatio = Math.max(0, Math.min(1, (drawWeightLbs - 45) / 40)); // 0 (45lb) -> 1 (85lb)
    const startFreq = 78 - weightRatio * 30 + intensity * (45 - weightRatio * 12);
    const endFreq = 165 - weightRatio * 55 + intensity * 50;

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
   * Tactile jade/horn thumb-ring rotation click & silk-string micro-friction when adjusting
   * the manual thumb-draw release angle (扳指控弦微調聲；若合於正法決角則帶玉鳴清音)
   */
  public playThumbRingAdjust(isOptimal: boolean = false) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // 1. Subtle jade ring against silk bowstring click
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isOptimal ? 2650 : 1680, t);
    osc.frequency.exponentialRampToValueAtTime(isOptimal ? 1320 : 620, t + 0.028);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(isOptimal ? 0.075 : 0.045, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.032);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.035);

    // 2. Resonant jade harmonic chime when entering the crisp release sweet spot (玉決合度清音)
    if (isOptimal) {
      const chimeOsc = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();
      chimeOsc.type = 'sine';
      chimeOsc.frequency.setValueAtTime(3120, t + 0.01);
      chimeOsc.frequency.exponentialRampToValueAtTime(2480, t + 0.09);

      chimeGain.gain.setValueAtTime(0.001, t + 0.01);
      chimeGain.gain.linearRampToValueAtTime(0.04, t + 0.02);
      chimeGain.gain.exponentialRampToValueAtTime(0.0005, t + 0.095);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(this.ctx.destination);
      chimeOsc.start(t + 0.01);
      chimeOsc.stop(t + 0.1);
    }
  }

  /**
   * Distinct Historical Bow Release Acoustics based on Draw Weight (lbs), Tension & Thumb-Ring Clearance Error
   */
  public playRelease(
    drawWeightLbs: number = this.currentDrawWeightLbs,
    tension: number = 1.0,
    angleErrorDeg: number = 0
  ) {
    // Stop continuous breath-hold loop and emit martial release exhalation puff (撒放吐氣)
    this.stopBreathing(true);

    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const power = Math.max(0.45, Math.min(1.0, tension));
    const isCrisp = Math.abs(angleErrorDeg) <= 3.5;

    // 1. Jade / Ivory Thumb Ring Click on Release (玉扳指脫弦脆響)
    const ringOsc = this.ctx.createOscillator();
    const ringGain = this.ctx.createGain();
    ringOsc.type = 'sine';
    ringOsc.frequency.setValueAtTime(isCrisp ? 2680 : 1950, t);
    ringOsc.frequency.exponentialRampToValueAtTime(isCrisp ? 1120 : 760, t + 0.024);
    ringGain.gain.setValueAtTime((isCrisp ? 0.16 : 0.11) * power, t);
    ringGain.gain.exponentialRampToValueAtTime(0.001, t + 0.028);
    ringOsc.connect(ringGain);
    ringGain.connect(this.ctx.destination);
    ringOsc.start(t);
    ringOsc.stop(t + 0.03);

    // 1b. Wooden Shaft-Slap Clack against Bow Pass if thumb release is poorly angled (滯弦擦弝木擊聲)
    if (Math.abs(angleErrorDeg) > 4.5) {
      const slapOsc = this.ctx.createOscillator();
      const slapGain = this.ctx.createGain();
      slapOsc.type = 'square';
      slapOsc.frequency.setValueAtTime(520, t + 0.012);
      slapOsc.frequency.exponentialRampToValueAtTime(140, t + 0.048);
      slapGain.gain.setValueAtTime(0.09 * power, t + 0.012);
      slapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.052);
      slapOsc.connect(slapGain);
      slapGain.connect(this.ctx.destination);
      slapOsc.start(t + 0.012);
      slapOsc.stop(t + 0.055);
    }

    if (drawWeightLbs <= 50) {
      // === 45lb MING SILK-STRING BOW (絲弦清越錚鳴) ===
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
   * Target impact acoustics
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
          t + 1.35 / (idx + 1)
        );

        const amp = (0.18 / (idx + 1)) * (score === 10 ? 1.25 : 0.9);
        gongGain.gain.setValueAtTime(0.001, t);
        gongGain.gain.linearRampToValueAtTime(amp, t + 0.025);
        gongGain.gain.exponentialRampToValueAtTime(0.0008, t + 1.35 / (idx + 1));

        gongOsc.connect(gongGain);
        gongGain.connect(this.ctx.destination);
        gongOsc.start(t + 0.015);
        gongOsc.stop(t + 1.4 / (idx + 1));
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
