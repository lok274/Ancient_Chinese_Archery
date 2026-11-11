/**
 * 3D Mechanics Debug Layer & In-World Heritage Exhibition Prop
 * Educational Objectives:
 * - OBJ-TECH — 探究創新科技以認識國家發展 (3D limb stress heatmap + Material Evolution ghost trajectory)
 * - OBJ-HK   — 認識內地與香港系出同源的關係 (Side-range clickable 3D Hong Kong Archery Heritage Board)
 *
 * Instrumentation Rule: Strictly read-only observation of physics parameters.
 * Never mutates BallisticsEngine outputs, sway amplitude, stamina rates, or scoring.
 */

import * as THREE from 'three';
import { BowConfig, WindState } from '../types/archery';
import { MaterialStage } from '../data/inquiry/materialTimeline';
import { BallisticsEngine } from '../physics/BallisticsEngine';

export class MechanicsDebugLayer {
  private scene: THREE.Scene;
  private upperLimb: THREE.Group;
  private lowerLimb: THREE.Group;

  // Limb stress heatmap state
  private isHeatmapEnabled: boolean = false;
  private originalHornColor = new THREE.Color(0x1f1b18);
  private stressLowColor = new THREE.Color(0x10b981);   // Emerald (low bending stress)
  private stressMidColor = new THREE.Color(0xf59e0b);   // Amber (medium bending stress)
  private stressHighColor = new THREE.Color(0xef4444);  // Crimson (peak limb energy storage)

  // Material Evolution Ghost Trajectory Line & Target Impact Ring (歷史對照軌跡（模擬）)
  private ghostGroup: THREE.Group;
  private ghostLine: THREE.Line;
  private ghostImpactRing: THREE.Mesh;
  private ghostLabelSprite: THREE.Sprite;
  private ghostVisible: boolean = false;

  // In-3D-World Hong Kong Archery Heritage Exhibition Board Prop (x ≈ -6.8, z ≈ -12)
  public hkBoardGroup: THREE.Group;
  public hkBoardCollider: THREE.Mesh;
  private hkBoardBeaconMat!: THREE.MeshBasicMaterial;

