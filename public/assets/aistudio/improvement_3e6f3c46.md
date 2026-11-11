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

5. UI / HUD Spatial Layout Guidelines (CRITICAL — DO NOT VIOLATE)
To prevent HUD elements from cluttering the center of the screen or obstructing the player's aiming sightline:

Center Viewport Must Remain Clear:

Only a minimal, semi-transparent Olympic sight pin (AimReticleHUD.tsx) is permitted at the center (50%, 50%).

Never place modal banners, large text overlays, stamina bars, inquiry cards, or mechanics legends near the center reticle.

Peripheral HUD Placement:

Top Bar (TopRitualBar.tsx): Slim header (h-11) for stage switching, wind badge, modal triggers, and the 力學疊加層 toggle icon (v2).

Left Peripheral (left-5, AimReticleHUD.tsx): Compact wind-drift offset pill and vertical stamina bar with dynamic heartbeat pulse & [Space] 屏息凝神 status.

Top-Right (top-14 right-4, ShotScoreBanner.tsx & BullseyeCalligraphyEffect.tsx): Non-blocking (pointer-events-none) shot score card, ballistic telemetry (speed, flight time, wind drift, drop), historical/Olympic insight, and national sports-tech data card (v2).

Bottom-Left (bottom-3 left-4, BottomControlDock.tsx): Compact bow selector pills (奧運競技反曲弓 48lb, 中華傳統筋角複合弓 55lb, 專業滿弓重磅反曲弓 62lb). The 材質演化實驗室 expander (v2) opens upward from here as a collapsible drawer — it MUST NOT expand horizontally into the aiming zone.

Bottom-Right (bottom-14 right-4 & bottom-3 right-4, Quiver3DHUD.tsx & BottomControlDock.tsx): Remaining arrows indicator, cumulative score, and Next Round / Reset controls.

In-3D-World Panels (not HUD): HKHeritagePanel.tsx is rendered as a clickable 3D prop inside ArcheryScene (a side-range exhibition board), not as a screen-space overlay. When opened, it fades the scene backdrop and shows a centred modal — the only permitted exception to rule 1, and only while the bow is not drawn.

Interaction Locking: Inquiry missions, heritage panels, and relay handoff must be unopenable while drawProgress > 0 or stamina < 30. Queue the request and show a subtle peripheral hint (射箭中，完成本箭後開啟) instead of interrupting.

6. Core Gameplay & Physics Mechanics (DO NOT REGRESS)
Drawing & Aiming:

Hold Left Mouse Button on the 3D canvas to draw the bow (drawProgress from 0 to 1).

Release Left Mouse Button to fire the arrow.

Stamina & Heartbeat Pulse:

Holding full draw depletes stamina (100 → 0).

As stamina drops below 75%, a visual and auditory heartbeat pulse accelerates (duration = max(0.28s, 0.3 + (stamina / 100) * 0.85s)), and aiming sway amplitude increases.

Deep Breath Stabilizer (Spacebar):

Holding Spacebar while drawing activates Deep Breath (屏息凝神), reducing aiming sway by 78% (swayMultiplier = 0.22) at the cost of 2.4x faster stamina depletion.

If stamina hits 0, the archer enters a fatigued state and Deep Breath automatically disengages.

Arrow Flight Trail:

During flight, ArcheryScene.ts renders a dynamic ribbon/brush-stroke trail behind the arrow to visualize parabolic drop and crosswind drift against the stadium backdrop.

Instrumentation Rule: Any v2 visualisation (stress heatmap, draw-force curve, material trajectory morph) is read-only observation of existing physics values. It MUST NOT alter BallisticsEngine outputs, sway amplitude, stamina rates, or scoring. If a visualisation needs a derived value, compute it in the visualisation component.

7. Build, Dev Server & GitHub Pages Deployment Rules
Local Development Server (AI Studio Container)
Port: Must always run on port 3000 via "dev": "tsx server.ts".

package.json & bun.lock Sync (CRITICAL):

NEVER change dependency version specifiers in /package.json away from the exact versions recorded in /bun.lock ("@google/genai": "^2.32.0", "@tailwindcss/vite": "^4.3.3", "@vitejs/plugin-react": "^6.1.1", "three": "^0.187.0", "typescript": "^7.0.2", "vite": "^8.3.0").

Modifying /package.json version strings without updating /bun.lock will cause the container's dev server startup check to fail.

When editing /package.json, always use replace_file_content (never overwrite the file with write_to_file).

No New Dependencies for v2 Features: material lab, mechanics overlay, relay, and inquiry modules must be built with existing dependencies only (React, Three.js, Lucide, Tailwind). Do not add charting, state-management, or animation libraries.

