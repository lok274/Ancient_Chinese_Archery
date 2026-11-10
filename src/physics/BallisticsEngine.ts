import * as THREE from 'three';
import { BowConfig, ShotResult, WindState, ThumbGripState } from '../types/archery';

export interface ArrowFlightState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  orientation: THREE.Quaternion;
  flightTime: number;
  distanceTraveled: number;
  initialSpeed: number;
  isStuck: boolean;
  stuckPosition?: THREE.Vector3;
  stuckNormal?: THREE.Vector3;
  stuckScore?: number;
  wobbleIntensity?: number;
  turbulencePhase?: number;
  turbulenceFactor?: number;
  fishtailYawOffset?: number;
  fishtailPitchOffset?: number;
  thumbAngleDeg?: number;
  gripTechniqueLabel?: string;
}

export interface TargetCollisionPlane {
  center: THREE.Vector3;
  normal: THREE.Vector3;
  radius: THREE.Vector3 | number; // radius in meters
  bullseyeCenter: THREE.Vector3;
}

export interface WindageCalculation {
  /** Predicted total horizontal drift at target plane in centimeters (+ = Right, - = Left) */
  driftXCm: number;
  /** Predicted total vertical deviation at target plane relative to sight zero in centimeters (+ = High, - = Low) */
  driftYCm: number;
  /** Pure aerodynamic wind horizontal drift in centimeters (+ = Right, - = Left) */
  pureWindDriftXCm: number;
  /** Required manual horizontal aim offset in centimeters (-driftXCm: negative = aim Left, positive = aim Right) */
  requiredAimXCm: number;
  /** Required manual vertical aim offset in centimeters (-driftYCm: positive = aim High, negative = aim Low) */
  requiredAimYCm: number;
  /** Crosswind velocity component in m/s (+ = Left-to-Right, - = Right-to-Left) */
  crosswindSpeed: number;
  /** Longitudinal wind velocity component in m/s (+ = Headwind, - = Tailwind) */
  headwindSpeed: number;
  /** Lateral drift expressed in target rings (0 to 10 scale) */
  ringOffset: number;
  /** Estimated time of flight to target in seconds */
  estimatedFlightTime: number;
  /** Crosswind turbulence margin in centimeters (±cm) at high wind speeds */
  turbulenceMarginCm: number;
  /** Active thumb-ring grip & release clearance effect */
  gripEffect: ThumbGripState;
}

export class BallisticsEngine {
  // Physical Constants
  private static readonly GRAVITY = new THREE.Vector3(0, -9.81, 0);
  private static readonly AIR_DENSITY = 1.225; // kg/m^3
  private static readonly DRAG_COEFFICIENT = 1.35; // Axial drag coefficient
  private static readonly ARROW_CROSS_SECTION = 0.00012; // m^2 (approx 8.5mm shaft head-on)
  // Lateral crosswind pressure coefficient on arrow shaft + 3 eagle feather fletchings (N per m/s)
  private static readonly LATERAL_WINDAGE_COEFF = 0.0165;

  // Reusable vectors/quaternions to avoid per-frame GC allocations
  private static readonly _vRel = new THREE.Vector3();
  private static readonly _fDrag = new THREE.Vector3();
  private static readonly _fTurb = new THREE.Vector3();
  private static readonly _accel = new THREE.Vector3();
  private static readonly _prevPos = new THREE.Vector3();
  private static readonly _rayDir = new THREE.Vector3();
  private static readonly _ray = new THREE.Ray();
  private static readonly _plane = new THREE.Plane();
  private static readonly _intersect = new THREE.Vector3();
  private static readonly _oscQuat = new THREE.Quaternion();
  private static readonly _oscEuler = new THREE.Euler(0, 0, 0, 'YXZ');

  /**
   * Computes a normalized [0, 1.5] Crosswind Turbulence Factor based on total wind speed
   * and lateral crosswind shear across the frontier battlements.
   */
  public static computeTurbulenceFactor(windVector: THREE.Vector3): number {
    const windSpeed = windVector.length();
    if (windSpeed <= 1.2) return 0;

    // Crosswind shear component (perpendicular to the -Z shooting axis) amplifies vortex shedding
    const crossRatio = Math.min(1.0, Math.abs(windVector.x) / Math.max(0.001, windSpeed));
    const speedFactor = Math.pow(Math.max(0, (windSpeed - 1.2) / 5.5), 1.3);

    return speedFactor * (0.55 + crossRatio * 0.65);
  }

