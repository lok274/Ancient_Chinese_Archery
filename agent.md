# AGENT.md — Project Guide & AI Agent Instructions

## 1. Project Overview
**現代奧林匹克射箭錦標賽 · 中國射箭榮耀與千年射藝傳承 (Modern Olympic Archery Championship & Chinese Archery Heritage)** is a 3D interactive Olympic archery simulation and cultural-historical showcase built with React, TypeScript, Three.js, Tailwind CSS, and Express.

The application combines:
1. **3D First-Person Olympic Archery Simulation**: Realistic 70m / 50m / 90m WA (World Archery) 122cm 10-ring target ballistics, wind drift, gravity drop, stamina depletion with dynamic heartbeat pulse, and a tactical **Deep Breath (`Spacebar`)** stabilizer mechanic.
2. **Team China Olympic Achievements (`中國射箭隊奧運輝煌成就`)**: Showcasing Team China's Olympic medal history (1 Gold, 7 Silver, 2 Bronze), highlighting Zhang Juanjuan's historic 2008 Beijing Olympic individual gold medal that broke South Korea's 24-year streak, plus women's and men's team breakthroughs from 1984 Los Angeles to 2024 Paris.
3. **History of Archery in China (`射箭在中國的千年歷史`)**: A 28,000-year historical timeline spanning Paleolithic Shiyu stone arrowheads (`峙峪遺址石鏃`), Shang/Zhou Six Arts (`六藝「禮、樂、射、御、書、數」`), Warring States `Kao Gong Ji` (`《考工記·弓人》`) composite bow engineering, Han/Tang/Qing archery traditions, and modern Olympic recurve biomechanics.
4. **3D & Multi-Angle Posture Coach (`射藝姿態教練`)**: Interactive 3D skeletal/anatomical visualization comparing Olympic KSL (BEST) biomechanical alignment (`T-Shape Alignment`, `Back Tension / Scapular Draw`, `Anchor Point`) with traditional Chinese archery (`《射義》正己而後發`).

---

## 2. Tech Stack & Architecture
- **Frontend**: React 19, TypeScript, Tailwind CSS v4 (`@import "tailwindcss";`), Lucide React icons.
- **3D Rendering**: Three.js (`src/three/ArcheryScene.ts` & procedural textures in `src/three/TextureGenerator.ts`).
- **Physics Engine**: Custom RK4 / Euler step ballistic solver (`src/physics/BallisticsEngine.ts`) modeling arrow mass, draw weight, quadratic air drag, crosswind/headwind vectors, and 10-ring / X-ring scoring.
- **Audio**: Procedural Web Audio API synthesizer (`src/audio/ArcheryAudio.ts`) generating bowstring tension creaks, release twangs, arrow whooshes, target thuds, heartbeat pulses, and celebratory chimes with zero external MP3 dependencies.
- **Backend / Full-Stack**: Express + Vite middleware (`server.ts`) on port `3000`, providing `/api/archery-lore` with automatic static fallback (`src/data/staticHistoricalNotes.ts`) when deployed to static hosts like GitHub Pages.

---

## 3. Directory & File Structure
```text
/
├── .github/workflows/deploy.yml       # GitHub Actions CI/CD workflow for GitHub Pages
├── index.html                         # Entry HTML (Traditional Chinese metadata & fonts)
├── metadata.json                      # AI Studio applet metadata (DO NOT rename `name`)
├── package.json                       # Dependencies (MUST stay synced with bun.lock)
├── server.ts                          # Express + Vite dev/prod server on port 3000
├── vite.config.ts                     # Vite config (`base: './'` for GitHub Pages support)
└── src/
    ├── App.tsx                        # Main application state, keyboard/mouse handlers, game loop
    ├── main.tsx                       # React DOM mount
    ├── index.css                      # Tailwind CSS imports & custom keyframe animations
    ├── audio/
    │   └── ArcheryAudio.ts            # Web Audio API procedural sound engine
    ├── components/
    │   ├── AimReticleHUD.tsx          # Minimal center sight pin + peripheral wind/stamina/breath HUD
    │   ├── ArcheryCanvas.tsx          # Three.js canvas wrapper & pointer/keyboard bridge
    │   ├── ArcheryGuideModal.tsx      # 4-tab modal: Team China, Chinese History, Rules, Bow Specs
    │   ├── BottomControlDock.tsx      # Compact bottom-left equipment selector & bottom-right action dock
    │   ├── BullseyeCalligraphyEffect.tsx # Non-blocking top celebration banner on 10-ring / X-ring hits
    │   ├── ExamSummaryModal.tsx       # End-of-round (6-arrow / 12-arrow) Olympic scorecard & medal evaluation
    │   ├── PostureCoachOverlay.tsx    # Interactive 3D & diagram Posture Coach (Front / Side / Top views)
    │   ├── Quiver3DHUD.tsx            # Compact bottom-right arrow quiver & round score tracker
    │   ├── ShotScoreBanner.tsx        # Top-right compact telemetry card for shot score & ballistics
    │   └── TopRitualBar.tsx           # Slim top navigation bar (Stage selector, Guide, Posture Coach, Audio)
    ├── data/
    │   └── staticHistoricalNotes.ts   # Offline/static historical & Olympic commentary fallback data
    ├── physics/
    │   └── BallisticsEngine.ts        # Bow specs, competition stages, wind generator & trajectory solver
    ├── three/
    │   ├── ArcheryScene.ts            # 3D Olympic stadium/range, 122cm WA target, bow, arrow & trail
    │   └── TextureGenerator.ts        # Procedural canvas textures (10-ring target face, wood, stadium)
    └── types/
        └── archery.ts                 # Shared TypeScript interfaces (BowSpec, StageConfig, ShotRecord, etc.)
```