GitHub Pages Static Deployment (.github/workflows/deploy.yml)
Relative Asset Paths: vite.config.ts sets base: './' so built assets load properly under https://<username>.github.io/<repo-name>/.

Static API Fallback: When deployed on GitHub Pages (where server.ts is not running), App.tsx catches /api/archery-lore fetch errors and seamlessly falls back to getStaticHistoricalNote() in src/data/staticHistoricalNotes.ts.

Static Inquiry Fallback: All src/data/inquiry/*.ts content is bundled at build time. Inquiry features MUST be fully functional offline on GitHub Pages. Never fetch inquiry content from /api/*.

CI Version Normalization: Because AI Studio's internal mirror versions in package.json differ from public registry.npmjs.org, .github/workflows/deploy.yml dynamically normalizes package.json inside the GitHub Actions runner before running npm install --no-package-lock --legacy-peer-deps. Do not enable cache: 'npm' in actions/setup-node@v4 because the repository uses bun.lock rather than package-lock.json.

8. Inquiry & National Identity Education Layer (v2)
8.1 Material Evolution Lab — MaterialEvolutionLab.tsx + data/inquiry/materialTimeline.ts 〔OBJ-TECH〕
Purpose: Make innovation and technology an investigable object rather than a black box.

Data model: ordered array of material stages —
石鏃 (峙峪遺址) → 青銅鏃 (商周) → 鐵鏃 (漢) → 合金鋼 (近現代) → 碳纖維／複合材料 (當代).
Each stage carries: { id, era, label, materialSpec, massG, dragCoeff, flightNarrative, sourceRef }.

Interaction: a vertical/wheel timeline slider in the bottom-left drawer. Dragging it re-renders the same shot's trajectory ghost in the 3D scene using that stage's massG / dragCoeff, so students directly observe "材料迭代 → 競技表現改變".

Guardrail: this is a ghost comparison overlay. It must not overwrite the live shot record or the scorecard. Label it clearly as 歷史對照軌跡（模擬）.

Required framing copy: every stage panel ends with a one-line "驅動因素" statement so the narrative is cumulative capability-building, not a technology triumphalism list.

8.2 Mechanics Overlay — MechanicsOverlay.tsx + three/MechanicsDebugLayer.ts 〔OBJ-TECH〕
Toggle: icon button in TopRitualBar.tsx, off by default, state persisted via useInquiryProgress.

Contents (all read-only, peripheral or in-world):

Limb stress heatmap on the 3D bow limbs (colour ramp only, no data mutation).
Draw-force curve plotted live during the draw, 2D mini-chart anchored bottom-left, max 240px × 120px.
Cam transmission-ratio readout for compound-style bows.
Built-in inquiry prompt: after 3 overlay-enabled shots, surface a single peripheral card:
「為什麼複合弓能在保持高箭速的同時減輕拉弓負擔？」 → links into the matching mission in inquiryMissions.ts.

8.3 National Sports-Tech Data Cards — sportsTechCases.ts 〔OBJ-TECH + OBJ-IDENTITY〕
Rendered inside ShotScoreBanner.tsx as an optional second line after each shot: a rotating one-card insight on sports-science support for national teams (biomechanics analysis, high-speed video feedback, wind-tunnel testing).

Card structure: { headline, oneLineFact, methodTag, causalChain } where causalChain explicitly encodes 科技投入 → 競技突破 → 國家榮耀.

Copy rule: factual, sourced, non-hyperbolic. No unsupported superlatives. Attribute methods generically ("生物力學動作分析") rather than inventing specific unverified programme names.

8.4 Inquiry Missions — InquiryMissionPanel.tsx + inquiryMissions.ts 〔ALL〕
New fifth tab in ArcheryGuideModal.tsx: 探究任務.

Each mission implements the four-step cycle and stores progress in useInquiryProgress:

ts
interface InquiryMission {
  id: string;
  objective: 'OBJ-TECH' | 'OBJ-IDENTITY' | 'OBJ-PEER' | 'OBJ-HK';
  title: string;
  sourceExcerpt: string;      // short original-material snippet
  question: string;            // a "why" question, open-ended
  reflectionPrompt: string;
  rubricHint: string[];        // what a strong answer touches on (not a mark scheme)
  artefactTitle: string;       // name of the shareable output
}
Mandatory missions to ship:

M-OLY-01 奧運突破探究：張娟娟2008年金牌為何被視為打破韓國24年壟斷？這對中國射箭的後續發展意味著什麼？ 〔OBJ-IDENTITY〕

M-RIT-01 兩種文明邏輯對照：《射義》「正己而後發」與奧運KSL生物力學標準，分別追求什麼？ 〔OBJ-IDENTITY〕— rendered as a side-by-side toggle inside PostureCoachOverlay.tsx.

M-HK-01 香港線索：香港新界宗族何以習射為傳統？與中原地區武舉制度有何關聯？ 〔OBJ-HK〕

M-TECH-01 材料與力學：見 8.2 內建提問 〔OBJ-TECH〕

No grading, no leaderboard. This is an inquiry tool; auto-scoring student reflection would misrepresent the learning goal.

8.5 Peer Relay Collaboration — RelayHandoffModal.tsx + state/useRelaySession.ts 〔OBJ-PEER〕
Flow:

Student A completes a round (6 or 12 arrows). ExamSummaryModal.tsx gains a 邀請搭檔接力 button.
A handoff code is generated: base64url(JSON) of { v, shots: ShotRecord[], telemetrySummary, missionsTouched } written to the URL hash #relay=.... Copy-to-clipboard plus a visible short code.
Student B opens the link (or pastes the code) → app shows A's telemetry report → B adjusts breath/aim strategy and records a one-line 調整理由 before shooting.
After B's round, RelayHandoffModal shows a paired comparison and asks: 你們的協作如何改變了射擊結果？這與國家隊團體項目的分工有何相似之處？
Constraints:

Payload cap 2 KB (truncate shots to numeric summary if exceeded). Never encode full trajectories.

No personal data in the code. No names, no free text from reflections in the URL hash — reflections stay in localStorage only.

Handle malformed/foreign hash values defensively: parse in try/catch, show 接力碼無效 and clear the hash.

8.6 Hong Kong Heritage Anchors — HKHeritagePanel.tsx + hkHeritageNotes.ts + sourceAnchors.ts 〔OBJ-HK〕
Presentation: a clickable exhibition board prop placed at the side of the range in ArcheryScene (out of the sightline, e.g. x ≈ -8, z ≈ 12). Opens a centred modal listing short, dated, verifiable entries:

香港中華傳統弓總會（2018年成立）推廣傳統射藝，教練赴內地拜訪弓箭師傅交流工藝

香港海防博物館藏亞洲傳統射藝展品，含二千多年前秦末漢初單木弓

香港青年赴青海參加傳統射箭比賽

香港大專院校射藝學會赴內地學藝

屏山鄧氏宗族：清代出過多位武舉人，文物館藏清朝官兵箭

Framing rule (CRITICAL): Hong Kong must be portrayed as an active participant in an ongoing cultural exchange within the national tradition, never as an outside observer of "Chinese" archery. Every entry pairs a Hong Kong fact with its mainland institutional or historical counterpart.

Source discipline: sourceAnchors.ts holds the original-material excerpts used for the 史料標註 task. Each excerpt needs { id, title, excerpt, institution, dateNote }. Do not fabricate quotations or statistics. If a claim cannot be tied to a listed source anchor, drop it.

8.7 Student-Authored Content — 史料標註 + AI 輔助解說詞 〔OBJ-PEER〕
史料標註: from sourceAnchors.ts, students pick keywords and tag them onto timeline nodes or 3D props. Stored locally; exportable as a handoff code for the partner.

AI 輔助解說詞: the app must not call an LLM itself. Instead provide a structured worksheet in InquiryMissionPanel: 展品 → 三個必答事實 → AI 草稿提示詞（可複製） → 人工核查清單 → 定稿輸入. The human-verification step is mandatory UI, not optional.

Fact-check checklist (must be visible): 來源是否可追溯？ 數字是否與原始材料一致？ 是否避免了誇大或情緒化表述？ 是否說明了與香港／國家的關聯？

9. Verification Checklist for Agents
Before completing any code modification turn:

Run compile_applet and lint_applet together to verify zero TypeScript or Vite bundling errors.

Ensure /metadata.json retains its original name field.

Verify that all user-facing copy uses Traditional Chinese (繁體中文) with accurate Olympic archery terminology (e.g., 反曲弓, 10環 / X環, 70米奧運標準距離, 張娟娟, 六藝射禮).

HUD regression: confirm the centre 50%, 50% region is still occupied only by the sight pin; confirm no new overlay exceeds the peripheral zones defined in Section 5.

Physics regression: confirm BallisticsEngine outputs and sway/stamina behaviour are unchanged when all v2 toggles are off, and unchanged when on.

Offline regression: with the network blocked, confirm inquiry modules, material lab, heritage panel, and relay all still function (static-bundle path).

No-dependency check: confirm /package.json dependency list is byte-identical to the pre-change version.

Relay safety: confirm handoff codes contain no free-text reflection or personal data, and that malformed hashes fail gracefully.

Framing check for any OBJ-HK or OBJ-IDENTITY copy: Hong Kong is an active participant; national development is described through cumulative capability, not bare superlatives.

Interaction lock: confirm inquiry/heritage/relay openers are disabled during a draw and re-enable cleanly after release.