  constructor(scene: THREE.Scene, upperLimb: THREE.Group, lowerLimb: THREE.Group) {
    this.scene = scene;
    this.upperLimb = upperLimb;
    this.lowerLimb = lowerLimb;

    // 1. Initialize Ghost Trajectory Group
    this.ghostGroup = new THREE.Group();
    const initialPoints = [new THREE.Vector3(0, 1.6, 0), new THREE.Vector3(0, 1.6, -30)];
    const ghostGeo = new THREE.BufferGeometry().setFromPoints(initialPoints);
    const ghostMat = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 0.65,
      gapSize: 0.3,
      transparent: true,
      opacity: 0.85,
    });
    this.ghostLine = new THREE.Line(ghostGeo, ghostMat);
    this.ghostLine.computeLineDistances();
    this.ghostGroup.add(this.ghostLine);

    const ringGeo = new THREE.RingGeometry(0.06, 0.11, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    this.ghostImpactRing = new THREE.Mesh(ringGeo, ringMat);
    this.ghostGroup.add(this.ghostImpactRing);

    this.ghostLabelSprite = this.createGhostLabelSprite('歷史對照軌跡（模擬）');
    this.ghostGroup.add(this.ghostLabelSprite);

    this.ghostGroup.visible = false;
    this.scene.add(this.ghostGroup);

    // 2. Build Side-Range Hong Kong Archery Heritage Exhibition Board Prop
    this.hkBoardGroup = new THREE.Group();
    this.hkBoardCollider = this.buildHKExhibitionBoard();
    this.scene.add(this.hkBoardGroup);
  }

  private createGhostLabelSprite(text: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 96;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(8, 8, 496, 80, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 28px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 48);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthTest: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(2.4, 0.45, 1);
    return sprite;
  }

  private updateGhostLabelText(text: string, colorHex: string) {
    const mat = this.ghostLabelSprite.material as THREE.SpriteMaterial;
    if (mat.map) mat.map.dispose();

    const canvas = document.createElement('canvas');
    canvas.width = 560;
    canvas.height = 96;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = colorHex;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(8, 8, 544, 80, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fef3c7';
    ctx.font = 'bold 25px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 280, 48);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    mat.map = tex;
    mat.needsUpdate = true;
  }

  /**
   * Toggles the 3D limb stress heatmap on/off
   */
  public setHeatmapEnabled(enabled: boolean, currentTension: number = 0) {
    this.isHeatmapEnabled = enabled;
    this.updateLimbStressColor(currentTension);
  }

  /**
   * Updates the 3D bow limb colour ramp according to current draw tension (read-only)
   */
  public updateLimbStressColor(drawTension: number) {
    const applyToLimb = (limbGroup: THREE.Group) => {
      if (!limbGroup || limbGroup.children.length === 0) return;
      const workingMesh = limbGroup.children[0] as THREE.Mesh;
      if (!workingMesh || !workingMesh.material) return;
      const mat = workingMesh.material as THREE.MeshPhysicalMaterial;

      if (!this.isHeatmapEnabled) {
        mat.color.copy(this.originalHornColor);
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0;
        return;
      }

      const t = Math.max(0, Math.min(1, drawTension));
      const c = new THREE.Color();
      if (t < 0.5) {
        c.copy(this.stressLowColor).lerp(this.stressMidColor, t * 2);
      } else {
        c.copy(this.stressMidColor).lerp(this.stressHighColor, (t - 0.5) * 2);
      }
      mat.color.copy(c);
      mat.emissive.copy(c);
      mat.emissiveIntensity = 0.25 + t * 0.45;
    };

    applyToLimb(this.upperLimb);
    applyToLimb(this.lowerLimb);
  }

  /**
   * Computes and renders a read-only 3D ghost comparison trajectory for the selected MaterialStage
   */
  public updateMaterialGhostTrajectory(
    stage: MaterialStage | null,
    bow: BowConfig,
    targetDistance: number,
    windState: WindState,
    aimRotationX: number,
    aimRotationY: number
  ) {
    if (!stage) {
      this.ghostGroup.visible = false;
      this.ghostVisible = false;
      return;
    }

    this.ghostVisible = true;
    this.ghostGroup.visible = true;

    const massKg = stage.massG / 1000;
    const dragCoeff = stage.dragCoeff;

    // Heavier ancient stone/bronze arrows have lower launch velocity for the same bow energy: E = 1/2 m v^2
    const refMassKg = (bow.arrowMassGrams || 24) / 1000;
    const velocityScale = Math.sqrt(refMassKg / Math.max(0.015, massKg));
    const launchSpeed = bow.initialVelocity * velocityScale;

    const baseElevRad = BallisticsEngine.computeBaseSightElevationRad(
      targetDistance,
      bow.initialVelocity,
      refMassKg
    );

    const launchEuler = new THREE.Euler(
      aimRotationX + baseElevRad,
      aimRotationY,
      0,
      'YXZ'
    );
    const launchDir = new THREE.Vector3(0, 0, -1).applyEuler(launchEuler).normalize();

    const pos = new THREE.Vector3(0, 1.6, 0);
    const vel = launchDir.clone().multiplyScalar(launchSpeed);

    const wx = Math.sin(windState.directionAngle) * windState.speed;
    const wz = Math.cos(windState.directionAngle) * windState.speed;

    const targetZ = -targetDistance + 0.16;
    const dt = 1 / 120;
    const points: THREE.Vector3[] = [pos.clone()];
    const airDensity = 1.225;
    const crossSection = 0.00012;
    const lateralWindage = 0.0165;

    for (let i = 0; i < 600; i++) {
      const vRelX = vel.x - wx;
      const vRelY = vel.y;
      const vRelZ = vel.z - wz;
      const speedRel = Math.sqrt(vRelX * vRelX + vRelY * vRelY + vRelZ * vRelZ);

      let fDragX = 0;
      let fDragY = 0;
      let fDragZ = 0;
      if (speedRel > 0.01) {
        const dragMag = 0.5 * airDensity * speedRel * speedRel * dragCoeff * crossSection;
        fDragX = (-vRelX / speedRel) * dragMag;
        fDragY = (-vRelY / speedRel) * dragMag;
        fDragZ = (-vRelZ / speedRel) * dragMag;
      }

      const fLatX = (wx - vel.x) * lateralWindage;
      vel.x += ((fDragX + fLatX) / massKg) * dt;
      vel.y += (-9.81 + fDragY / massKg) * dt;
      vel.z += (fDragZ / massKg) * dt;

      pos.x += vel.x * dt;
      pos.y += vel.y * dt;
      pos.z += vel.z * dt;

      if (i % 3 === 0) {
        points.push(pos.clone());
      }

      if (pos.z <= targetZ || pos.y <= 0.05) {
        points.push(pos.clone());
        break;
      }
    }

    this.ghostLine.geometry.dispose();
    this.ghostLine.geometry = new THREE.BufferGeometry().setFromPoints(points);
    this.ghostLine.computeLineDistances();

    const lineMat = this.ghostLine.material as THREE.LineDashedMaterial;
    lineMat.color.set(stage.colorHex);

    const ringMat = this.ghostImpactRing.material as THREE.MeshBasicMaterial;
    ringMat.color.set(stage.colorHex);

    const endPt = points[points.length - 1];
    this.ghostImpactRing.position.copy(endPt);
    this.ghostImpactRing.position.z += 0.02;

    const midPt = points[Math.floor(points.length * 0.55)] || endPt;
    this.ghostLabelSprite.position.set(midPt.x, midPt.y + 0.55, midPt.z);
    this.updateGhostLabelText(
      `歷史對照軌跡（模擬）：${stage.label} (${stage.massG}g)`,
      stage.colorHex
    );
  }

  public setGhostVisible(visible: boolean) {
    this.ghostVisible = visible;
    this.ghostGroup.visible = visible;
  }

  /**
   * Builds the clickable 3D side-range exhibition board prop for Hong Kong Archery Heritage
   * Placed at x = -6.2, z = -12.5 (clearly visible on the left side of the shooting lane,
   * completely outside the central sightline)
   */
  private buildHKExhibitionBoard(): THREE.Mesh {
    this.hkBoardGroup.position.set(-6.2, 0, -12.5);
    this.hkBoardGroup.rotation.y = Math.PI * 0.22; // Angled toward player camera

    const woodPostMat = new THREE.MeshStandardMaterial({
      color: 0x451a03,
      roughness: 0.7,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.3,
      metalness: 0.8,
    });

    // Left & Right Pillars
    const postGeo = new THREE.CylinderGeometry(0.08, 0.09, 2.8, 12);
    const leftPost = new THREE.Mesh(postGeo, woodPostMat);
    leftPost.position.set(-1.55, 1.4, 0);
    this.hkBoardGroup.add(leftPost);

    const rightPost = new THREE.Mesh(postGeo, woodPostMat);
    rightPost.position.set(1.55, 1.4, 0);
    this.hkBoardGroup.add(rightPost);

    // Top Traditional Eave Bar
    const roofGeo = new THREE.BoxGeometry(3.5, 0.18, 0.36);
    const roofMesh = new THREE.Mesh(roofGeo, goldMat);
    roofMesh.position.set(0, 2.82, 0);
    this.hkBoardGroup.add(roofMesh);

    // Board Canvas Texture
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 440;
    const ctx = canvas.getContext('2d')!;

    // Deep vermilion & slate background
    const grad = ctx.createLinearGradient(0, 0, 768, 440);
    grad.addColorStop(0, '#450a0a');
    grad.addColorStop(0.5, '#0f172a');
    grad.addColorStop(1, '#1e293b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 768, 440);

    // Gold border
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 10;
    ctx.strokeRect(14, 14, 740, 412);

    // Header badge
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 26px serif';
    ctx.textAlign = 'center';
    ctx.fillText('【 場邊文化展板 · 內地與香港射藝同源考據 】', 384, 72);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 38px serif';
    ctx.fillText('香港射藝傳統 × 國家武舉與非遺傳承', 384, 138);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '24px sans-serif';
    ctx.fillText('• 屏山鄧氏宗族清代武舉人與文物館藏清朝官兵箭', 384, 205);
    ctx.fillText('• 香港海防博物館藏二千年前秦末漢初單木弓展品', 384, 250);
    ctx.fillText('• 香港中華傳統弓總會與大專學子赴內地學藝參賽', 384, 295);

    // Call-to-action button graphic
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(194, 336, 380, 62, 12);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 27px sans-serif';
    ctx.fillText('點擊 3D 展板查閱史料與標註 →', 384, 375);

    const boardTex = new THREE.CanvasTexture(canvas);
    boardTex.colorSpace = THREE.SRGBColorSpace;

    const boardGeo = new THREE.BoxGeometry(3.0, 1.75, 0.08);
    const boardMat = new THREE.MeshStandardMaterial({
      map: boardTex,
      roughness: 0.35,
      emissive: new THREE.Color(0x3b2506),
      emissiveIntensity: 0.35,
    });
    const boardMesh = new THREE.Mesh(boardGeo, boardMat);
    boardMesh.position.set(0, 1.72, 0);
    boardMesh.name = 'hk_heritage_board';
    this.hkBoardGroup.add(boardMesh);

    // Pulsing Beacon Orb above the board to guide student attention
    const beaconGeo = new THREE.SphereGeometry(0.14, 16, 16);
    this.hkBoardBeaconMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.9,
    });
    const beaconMesh = new THREE.Mesh(beaconGeo, this.hkBoardBeaconMat);
    beaconMesh.position.set(0, 3.15, 0);
    this.hkBoardGroup.add(beaconMesh);

    return boardMesh;
  }

  public tick(time: number) {
    if (this.hkBoardBeaconMat) {
      this.hkBoardBeaconMat.opacity = 0.55 + Math.sin(time * 3.5) * 0.35;
    }
  }

  public dispose() {
    this.ghostLine.geometry.dispose();
    (this.ghostLine.material as THREE.Material).dispose();
    this.ghostImpactRing.geometry.dispose();
    (this.ghostImpactRing.material as THREE.Material).dispose();
  }
}
