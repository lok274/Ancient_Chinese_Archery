import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { TextureGenerator } from './TextureGenerator';
import { BallisticsEngine, ArrowFlightState, TargetCollisionPlane } from '../physics/BallisticsEngine';
import { BowConfig, ShotResult, WindState, CameraViewMode } from '../types/archery';
import { archeryAudio } from '../audio/ArcheryAudio';

export class ArcheryScene {
  private container: HTMLDivElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private chaseCamera!: THREE.PerspectiveCamera;
  private targetCamera!: THREE.PerspectiveCamera;

  // Software WebGL probe
  public isSoftwareGl: boolean = false;

  // Scene Objects
  private targetGroup!: THREE.Group;
  private bowGroup!: THREE.Group;
  private quiverGroup!: THREE.Group;
  private quiverArrows: THREE.Group[] = [];
  private remainingQuiverCount: number = 6;
  private arrowMesh!: THREE.Group;
  private flyingArrowMesh!: THREE.Group;
  private embeddedArrowsGroup!: THREE.Group;
  private bannerMeshes: THREE.Mesh[] = [];

  // Wind Particle System (Drifting Frontier Dust & Stylized Airflow Wisps)
  private windDustPoints!: THREE.Points;
  private windDustPositions!: Float32Array;
  private windDustSpeeds!: Float32Array;
  private windDustCount: number = 220;

  private windStreakLines!: THREE.LineSegments;
  private windStreakPositions!: Float32Array;
  private windStreakAnchors!: Float32Array;
  private windStreakPhases!: Float32Array;
  private windStreakCount: number = 55;

  // Dynamic Time-of-Day Lighting & Atmospheric System (卯時破曉 -> 申酉斜陽暮靄)
  private sunLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private rimLight!: THREE.DirectionalLight;
  private skyDomeMat!: THREE.ShaderMaterial;
  private sunOrbGroup!: THREE.Group;
  private sunDiscMat!: THREE.MeshBasicMaterial;
  private sunHaloMat!: THREE.SpriteMaterial;
  private mountainMat!: THREE.MeshStandardMaterial;
  private dustMat!: THREE.PointsMaterial;
  private streakMat!: THREE.LineBasicMaterial;
  private targetFaceMat!: THREE.MeshStandardMaterial;
  private targetBrazierLight!: THREE.PointLight;
  private platformBrazierLight!: THREE.PointLight;
  private brazierFlames: THREE.Mesh[] = [];
  private targetTimeOfDayProgress: number = 0.0;
  private currentTimeOfDayProgress: number = 0.0;

  // Bow dynamic components
  private upperLimb!: THREE.Group;
  private lowerLimb!: THREE.Group;
  private bowStringLine!: THREE.Line;
  private stringPositions!: Float32Array;

  // Active Flight & Physics
  private currentArrowState: ArrowFlightState | null = null;
  private activeArrowMassKg: number = 0.035;
  private targetCollisionPlane!: TargetCollisionPlane;
  private targetDistance: number = 50; // meters (Z = -targetDistance)
  private targetRadius: number = 0.6;  // meters

  // Aiming & Sway
  private drawTension: number = 0; // 0 (idle) to 1 (full draw)
  private breathTime: number = 0;
  private aimSway = new THREE.Vector2(0, 0);
  private cameraBasePosition = new THREE.Vector3(0, 1.62, 0);
  private cameraLookTarget = new THREE.Vector3(0, 1.60, -50);
  private currentCameraMode: CameraViewMode = 'first_person';

  // Wind
  public windState: WindState = {
    speed: 1.8,
    directionAngle: Math.PI * 0.25,
    directionName: '東南微風 二級',
  };

  // State Callbacks
  private onImpactCallback?: (result: ShotResult) => void;
  private onStaminaUpdate?: (staminaPercent: number, isFatigued: boolean) => void;
  private onWindUpdateCallback?: (wind: WindState) => void;

  private clock = new THREE.Clock();
  private frameId: number = 0;
  private isDisposed: boolean = false;

  constructor(
    container: HTMLDivElement,
    initialBow: BowConfig,
    initialDistance: number,
    onImpact?: (result: ShotResult) => void,
    onStamina?: (staminaPercent: number, isFatigued: boolean) => void,
    onWindUpdate?: (wind: WindState) => void
  ) {
    this.container = container;
    this.targetDistance = initialDistance;
    this.onImpactCallback = onImpact;
    this.onStaminaUpdate = onStamina;
    this.onWindUpdateCallback = onWindUpdate;

    this.initRenderer();
    this.initScene();
    this.buildFrontierEnvironment();
    this.buildWindParticles();
    this.buildTarget(this.targetDistance);
    this.buildHeroBowAndArrow();
    this.buildFlightArrow();
    this.applyTimeOfDayAtmosphere(0.0, 0);

    this.startLoop();
  }

  private initRenderer() {
    // Detect software WebGL
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // Main Player Camera (YXZ Euler order prevents pitch-induced roll / upside-down inversion)
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 800);
    this.camera.rotation.order = 'YXZ';
    this.camera.position.copy(this.cameraBasePosition);
    this.camera.rotation.set(0, 0, 0);

    // Dedicated Arrow Chase Camera (Prevents displacing first-person camera or bow model)
    this.chaseCamera = new THREE.PerspectiveCamera(48, width / height, 0.05, 800);
    this.chaseCamera.position.copy(this.cameraBasePosition);

    // Target View Camera
    this.targetCamera = new THREE.PerspectiveCamera(40, width / height, 0.1, 500);
    this.targetCamera.rotation.order = 'YXZ';
    this.updateTargetCamera();

