# AGENT.md — Project Guide & AI Agent Instructions

## 1. Project Overview
**現代奧林匹克射箭錦標賽 · 中國射箭榮耀與千年射藝傳承 (Modern Olympic Archery Championship & Chinese Archery Heritage)** is a 3D interactive Olympic archery simulation and cultural-historical showcase built with React, TypeScript, Three.js, Tailwind CSS, and Express.

The application combines:
1. **3D First-Person Olympic Archery Simulation**: Realistic 70m / 50m / 90m WA (World Archery) 122cm 10-ring target ballistics, wind drift, gravity drop, stamina depletion with dynamic heartbeat pulse, and a tactical **Deep Breath (`Spacebar`)** stabilizer mechanic.
2. **Team China Olympic Achievements (`中國射箭隊奧運輝煌成就`)**: Showcasing Team China's Olympic medal history (1 Gold, 7 Silver, 2 Bronze), highlighting Zhang Juanjuan's historic 2008 Beijing Olympic individual gold medal that broke South Korea's 24-year streak, plus women's and men's team breakthroughs from 1984 Los Angeles to 2024 Paris.
3. **History of Archery in China (`射箭在中國的千年歷史`)**: A 28,000-year historical timeline spanning Paleolithic Shiyu stone arrowheads (`峙峪遺址石鏃`), Shang/Zhou Six Arts (`六藝「禮、樂、射、御、書、數」`), Warring States `Kao Gong Ji` (`《考工記·弓人》`) composite bow engineering, Han/Tang/Qing archery traditions, and modern Olympic recurve biomechanics.
4. **3D & Multi-Angle Posture Coach (`射藝姿態教練`)**: Interactive 3D skeletal/anatomical visualization comparing Olympic KSL (BEST) biomechanical alignment (`T-Shape Alignment`, `Back Tension / Scapular Draw`, `Anchor Point`) with traditional Chinese archery (`《射義》正己而後發`).
5. **Inquiry-Based Civic Education Layer (`探究學習層`)** *(v2)*: A structured inquiry system that turns the simulator into a learning platform for national identity education — material-science evolution lab, live biomechanics visualisation, national sports-tech data cards, guided inquiry missions, peer relay collaboration, and Hong Kong archery heritage anchors. See **Section 8**.

---

## 2. Educational Objectives (Civic / National Identity Education)

This project is designed as a **Civic and Citizenship Education inquiry tool**, not merely an entertainment game. All new features MUST serve at least one of the following four objectives. When adding content, state which objective(s) it serves in the code comment header.

1. **`OBJ-TECH` — 探究創新科技以認識國家發展**
   Let students *investigate* innovation and technology (materials science, engineering mechanics, sports science) as observable, manipulable phenomena, and connect them to national development in sports engineering and advanced materials.
2. **`OBJ-IDENTITY` — 深化對祖國的認識，培養國家觀念與國民身份認同**
   Move beyond medal-count narratives toward *development-pattern* narratives: why breakthroughs happened, what capability they demonstrated, and how tradition and modernity form a civilisational continuum.
3. **`OBJ-PEER` — 透過同儕協作推動認識國家**
   Enable paired/group investigation. Students produce, critique and share inquiry artefacts (telemetry reports, annotated sources, AI-assisted commentary) rather than only consuming content.
4. **`OBJ-HK` — 認識內地與香港系出同源的關係**
   Anchor Hong Kong explicitly in the national archery heritage narrative — never as an external observer, but as an active participant in an ongoing cultural exchange.

**Pedagogical pattern to follow (教育局公民科閱讀獎勵計劃式微迴圈):**
`閱讀材料 → 提問 → 反思 → 產出` . Every inquiry module must implement this cycle with a short source excerpt, a "why" question, a free-text reflection input, and a shareable artefact.

---