---

## 4. UI / HUD Spatial Layout Guidelines (CRITICAL)
To prevent HUD elements from cluttering the center of the screen or obstructing the player's aiming sightline:
1. **Center Viewport Must Remain Clear**:
   - Only a minimal, semi-transparent Olympic sight pin (`AimReticleHUD.tsx`) is permitted at the center (`50%, 50%`).
   - Never place modal banners, large text overlays, or stamina bars near the center reticle.
2. **Peripheral HUD Placement**:
   - **Top Bar (`TopRitualBar.tsx`)**: Slim header (`h-11`) for stage switching, wind badge, and modal triggers.
   - **Left Peripheral (`left-5`, `AimReticleHUD.tsx`)**: Compact wind-drift offset pill and vertical stamina bar with dynamic heartbeat pulse & `[Space] 屏息凝神` status.
   - **Top-Right (`top-14 right-4`, `ShotScoreBanner.tsx` & `BullseyeCalligraphyEffect.tsx`)**: Non-blocking (`pointer-events-none`) shot score card, ballistic telemetry (speed, flight time, wind drift, drop), and historical/Olympic insight.
   - **Bottom-Left (`bottom-3 left-4`, `BottomControlDock.tsx`)**: Compact bow selector pills (`奧運競技反曲弓 48lb`, `中華傳統筋角複合弓 55lb`, `專業滿弓重磅反曲弓 62lb`).
   - **Bottom-Right (`bottom-14 right-4` & `bottom-3 right-4`, `Quiver3DHUD.tsx` & `BottomControlDock.tsx`)**: Remaining arrows indicator, cumulative score, and Next Round / Reset controls.

---

## 5. Core Gameplay & Physics Mechanics
- **Drawing & Aiming**:
  - Hold **Left Mouse Button** on the 3D canvas to draw the bow (`drawProgress` from `0` to `1`).
  - Release **Left Mouse Button** to fire the arrow.
- **Stamina & Heartbeat Pulse**:
  - Holding full draw depletes `stamina` (`100` → `0`).
  - As stamina drops below `75%`, a visual and auditory heartbeat pulse accelerates (`duration = max(0.28s, 0.3 + (stamina / 100) * 0.85s)`), and aiming sway amplitude increases.
- **Deep Breath Stabilizer (`Spacebar`)**:
  - Holding `Spacebar` while drawing activates **Deep Breath (`屏息凝神`)**, reducing aiming sway by **78%** (`swayMultiplier = 0.22`) at the cost of **2.4x faster stamina depletion**.
  - If stamina hits `0`, the archer enters a fatigued state and Deep Breath automatically disengages.
- **Arrow Flight Trail**:
  - During flight, `ArcheryScene.ts` renders a dynamic ribbon/brush-stroke trail behind the arrow to visualize parabolic drop and crosswind drift against the stadium backdrop.

---

## 6. Build, Dev Server & GitHub Pages Deployment Rules

### Local Development Server (AI Studio Container)
- **Port**: Must always run on port `3000` via `"dev": "tsx server.ts"`.
- **`package.json` & `bun.lock` Sync (CRITICAL)**:
  - **NEVER** change dependency version specifiers in `/package.json` away from the exact versions recorded in `/bun.lock` (`"@google/genai": "^2.32.0"`, `"@tailwindcss/vite": "^4.3.3"`, `"@vitejs/plugin-react": "^6.1.1"`, `"three": "^0.187.0"`, `"typescript": "^7.0.2"`, `"vite": "^8.3.0"`).
  - Modifying `/package.json` version strings without updating `/bun.lock` will cause the container's dev server startup check to fail.
  - When editing `/package.json`, always use `replace_file_content` (never overwrite the file with `write_to_file`).

### GitHub Pages Static Deployment (`.github/workflows/deploy.yml`)
- **Relative Asset Paths**: `vite.config.ts` sets `base: './'` so built assets load properly under `https://<username>.github.io/<repo-name>/`.
- **Static API Fallback**: When deployed on GitHub Pages (where `server.ts` is not running), `App.tsx` catches `/api/archery-lore` fetch errors and seamlessly falls back to `getStaticHistoricalNote()` in `src/data/staticHistoricalNotes.ts`.
- **CI Version Normalization**: Because AI Studio's internal mirror versions in `package.json` differ from public `registry.npmjs.org`, `.github/workflows/deploy.yml` dynamically normalizes `package.json` inside the GitHub Actions runner before running `npm install --no-package-lock --legacy-peer-deps`. Do **not** enable `cache: 'npm'` in `actions/setup-node@v4` because the repository uses `bun.lock` rather than `package-lock.json`.

---

## 7. Verification Checklist for Agents
Before completing any code modification turn:
1. Run `compile_applet` and `lint_applet` together to verify zero TypeScript or Vite bundling errors.
2. Ensure `/metadata.json` retains its original `name` field.
3. Verify that all user-facing copy uses **Traditional Chinese (`繁體中文`)** with accurate Olympic archery terminology (e.g., `反曲弓`, `10環 / X環`, `70米奧運標準距離`, `張娟娟`, `六藝射禮`).