  /**
   * Computes the base vertical sight zeroing pitch (in radians) for a given target distance and bow
   * in calm conditions, compensating ~86% of pure gravity drop so the target remains well within
   * the central sight picture while still requiring a subtle manual elevation holdover.
   */
  public static computeBaseSightElevationRad(
    targetDistance: number,
    initialVelocity: number,
    arrowMassKg: number
  ): number {
    const dist = Math.max(10, targetDistance - 0.15);
    // Approximate calm-air flight time including quadratic axial drag deceleration
    const dragFactor =
      (0.5 *
        this.AIR_DENSITY *
        this.DRAG_COEFFICIENT *
        this.ARROW_CROSS_SECTION *
        dist) /
      Math.max(0.02, arrowMassKg);
    const avgSpeed = initialVelocity / (1 + 0.5 * dragFactor);
    const flightTime = dist / Math.max(20, avgSpeed);
    const totalGravityDrop = 0.5 * 9.81 * flightTime * flightTime;

    // Leave a realistic manual holdover requirement (~10cm at 30m up to ~28cm at 110m)
    const manualHoldoverMeters = Math.min(0.32, 0.06 + targetDistance * 0.002);
    const compensatedDrop = Math.max(0, totalGravityDrop - manualHoldoverMeters);

    return Math.atan2(compensatedDrop, dist);
  }

  /**
   * Computes the ideal thumb-draw release twist angle (正法決角) in degrees for a given bow draw weight.
   * Heavier Ming-Qing composite horn bows require a crisper outward thumb-ring twist & bow-wrist khatra
   * (後手轉決、前手撇弓) to clear the right-side arrow pass without shaft slap.
   */
  public static getOptimalThumbAngleDeg(bow: BowConfig, drawTension: number = 1.0): number {
    // 45lb -> 14°, 65lb -> 18°, 85lb -> 22°
    const baseAngle = 14 + ((bow.drawWeightLbs - 45) / 40) * 8;
    const tensionScale = 0.85 + 0.15 * Math.max(0.45, Math.min(1.0, drawTension));
    return Math.round(baseAngle * tensionScale);
  }

  /**
   * Simulates the technical biomechanics of traditional Chinese thumb-ring archery (蒙古式拇指扣弦 / 玉扳指撒放):
   * - Arrow rests on the right side of the bow handle (右搭箭).
   * - Under-rotated thumb ring (angle < optimal - 3.5°) causes string hook drag (滯弦) and shaft slap against
   *   the bow handle (括羽擦弝), deflecting the arrow rightward (+X) and dragging elevation down (-Y).
   * - Crisp thumb twist & wrist khatra (|angle - optimal| <= 3.5°) achieves clean arrow-pass clearance (中正斷弦).
   * - Over-torqued release (angle > optimal + 3.5°) over-corrects and kicks the arrow leftward (-X).
   */
  public static calculateThumbGripEffect(
    thumbAngleDeg: number,
    bow: BowConfig,
    targetDistance: number,
    drawTension: number = 1.0
  ): ThumbGripState {
    const optimalAngleDeg = this.getOptimalThumbAngleDeg(bow, drawTension);
    const angleErrorDeg = thumbAngleDeg - optimalAngleDeg;
    const isCrispRelease = Math.abs(angleErrorDeg) <= 3.5;

    // Distance scaling factor (normalized around 50m)
    const distScale = Math.max(0.55, targetDistance / 50);
    // Heavier bows magnify thumb-ring clearance errors
    const weightScale = 0.85 + ((bow.drawWeightLbs - 45) / 40) * 0.45;

    let clearanceDriftXCm = 0;
    let clearanceDriftYCm = 0;
    let techniqueLabel = '中正斷弦 · 箭不擦弝';

    if (isCrispRelease) {
      // Within sweet spot: minimal micro-deflection, crisp clearance
      clearanceDriftXCm = -angleErrorDeg * 0.35 * distScale;
      clearanceDriftYCm = 0;
      techniqueLabel =
        Math.abs(angleErrorDeg) <= 1.2
          ? '完美過響片 · 撒放乾淨利落'
          : '標準靠位撒放 · 箭身零擦碰';
    } else if (angleErrorDeg < -3.5) {
      const excess = Math.abs(angleErrorDeg) - 3.5;
      clearanceDriftXCm = (1.2 + excess * 1.65) * distScale * weightScale;
      clearanceDriftYCm = -(0.6 + excess * 0.55) * distScale * weightScale;
      techniqueLabel =
        angleErrorDeg < -12
          ? '撒放勾弦滯留 · 箭尾擦把偏右'
          : '手指鬆弦稍慢 · 微偏右方';
    } else {
      const excess = angleErrorDeg - 3.5;
      clearanceDriftXCm = -(1.2 + excess * 1.55) * distScale * weightScale;
      clearanceDriftYCm = (0.35 + excess * 0.35) * distScale;
      techniqueLabel =
        angleErrorDeg > 12
          ? '前手推把過猛 · 大幅偏左'
          : '撒放外撇稍大 · 微偏左方';
    }

    return {
      thumbAngleDeg,
      optimalAngleDeg,
      angleErrorDeg,
      clearanceDriftXCm,
      clearanceDriftYCm,
      techniqueLabel,
      isCrispRelease,
    };
  }

