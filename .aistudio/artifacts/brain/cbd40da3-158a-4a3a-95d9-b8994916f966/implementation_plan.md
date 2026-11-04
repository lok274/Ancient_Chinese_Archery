# 中華傳統射箭：邊關演武 (Traditional Chinese Archery: Frontier Martial Trial)

A first-person 3D sports simulation recreating traditional Chinese archery (禮射与武舉之射) set in a Ming-Qing frontier mountain pass and fortress martial training ground, featuring authentic composite horn bow (角弓) mechanics, stamina-governed breath aiming sway, and realistic aerodynamic arrow flight physics.

## User Review & Critical Decisions

> [!IMPORTANT]
> The design below incorporates your confirmed selections from Phase 1:
> - **Historical Environment**: Ming-Qing Frontier Pass & Martial Training Ground (邊關重鎮·烽火演武場) with brick watchtowers, earthen range, ceremonial drums, wind banners, and mountain ridge vistas.
> - **Gameplay Progression**: Traditional Rite Archery (禮射) and Imperial Martial Exam (武舉試: 童試·鄉試·殿試) with progressive distances (20步 / 30m, 50步 / 60m, 90步 / 110m) and historical target targets (皮侯 / 鵠心).
> - **Bow Drawing & Ballistics**: Full hold-to-draw tension mechanic, breath stamina bar with heart pulsation sway, realistic parabolic gravity drop, crosswind drift, and dynamic camera follow / hit zoom.

- **Confirmed Decision 1**: First-person bow viewpoint showing composite horn bow limb deflection, bowstring draw, arrow nock, and thumb draw ring (扳指) alignment.
- **Confirmed Decision 2**: Procedural Web Audio API soundscape of bowstring hum, arrow whistling (鳴鏑/羽箭疾風), drum rolls, wind gusts, and wood-target impact resonance.
- **Confirmed Decision 3**: Collapsible ergonomic bottom dock for equipment inspection, wind indicator, round statistics, and martial rank progression without obstructing the 3D range.

---

## 1. Overview & Core Concept

- **What It Does**: Transports players into a historically grounded Chinese martial archery range. Players draw an authentic Ming-Qing horn bow, steady their breath against dynamic mountain winds, aim via traditional sightlines, and release arrows governed by real-time Newtonian kinematics (drag, mass, gravity, wind vector).
- **Target Audience & Persona**: Enthusiasts of traditional archery, Chinese martial arts history (六藝之射), and realistic 3D sports simulators who appreciate tactical breath control and authentic ballistics over arcade crosshairs.
- **Key Value**: Delivers the tactile thrill of traditional Asiatic thumb-draw archery with historical reverence, atmospheric frontier visuals, and precise physical feedback.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Entry & Martial Rite (起射禮儀)**:
   - Player starts on the raised stone archery platform facing the expansive martial ground.
   - Initial HUD introduces the current stage (e.g., 鄉試五十五步試), weather conditions (wind speed/direction), and target objective.
2. **Aiming & Drawing Mechanics (審固·引弦·屏息)**:
   - **Hold Left Click / Space / Touch**: Player enters draw stance; bow limbs flex back, string tensions, and camera gently draws closer into sightline.
   - **Breath Meter (神意氣息)**: Stamina drains smoothly while holding full draw. In the optimal green breath zone (1.5s–3.5s), sway is minimal; holding too long causes trembling muscle fatigue.
   - **Sightline & Sway**: Natural micro-drift influenced by wind gusts; player aligns arrow tip and target center (鵠心).
3. **Release & Ballistic Flight (發矢·穿楊)**:
   - **Release Mouse / Key**: Crisp bowstring snap sound (`twang`); arrow launches with initial velocity proportional to draw weight and release timing.
   - **Slow-Motion Flight Cam Toggle**: On long-distance or bullseye shots, an optional cinematic tracking camera follows the spinning fletching through the air into the target.
   - **Hit Impact & Scoring**: Arrow embeds into target wood or earthen embankment with vibration kinematics; historical scoring banner announces result (中鵠 10環, 穿正 9環, 命中 7環, 脱靶 0環).
4. **Martial Exam Progression (武科及第)**:
   - Complete rounds across 4 ranks: 武生 (Scholar-Archer), 武秀才 (Military Xiucai), 武舉人 (Provincial Graduate), and 武狀元 (Imperial Champion).

### Visual Identity & Theme
- **Aesthetic Direction**: Solemn, grand historical martial atmosphere—aged gray stone pavers, weathered rammed earth, cinnabar red wooden pillars, fluttering wind banners, and mist-shrouded mountain peaks.
- **Color Palette**:
  - Dominant Canvas: Aged Stone Gray (`#2C302E`), Terracotta Earth (`#8B5A2B`), Deep Forest Slate (`#1A2421`).
  - Structural Surfaces: Cinnabar Crimson (`#9E2A2B`), Weathered Pine Wood (`#4A3728`), Imperial Ochre (`#DDA15E`).
  - Accent / Focus: Gold Leaf (`#E0A96D`), Jade Green (`#2D6A4F` for optimal breath meter), Incandescent Red (`#BC4749` for wind drift alert).
