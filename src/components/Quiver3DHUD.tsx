import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GameState } from '../types/archery';

interface Quiver3DHUDProps {
  totalArrows: number;
  currentArrowIndex: number;
  shotCount: number;
  gameState: GameState;
}

/**
 * Real-time 3D Ming-Era Quiver HUD Component (明代步射箭囊 · 3D 實時雕翎箭矢)
 * Renders an interactive Three.js 3D display of remaining traditional Ming bamboo arrows
 * with horn nocks, red silk cresting wraps, and three-vane eagle feather fletchings.
 */
export const Quiver3DHUD: React.FC<Quiver3DHUDProps> = ({
  totalArrows,
  currentArrowIndex,
  shotCount,
  gameState,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const arrowGroupsRef = useRef<THREE.Group[]>([]);
  const quiverRootRef = useRef<THREE.Group | null>(null);
  const remainingRef = useRef<number>(totalArrows);
  const isDrawingRef = useRef<boolean>(false);

  // Calculate how many arrows are currently sitting inside the quiver:
  // Total arrows minus arrows already shot, and minus 1 when the current arrow is nocked/drawn/flying
  const arrowsInQuiver = Math.max(
    0,
    totalArrows - shotCount - (gameState === 'idle' || gameState === 'drawing' || gameState === 'aiming' ? 1 : 0)
  );
  const totalRemaining = Math.max(0, totalArrows - shotCount);

  remainingRef.current = totalRemaining;
  isDrawingRef.current = gameState === 'drawing' || gameState === 'aiming';

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = 116;
    const height = 150;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !isSoftwareGl,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 20);
    camera.position.set(0, 0.28, 1.35);
    camera.lookAt(0, 0.05, 0);

    // Studio 3-point lighting for quiver & feathers
    const keyLight = new THREE.DirectionalLight(0xfff4d6, 2.6);
    keyLight.position.set(2, 3, 3);
    scene.add(keyLight);

    const fillLight = new THREE.HemisphereLight(0xdbeafe, 0x5c4033, 1.2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xfbbf24, 1.4);
    rimLight.position.set(-2, 2, -2);
    scene.add(rimLight);

    // Build Ming-Era Quiver & 6 Traditional Arrows
    const quiverRoot = new THREE.Group();
    quiverRoot.position.set(0, -0.18, 0);
    quiverRoot.rotation.set(0.12, -0.28, -0.08);
    scene.add(quiverRoot);
    quiverRootRef.current = quiverRoot;

    // Materials
    const leatherMat = new THREE.MeshStandardMaterial({
      color: 0x241612,
      roughness: 0.5,
      metalness: 0.18,
    });
    const brocadeMat = new THREE.MeshStandardMaterial({
      color: 0x8b1e1e,
      roughness: 0.6,
      metalness: 0.12,
    });
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.25,
      metalness: 0.88,
    });
    const bambooMat = new THREE.MeshStandardMaterial({
      color: 0xc89d66,
      roughness: 0.45,
      metalness: 0.08,
    });
    const crimsonWrapMat = new THREE.MeshStandardMaterial({
      color: 0x9e1b1b,
      roughness: 0.5,
    });
    const hornNockMat = new THREE.MeshStandardMaterial({
      color: 0x1c1917,
      roughness: 0.3,
      metalness: 0.2,
    });
    const featherMat = new THREE.MeshStandardMaterial({
      color: 0xf5f2eb,
      roughness: 0.75,
      side: THREE.DoubleSide,
    });
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0xd6d3d1,
      roughness: 0.22,
      metalness: 0.9,
    });

    // 1. Ming Quiver Scabbard (黑漆描金步射撒袋)
    const boxBodyGeo = new THREE.CylinderGeometry(0.13, 0.095, 0.46, 20);
    const boxBody = new THREE.Mesh(boxBodyGeo, leatherMat);
    boxBody.position.y = -0.14;
    boxBody.scale.set(1.32, 1, 0.68);
    quiverRoot.add(boxBody);

    // Crimson silk mouth collar
    const collarGeo = new THREE.CylinderGeometry(0.136, 0.131, 0.09, 20);
    const collar = new THREE.Mesh(collarGeo, brocadeMat);
    collar.position.y = 0.05;
    collar.scale.set(1.34, 1, 0.7);
    quiverRoot.add(collar);

    // Top & mid brass bands
    const bandGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.02, 20);
    const topBand = new THREE.Mesh(bandGeo, brassMat);
    topBand.position.y = 0.095;
    topBand.scale.set(1.35, 1, 0.72);
    quiverRoot.add(topBand);

    const midBand = new THREE.Mesh(bandGeo, brassMat);
    midBand.position.y = -0.06;
    midBand.scale.set(1.26, 1, 0.68);
    quiverRoot.add(midBand);

    // Central brass emblem boss (獸面銅飾)
    const emblemGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.015, 12);
    const emblem = new THREE.Mesh(emblemGeo, brassMat);
    emblem.rotation.x = Math.PI / 2;
    emblem.position.set(0, -0.06, 0.092);
    quiverRoot.add(emblem);

    // 2. Construct 6 Individual 3D Ming Arrows inside the quiver
    const builtArrows: THREE.Group[] = [];
    for (let i = 0; i < totalArrows; i++) {
      const arrowGroup = new THREE.Group();

      // Bamboo shaft
      const shaftGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.56, 10);
      const shaft = new THREE.Mesh(shaftGeo, bambooMat);
      shaft.position.y = 0.12;
      arrowGroup.add(shaft);

      // Crimson silk cresting wrap below fletchings (朱紅纏絲)
      const wrapGeo = new THREE.CylinderGeometry(0.0102, 0.0102, 0.05, 10);
      const wrap = new THREE.Mesh(wrapGeo, crimsonWrapMat);
      wrap.position.y = 0.22;
      arrowGroup.add(wrap);

      // Gold ring band
      const goldBandGeo = new THREE.CylinderGeometry(0.0105, 0.0105, 0.012, 10);
      const goldBand = new THREE.Mesh(goldBandGeo, brassMat);
      goldBand.position.y = 0.248;
      arrowGroup.add(goldBand);

      // Three Eagle Feather Fletchings (三羽雕翎)
      for (let v = 0; v < 3; v++) {
        const angle = (v * Math.PI * 2) / 3 + i * 0.4;
        const vaneShape = new THREE.Shape();
        vaneShape.moveTo(0, 0);
        vaneShape.quadraticCurveTo(0.028, 0.03, 0.024, 0.11);
        vaneShape.lineTo(0, 0.135);
        vaneShape.closePath();

        const vaneGeo = new THREE.ShapeGeometry(vaneShape);
        const vane = new THREE.Mesh(vaneGeo, featherMat);
        vane.position.set(Math.cos(angle) * 0.008, 0.255, Math.sin(angle) * 0.008);
        vane.rotation.y = -angle;
        arrowGroup.add(vane);
      }

      // Ox-horn Nock (牛角箭扣)
      const nockGeo = new THREE.CylinderGeometry(0.0105, 0.0095, 0.032, 10);
      const nock = new THREE.Mesh(nockGeo, hornNockMat);
      nock.position.y = 0.405;
      arrowGroup.add(nock);

      // Steel Bodkin Tip at bottom (for extracted animation visibility)
      const tipGeo = new THREE.ConeGeometry(0.016, 0.055, 4);
      const tip = new THREE.Mesh(tipGeo, steelMat);
      tip.rotation.x = Math.PI;
      tip.position.y = -0.17;
      arrowGroup.add(tip);

      // Arrange in a natural fanned cluster
      const spread = i - (totalArrows - 1) / 2;
      const baseX = spread * 0.034;
      const baseY = (i % 2) * 0.022;
      const baseZ = (i % 2 === 0 ? 1 : -1) * 0.016;
      const baseRotZ = -spread * 0.065;

      arrowGroup.userData = {
        baseX,
        baseY,
        baseZ,
        baseRotZ,
        currentLift: 0,
        currentScale: 1,
      };

      arrowGroup.position.set(baseX, baseY, baseZ);
      arrowGroup.rotation.z = baseRotZ;

      quiverRoot.add(arrowGroup);
      builtArrows.push(arrowGroup);
    }
    arrowGroupsRef.current = builtArrows;

    // Animation loop
    let frameId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();

      if (quiverRootRef.current) {
        // Gentle idle breathing sway on the 3D quiver
        quiverRootRef.current.rotation.y = -0.28 + Math.sin(elapsed * 1.4) * 0.08;
        quiverRootRef.current.position.y = -0.18 + Math.sin(elapsed * 2.1) * 0.008;
      }

      const activeRemaining = remainingRef.current;
      const drawing = isDrawingRef.current;

      for (let i = 0; i < arrowGroupsRef.current.length; i++) {
        const arr = arrowGroupsRef.current[i];
        const isAvailable = i < activeRemaining;
        const isActiveNocked = i === activeRemaining - 1;

        if (!isAvailable) {
          // Depleted arrow slides upward and fades/scales out as shot
          arr.userData.currentLift = THREE.MathUtils.lerp(arr.userData.currentLift, 0.35, dt * 10);
          arr.userData.currentScale = THREE.MathUtils.lerp(arr.userData.currentScale, 0.001, dt * 10);
          arr.visible = arr.userData.currentScale > 0.02;
        } else {
          arr.visible = true;
          arr.userData.currentScale = THREE.MathUtils.lerp(arr.userData.currentScale, 1.0, dt * 12);
          // The currently nocked/active arrow lifts slightly out of the quiver when drawing
          const targetLift = isActiveNocked ? (drawing ? 0.11 : 0.045) : 0;
          arr.userData.currentLift = THREE.MathUtils.lerp(arr.userData.currentLift, targetLift, dt * 10);
        }

        arr.position.y = arr.userData.baseY + arr.userData.currentLift;
        arr.scale.setScalar(arr.userData.currentScale);
      }

      renderer.render(scene, camera);
      if (!isSoftwareGl) {
        frameId = requestAnimationFrame(animate);
      } else {
        frameId = window.setTimeout(animate, 80);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [totalArrows]);

  return (
    <div
      className={`absolute bottom-4 left-4 z-20 pointer-events-none flex flex-col items-center transition-opacity duration-200 ${
        gameState === 'drawing' || gameState === 'aiming' ? 'opacity-65' : 'opacity-95'
      }`}
    >
      <div className="relative bg-stone-950/65 backdrop-blur-xs border border-amber-800/40 rounded-md px-2 pt-1.5 pb-2 shadow-lg flex flex-col items-center">
        {/* Header Label */}
        <div className="w-full flex items-center justify-between px-0.5 mb-0.5 border-b border-stone-800/80 pb-0.5">
          <span className="text-[10px] font-bold tracking-wider text-amber-300">
            步射撒袋
          </span>
          <span className="font-mono tabular-nums text-[11px] font-bold text-amber-200">
            {totalRemaining}/{totalArrows}矢
          </span>
        </div>

        {/* 3D WebGL Canvas Mount for Real-Time 3D Ming Arrows */}
        <div ref={mountRef} className="w-[116px] h-[150px] flex items-center justify-center" />

        {/* Status Caption */}
        <div className="w-full flex items-center justify-between px-0.5 pt-0.5 border-t border-stone-800/80 text-[10px] text-stone-400">
          <span>雕翎箭</span>
          <span className="text-amber-300/90 font-medium">
            {totalRemaining > 0
              ? gameState === 'drawing' || gameState === 'aiming'
                ? `第${currentArrowIndex + 1}矢引弦`
                : `待發第${currentArrowIndex + 1}矢`
              : '六矢已畢'}
          </span>
        </div>
      </div>
    </div>
  );
};