  /**
   * Deterministic Windage & Thumb-Grip Clearance Calculation: simulates arrow trajectory under current
   * windState and player's thumb-draw release angle to compute exact lateral drift (cm) and vertical drop (cm)
   * at the target plane, informing the player how far off-center to aim or how to tune their thumb grip.
   */
  public static calculateWindage(
    windState: WindState,
    targetDistance: number,
    targetRadius: number,
    bow: BowConfig,
    drawTension: number = 1.0,
    thumbAngleDeg?: number
  ): WindageCalculation {
    const effectiveTension = Math.max(0.45, Math.min(1.0, drawTension));
    const launchSpeed = bow.initialVelocity * (0.6 + effectiveTension * 0.4);
    const arrowMassKg = (bow.arrowMassGrams || 35) / 1000;

    const wx = Math.sin(windState.directionAngle) * windState.speed;
    const wz = Math.cos(windState.directionAngle) * windState.speed;
    const windVec = new THREE.Vector3(wx, 0, wz);

    // Launch from bullseye-aligned origin (0, 1.60, 0) with base sight elevation
    const baseElevRad = this.computeBaseSightElevationRad(
      targetDistance,
      bow.initialVelocity,
      arrowMassKg
    );
    const pos = new THREE.Vector3(0, 1.6, 0);
    const vel = new THREE.Vector3(
      0,
      Math.sin(baseElevRad) * launchSpeed,
      -Math.cos(baseElevRad) * launchSpeed
    );

    const targetZ = -targetDistance + 0.15;
    const dt = 1 / 240;
    let flightTime = 0;
    const maxSteps = 1200; // up to 5 seconds

    for (let i = 0; i < maxSteps; i++) {
      const prevZ = pos.z;
      const prevX = pos.x;
      const prevY = pos.y;

      // 1. Axial aerodynamic drag relative to wind
      const vRelX = vel.x - wx;
      const vRelY = vel.y;
      const vRelZ = vel.z - wz;
      const speedRel = Math.sqrt(vRelX * vRelX + vRelY * vRelY + vRelZ * vRelZ);

      let fDragX = 0;
      let fDragY = 0;
      let fDragZ = 0;
      if (speedRel > 0.01) {
        const dragMag =
          0.5 *
          this.AIR_DENSITY *
          speedRel *
          speedRel *
          this.DRAG_COEFFICIENT *
          this.ARROW_CROSS_SECTION;
        fDragX = (-vRelX / speedRel) * dragMag;
        fDragY = (-vRelY / speedRel) * dragMag;
        fDragZ = (-vRelZ / speedRel) * dragMag;
      }

      // 2. Lateral crosswind force on shaft & eagle feather fletchings
      const fLateralWindX = (wx - vel.x) * this.LATERAL_WINDAGE_COEFF;

      const ax = (fDragX + fLateralWindX) / arrowMassKg;
      const ay = -9.81 + fDragY / arrowMassKg;
      const az = fDragZ / arrowMassKg;

      vel.x += ax * dt;
      vel.y += ay * dt;
      vel.z += az * dt;

      pos.x += vel.x * dt;
      pos.y += vel.y * dt;
      pos.z += vel.z * dt;
      flightTime += dt;

      if (pos.z <= targetZ) {
        // Linearly interpolate exact crossing at targetZ
        const denom = prevZ - pos.z;
        const alpha = denom > 0.00001 ? (prevZ - targetZ) / denom : 1.0;
        pos.x = prevX + (pos.x - prevX) * alpha;
        pos.y = prevY + (pos.y - prevY) * alpha;
        break;
      }
    }

    const pureWindDriftXCm = pos.x * 100; // + = right of center, - = left of center
    const pureWindDriftYCm = (pos.y - 1.6) * 100; // + = above bullseye, - = below bullseye

    const activeThumbAngle =
      thumbAngleDeg !== undefined
        ? thumbAngleDeg
        : this.getOptimalThumbAngleDeg(bow, effectiveTension);
    const gripEffect = this.calculateThumbGripEffect(
      activeThumbAngle,
      bow,
      targetDistance,
      effectiveTension
    );

    const driftXCm = pureWindDriftXCm + gripEffect.clearanceDriftXCm;
    const driftYCm = pureWindDriftYCm + gripEffect.clearanceDriftYCm;
    const driftXMeters = driftXCm / 100;

    const turbFactor = this.computeTurbulenceFactor(windVec);
    const turbulenceMarginCm = turbFactor * (2.5 + targetDistance * 0.045);

    return {
      driftXCm,
      driftYCm,
      pureWindDriftXCm,
      requiredAimXCm: -driftXCm,
      requiredAimYCm: -driftYCm,
      crosswindSpeed: wx,
      headwindSpeed: wz,
      ringOffset: Math.min(10, (Math.abs(driftXMeters) / Math.max(0.3, targetRadius)) * 10),
      estimatedFlightTime: flightTime,
      turbulenceMarginCm,
      gripEffect,
    };
  }