    window.addEventListener('resize', this.onWindowResize);
  }

  private initScene() {
    this.scene = new THREE.Scene();

    // Studio Environment map reflection
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Warm Northern Frontier Sky & Atmospheric Fog
    const horizonColor = new THREE.Color(0xd49b82);
    this.scene.background = horizonColor;
    this.scene.fog = new THREE.FogExp2(horizonColor.getHex(), 0.0082);

    // Procedural Atmospheric Sky Dome (Zenith to Horizon Gradient + Solar Scattering)
    const skyGeo = new THREE.SphereGeometry(540, 32, 24);
    this.skyDomeMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        uZenithColor: { value: new THREE.Color(0x32435f) },
        uHorizonColor: { value: new THREE.Color(0xd49b82) },
        uSunColor: { value: new THREE.Color(0xffb07c) },
        uSunDir: { value: new THREE.Vector3(0.6, 0.15, -0.5).normalize() },
      },
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform vec3 uZenithColor;
        uniform vec3 uHorizonColor;
        uniform vec3 uSunColor;
        uniform vec3 uSunDir;
        varying vec3 vWorldPos;
        void main() {
          vec3 dir = normalize(vWorldPos);
          float h = clamp(dir.y, 0.0, 1.0);
          vec3 sky = mix(uHorizonColor, uZenithColor, pow(h, 0.55));
          float sunDot = max(dot(dir, uSunDir), 0.0);
          // Atmospheric Mie glow around sun position
          float sunGlow = pow(sunDot, 8.0) * 0.42 + pow(sunDot, 64.0) * 0.65;
          // Horizon warm band
          float horizonBand = exp(-abs(dir.y) * 9.0) * 0.28;
          vec3 col = sky + uSunColor * (sunGlow + horizonBand * max(dot(dir, uSunDir) * 0.5 + 0.5, 0.2));
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    const skyDome = new THREE.Mesh(skyGeo, this.skyDomeMat);
    this.scene.add(skyDome);

    // Celestial Sun Orb & Corona Sprite (塞上日輪與霞暈)
    this.sunOrbGroup = new THREE.Group();
    const sunDiscGeo = new THREE.SphereGeometry(13, 24, 24);
    this.sunDiscMat = new THREE.MeshBasicMaterial({
      color: 0xffd2a6,
      fog: false,
    });
    const sunDisc = new THREE.Mesh(sunDiscGeo, this.sunDiscMat);
    this.sunOrbGroup.add(sunDisc);

    const haloCanvas = document.createElement('canvas');
    haloCanvas.width = 128;
    haloCanvas.height = 128;
    const hCtx = haloCanvas.getContext('2d')!;
    const hGrad = hCtx.createRadialGradient(64, 64, 4, 64, 64, 62);
    hGrad.addColorStop(0, 'rgba(255, 245, 220, 0.95)');
    hGrad.addColorStop(0.28, 'rgba(255, 190, 110, 0.52)');
    hGrad.addColorStop(0.65, 'rgba(255, 130, 65, 0.16)');
    hGrad.addColorStop(1, 'rgba(255, 100, 40, 0)');
    hCtx.fillStyle = hGrad;
    hCtx.fillRect(0, 0, 128, 128);
    const haloTex = new THREE.CanvasTexture(haloCanvas);
    haloTex.colorSpace = THREE.SRGBColorSpace;

    this.sunHaloMat = new THREE.SpriteMaterial({
      map: haloTex,
      color: 0xffb07c,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });
    const sunHalo = new THREE.Sprite(this.sunHaloMat);
    sunHalo.scale.set(115, 115, 1);
    this.sunOrbGroup.add(sunHalo);
    this.scene.add(this.sunOrbGroup);

    // Lighting Rig
    // 1. Dynamic Frontier Sun Key Light
    this.sunLight = new THREE.DirectionalLight(0xffb07c, 1.55);
    this.sunLight.position.set(82, 16, -65);
    this.sunLight.castShadow = !this.isSoftwareGl;
    if (this.sunLight.shadow) {
      this.sunLight.shadow.mapSize.width = 2048;
      this.sunLight.shadow.mapSize.height = 2048;
      this.sunLight.shadow.camera.near = 10;
      this.sunLight.shadow.camera.far = 260;
      this.sunLight.shadow.camera.left = -45;
      this.sunLight.shadow.camera.right = 45;
      this.sunLight.shadow.camera.top = 45;
      this.sunLight.shadow.camera.bottom = -45;
      this.sunLight.shadow.bias = -0.0005;
      this.sunLight.shadow.normalBias = 0.02;
    }
    this.scene.add(this.sunLight);

    // 2. Sky / Ground Hemisphere Fill Light
    this.hemiLight = new THREE.HemisphereLight(0x8ca2c4, 0x42332b, 0.68);
    this.scene.add(this.hemiLight);

    // 3. Frontier Pass Rim Light
    this.rimLight = new THREE.DirectionalLight(0xf2a679, 0.85);
    this.rimLight.position.set(-50, 30, -80);
    this.scene.add(this.rimLight);

    // 4. Shooting Platform Torch Brazier Light (for dawn & golden-hour warmth)
    this.platformBrazierLight = new THREE.PointLight(0xff7b29, 0.5, 22, 1.6);
    this.platformBrazierLight.position.set(0, 2.2, -3.5);
    this.scene.add(this.platformBrazierLight);

    // Embedded arrows collection
    this.embeddedArrowsGroup = new THREE.Group();
    this.scene.add(this.embeddedArrowsGroup);
  }

  /**
   * Procedurally builds the Ming-Qing Frontier Pass & Martial Archery Ground
   */
  private buildFrontierEnvironment() {
    const groundTex = TextureGenerator.createGroundTexture(this.renderer);
    const brickTex = TextureGenerator.createBrickTexture(this.renderer);
    const bannerTex = TextureGenerator.createBannerTexture(this.renderer, '武');
    const dragonBannerTex = TextureGenerator.createBannerTexture(this.renderer, '帥');

    // 1. Archery Ground Terrain (240m x 100m)
    const groundGeo = new THREE.PlaneGeometry(160, 320);
    const groundMat = new THREE.MeshStandardMaterial({
      map: groundTex,
      roughness: 0.92,
      metalness: 0.05,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, 0, -80);
    ground.receiveShadow = !this.isSoftwareGl;
    this.scene.add(ground);

    // 2. Stone Shooting Platform (演武射位石臺)
    const platformGeo = new THREE.BoxGeometry(16, 0.4, 10);
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x5a5d62,
      roughness: 0.85,
      metalness: 0.1,
    });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.set(0, 0.2, 0);
    platform.receiveShadow = !this.isSoftwareGl;
    platform.castShadow = !this.isSoftwareGl;
    this.scene.add(platform);

    // Red lacquered wooden balustrades & columns for the pavilion
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x8b251e,
      roughness: 0.65,
      metalness: 0.15,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.35,
      metalness: 0.85,
    });

    // Pavilion columns behind player
    const colPositions = [
      [-6, 2.5, 3],
      [6, 2.5, 3],
      [-6, 2.5, -2],
      [6, 2.5, -2],
    ];
    for (const pos of colPositions) {
      const colGeo = new THREE.CylinderGeometry(0.2, 0.22, 5, 12);
      const col = new THREE.Mesh(colGeo, woodMat);
      col.position.set(pos[0], pos[1], pos[2]);
      col.castShadow = !this.isSoftwareGl;
      this.scene.add(col);

      // Stone base plinth (柱礎)
      const baseGeo = new THREE.CylinderGeometry(0.35, 0.4, 0.4, 12);
      const baseMesh = new THREE.Mesh(baseGeo, platformMat);
      baseMesh.position.set(pos[0], 0.4, pos[2]);
      this.scene.add(baseMesh);
    }

    // Pavilion Tiled Roof (歇山頂簷)
    const roofGeo = new THREE.ConeGeometry(9.5, 2.5, 4);
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x3d434a,
      roughness: 0.7,
      metalness: 0.1,
    });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 6.2, 0.5);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = !this.isSoftwareGl;
    this.scene.add(roof);

    // 3. Frontier Fortress Ramparts (邊關長城堞牆)
    const wallMat = new THREE.MeshStandardMaterial({
      map: brickTex,
      roughness: 0.88,
      metalness: 0.08,
    });

    // Left and Right Flanking Battlements (長廊城牆)
    for (const side of [-1, 1]) {
      const wallGeo = new THREE.BoxGeometry(4, 5, 240);
      const wall = new THREE.Mesh(wallGeo, wallMat);
      wall.position.set(side * 28, 2.5, -70);
      wall.receiveShadow = !this.isSoftwareGl;
      wall.castShadow = !this.isSoftwareGl;
      this.scene.add(wall);

      // Crenels / Battlements (雉堞)
      for (let z = 30; z > -180; z -= 6) {
        const crenelGeo = new THREE.BoxGeometry(1.2, 1.2, 3);
        const crenel = new THREE.Mesh(crenelGeo, wallMat);
        crenel.position.set(side * (28 - 1.2 * side), 5.6, z);
        crenel.castShadow = !this.isSoftwareGl;
        this.scene.add(crenel);
      }
    }

    // 4. Grand Frontier Gate Tower (遠方雄關城門樓 at Z = -160)
    const gateGroup = new THREE.Group();
    gateGroup.position.set(0, 0, -170);

    // Bastion Base
    const bastionGeo = new THREE.BoxGeometry(60, 14, 20);
    const bastion = new THREE.Mesh(bastionGeo, wallMat);
    bastion.position.y = 7;
    gateGroup.add(bastion);

    // Arched Gate Portal (券門)
    const archGeo = new THREE.CylinderGeometry(4.5, 4.5, 22, 16, 1, false, 0, Math.PI);
    const archMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
    const arch = new THREE.Mesh(archGeo, archMat);
    arch.rotation.z = Math.PI / 2;
    arch.rotation.y = Math.PI / 2;
    arch.position.set(0, 4.5, 0);
    gateGroup.add(arch);

    // Gate Watchtower Pavilion (二層城樓)
    const towerGeo = new THREE.BoxGeometry(32, 8, 14);
    const tower = new THREE.Mesh(towerGeo, woodMat);
    tower.position.set(0, 18, 0);
    gateGroup.add(tower);

    // Tower Roof (雙層重簷)
    const upperRoofGeo = new THREE.ConeGeometry(24, 6, 4);
    const upperRoof = new THREE.Mesh(upperRoofGeo, roofMat);
    upperRoof.rotation.y = Math.PI / 4;
    upperRoof.position.set(0, 24, 0);
    gateGroup.add(upperRoof);

    this.scene.add(gateGroup);

    // 5. Ceremonial War Drums (戰鼓) & Banner Poles
    this.buildWarDrum(-7, 0.4, -2);
    this.buildWarDrum(7, 0.4, -2);

    // Military Banners on poles
    this.buildBannerPole(-12, -10, bannerTex);
    this.buildBannerPole(12, -10, dragonBannerTex);
    this.buildBannerPole(-16, -40, bannerTex);
    this.buildBannerPole(16, -40, bannerTex);
    this.buildBannerPole(-18, -80, dragonBannerTex);
    this.buildBannerPole(18, -80, bannerTex);

    // 6. Halberd & Weapon Racks (兵器架) & Platform Fire Braziers (演武石臺火盆)
    this.buildWeaponRack(-8.5, 0.4, 1);
    this.buildWeaponRack(8.5, 0.4, 1);
    this.buildFireBrazier(this.scene, -5.4, 0.4, -3.6);
    this.buildFireBrazier(this.scene, 5.4, 0.4, -3.6);

    // 7. Encompassing Mountain Horizon (Layered distant terrain)
    this.buildMountainHorizon();
  }

  /**
   * Builds a traditional wrought-iron tripod fire brazier (邊關演武鐵火盆)
   * Used on the shooting platform and flanking the target butt to illuminate the target during Golden Hour / Sunset
   */
  private buildFireBrazier(parent: THREE.Object3D, x: number, y: number, z: number) {
    const brazierGroup = new THREE.Group();
    brazierGroup.position.set(x, y, z);

    const ironMat = new THREE.MeshStandardMaterial({
      color: 0x2a2624,
      roughness: 0.75,
      metalness: 0.65,
    });

    // Basin bowl
    const bowlGeo = new THREE.CylinderGeometry(0.38, 0.24, 0.26, 12);
    const bowl = new THREE.Mesh(bowlGeo, ironMat);
    bowl.position.y = 0.68;
    brazierGroup.add(bowl);

    // 3 Tripod legs
    const legGeo = new THREE.CylinderGeometry(0.035, 0.045, 0.72, 6);
    for (let i = 0; i < 3; i++) {
      const ang = (i / 3) * Math.PI * 2;
      const leg = new THREE.Mesh(legGeo, ironMat);
      leg.position.set(Math.cos(ang) * 0.22, 0.34, Math.sin(ang) * 0.22);
      leg.rotation.z = -Math.cos(ang) * 0.18;
      leg.rotation.x = Math.sin(ang) * 0.18;
      brazierGroup.add(leg);
    }

    // Glowing charcoal bed
    const coalGeo = new THREE.CylinderGeometry(0.32, 0.22, 0.08, 10);
    const coalMat = new THREE.MeshBasicMaterial({ color: 0xff5511 });
    const coal = new THREE.Mesh(coalGeo, coalMat);
    coal.position.y = 0.79;
    brazierGroup.add(coal);

    // Flickering flame cone
    const flameGeo = new THREE.ConeGeometry(0.26, 0.62, 7);
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xff9d3b,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.y = 1.08;
    brazierGroup.add(flame);
    this.brazierFlames.push(flame);

    parent.add(brazierGroup);
  }

  private buildWarDrum(x: number, y: number, z: number) {
    const drumGroup = new THREE.Group();
    drumGroup.position.set(x, y, z);

    // Drum wood stand
    const standMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.8 });
    const legGeo = new THREE.CylinderGeometry(0.08, 0.09, 1.4, 8);
    for (const angle of [0.5, 2.6, 3.6, 5.7]) {
      const leg = new THREE.Mesh(legGeo, standMat);
      leg.position.set(Math.cos(angle) * 0.6, 0.7, Math.sin(angle) * 0.6);
      leg.rotation.z = Math.cos(angle) * 0.25;
      drumGroup.add(leg);
    }

    // Drum barrel (大戰鼓)
    const drumGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.9, 20);
    const drumMat = new THREE.MeshStandardMaterial({ color: 0x9e2a2b, roughness: 0.5 });
    const drum = new THREE.Mesh(drumGeo, drumMat);
    drum.rotation.z = Math.PI / 2;
    drum.position.y = 1.35;
    drumGroup.add(drum);

    // Cowhide drum face
    const skinGeo = new THREE.CircleGeometry(0.85, 20);
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd9c5a0, roughness: 0.8 });
    const face1 = new THREE.Mesh(skinGeo, skinMat);
    face1.rotation.y = Math.PI / 2;
    face1.position.set(x > 0 ? -0.46 : 0.46, 1.35, 0);
    drumGroup.add(face1);

    this.scene.add(drumGroup);
  }

  private buildBannerPole(x: number, z: number, bannerTex: THREE.CanvasTexture) {
    const poleGeo = new THREE.CylinderGeometry(0.07, 0.1, 9, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.7 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(x, 4.5, z);
    this.scene.add(pole);

    // Gold finial spearhead on top
    const spearGeo = new THREE.ConeGeometry(0.18, 0.6, 6);
    const spearMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.3 });
    const spear = new THREE.Mesh(spearGeo, spearMat);
    spear.position.set(x, 9.2, z);
    this.scene.add(spear);

    // Cloth banner that waves in the wind
    const bannerGeo = new THREE.PlaneGeometry(1.6, 3.2, 8, 12);
    const bannerMat = new THREE.MeshStandardMaterial({
      map: bannerTex,
      side: THREE.DoubleSide,
      roughness: 0.7,
    });
    const banner = new THREE.Mesh(bannerGeo, bannerMat);
    banner.position.set(x + 0.8, 6.5, z);
    this.scene.add(banner);
    this.bannerMeshes.push(banner);
  }

  private buildWeaponRack(x: number, y: number, z: number) {
    const rackGroup = new THREE.Group();
    rackGroup.position.set(x, y, z);
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x3a2312, roughness: 0.8 });
    const steelMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.85, roughness: 0.25 });

    // Stand base
    const baseGeo = new THREE.BoxGeometry(0.5, 0.2, 3);
    const base = new THREE.Mesh(baseGeo, woodMat);
    base.position.y = 0.1;
    rackGroup.add(base);

    // Spears and Halberds
    for (let i = -1.2; i <= 1.2; i += 0.5) {
      const shaftGeo = new THREE.CylinderGeometry(0.025, 0.025, 2.6, 6);
      const shaft = new THREE.Mesh(shaftGeo, woodMat);
      shaft.position.set(0, 1.3, i);
      rackGroup.add(shaft);

      const bladeGeo = new THREE.ConeGeometry(0.06, 0.35, 4);
      const blade = new THREE.Mesh(bladeGeo, steelMat);
      blade.position.set(0, 2.7, i);
      rackGroup.add(blade);
    }

    this.scene.add(rackGroup);
  }

  private buildMountainHorizon() {
    // Majestic jagged mountain peaks on horizon
    this.mountainMat = new THREE.MeshStandardMaterial({
      color: 0x6e7882,
      roughness: 0.95,
      metalness: 0.05,
    });

    const segments = 24;
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const dist = 320 + Math.random() * 80;
      const height = 45 + Math.random() * 55;
      const width = 60 + Math.random() * 40;

      const peakGeo = new THREE.ConeGeometry(width, height, 5);
      const peak = new THREE.Mesh(peakGeo, this.mountainMat);
      peak.position.set(Math.sin(angle) * dist, height * 0.4, Math.cos(angle) * dist - 80);
      peak.scale.set(1.4, 1, 0.8);
      this.scene.add(peak);
    }
  }

  /**
   * Builds a subtle, stylized 3D wind particle system (Drifting Frontier Dust Motes + Wind Flow Wisps)
   * Provides an intuitive visual reading of current wind speed and direction across the range.
   */
  private buildWindParticles() {
    // 1. Soft radial glow sprite texture for frontier dust motes
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0, 'rgba(255, 244, 214, 0.95)');
    grad.addColorStop(0.45, 'rgba(235, 212, 175, 0.45)');
    grad.addColorStop(1, 'rgba(235, 212, 175, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const dustTex = new THREE.CanvasTexture(canvas);
    dustTex.colorSpace = THREE.SRGBColorSpace;

    this.windDustPositions = new Float32Array(this.windDustCount * 3);
    this.windDustSpeeds = new Float32Array(this.windDustCount);

    for (let i = 0; i < this.windDustCount; i++) {
      // Distribute across the archery lane from camera (Z=2) to downrange (Z=-115)
      this.windDustPositions[i * 3] = (Math.random() - 0.5) * 44;      // X: -22m to +22m
      this.windDustPositions[i * 3 + 1] = 0.25 + Math.random() * 6.5;  // Y: 0.25m to 6.75m
      this.windDustPositions[i * 3 + 2] = 2 - Math.random() * 115;     // Z: +2m to -113m
      this.windDustSpeeds[i] = 0.75 + Math.random() * 0.55;
    }

    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(this.windDustPositions, 3));

    this.dustMat = new THREE.PointsMaterial({
      map: dustTex,
      color: 0xffebd1,
      size: 0.34,
      transparent: true,
      opacity: 0.58,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.windDustPoints = new THREE.Points(dustGeo, this.dustMat);
    this.windDustPoints.frustumCulled = false;
    this.scene.add(this.windDustPoints);

    // 2. Stylized Wind Wisps / Airflow Streaks (流風氣韻線)
    // Each streak is a 2-vertex line segment aligned with the wind vector
    this.windStreakPositions = new Float32Array(this.windStreakCount * 6);
    this.windStreakAnchors = new Float32Array(this.windStreakCount * 3);
    this.windStreakPhases = new Float32Array(this.windStreakCount);

    for (let i = 0; i < this.windStreakCount; i++) {
      const ax = (Math.random() - 0.5) * 36;
      const ay = 0.6 + Math.random() * 5.2;
      const az = -1 - Math.random() * 95;

      this.windStreakAnchors[i * 3] = ax;
      this.windStreakAnchors[i * 3 + 1] = ay;
      this.windStreakAnchors[i * 3 + 2] = az;
      this.windStreakPhases[i] = Math.random() * Math.PI * 2;

      // Head and tail initialized at anchor
      this.windStreakPositions[i * 6] = ax;
      this.windStreakPositions[i * 6 + 1] = ay;
      this.windStreakPositions[i * 6 + 2] = az;
      this.windStreakPositions[i * 6 + 3] = ax;
      this.windStreakPositions[i * 6 + 4] = ay;
      this.windStreakPositions[i * 6 + 5] = az;
    }

    const streakGeo = new THREE.BufferGeometry();
    streakGeo.setAttribute('position', new THREE.BufferAttribute(this.windStreakPositions, 3));

    this.streakMat = new THREE.LineBasicMaterial({
      color: 0xe6d5b8,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    });

    this.windStreakLines = new THREE.LineSegments(streakGeo, this.streakMat);
    this.windStreakLines.frustumCulled = false;
    this.scene.add(this.windStreakLines);
  }

  /**
   * Advances drifting dust particles and stylized wind wisps according to windState
   * Incorporates Crosswind Turbulence eddies that swirl particles in high winds
   */
  private updateWindParticles(dt: number, time: number) {
    const wx = Math.sin(this.windState.directionAngle) * this.windState.speed;
    const wz = Math.cos(this.windState.directionAngle) * this.windState.speed;
    const turbFactor = BallisticsEngine.computeTurbulenceFactor(new THREE.Vector3(wx, 0, wz));

    // 1. Update Drifting Dust Motes with Crosswind Turbulence Eddies
    if (this.windDustPoints) {
      for (let i = 0; i < this.windDustCount; i++) {
        const idx = i * 3;
        const speedMul = this.windDustSpeeds[i];
        const pz = this.windDustPositions[idx + 2];

        // Turbulent vortex swirl perpendicular & vertical to wind flow at high wind speeds
        const eddyX = turbFactor * Math.sin(time * 7.5 + pz * 0.25 + i * 0.7) * 1.45;
        const eddyY = turbFactor * Math.cos(time * 6.0 + pz * 0.18 + i * 1.1) * 0.65;

        // Drift along wind vector + thermal undulation + turbulent crosswind eddies
        this.windDustPositions[idx] += (wx * speedMul * 1.35 + eddyX) * dt;
        this.windDustPositions[idx + 1] += (Math.sin(time * 1.5 + i) * 0.12 + eddyY) * dt;
        this.windDustPositions[idx + 2] += wz * speedMul * dt * 1.35;

        // Wrap within [-22, +22] on X, [0.2, 6.8] on Y, and [-115, +2] on Z
        if (this.windDustPositions[idx] > 22) this.windDustPositions[idx] -= 44;
        if (this.windDustPositions[idx] < -22) this.windDustPositions[idx] += 44;

        if (this.windDustPositions[idx + 1] > 6.8) this.windDustPositions[idx + 1] = 0.25;
        if (this.windDustPositions[idx + 1] < 0.2) this.windDustPositions[idx + 1] = 6.7;

        if (this.windDustPositions[idx + 2] > 2) this.windDustPositions[idx + 2] -= 117;
        if (this.windDustPositions[idx + 2] < -115) this.windDustPositions[idx + 2] += 117;
      }
      this.windDustPoints.geometry.attributes.position.needsUpdate = true;
    }

    // 2. Update Stylized Wind Flow Wisps (Length, velocity, and turbulent whip scale with wind speed)
    if (this.windStreakLines) {
      const dirX = Math.sin(this.windState.directionAngle);
      const dirZ = Math.cos(this.windState.directionAngle);
      // Tail length proportional to wind speed so stronger gusts produce longer wisps
      const streakLength = Math.max(0.45, Math.min(3.5, this.windState.speed * 0.44));
      const whipFreq = 3.0 + turbFactor * 6.5;

      for (let i = 0; i < this.windStreakCount; i++) {
        const aIdx = i * 3;
        const pIdx = i * 6;

        // Advance anchor along wind direction + subtle turbulent weave
        const anchorEddyX = turbFactor * Math.sin(time * 8.0 + this.windStreakPhases[i]) * 0.85;
        this.windStreakAnchors[aIdx] += (wx * 1.85 + anchorEddyX) * dt;
        this.windStreakAnchors[aIdx + 2] += wz * dt * 1.85;

        // Wrap anchors within shooting corridor
        if (this.windStreakAnchors[aIdx] > 18) this.windStreakAnchors[aIdx] -= 36;
        if (this.windStreakAnchors[aIdx] < -18) this.windStreakAnchors[aIdx] += 36;
        if (this.windStreakAnchors[aIdx + 2] > 1) this.windStreakAnchors[aIdx + 2] -= 96;
        if (this.windStreakAnchors[aIdx + 2] < -95) this.windStreakAnchors[aIdx + 2] += 96;

        const ax = this.windStreakAnchors[aIdx];
        const ay =
          this.windStreakAnchors[aIdx + 1] +
          Math.sin(time * (2.2 + turbFactor * 2.5) + this.windStreakPhases[i]) * (0.08 + turbFactor * 0.12);
        const az = this.windStreakAnchors[aIdx + 2];

        // Leading vertex
        this.windStreakPositions[pIdx] = ax;
        this.windStreakPositions[pIdx + 1] = ay;
        this.windStreakPositions[pIdx + 2] = az;

        // Trailing vertex (aligned opposite to wind vector with turbulent lateral/vertical whip)
        const tailWhipX = Math.sin(time * whipFreq + this.windStreakPhases[i]) * turbFactor * 0.22;
        const tailWhipY = Math.cos(time * whipFreq + this.windStreakPhases[i]) * (0.04 + turbFactor * 0.14);
        this.windStreakPositions[pIdx + 3] = ax - dirX * streakLength + tailWhipX;
        this.windStreakPositions[pIdx + 4] = ay + tailWhipY;
        this.windStreakPositions[pIdx + 5] = az - dirZ * streakLength;
      }
      this.windStreakLines.geometry.attributes.position.needsUpdate = true;
    }
  }

  /**
   * Builds the Traditional Archery Target Butt (皮侯) on timber tripod
   */
  public buildTarget(distance: number, radius: number = 0.6) {
    if (this.targetGroup) {
      this.scene.remove(this.targetGroup);
      this.brazierFlames = this.brazierFlames.slice(0, 2);
    }

    this.targetDistance = distance;
    this.targetRadius = radius;

    this.targetGroup = new THREE.Group();
    const targetZ = -distance;
    const targetY = 1.60; // eye height
    this.targetGroup.position.set(0, targetY, targetZ);

    const targetTex = TextureGenerator.createTargetTexture(this.renderer);

    // 1. Straw Target Butt Body (草圓靶)
    const strawMat = new THREE.MeshStandardMaterial({
      color: 0x8a704c,
      roughness: 0.95,
      metalness: 0.02,
    });
    const strawGeo = new THREE.CylinderGeometry(radius * 1.08, radius * 1.08, 0.28, 32);
    const strawButt = new THREE.Mesh(strawGeo, strawMat);
    strawButt.rotation.x = Math.PI / 2;
    strawButt.castShadow = !this.isSoftwareGl;
    strawButt.receiveShadow = !this.isSoftwareGl;
    this.targetGroup.add(strawButt);

    // 2. Target Canvas Face (皮侯布面)
    const faceGeo = new THREE.CircleGeometry(radius, 32);
    this.targetFaceMat = new THREE.MeshStandardMaterial({
      map: targetTex,
      roughness: 0.8,
      metalness: 0.05,
      emissive: new THREE.Color(0x3a1d08),
      emissiveIntensity: 0.05,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const face = new THREE.Mesh(faceGeo, this.targetFaceMat);
    face.position.z = 0.15; // slightly in front of straw
    this.targetGroup.add(face);

    // 3. Brass Bell / Chime on top of bullseye frame (金鐸/金鈴)
    const bellMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.9,
      roughness: 0.2,
    });
    const bellGeo = new THREE.CylinderGeometry(0.06, 0.12, 0.22, 12);
    const bell = new THREE.Mesh(bellGeo, bellMat);
    bell.position.set(0, radius + 0.18, 0.05);
    this.targetGroup.add(bell);

    // 4. Timber Tripod Stand (三足木支架)
    const standMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.85 });
    const legGeo = new THREE.CylinderGeometry(0.06, 0.08, targetY * 1.45, 8);

    // Two front legs
    for (const sx of [-1, 1]) {
      const frontLeg = new THREE.Mesh(legGeo, standMat);
      frontLeg.position.set(sx * radius * 0.75, -targetY * 0.45, -0.05);
      frontLeg.rotation.z = -sx * 0.22;
      frontLeg.castShadow = !this.isSoftwareGl;
      this.targetGroup.add(frontLeg);
    }
    // One back support leg
    const backLeg = new THREE.Mesh(legGeo, standMat);
    backLeg.position.set(0, -targetY * 0.45, -0.6);
    backLeg.rotation.x = 0.35;
    backLeg.castShadow = !this.isSoftwareGl;
    this.targetGroup.add(backLeg);

    // 5. Flanking Target Torch Braziers (皮侯照明鐵火盆 - Ignites during Golden Hour & Sunset)
    this.buildFireBrazier(this.targetGroup, -(radius + 0.95), -targetY, 0.55);
    this.buildFireBrazier(this.targetGroup, radius + 0.95, -targetY, 0.55);

    this.targetBrazierLight = new THREE.PointLight(0xff7e2e, 0.6, 12, 1.35);
    this.targetBrazierLight.position.set(0, 0.15, 1.35);
    this.targetGroup.add(this.targetBrazierLight);

    this.scene.add(this.targetGroup);

    // Target Collision Plane definition for physics
    this.targetCollisionPlane = {
      center: new THREE.Vector3(0, targetY, targetZ + 0.15),
      normal: new THREE.Vector3(0, 0, 1),
      radius: this.targetRadius,
      bullseyeCenter: new THREE.Vector3(0, targetY, targetZ + 0.15),
    };

    this.updateTargetCamera();
    this.applyTimeOfDayAtmosphere(this.currentTimeOfDayProgress, this.clock.getElapsedTime());
  }

  /**
   * Updates Target View Camera position based on current target distance
   */
  private updateTargetCamera() {
    if (!this.targetCamera) return;
    this.targetCamera.position.set(1.4, 1.8, -this.targetDistance + 3.8);
    this.targetCamera.lookAt(0, 1.6, -this.targetDistance);
  }

  /**
   * Procedural Composite Recurve Horn Bow & Arrow (First-Person hero model)
   */
  private buildHeroBowAndArrow() {
    this.bowGroup = new THREE.Group();

    // Material finishes
    const hornMat = new THREE.MeshPhysicalMaterial({
      color: 0x1f1a17, // Polished black buffalo horn
      roughness: 0.18,
      metalness: 0.25,
      clearcoat: 0.8,
    });
    const woodBellyMat = new THREE.MeshStandardMaterial({
      color: 0x734822, // Mulberry / birch core
      roughness: 0.6,
    });
    const sinewMat = new THREE.MeshStandardMaterial({
      color: 0xc4a482, // Sinew backing with lacquer
      roughness: 0.75,
    });
    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.3,
      metalness: 0.85,
    });

    // 1. Bow Handle / Grip (把手)
    const gripGeo = new THREE.CylinderGeometry(0.024, 0.026, 0.18, 12);
    const gripMat = new THREE.MeshStandardMaterial({ color: 0x24201e, roughness: 0.9 });
    const grip = new THREE.Mesh(gripGeo, gripMat);
    this.bowGroup.add(grip);

    // Arrow pass plate on handle side (出箭口/骨墊)
    const plateGeo = new THREE.BoxGeometry(0.012, 0.06, 0.04);
    const plateMat = new THREE.MeshStandardMaterial({ color: 0xded8c8, roughness: 0.4 });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.set(-0.022, 0.02, -0.01);
    this.bowGroup.add(plate);

    // 2. Working Limbs (上弓臂 / 下弓臂)
    this.upperLimb = this.createCurvedLimb(1, hornMat, woodBellyMat, sinewMat, goldTrimMat);
    this.upperLimb.position.set(0, 0.09, 0);
    this.bowGroup.add(this.upperLimb);

    this.lowerLimb = this.createCurvedLimb(-1, hornMat, woodBellyMat, sinewMat, goldTrimMat);
    this.lowerLimb.position.set(0, -0.09, 0);
    this.bowGroup.add(this.lowerLimb);

    // 3. Dynamic Bowstring (弓弦)
    // 3 points: Upper tip, Nock center, Lower tip
    this.stringPositions = new Float32Array([
      0, 0.58, -0.04,  // Upper tip
      0, 0.0, 0.14,    // Center nock point
      0, -0.58, -0.04  // Lower tip
    ]);
    const stringGeo = new THREE.BufferGeometry();
    stringGeo.setAttribute('position', new THREE.BufferAttribute(this.stringPositions, 3));
    const stringMat = new THREE.LineBasicMaterial({ color: 0xf5f0e1, linewidth: 2 });
    this.bowStringLine = new THREE.Line(stringGeo, stringMat);
    this.bowGroup.add(this.bowStringLine);

    // 4. Hero Arrow (nocked on bow)
    this.arrowMesh = this.createArrowModel();
    this.arrowMesh.position.set(-0.018, 0.0, 0.14);
    this.bowGroup.add(this.arrowMesh);

    // Position bow in front of first-person camera
    this.bowGroup.position.set(0.18, -0.16, -0.42);
    this.bowGroup.rotation.y = 0.06;
    this.camera.add(this.bowGroup);

    // 5. Build 3D Ming-Era Waist Quiver (明代步射箭囊/撒袋) at lower-left of player HUD view
    this.buildPlayerQuiver();

    this.scene.add(this.camera);
  }

  /**
   * Builds a 3D Ming-era lacquered leather & brass-trimmed waist quiver holding 6 fanned 3D arrows
   */
  private buildPlayerQuiver() {
    this.quiverGroup = new THREE.Group();
    this.quiverArrows = [];

    // Quiver leather body (黑漆壓花皮箭壺)
    const leatherMat = new THREE.MeshStandardMaterial({
      color: 0x261712,
      roughness: 0.55,
      metalness: 0.15,
    });
    const crimsonSilkMat = new THREE.MeshStandardMaterial({
      color: 0x7c1d1d,
      roughness: 0.65,
      metalness: 0.1,
    });
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.28,
      metalness: 0.85,
    });

    // Main quiver scabbard tube
    const bodyGeo = new THREE.CylinderGeometry(0.048, 0.036, 0.34, 16);
    const bodyMesh = new THREE.Mesh(bodyGeo, leatherMat);
    bodyMesh.position.y = -0.17;
    bodyMesh.scale.set(1.35, 1, 0.72);
    this.quiverGroup.add(bodyMesh);

    // Crimson brocade throat wrap (織錦壺口)
    const throatGeo = new THREE.CylinderGeometry(0.051, 0.049, 0.065, 16);
    const throatMesh = new THREE.Mesh(throatGeo, crimsonSilkMat);
    throatMesh.position.y = -0.025;
    throatMesh.scale.set(1.36, 1, 0.74);
    this.quiverGroup.add(throatMesh);

    // Upper & Middle Brass Rim Fittings (黃銅束箍)
    const upperRimGeo = new THREE.CylinderGeometry(0.053, 0.053, 0.014, 16);
    const upperRim = new THREE.Mesh(upperRimGeo, brassMat);
    upperRim.position.y = 0.005;
    upperRim.scale.set(1.37, 1, 0.75);
    this.quiverGroup.add(upperRim);

    const midRim = new THREE.Mesh(upperRimGeo, brassMat);
    midRim.position.y = -0.11;
    midRim.scale.set(1.28, 1, 0.70);
    this.quiverGroup.add(midRim);

    // 6 Individual 3D Ming-era Arrows fanned inside the quiver
    // Oriented with nock and eagle feather fletchings protruding upward out of the quiver mouth
    for (let i = 0; i < 6; i++) {
      const arrowWrapper = new THREE.Group();
      const arrow3D = this.createArrowModel();

      // Rotate so nock (+Z in arrow model) points upward (+Y) and tip (-Z) sits deep inside quiver (-Y)
      arrow3D.rotation.x = Math.PI / 2;
      // Add subtle authentic axial spin so eagle feathers interlock naturally
      arrow3D.rotation.z = i * 0.9;
      arrowWrapper.add(arrow3D);

      // Fan the 6 arrows neatly across the quiver opening
      const spreadIndex = i - 2.5;
      arrowWrapper.position.set(
        spreadIndex * 0.015,
        0.16 + (i % 2) * 0.012,
        (i % 2 === 0 ? 1 : -1) * 0.008
      );
      arrowWrapper.rotation.z = -spreadIndex * 0.045;
      arrowWrapper.rotation.x = (i % 2 === 0 ? 1 : -1) * 0.025;

      this.quiverGroup.add(arrowWrapper);
      this.quiverArrows.push(arrowWrapper);
    }

    // Position in lower-left peripheral vision of the archer
    this.quiverGroup.position.set(-0.32, -0.26, -0.52);
    this.quiverGroup.rotation.set(0.24, 0.32, -0.18);
    this.camera.add(this.quiverGroup);
  }

  /**
   * Updates the real-time 3D arrows visible in the quiver as the player shoots
   */
  public setRemainingArrows(remainingCount: number) {
    this.remainingQuiverCount = Math.max(0, Math.min(6, remainingCount));
    for (let i = 0; i < this.quiverArrows.length; i++) {
      this.quiverArrows[i].visible = i < this.remainingQuiverCount;
    }
  }

  /**
   * Helper to build authentic Asiatic static recurve limb with siyah
   */
  private createCurvedLimb(
    direction: number,
    hornMat: THREE.Material,
    woodMat: THREE.Material,
    sinewMat: THREE.Material,
    goldMat: THREE.Material
  ): THREE.Group {
    const limbGroup = new THREE.Group();

    // Curved working limb curve
    const curvePoints: THREE.Vector3[] = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, direction * 0.18, -0.05),
      new THREE.Vector3(0, direction * 0.36, -0.09),
    ];
    const limbCurve = new THREE.CatmullRomCurve3(curvePoints);
    const limbGeo = new THREE.TubeGeometry(limbCurve, 16, 0.018, 8, false);
    const limbMesh = new THREE.Mesh(limbGeo, hornMat);
    limbGroup.add(limbMesh);

    // Siyah (弓梢 - rigid wooden tip angled forward)
    const siyahGeo = new THREE.CylinderGeometry(0.012, 0.016, 0.18, 8);
    const siyah = new THREE.Mesh(siyahGeo, woodMat);
    siyah.position.set(0, direction * 0.44, -0.06);
    siyah.rotation.x = direction * 0.45;
    limbGroup.add(siyah);

    // String Bridge (弦墊)
    const bridgeGeo = new THREE.BoxGeometry(0.02, 0.02, 0.03);
    const bridge = new THREE.Mesh(bridgeGeo, goldMat);
    bridge.position.set(0, direction * 0.37, -0.08);
    limbGroup.add(bridge);

    return limbGroup;
  }

  /**
   * Creates a detailed Chinese bamboo arrow model
   */
  private createArrowModel(): THREE.Group {
    const arrow = new THREE.Group();

    // 1. Bamboo Shaft (竹箭桿 - 0.78m length)
    const shaftGeo = new THREE.CylinderGeometry(0.0042, 0.0042, 0.78, 8);
    const shaftMat = new THREE.MeshStandardMaterial({
      color: 0x9b7653,
      roughness: 0.6,
      metalness: 0.05,
    });
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    shaft.rotation.x = Math.PI / 2;
    shaft.position.z = -0.39;
    arrow.add(shaft);

    // 2. Steel Broadhead / Target Point (鐵鈹箭鏃)
    const tipGeo = new THREE.ConeGeometry(0.009, 0.06, 4);
    const tipMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.9,
      roughness: 0.2,
    });
    const tip = new THREE.Mesh(tipGeo, tipMat);
    tip.rotation.x = -Math.PI / 2;
    tip.position.z = -0.81;
    arrow.add(tip);

    // 3. Eagle Feather Fletching (三羽雕翎)
    const featherMat = new THREE.MeshStandardMaterial({
      color: 0xf5f5f0,
      roughness: 0.8,
      side: THREE.DoubleSide,
    });
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const featherGeo = new THREE.PlaneGeometry(0.024, 0.14);
      const feather = new THREE.Mesh(featherGeo, featherMat);
      feather.position.set(Math.cos(angle) * 0.016, Math.sin(angle) * 0.016, -0.08);
      feather.rotation.z = angle;
      arrow.add(feather);
    }

    // 4. Horn Nock (角質箭尾)
    const nockGeo = new THREE.CylinderGeometry(0.0045, 0.0045, 0.025, 8);
    const nockMat = new THREE.MeshStandardMaterial({ color: 0x242424, roughness: 0.4 });
    const nock = new THREE.Mesh(nockGeo, nockMat);
    nock.rotation.x = Math.PI / 2;
    nock.position.z = 0.01;
    arrow.add(nock);

    return arrow;
  }

  /**
   * Standalone arrow mesh for aerodynamic flight
   */
  private buildFlightArrow() {
    this.flyingArrowMesh = this.createArrowModel();
    this.flyingArrowMesh.visible = false;
    this.scene.add(this.flyingArrowMesh);
  }

  /**
   * Set dynamic wind parameters
   */
  public setWind(speed: number, angleRad: number, name: string) {
    this.windState = {
      speed,
      directionAngle: angleRad,
      directionName: name,
    };
    if (this.onWindUpdateCallback) {
      this.onWindUpdateCallback(this.windState);
    }
  }

  /**
   * Updates Draw State (holding to draw tension)
   */
  public updateDrawTension(tension: number, breathElapsed: number) {
    this.drawTension = Math.max(0, Math.min(1, tension));
    this.breathTime = breathElapsed;

    // Flex limbs backward
    const flexAngle = this.drawTension * 0.22;
    this.upperLimb.rotation.x = -flexAngle;
    this.lowerLimb.rotation.x = flexAngle;

    // Pull string nock back towards camera (Index 5 is Z)
    const pullBackZ = 0.14 + this.drawTension * 0.28;
    this.stringPositions[4] = 0.0;
    this.stringPositions[5] = pullBackZ;
    this.bowStringLine.geometry.attributes.position.needsUpdate = true;

    // Pull arrow back along with string
    this.arrowMesh.position.z = pullBackZ;

    // Play tension audio creak
    if (this.drawTension > 0.05 && Math.random() < 0.2) {
      archeryAudio.playDrawTension(this.drawTension);
    }

    // Breath stamina calculation:
    // Optimal breathing zone: 1.2s to 3.2s
    // Holding > 3.8s causes muscle fatigue tremor
    let stamina = 1.0;
    let isFatigued = false;
    if (breathElapsed > 0) {
      stamina = Math.max(0, 1 - breathElapsed / 5.5);
      isFatigued = breathElapsed > 3.8;
    }

    if (this.drawTension > 0.01) {
      archeryAudio.updateBreathing(breathElapsed, stamina, isFatigued);
    } else {
      archeryAudio.stopBreathing(false);
    }

    if (this.onStaminaUpdate) {
      this.onStaminaUpdate(stamina, isFatigued);
    }
  }

  /**
   * Adjusts aim point with mouse movement
   */
  public applyAimOffset(deltaX: number, deltaY: number) {
    const sensitivity = 0.0016;
    this.aimSway.x -= deltaX * sensitivity;
    this.aimSway.y -= deltaY * sensitivity;

    // Pitch & Yaw constraints
    this.aimSway.x = Math.max(-0.55, Math.min(0.55, this.aimSway.x));
    this.aimSway.y = Math.max(-0.22, Math.min(0.32, this.aimSway.y));
  }

  /**
   * Releases the arrow into aerodynamic flight
   */
  public releaseArrow(bow: BowConfig): ShotResult | null {
    // Always guarantee minimum power so every user click/release launches the arrow
    const effectiveTension = Math.max(0.45, this.drawTension);
    this.drawTension = effectiveTension;

    archeryAudio.setBowDrawWeight(bow.drawWeightLbs);
    archeryAudio.playRelease(bow.drawWeightLbs, effectiveTension);

    // Calculate launch world position & direction
    const launchPos = new THREE.Vector3();
    this.arrowMesh.getWorldPosition(launchPos);

    const launchDir = new THREE.Vector3(0, 0, -1);
    launchDir.applyQuaternion(this.camera.quaternion);

    // Add progressive release deviation when stamina is low (< 35%) or fatigued (> 3.8s)
    const staminaRemaining = Math.max(0, 1 - this.breathTime / 5.5);
    if (staminaRemaining < 0.35 || this.breathTime > 3.8) {
      const lowStaminaFactor = Math.max(0, (0.35 - staminaRemaining) / 0.35);
      const fatigueFactor = this.breathTime > 3.8 ? Math.min(1.5, (this.breathTime - 3.8) * 0.6) : 0;
      const totalShake = (lowStaminaFactor * 0.012) + (fatigueFactor * 0.022);
      launchDir.x += (Math.random() - 0.5) * totalShake;
      launchDir.y += (Math.random() - 0.5) * totalShake;
      launchDir.normalize();
    }

    // Launch speed and arrow mass based on draw tension and bow rating
    const launchSpeed = bow.initialVelocity * (0.6 + this.drawTension * 0.4);
    this.activeArrowMassKg = (bow.arrowMassGrams || 35) / 1000;

    this.currentArrowState = {
      position: launchPos.clone(),
      velocity: launchDir.clone().multiplyScalar(launchSpeed),
      orientation: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), launchDir),
      flightTime: 0,
      distanceTraveled: 0,
      initialSpeed: launchSpeed,
      isStuck: false,
      turbulencePhase: Math.random() * Math.PI * 2,
    };

    // Hide nocked arrow, show flying arrow
    this.arrowMesh.visible = false;
    this.flyingArrowMesh.visible = true;
    this.flyingArrowMesh.position.copy(launchPos);
    this.flyingArrowMesh.quaternion.copy(this.currentArrowState.orientation);

    // Initialize chase camera right behind the launched arrow
    const velocityDir = launchDir.clone().normalize();
    this.chaseCamera.position
      .copy(launchPos)
      .addScaledVector(velocityDir, -1.6)
      .add(new THREE.Vector3(0.18, 0.25, 0));
    this.chaseCamera.lookAt(launchPos.clone().addScaledVector(velocityDir, 8));

    // Reset bowstring & limbs
    this.updateDrawTension(0, 0);

    // Start arrow whistling audio (with dual-tone war whistle on heavy bows)
    archeryAudio.startArrowWhistle(launchSpeed, bow.drawWeightLbs);

    return null;
  }

  /**
   * Resets bow to nocked state for the next arrow (Preserves user's chosen camera mode!)
   */
  public readyNextArrow() {
    this.currentArrowState = null;
    this.flyingArrowMesh.visible = false;
    this.arrowMesh.visible = true;
    this.updateDrawTension(0, 0);
    this.camera.position.copy(this.cameraBasePosition);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.z = 0;
    archeryAudio.stopBreathing(false);
    archeryAudio.playArrowNock();
  }

  /**
   * Clears embedded arrows on target
   */
  public clearEmbeddedArrows() {
    while (this.embeddedArrowsGroup.children.length > 0) {
      const obj = this.embeddedArrowsGroup.children[0];
      this.embeddedArrowsGroup.remove(obj);
    }
  }

  public setCameraMode(mode: CameraViewMode) {
    this.currentCameraMode = mode;
    this.camera.position.copy(this.cameraBasePosition);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.z = 0;
  }

  /**
   * Sets the target time-of-day progression (0.0 = Sunrise Mist, 0.5 = High Sun, 0.8 = Golden Hour, 1.0 = Frontier Sunset)
   */
  public setTimeOfDayProgress(progress: number, immediate: boolean = false) {
    this.targetTimeOfDayProgress = Math.max(0, Math.min(1, progress));
    if (immediate) {
      this.currentTimeOfDayProgress = this.targetTimeOfDayProgress;
      this.applyTimeOfDayAtmosphere(this.currentTimeOfDayProgress, this.clock.getElapsedTime());
    }
  }

  /**
   * Interpolates sky dome, solar trajectory, fog density, directional shadows, and torch braziers
   * from Sunrise (卯時破曉) through Midday (午時驕陽) to Golden Hour & Sunset (申酉斜陽暮靄)
   */
  private applyTimeOfDayAtmosphere(progress: number, time: number) {
    const p = Math.max(0, Math.min(1, progress));

    // Keyframe stops across the 6-arrow exam (0.0 -> 1.0)
    const stops = [
      {
        t: 0.0, // 卯時 · 破曉晨霧 (Sunrise Mist)
        sunPos: new THREE.Vector3(85, 15, -68),
        zenith: new THREE.Color(0x2d3f5e),
        horizon: new THREE.Color(0xd1947c),
        sunCol: new THREE.Color(0xffa873),
        sunInt: 1.5,
        hemiSky: new THREE.Color(0x889ec2),
        hemiGround: new THREE.Color(0x3f3028),
        hemiInt: 0.65,
        rimCol: new THREE.Color(0xf09f72),
        rimInt: 0.85,
        mountainCol: new THREE.Color(0x5c5b6e),
        dustCol: new THREE.Color(0xffcfb3),
        fogDensity: 0.0082,
        exposure: 1.0,
        brazierGlow: 0.48,
      },
      {
        t: 0.2, // 辰時 · 旭日初升 (Morning Clear)
        sunPos: new THREE.Vector3(64, 38, -24),
        zenith: new THREE.Color(0x4b709c),
        horizon: new THREE.Color(0xdac3a5),
        sunCol: new THREE.Color(0xffe1ba),
        sunInt: 2.05,
        hemiSky: new THREE.Color(0xadc7e3),
        hemiGround: new THREE.Color(0x544233),
        hemiInt: 0.88,
        rimCol: new THREE.Color(0xeac59b),
        rimInt: 0.72,
        mountainCol: new THREE.Color(0x697480),
        dustCol: new THREE.Color(0xffeacc),
        fogDensity: 0.0055,
        exposure: 1.12,
        brazierGlow: 0.12,
      },
      {
        t: 0.4, // 巳時 · 晴空朗照 (High Forenoon)
        sunPos: new THREE.Vector3(34, 66, 20),
        zenith: new THREE.Color(0x5882b0),
        horizon: new THREE.Color(0xdce0e3),
        sunCol: new THREE.Color(0xfff6e6),
        sunInt: 2.45,
        hemiSky: new THREE.Color(0xc4dbf0),
        hemiGround: new THREE.Color(0x614e3c),
        hemiInt: 1.02,
        rimCol: new THREE.Color(0xebd2b0),
        rimInt: 0.65,
        mountainCol: new THREE.Color(0x727d87),
        dustCol: new THREE.Color(0xfff5e0),
        fogDensity: 0.0040,
        exposure: 1.18,
        brazierGlow: 0.0,
      },
      {
        t: 0.6, // 午未 · 塞上驕陽 (Frontier High Sun)
        sunPos: new THREE.Vector3(-24, 64, 18),
        zenith: new THREE.Color(0x51749c),
        horizon: new THREE.Color(0xd7c5a6),
        sunCol: new THREE.Color(0xffedd0),
        sunInt: 2.35,
        hemiSky: new THREE.Color(0xbad0e6),
        hemiGround: new THREE.Color(0x5d4935),
        hemiInt: 0.95,
        rimCol: new THREE.Color(0xe8bd8a),
        rimInt: 0.78,
        mountainCol: new THREE.Color(0x70767d),
        dustCol: new THREE.Color(0xffe8c2),
        fogDensity: 0.0048,
        exposure: 1.14,
        brazierGlow: 0.05,
      },
      {
        t: 0.8, // 申時 · 斜陽金暉 (Golden Hour)
        sunPos: new THREE.Vector3(-74, 23, -44),
        zenith: new THREE.Color(0x463d5c),
        horizon: new THREE.Color(0xde8343),
        sunCol: new THREE.Color(0xff943d),
        sunInt: 1.92,
        hemiSky: new THREE.Color(0xc78665),
        hemiGround: new THREE.Color(0x452e20),
        hemiInt: 0.70,
        rimCol: new THREE.Color(0xff903b),
        rimInt: 1.28,
        mountainCol: new THREE.Color(0x5e4a4e),
        dustCol: new THREE.Color(0xffb870),
        fogDensity: 0.0068,
        exposure: 1.05,
        brazierGlow: 0.75,
      },
      {
        t: 1.0, // 酉時 · 長河落日 (Deep Golden Hour / Sunset)
        sunPos: new THREE.Vector3(-88, 10, -78),
        zenith: new THREE.Color(0x251f36),
        horizon: new THREE.Color(0xb54d2e),
        sunCol: new THREE.Color(0xff6229),
        sunInt: 1.35,
        hemiSky: new THREE.Color(0x8a4e42),
        hemiGround: new THREE.Color(0x2b1c15),
        hemiInt: 0.46,
        rimCol: new THREE.Color(0xff6630),
        rimInt: 1.45,
        mountainCol: new THREE.Color(0x3d2c35),
        dustCol: new THREE.Color(0xff8e52),
        fogDensity: 0.0090,
        exposure: 0.95,
        brazierGlow: 1.0,
      },
    ];

    // Find segment [s0, s1]
    let s0 = stops[0];
    let s1 = stops[stops.length - 1];
    for (let i = 0; i < stops.length - 1; i++) {
      if (p >= stops[i].t && p <= stops[i + 1].t) {
        s0 = stops[i];
        s1 = stops[i + 1];
        break;
      }
    }
    const span = Math.max(0.0001, s1.t - s0.t);
    const alpha = Math.max(0, Math.min(1, (p - s0.t) / span));

    // Interpolate values
    const sunPos = s0.sunPos.clone().lerp(s1.sunPos, alpha);
    const zenithCol = s0.zenith.clone().lerp(s1.zenith, alpha);
    const horizonCol = s0.horizon.clone().lerp(s1.horizon, alpha);
    const sunCol = s0.sunCol.clone().lerp(s1.sunCol, alpha);
    const sunInt = s0.sunInt + (s1.sunInt - s0.sunInt) * alpha;
    const hemiSky = s0.hemiSky.clone().lerp(s1.hemiSky, alpha);
    const hemiGround = s0.hemiGround.clone().lerp(s1.hemiGround, alpha);
    const hemiInt = s0.hemiInt + (s1.hemiInt - s0.hemiInt) * alpha;
    const rimCol = s0.rimCol.clone().lerp(s1.rimCol, alpha);
    const rimInt = s0.rimInt + (s1.rimInt - s0.rimInt) * alpha;
    const mountainCol = s0.mountainCol.clone().lerp(s1.mountainCol, alpha);
    const dustCol = s0.dustCol.clone().lerp(s1.dustCol, alpha);
    const fogDensity = s0.fogDensity + (s1.fogDensity - s0.fogDensity) * alpha;
    const exposure = s0.exposure + (s1.exposure - s0.exposure) * alpha;
    const brazierGlow = s0.brazierGlow + (s1.brazierGlow - s0.brazierGlow) * alpha;

    // 1. Update Key Sun Light & Celestial Sun Orb
    this.sunLight.position.copy(sunPos);
    this.sunLight.color.copy(sunCol);
    this.sunLight.intensity = sunInt;

    const sunDir = sunPos.clone().normalize();
    if (this.sunOrbGroup) {
      this.sunOrbGroup.position.copy(sunDir.clone().multiplyScalar(420));
      this.sunDiscMat.color.copy(sunCol).lerp(new THREE.Color(0xffffff), 0.35);
      this.sunHaloMat.color.copy(sunCol);
    }

    // 2. Update Sky Dome Shader & Scene Fog
    if (this.skyDomeMat) {
      this.skyDomeMat.uniforms.uZenithColor.value.copy(zenithCol);
      this.skyDomeMat.uniforms.uHorizonColor.value.copy(horizonCol);
      this.skyDomeMat.uniforms.uSunColor.value.copy(sunCol);
      this.skyDomeMat.uniforms.uSunDir.value.copy(sunDir);
    }
    this.scene.background = horizonCol;
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.copy(horizonCol);
      this.scene.fog.density = fogDensity;
    }

    // 3. Update Hemisphere, Rim Light & Exposure
    this.hemiLight.color.copy(hemiSky);
    this.hemiLight.groundColor.copy(hemiGround);
    this.hemiLight.intensity = hemiInt;

    this.rimLight.color.copy(rimCol);
    this.rimLight.intensity = rimInt;
    this.rimLight.position.set(-sunPos.x * 0.7, 28, -90);

    this.renderer.toneMappingExposure = exposure;

    // 4. Update Mountains & Wind Dust Tint
    if (this.mountainMat) {
      this.mountainMat.color.copy(mountainCol);
    }
    if (this.dustMat) {
      this.dustMat.color.copy(dustCol);
      this.dustMat.opacity = 0.48 + brazierGlow * 0.24;
    }
    if (this.streakMat) {
      this.streakMat.color.copy(dustCol);
    }

    // 5. Update Torch Braziers & Target Face Visibility in Golden Hour / Sunset
    const flicker = 0.88 + Math.sin(time * 13.0) * 0.07 + Math.cos(time * 23.0) * 0.05;
    if (this.targetBrazierLight) {
      this.targetBrazierLight.intensity = brazierGlow * 2.8 * flicker;
    }
    if (this.platformBrazierLight) {
      this.platformBrazierLight.intensity = brazierGlow * 1.6 * flicker;
    }
    if (this.targetFaceMat) {
      // Subtle warm firelight bounce on the target face when braziers are lit
      this.targetFaceMat.emissiveIntensity = brazierGlow * 0.16 * flicker;
    }

    for (let i = 0; i < this.brazierFlames.length; i++) {
      const flame = this.brazierFlames[i];
      const fMat = flame.material as THREE.MeshBasicMaterial;
      const activeScale = Math.max(0.18, brazierGlow);
      const wave = Math.sin(time * 14 + i * 2.1) * 0.08;
      flame.scale.set(
        activeScale * (1 + wave * 0.5),
        activeScale * (0.9 + Math.cos(time * 18 + i) * 0.18),
        activeScale * (1 - wave * 0.5)
      );
      fMat.opacity = Math.min(0.95, 0.25 + brazierGlow * 0.7);
    }
  }

  /**
   * Main Render & Physics Tick Loop
   */
  private startLoop() {
    const tick = () => {
      if (this.isDisposed) return;

      const dt = Math.min(this.clock.getDelta(), 0.05);
      const time = this.clock.getElapsedTime();

      // 0. Smoothly advance Time-of-Day lighting & brazier flicker
      const todDiff = this.targetTimeOfDayProgress - this.currentTimeOfDayProgress;
      if (Math.abs(todDiff) > 0.0005) {
        this.currentTimeOfDayProgress += todDiff * Math.min(1, dt * 1.8);
      } else {
        this.currentTimeOfDayProgress = this.targetTimeOfDayProgress;
      }
      this.applyTimeOfDayAtmosphere(this.currentTimeOfDayProgress, time);

      // 1. Fluttering Banners & Wind Particle System Animation
      for (let i = 0; i < this.bannerMeshes.length; i++) {
        const banner = this.bannerMeshes[i];
        const wave = Math.sin(time * (2.5 + this.windState.speed * 0.4) + i) * (0.12 + this.windState.speed * 0.025);
        banner.rotation.y = wave;
      }
      this.updateWindParticles(dt, time);

      // 2. Breath, Low-Stamina Tremor, and Aiming Sway (Always keep first-person camera cleanly aligned at shooting platform)
      this.camera.position.copy(this.cameraBasePosition);
      this.camera.rotation.order = 'YXZ';
      if (this.drawTension > 0) {
        const staminaRemaining = Math.max(0, 1 - this.breathTime / 5.5);
        const isOptimal = this.breathTime >= 1.2 && this.breathTime <= 3.5;

        // Base Lissajous breathing sway (minimal during optimal breath window)
        let swayMagnitude = isOptimal ? 0.0016 : 0.0032;
        let breathSpeed = isOptimal ? 1.6 : 2.2;

        // Progressive muscle tremor as stamina drops below 40% or enters fatigue (> 3.8s)
        let tremorX = 0;
        let tremorY = 0;

        if (staminaRemaining < 0.4 || this.breathTime > 3.5) {
          const lowStaminaRatio = Math.max(0, (0.4 - staminaRemaining) / 0.4); // 0 -> 1
          const fatigueBoost = this.breathTime > 3.8 ? Math.min(2.0, (this.breathTime - 3.8) * 0.75) : 0;
          const intensity = lowStaminaRatio * 0.009 + fatigueBoost * 0.014;

          // High-frequency muscle tremor harmonics
          tremorX =
            Math.sin(time * 28.0) * intensity * 0.65 +
            Math.cos(time * 43.0) * intensity * 0.35;
          tremorY =
            Math.cos(time * 31.0) * intensity * 0.65 +
            Math.sin(time * 47.0) * intensity * 0.35;

          // Physical bow hand micro-tremor in 3D space
          this.bowGroup.position.set(
            0.18 + tremorX * 0.45,
            -0.16 + tremorY * 0.45,
            -0.42
          );
        } else {
          this.bowGroup.position.set(0.18, -0.16, -0.42);
        }

        const swayX = Math.sin(time * breathSpeed) * swayMagnitude + tremorX;
        const swayY = Math.sin(time * breathSpeed * 1.6) * (swayMagnitude * 0.8) + tremorY;

        this.camera.rotation.y = this.aimSway.x + swayX;
        this.camera.rotation.x = this.aimSway.y + swayY;
        this.camera.rotation.z = 0;
      } else {
        this.bowGroup.position.set(0.18, -0.16, -0.42);
        this.camera.rotation.y = this.aimSway.x;
        this.camera.rotation.x = this.aimSway.y;
        this.camera.rotation.z = 0;
      }

      // 3. Arrow Ballistics Update
      if (this.currentArrowState && !this.currentArrowState.isStuck) {
        const windVec = new THREE.Vector3(
          Math.sin(this.windState.directionAngle) * this.windState.speed,
          0,
          Math.cos(this.windState.directionAngle) * this.windState.speed
        );

        const isFlying = BallisticsEngine.updateArrow(
          this.currentArrowState,
          windVec,
          this.activeArrowMassKg,
          this.targetCollisionPlane,
          dt,
          (result) => {
            // Impact occurred!
            archeryAudio.playImpact(result.score);
            this.onArrowStruck(result);
          }
        );

        if (isFlying) {
          this.flyingArrowMesh.position.copy(this.currentArrowState.position);
          this.flyingArrowMesh.quaternion.copy(this.currentArrowState.orientation);
          archeryAudio.updateArrowWhistle(this.currentArrowState.velocity.length());

          // Update dedicated chaseCamera cleanly behind and slightly above the arrow
          const flightDir = this.currentArrowState.velocity.clone().normalize();
          const desiredCamPos = this.currentArrowState.position
            .clone()
            .addScaledVector(flightDir, -1.65)
            .add(new THREE.Vector3(0.18, 0.26, 0));

          // Stop chase camera from penetrating target plane
          const minZ = -this.targetDistance + 2.2;
          if (desiredCamPos.z < minZ) {
            desiredCamPos.z = minZ;
          }

          this.chaseCamera.position.lerp(desiredCamPos, Math.min(1, dt * 22));
          const lookPoint = this.currentArrowState.position.clone().addScaledVector(flightDir, 4.0);
          this.chaseCamera.lookAt(lookPoint);
        }
      } else if (this.currentArrowState?.isStuck) {
        // When arrow is stuck in target/ground and chase mode is active, frame the embedded arrow smoothly
        const stuckPos = this.currentArrowState.position;
        const inspectPos = new THREE.Vector3(
          stuckPos.x + 0.65,
          Math.max(0.8, stuckPos.y + 0.25),
          stuckPos.z + 2.4
        );
        this.chaseCamera.position.lerp(inspectPos, Math.min(1, dt * 8));
        this.chaseCamera.lookAt(stuckPos);
      }

      // 4. Stuck Arrow Vibration (Damped Oscillation upon striking wood)
      if (this.currentArrowState?.isStuck && this.currentArrowState.wobbleIntensity! > 0.001) {
        this.currentArrowState.wobbleIntensity! *= 0.92; // Damping
        const shake = Math.sin(time * 45) * this.currentArrowState.wobbleIntensity! * 0.04;
        this.flyingArrowMesh.rotation.z += shake;
      }

      // 5. Select active camera without displacing player camera
      // - 'target_view': always show target close-up camera
      // - 'flight_chase': use first-person camera while drawing/aiming so player can aim properly,
      //   then automatically switch to chaseCamera the instant an arrow is launched/stuck!
      // - 'first_person': always use player first-person camera
      let activeCam: THREE.PerspectiveCamera = this.camera;
      if (this.currentCameraMode === 'target_view') {
        activeCam = this.targetCamera;
      } else if (this.currentCameraMode === 'flight_chase' && this.currentArrowState !== null) {
        activeCam = this.chaseCamera;
      }

      this.renderer.render(this.scene, activeCam);

      // Frame pacing
      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.afterDraw(tick);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 60);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private onArrowStruck(result: ShotResult) {
    // Clone arrow and stick it permanently onto target/ground
    const embeddedArrow = this.createArrowModel();
    embeddedArrow.position.copy(this.flyingArrowMesh.position);
    embeddedArrow.quaternion.copy(this.flyingArrowMesh.quaternion);
    this.embeddedArrowsGroup.add(embeddedArrow);

    if (this.onImpactCallback) {
      this.onImpactCallback(result);
    }
  }

  private onWindowResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.chaseCamera.aspect = width / height;
    this.chaseCamera.updateProjectionMatrix();
    this.targetCamera.aspect = width / height;
    this.targetCamera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public dispose() {
    this.isDisposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    window.removeEventListener('resize', this.onWindowResize);
    archeryAudio.stopBreathing(false);
    archeryAudio.stopArrowWhistle();
    this.renderer.dispose();
  }
}
