import * as THREE from 'three';
import { ShotResult } from '../types/archery';

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
}

export interface TargetCollisionPlane {
  center: THREE.Vector3;
  normal: THREE.Vector3;
  radius: THREE.Vector3 | number; // radius in meters
  bullseyeCenter: THREE.Vector3;
}

export class BallisticsEngine {
  // Physical Constants
  private static readonly GRAVITY = new THREE.Vector3(0, -9.81, 0);
  private static readonly AIR_DENSITY = 1.225; // kg/m^3
  private static readonly DRAG_COEFFICIENT = 1.35; // Arrow with 3 turkey/eagle feathers
  private static readonly ARROW_CROSS_SECTION = 0.00012; // m^2 (approx 8.5mm shaft + fletchings)

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
   * Advances arrow flight physics by dt using sub-stepped Euler integration,
   * incorporating quadratic drag, gravity, and high-wind Crosswind Turbulence oscillations.
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
        const lateralTurbForce = lateralWave * turbFactor * 0.165 + windSign * turbFactor * 0.025 * Math.sin(t * 9.5);
        const verticalTurbForce = verticalEddy * turbFactor * 0.075;

        this._fTurb.set(lateralTurbForce, verticalTurbForce, 0);
      } else {
        this._fTurb.set(0, 0, 0);
      }

      // Total acceleration: Gravity + (Drag + Crosswind Turbulence) / mass
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

      // 2. Collision Check: Target Plane
      this._rayDir.copy(arrow.position).sub(this._prevPos);
      const segmentLen = this._rayDir.length();
      this._rayDir.normalize();
      this._ray.set(this._prevPos, this._rayDir);

      this._plane.setFromNormalAndCoplanarPoint(targetPlane.normal, targetPlane.center);

      if (this._ray.intersectPlane(this._plane, this._intersect)) {
        const distToIntersection = this._prevPos.distanceTo(this._intersect);
        if (distToIntersection <= segmentLen + 0.1) {
          // Check if within target face radius
          const targetRad = typeof targetPlane.radius === 'number' ? targetPlane.radius : targetPlane.radius.x;
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
                hitPosition: { x: this._intersect.x, y: this._intersect.y, z: this._intersect.z },
                windSpeed: windVector.length(),
                windDirectionAngle: Math.atan2(windVector.x, windVector.z),
              });
            }
            return false;
          }
        }
      }

      // 3. Collision Check: Ground (y <= 0)
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
          });
        }
        return false;
      }

      // 4. Collision Check: Missed beyond target barrier
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
          });
        }
        return false;
      }
    }

    return true;
  }

  private static calculateScore(distFromCenter: number, radius: number): number {
    const ratio = distFromCenter / radius;
    if (ratio <= 0.12) return 10; // 鵠心 (Gold)
    if (ratio <= 0.32) return 9;  // 穿正 (Red)
    if (ratio <= 0.52) return 8;  // 玄黑 (Inner Black)
    if (ratio <= 0.70) return 7;  // 玄黑 (Outer Black)
    if (ratio <= 0.86) return 5;  // 靛青 (Blue)
    if (ratio <= 1.02) return 3;  // 純素 (White)
    return 0; // 脫靶
  }

  private static getRingName(score: number): string {
    switch (score) {
      case 10: return '中鵠！十環 (金心貫頂)';
      case 9:  return '穿正！九環 (朱紅入扣)';
      case 8:  return '中彩！八環 (玄心著矢)';
      case 7:  return '及的！七環 (墨華流光)';
      case 5:  return '中邊！五環 (青羽留痕)';
      case 3:  return '擦靶！三環 (白素著翎)';
      default: return '脫靶 (未著靶面)';
    }
  }
}