  /**
   * Advances arrow flight physics by dt using sub-stepped Euler integration,
   * incorporating quadratic drag, lateral windage force, gravity, and Crosswind Turbulence oscillations.
   * Returns true if arrow continues flying, false if it struck a surface.
   */
  public static updateArrow(
    arrow: ArrowFlightState,
    windVector: THREE.Vector3,
    arrowMass: number, // in kg (e.g. 0.032 - 0.048)
    targetPlane: TargetCollisionPlane,
    dt: number,
    onImpact?: (result: ShotResult) => void
  ): boolean {
    if (arrow.isStuck) return false;

    // Sub-stepping to prevent tunnel artifacts at 50-80 m/s
    const subSteps = 4;
    const subDt = dt / subSteps;

    const turbFactor = this.computeTurbulenceFactor(windVector);
    arrow.turbulenceFactor = turbFactor;
    const phase = arrow.turbulencePhase ?? 0;
    const windSign = windVector.x >= 0 ? 1 : -1;

    for (let step = 0; step < subSteps; step++) {
      this._prevPos.copy(arrow.position);

      // 1. Aerodynamic drag relative to dynamic wind vector
      this._vRel.copy(arrow.velocity).sub(windVector);
      const speedRel = this._vRel.length();

      if (speedRel > 0.01) {
        // F_drag = 0.5 * rho * v^2 * Cd * A in direction opposite to v_rel
        const dragMag =
          0.5 *
          this.AIR_DENSITY *
          speedRel *
          speedRel *
          this.DRAG_COEFFICIENT *
          this.ARROW_CROSS_SECTION;
        this._fDrag.copy(this._vRel).normalize().multiplyScalar(-dragMag);
      } else {
        this._fDrag.set(0, 0, 0);
      }

      // Add lateral crosswind pressure on arrow shaft & eagle feather fletchings
      this._fDrag.x += (windVector.x - arrow.velocity.x) * this.LATERAL_WINDAGE_COEFF;

      // 2. Crosswind Turbulence Force (側風亂流渦旋力)
      // High winds shed turbulent Karman eddies down the range corridor (indexed by flightTime & Z position),
      // causing slight lateral & vertical trajectory oscillations that heavier war arrows resist better.
      if (turbFactor > 0.01) {
        const t = arrow.flightTime;
        const zPos = arrow.position.z;

        // Multi-frequency spatial-temporal gust oscillation
        const lateralWave =
          Math.sin(t * 17.5 + zPos * 0.24 + phase) * 0.65 +
          Math.cos(t * 29.0 - zPos * 0.38 + phase * 1.7) * 0.35;
        const verticalEddy =
          Math.cos(t * 14.0 + zPos * 0.19 + phase * 0.8) * 0.55 +
          Math.sin(t * 23.5 + zPos * 0.31) * 0.45;

        // Force in Newtons (~0.04N to ~0.22N in strong 5-7.5 m/s gales)
        const lateralTurbForce =
          lateralWave * turbFactor * 0.165 + windSign * turbFactor * 0.025 * Math.sin(t * 9.5);
        const verticalTurbForce = verticalEddy * turbFactor * 0.075;

        this._fTurb.set(lateralTurbForce, verticalTurbForce, 0);
      } else {
        this._fTurb.set(0, 0, 0);
      }

      // Total acceleration: Gravity + (Drag + Lateral Windage + Crosswind Turbulence) / mass
      this._accel
        .copy(this.GRAVITY)
        .addScaledVector(this._fDrag, 1 / arrowMass)
        .addScaledVector(this._fTurb, 1 / arrowMass);

      // Integrate velocity and position
      arrow.velocity.addScaledVector(this._accel, subDt);
      arrow.position.addScaledVector(arrow.velocity, subDt);

      arrow.flightTime += subDt;
      arrow.distanceTraveled += arrow.velocity.length() * subDt;

      // Orient arrow along current flight velocity tangent + aerodynamic fletching weathercock oscillation
      if (arrow.velocity.lengthSq() > 0.1) {
        const dir = arrow.velocity.clone().normalize();
        arrow.orientation.setFromUnitVectors(new THREE.Vector3(0, 0, -1), dir);

        // Apply subtle fishtailing (章動擺振) to arrow orientation in turbulent crosswinds
        if (turbFactor > 0.01) {
          const t = arrow.flightTime;
          // Initial archer's paradox decay + sustained crosswind turbulence weathercocking
          const envelope = Math.exp(-t * 2.2) * 0.5 + 0.5;
          const yawOsc =
            Math.sin(t * 26.0 + phase) * (0.014 + turbFactor * 0.036) * envelope;
          const pitchOsc =
            Math.cos(t * 21.0 + phase * 1.3) * (0.006 + turbFactor * 0.016) * envelope;

          arrow.fishtailYawOffset = yawOsc;
          arrow.fishtailPitchOffset = pitchOsc;

          this._oscEuler.set(pitchOsc, yawOsc, 0, 'YXZ');
          this._oscQuat.setFromEuler(this._oscEuler);
          arrow.orientation.multiply(this._oscQuat);
        } else {
          arrow.fishtailYawOffset = 0;
          arrow.fishtailPitchOffset = 0;
        }
      }

      // 3. Collision Check: Target Plane
      this._rayDir.copy(arrow.position).sub(this._prevPos);
      const segmentLen = this._rayDir.length();
      this._rayDir.normalize();
      this._ray.set(this._prevPos, this._rayDir);

      this._plane.setFromNormalAndCoplanarPoint(targetPlane.normal, targetPlane.center);

      if (this._ray.intersectPlane(this._plane, this._intersect)) {
        const distToIntersection = this._prevPos.distanceTo(this._intersect);
        if (distToIntersection <= segmentLen + 0.1) {
          // Check if within target face radius
          const targetRad =
            typeof targetPlane.radius === 'number' ? targetPlane.radius : targetPlane.radius.x;
          const distFromCenter = this._intersect.distanceTo(targetPlane.bullseyeCenter);

          if (distFromCenter <= targetRad * 1.05) {
            // Hit the Target!
            arrow.isStuck = true;
            arrow.position.copy(this._intersect).addScaledVector(this._rayDir, 0.12); // embed slightly
            arrow.stuckPosition = arrow.position.clone();
            arrow.stuckNormal = targetPlane.normal.clone();
            arrow.wobbleIntensity = 1.0;

            const score = this.calculateScore(distFromCenter, targetRad);
            const ringName = this.getRingName(score);
            arrow.stuckScore = score;

            if (onImpact) {
              onImpact({
                arrowIndex: 0,
                score,
                ringName,
                distanceFromCenter: distFromCenter,
                flightTime: arrow.flightTime,
                flightDistance: arrow.distanceTraveled,
                hitPosition: {
                  x: this._intersect.x,
                  y: this._intersect.y,
                  z: this._intersect.z,
                },
                windSpeed: windVector.length(),
                windDirectionAngle: Math.atan2(windVector.x, windVector.z),
                thumbAngleDeg: arrow.thumbAngleDeg,
                gripTechniqueLabel: arrow.gripTechniqueLabel,
              });
            }
            return false;
          }
        }
      }

      // 4. Collision Check: Ground (y <= 0)
      if (arrow.position.y <= 0.05) {
        arrow.isStuck = true;
        arrow.position.y = 0.05;
        arrow.stuckPosition = arrow.position.clone();
        arrow.stuckScore = 0;
        arrow.wobbleIntensity = 0.5;

        if (onImpact) {
          onImpact({
            arrowIndex: 0,
            score: 0,
            ringName: '脫靶（墮地）',
            distanceFromCenter: 999,
            flightTime: arrow.flightTime,
            flightDistance: arrow.distanceTraveled,
            hitPosition: { x: arrow.position.x, y: 0.05, z: arrow.position.z },
            windSpeed: windVector.length(),
            windDirectionAngle: Math.atan2(windVector.x, windVector.z),
            thumbAngleDeg: arrow.thumbAngleDeg,
            gripTechniqueLabel: arrow.gripTechniqueLabel,
          });
        }
        return false;
      }

      // 5. Collision Check: Missed beyond target barrier
      if (arrow.position.z < targetPlane.center.z - 25 || arrow.distanceTraveled > 250) {
        arrow.isStuck = true;
        arrow.stuckScore = 0;
        if (onImpact) {
          onImpact({
            arrowIndex: 0,
            score: 0,
            ringName: '脫靶（過遠）',
            distanceFromCenter: 999,
            flightTime: arrow.flightTime,
            flightDistance: arrow.distanceTraveled,
            hitPosition: { x: arrow.position.x, y: arrow.position.y, z: arrow.position.z },
            windSpeed: windVector.length(),
            windDirectionAngle: Math.atan2(windVector.x, windVector.z),
            thumbAngleDeg: arrow.thumbAngleDeg,
            gripTechniqueLabel: arrow.gripTechniqueLabel,
          });
        }
        return false;
      }
    }

    return true;
  }