## 3. Tech Stack & Architecture
- **Frontend**: React 19, TypeScript, Tailwind CSS v4 (`@import "tailwindcss";`), Lucide React icons.
- **3D Rendering**: Three.js (`src/three/ArcheryScene.ts` & procedural textures in `src/three/TextureGenerator.ts`).
- **Physics Engine**: Custom RK4 / Euler step ballistic solver (`src/physics/BallisticsEngine.ts`) modeling arrow mass, draw weight, quadratic air drag, crosswind/headwind vectors, and 10-ring / X-ring scoring.
- **Audio**: Procedural Web Audio API synthesizer (`src/audio/ArcheryAudio.ts`) generating bowstring tension creaks, release twangs, arrow whooshes, target thuds, heartbeat pulses, and celebratory chimes with zero external MP3 dependencies.
- **Backend / Full-Stack**: Express + Vite middleware (`server.ts`) on port `3000`, providing `/api/archery-lore` with automatic static fallback (`src/data/staticHistoricalNotes.ts`) when deployed to static hosts like GitHub Pages.
- **Collaboration Layer (v2)**: Browser-only. `localStorage` for session persistence + URL hash (`#relay=<base64url>`) for sharing inquiry artefacts. **No new dependencies, no database, no auth.** Must degrade gracefully when `localStorage` is unavailable (private mode) — fall back to in-memory state with a visible warning.
- **Inquiry Content (v2)**: Static TypeScript data modules under `src/data/inquiry/`. All content is bundled at build time so it works identically on the Express server and on GitHub Pages.

---

## 4. Directory & File Structure
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
    │   ├── ArcheryGuideModal.tsx      # 5-tab modal: Team China, Chinese History, Rules, Bow Specs, 探究任務
    │   ├── BottomControlDock.tsx      # Compact bottom-left equipment selector & bottom-right action dock
    │   ├── BullseyeCalligraphyEffect.tsx # Non-blocking top celebration banner on 10-ring / X-ring hits
    │   ├── ExamSummaryModal.tsx       # End-of-round Olympic scorecard, medal evaluation & relay handoff
    │   ├── PostureCoachOverlay.tsx    # Interactive 3D & diagram Posture Coach (Front / Side / Top views)
    │   ├── Quiver3DHUD.tsx            # Compact bottom-right arrow quiver & round score tracker
    │   ├── ShotScoreBanner.tsx        # Top-right compact telemetry card & national tech data card
    │   ├── TopRitualBar.tsx           # Slim top navigation bar (Stage, Guide, Posture Coach, Audio, 力學疊加層)
    │   ├── MaterialEvolutionLab.tsx   # (v2) Arrowhead/bow material timeline slider + live trajectory morph
    │   ├── MechanicsOverlay.tsx       # (v2) Stress heatmap, cam transmission ratio, draw-force curve
    │   ├── InquiryMissionPanel.tsx    # (v2) Inquiry mission cards: source → question → reflection → artefact
    │   ├── RelayHandoffModal.tsx      # (v2) Peer relay: handoff code generation & partner report intake
    │   └── HKHeritagePanel.tsx        # (v2) Hong Kong archery heritage anchor panel
    ├── data/
    │   ├── staticHistoricalNotes.ts   # Offline/static historical & Olympic commentary fallback data
    │   └── inquiry/
    │       ├── materialTimeline.ts    # (v2) Stone→Bronze→Iron→Alloy→Composite arrowhead & bow data
    │       ├── sportsTechCases.ts     # (v2) National-team sports-science support data cards
    │       ├── inquiryMissions.ts     # (v2) Mission definitions (source text, question, rubric hint)
    │       ├── hkHeritageNotes.ts     # (v2) Hong Kong archery heritage records & exchange timeline
    │       └── sourceAnchors.ts       # (v2) Original-material excerpts for student annotation tasks
    ├── physics/
    │   └── BallisticsEngine.ts        # Bow specs, competition stages, wind generator & trajectory solver
    ├── three/
    │   ├── ArcheryScene.ts            # 3D Olympic stadium/range, 122cm WA target, bow, arrow & trail
    │   ├── MechanicsDebugLayer.ts     # (v2) Optional 3D stress/draw visualisation overlay
    │   └── TextureGenerator.ts        # Procedural canvas textures (10-ring target face, wood, stadium)
    ├── state/
    │   ├── useRelaySession.ts         # (v2) localStorage + URL-hash relay session hook
    │   └── useInquiryProgress.ts      # (v2) Per-mission progress & reflection persistence
    └── types/
        └── archery.ts                 # Shared TypeScript interfaces (BowSpec, StageConfig, ShotRecord, etc.)