- **Typography & Hierarchy**:
  - Headers: Traditional classical serif (`Cinzel` / `Noto Serif SC` / `Songti`) for ceremonial titles and imperial exam grades.
  - Telemetry & Physics Data: Clean tabular numerals (`JetBrains Mono` / `tabular-nums`) for wind speed (m/s), distance (步/m), and flight duration (s).
- **Component Styling & Layout**:
  - 100% unobstructed central 3D archery lane.
  - Minimalist top bar showing current Martial Rank, Round (1/6 arrows), and Accumulated Score.
  - Top-right subtle windsock / pennant direction compass.
  - Pinned collapsible bottom dock housing bow specs (draw weight: 45磅角弓), camera view switch, and slow-mo toggle.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Procedural 3D Environment vs External 3D Models**:
  - *Chosen Approach*: Fully procedural 3D modeling using Three.js built-in geometries, custom lathe/extrude shapes, and canvas-generated PBR textures for the frontier gate, target butts, pavilions, mountain terrain, and composite bow.
  - *Why*: Eliminates 404 network risks, delivers instant zero-load performance, and ensures high visual fidelity tailored strictly to historical dimensions.
- **Decision 2: Realistic Parabolic Kinematics vs Hitscan**:
  - *Chosen Approach*: Sub-stepped Verlet / Euler integration for arrow flight accounting for gravity ($9.81 m/s^2$), air drag coefficient ($C_d$), arrow mass ($35g$), and dynamic 3D wind velocity vector.
  - *Why*: Archery is fundamentally a ballistic sport; parabolic drop and wind reading are the core satisfaction of traditional marksmanship.
- **Decision 3: Native Web Audio Synthesizer**:
  - *Chosen Approach*: Procedural sound generator using Web Audio API nodes (bandpass-filtered noise for wind, decaying dual-sine for string pluck, resonant low-frequency click for wood thud, metallic chime for bell/bullseye).
  - *Why*: Zero external asset dependencies, zero latency, and dynamically responsive pitch/volume tied to shot velocity.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ARCHERY APP CONTAINER                           │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                      TOP RITUAL STATUS BAR                     │   │
│   │  [ Martial Rank: 武舉人 ]  [ Arrows: ●●●○○○ ]  [ Total: 48 pts ] │   │
│   └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                 THREE.JS 3D VIEWPORT CANVAS                    │   │
│   │  - Ming-Qing Frontier Pass (Gate tower, battlements, mountains) │   │
│   │  - Martial Archery Lane (30m / 60m / 110m target butts)        │   │
│   │  - First-Person Composite Horn Bow (Limb flex & string draw)   │   │
│   │  - Dynamic Wind Ribbons & Ground Particles                     │   │
│   │  - In-flight Arrow Ballistics Simulation & Impact Collision    │   │
│   └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                MINIMAL FLOATING AIM & BREATH HUD               │   │
│   │   [ Wind: 2.4 m/s ↗ ]    [ Breath Stamina: ──■■■■■── ]         │   │
│   └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │           COLLAPSIBLE BOTTOM DOCK (Zero Viewport Occlusion)    │   │
│   │   [ Bow Specs: 45lb 角弓 ] [ Distance: 50步 ] [ Slow-Mo: ON ]  │   │
│   └────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

### Component Hierarchy & State Flow
- `src/App.tsx`: Main application container orchestrating game states (`idle`, `drawing`, `aiming`, `released`, `flight`, `scored`, `round_summary`).
- `src/components/ArcheryCanvas.tsx`: Three.js lifecycle manager with WebGL context loss handling, resize observer, and input bindings (mouse/touch/keyboard).
- `src/three/ArcheryScene.ts`:
  - `EnvironmentBuilder`: Procedural Chinese frontier pass (great wall ramparts, gate tower with sloping tiled roof, archery flags, earthen ground, mountain backdrop, decorative weapon stands).
  - `BowModel`: Procedurally constructed Asian recurve composite horn bow with wood core, black buffalo horn belly, sinew backing, string bridge, nocked bamboo arrow with feather fletching, and dynamic string displacement.
  - `TargetRig`: Traditional round target butts (侯) on timber tripods with concentric scoring rings (10, 9, 8, 7, 5, 3 points), bullseye chime bell, and impact particle burst.
- `src/physics/BallisticsEngine.ts`:
  - Real-time physics simulation stepping arrow position, velocity, orientation (tangent to velocity trajectory), wind force, gravity, and collision detection against target planes and ground.
- `src/audio/ArcheryAudio.ts`:
  - Web Audio API procedural sound effects for draw tension creak, bowstring twang, arrow flight whistle, wind ambience, and solid wood target impact.
- `src/components/TopBar.tsx`: Clean semantic header with current martial exam title, arrow quiver indicators, and score summary.
- `src/components/AimReticleHUD.tsx`: Subtle sightline indicator with breath stamina meter and wind vane.
- `src/components/BottomControlDock.tsx`: Collapsible bottom dock with camera mode selector (First-Person, Chase Follow Cam, Target Cam), distance selector, and round reset.
- `src/components/ExamSummaryModal.tsx`: End-of-round martial evaluation showing shot grouping, accuracy percentage, and imperial grade promotion.