  private static calculateScore(distFromCenter: number, radius: number): number {
    const ratio = distFromCenter / radius;
    if (ratio <= 0.12) return 10; // Gold 10 / X-Ring
    if (ratio <= 0.24) return 9;  // Gold 9
    if (ratio <= 0.36) return 8;  // Red 8
    if (ratio <= 0.48) return 7;  // Red 7
    if (ratio <= 0.60) return 6;  // Blue 6
    if (ratio <= 0.72) return 5;  // Blue 5
    if (ratio <= 0.84) return 4;  // Black 4
    if (ratio <= 0.94) return 3;  // Black 3
    if (ratio <= 1.02) return 2;  // White 2-1
    return 0; // Miss (M)
  }

  private static getRingName(score: number): string {
    switch (score) {
      case 10: return 'X-10環！正中靶心 (Gold 10-Ring)';
      case 9:  return '9環！黃金內圈 (Gold 9-Ring)';
      case 8:  return '8環！紅區高分 (Red 8-Ring)';
      case 7:  return '7環！紅區外圈 (Red 7-Ring)';
      case 6:  return '6環！藍區內圈 (Blue 6-Ring)';
      case 5:  return '5環！藍區外圈 (Blue 5-Ring)';
      case 4:  return '4環！黑區內圈 (Black 4-Ring)';
      case 3:  return '3環！黑區外圈 (Black 3-Ring)';
      case 2:  return '2環！白區外環 (White 2-Ring)';
      default: return '脫靶 M (未著靶面)';
    }
  }
}
