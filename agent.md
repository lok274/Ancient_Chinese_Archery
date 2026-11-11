# AGENT.md — Project Guide & AI Agent Instructions

## 1. Project Overview
**現代奧林匹克射箭錦標賽 · 中國射箭榮耀與千年射藝傳承 (Modern Olympic Archery Championship & Chinese Archery Heritage)** is a 3D interactive Olympic archery simulation and cultural-historical showcase built with React, TypeScript, Three.js, Tailwind CSS, and Express.

The application combines:
1. **3D First-Person Olympic Archery Simulation**: Realistic 70m / 50m / 90m WA (World Archery) 122cm 10-ring target ballistics, wind drift, gravity drop, stamina depletion with dynamic heartbeat pulse, and a tactical **Deep Breath (`Spacebar`)** stabilizer mechanic.
2. **Team China Olympic Achievements (`中國射箭隊奧運輝煌成就`)**: Showcasing Team China's Olympic medal history (1 Gold, 7 Silver, 2 Bronze), highlighting Zhang Juanjuan's historic 2008 Beijing Olympic individual gold medal that broke South Korea's 24-year streak, plus women's and men's team breakthroughs from 1984 Los Angeles to 2024 Paris.
3. **History of Archery in China (`射箭在中國的千年歷史`)**: A 28,000-year historical timeline spanning Paleolithic Shiyu stone arrowheads (`峙峪遺址石鏃`), Shang/Zhou Six Arts (`六藝「禮、樂、射、御、書、數」`), Warring States `Kao Gong Ji` (`《考工記·弓人》`) composite bow engineering, Han/Tang/Qing archery traditions, and modern Olympic recurve biomechanics.
4. **3D & Multi-Angle Posture Coach (`射藝姿態教練`)**: Interactive 3D skeletal/anatomical visualization comparing Olympic KSL (BEST) biomechanical alignment (`T-Shape Alignment`, `Back Tension / Scapular Draw`, `Anchor Point`) with traditional Chinese archery (`《射義》正己而後發`).
5. **Knowledge-Gated Inquiry Quizzes (`知識准入探究測驗`)** *(v2)*: A **read-first, quiz-second, shoot-last** gateway. Each competition stage is locked until the student has (a) opened the required source material, (b) reached the end of it, and (c) answered the stage's multiple-choice questions correctly. Only then does the bow become drawable. See **Section 8**.

---

## 2. Educational Objectives (Civic / National Identity Education)

This project is designed as a **Civic and Citizenship Education inquiry tool**, not merely an entertainment game. All new features MUST serve at least one of the following four objectives. When adding content, state which objective(s) it serves in the code comment header.

1. **`OBJ-TECH` — 探究創新科技以認識國家發展**
   Let students investigate innovation and technology (materials science, engineering mechanics, sports science) as observable, manipulable phenomena, and connect them to national development in sports engineering and advanced materials.
2. **`OBJ-IDENTITY` — 深化對祖國的認識，培養國家觀念與國民身份認同**
   Move beyond medal-count narratives toward *development-pattern* narratives: why breakthroughs happened, what capability they demonstrated, and how tradition and modernity form a civilisational continuum.
3. **`OBJ-PEER` — 透過同儕協作推動認識國家**
   Enable paired/group investigation. Students compare quiz results, exchange explanations and handoff codes, and co-author artefacts rather than only consuming content.
4. **`OBJ-HK` — 認識內地與香港系出同源的關係**
   Anchor Hong Kong explicitly in the national archery heritage narrative — never as an external observer, but as an active participant in an ongoing cultural exchange.

**Pedagogical pattern (MUST be implemented literally):**
`閱讀資料 → 完成MC測驗 → 通過准入 → 射箭體驗 → 反思產出`
The quiz is a **comprehension check on the source material**, not a memory test on hidden facts. Every question must be answerable *from the provided excerpt alone*.

---

## 3. Tech Stack & Architecture
- **Frontend**: React 19, TypeScript, Tailwind CSS v4 (`@import "tailwindcss";`), Lucide React icons.
- **3D Rendering**: Three.js (`src/three/ArcheryScene.ts` & procedural textures in `src/three/TextureGenerator.ts`).
- **Physics Engine**: Custom RK4 / Euler step ballistic solver (`src/physics/BallisticsEngine.ts`) modeling arrow mass, draw weight, quadratic air drag, crosswind/headwind vectors, and 10-ring / X-ring scoring.
- **Audio**: Procedural Web Audio API synthesizer (`src/audio/ArcheryAudio.ts`) generating bowstring tension creaks, release twangs, arrow whooshes, target thuds, heartbeat pulses, and celebratory chimes with zero external MP3 dependencies.
- **Backend / Full-Stack**: Express + Vite middleware (`server.ts`) on port `3000`, providing `/api/archery-lore` with automatic static fallback (`src/data/staticHistoricalNotes.ts`) when deployed to static hosts like GitHub Pages.
- **Gate & Quiz Layer (v2)**: Browser-only. `localStorage` for gate progress persistence + URL hash (`#relay=<base64url>`) for sharing gate certificates between peers. **No new dependencies, no database, no auth.** Must degrade gracefully when `localStorage` is unavailable (private mode) — fall back to in-memory state with a visible warning, and gate progress resets on reload.
- **Quiz Content (v2)**: Static TypeScript data modules under `src/data/inquiry/`. All content is bundled at build time so it works identically on the Express server and on GitHub Pages.

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
    ├── App.tsx                        # Main application state, keyboard/mouse handlers, game loop, gate orchestration
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
    │   ├── ExamSummaryModal.tsx       # End-of-round Olympic scorecard, medal evaluation & relay handoff
    │   ├── PostureCoachOverlay.tsx    # Interactive 3D & diagram Posture Coach (Front / Side / Top views)
    │   ├── Quiver3DHUD.tsx            # Compact bottom-right arrow quiver & round score tracker
    │   ├── ShotScoreBanner.tsx        # Top-right compact telemetry card & national tech data card
    │   ├── TopRitualBar.tsx           # Slim top navigation bar (Stage, Guide, Posture Coach, Audio, 力學疊加層)
    │   ├── MaterialEvolutionLab.tsx   # (v2) Arrowhead/bow material timeline slider + live trajectory morph
    │   ├── MechanicsOverlay.tsx       # (v2) Stress heatmap, cam transmission ratio, draw-force curve
    │   ├── StageGateModal.tsx         # (v2) Read → Quiz → Pass gate. Blocks drawing until cleared.
    │   ├── SourceReader.tsx           # (v2) Scroll-tracked source material reader with completion signal
    │   ├── QuizQuestionCard.tsx       # (v2) Single MCQ card with immediate explanation feedback
    │   ├── RelayHandoffModal.tsx      # (v2) Peer relay: handoff code generation & partner report intake
    │   └── HKHeritagePanel.tsx        # (v2) Hong Kong archery heritage anchor panel
    ├── data/
    │   ├── staticHistoricalNotes.ts   # Offline/static historical & Olympic commentary fallback data
    │   └── inquiry/
    │       ├── materialTimeline.ts    # (v2) Stone→Bronze→Iron→Alloy→Composite arrowhead & bow data
    │       ├── sportsTechCases.ts     # (v2) National-team sports-science support data cards
    │       ├── stageQuizBank.ts       # (v2) ★ Per-stage source readings + MCQ question sets
    │       ├── hkHeritageNotes.ts     # (v2) Hong Kong archery heritage records & exchange timeline
    │       └── sourceAnchors.ts       # (v2) Original-material excerpts (also feeds quiz sources)
    ├── physics/
    │   └── BallisticsEngine.ts        # Bow specs, competition stages, wind generator & trajectory solver
    ├── three/
    │   ├── ArcheryScene.ts            # 3D Olympic stadium/range, 122cm WA target, bow, arrow & trail
    │   ├── MechanicsDebugLayer.ts     # (v2) Optional 3D stress/draw visualisation overlay
    │   └── TextureGenerator.ts        # Procedural canvas textures (10-ring target face, wood, stadium)
    ├── state/
    │   ├── useGateProgress.ts         # (v2) ★ Per-stage gate status: unread / read / passed
    │   ├── useRelaySession.ts         # (v2) localStorage + URL-hash relay session hook
    │   └── useInquiryProgress.ts      # (v2) Reflection & artefact persistence
    └── types/
        └── archery.ts                 # Shared TypeScript interfaces (BowSpec, StageConfig, ShotRecord, etc.)
```

---

## 5. UI / HUD Spatial Layout Guidelines (CRITICAL — DO NOT VIOLATE)
To prevent HUD elements from cluttering the center of the screen or obstructing the player's aiming sightline:

- **Center Viewport Must Remain Clear**:
  - Only a minimal, semi-transparent Olympic sight pin (`AimReticleHUD.tsx`) is permitted at the center (`50%, 50%`).
  - Never place modal banners, large text overlays, stamina bars, inquiry cards, or mechanics legends near the center reticle.
  - **Exception — `StageGateModal`**: Because the gate precedes drawing, its centred modal is permitted only while the bow is locked (`gatePassed === false`). Once passed, it must close fully and cannot reopen in the centre; re-reading moves to a peripheral drawer.
- **Peripheral HUD Placement**:
  - **Top Bar (`TopRitualBar.tsx`)**: Slim header (`h-11`) for stage switching, wind badge, modal triggers, the `力學疊加層` toggle icon (v2), and the `已通過准入` / `未通過准入` badge (v2).
  - **Left Peripheral (`left-5`, `AimReticleHUD.tsx`)**: Compact wind-drift offset pill and vertical stamina bar with dynamic heartbeat pulse & `[Space] 屏息凝神` status. When the gate is locked, replace this with a compact `請先完成資料閱讀與測驗` pill linking to the gate.
  - **Top-Right (`top-14 right-4`, `ShotScoreBanner.tsx` & `BullseyeCalligraphyEffect.tsx`)**: Non-blocking (`pointer-events-none`) shot score card, ballistic telemetry (speed, flight time, wind drift, drop), historical/Olympic insight, and national sports-tech data card (v2).
  - **Bottom-Left (`bottom-3 left-4`, `BottomControlDock.tsx`)**: Compact bow selector pills (`奧運競技反曲弓 48lb`, `中華傳統筋角複合弓 55lb`, `專業滿弓重磅反曲弓 62lb`). The `材質演化實驗室` expander (v2) opens upward from here as a collapsible drawer — it MUST NOT expand horizontally into the aiming zone.
  - **Bottom-Right (`bottom-14 right-4` & `bottom-3 right-4`, `Quiver3DHUD.tsx` & `BottomControlDock.tsx`)**: Remaining arrows indicator, cumulative score, and Next Round / Reset controls. When the next stage is gate-locked, Next Round is disabled and shows a `前往測驗` affordance.
- **In-3D-World Panels (not HUD)**: `HKHeritagePanel.tsx` is rendered as a clickable 3D prop inside `ArcheryScene` (a side-range exhibition board), not as a screen-space overlay. Its content is viewable freely, but its optional quiz unlocks only via the peripheral drawer.
- **Interaction Locking**: Any panel that is not the gate MUST be unopenable while `drawProgress > 0` or `stamina < 30`. Queue the request and show a subtle peripheral hint (`射箭中，完成本箭後開啟`) instead of interrupting.

---

## 6. Core Gameplay & Physics Mechanics (DO NOT REGRESS)
1. **Drawing & Aiming**:
   - Hold Left Mouse Button on the 3D canvas to draw the bow (`drawProgress` from `0` to `1`).
   - Release Left Mouse Button to fire the arrow.
   - **Gate Lock (v2, CRITICAL)**: `ArcheryCanvas.tsx` MUST refuse to begin a draw when `gatePassed(stageId) === false`. Pointer-down on the canvas while locked is a no-op except showing a single peripheral toast (`請先完成本關卡閱讀與測驗`). Do not silently swallow the input — the student must understand why nothing happened.
2. **Stamina & Heartbeat Pulse**:
   - Holding full draw depletes stamina (`100` → `0`).
   - As stamina drops below `75%`, a visual and auditory heartbeat pulse accelerates (`duration = max(0.28s, 0.3 + (stamina / 100) * 0.85s)`), and aiming sway amplitude increases.
3. **Deep Breath Stabilizer (`Spacebar`)**:
   - Holding `Spacebar` while drawing activates Deep Breath (`屏息凝神`), reducing aiming sway by `78%` (`swayMultiplier = 0.22`) at the cost of `2.4x` faster stamina depletion.
   - If stamina hits `0`, the archer enters a fatigued state and Deep Breath automatically disengages.
4. **Arrow Flight Trail**:
   - During flight, `ArcheryScene.ts` renders a dynamic ribbon/brush-stroke trail behind the arrow to visualize parabolic drop and crosswind drift against the stadium backdrop.
5. **Instrumentation Rule**: Any v2 visualisation (stress heatmap, draw-force curve, material trajectory morph) is read-only observation of existing physics values. It MUST NOT alter `BallisticsEngine` outputs, sway amplitude, stamina rates, or scoring.

---

## 7. Build, Dev Server & GitHub Pages Deployment Rules

### Local Development Server (AI Studio Container)
- **Port**: Must always run on port `3000` via `"dev": "tsx server.ts"`.
- **`package.json` & `bun.lock` Sync (CRITICAL)**:
  - **NEVER** change dependency version specifiers in `/package.json` away from the exact versions recorded in `/bun.lock` (`"@google/genai": "^2.32.0"`, `"@tailwindcss/vite": "^4.3.3"`, `"@vitejs/plugin-react": "^6.1.1"`, `"three": "^0.187.0"`, `"typescript": "^7.0.2"`, `"vite": "^8.3.0"`).
  - Modifying `/package.json` version strings without updating `/bun.lock` will cause the container's dev server startup check to fail.
  - When editing `/package.json`, always use `replace_file_content` (never overwrite the file with `write_to_file`).
  - **No New Dependencies for v2 Features**: gate, quiz, material lab, mechanics overlay, relay must be built with existing dependencies only (React, Three.js, Lucide, Tailwind). Do not add quiz libraries, form libraries, charting libraries, or state-management libraries.

### GitHub Pages Static Deployment (`.github/workflows/deploy.yml`)
1. **Relative Asset Paths**: `vite.config.ts` sets `base: './'` so built assets load properly under `https://<username>.github.io/<repo-name>/`.
2. **Static API Fallback**: When deployed on GitHub Pages (where `server.ts` is not running), `App.tsx` catches `/api/archery-lore` fetch errors and seamlessly falls back to `getStaticHistoricalNote()` in `src/data/staticHistoricalNotes.ts`.
3. **Static Quiz Fallback**: All `src/data/inquiry/*.ts` content is bundled at build time. Gate and quiz features MUST be fully functional offline on GitHub Pages. Never fetch quiz content from `/api/*`.
4. **CI Version Normalization**: Because AI Studio's internal mirror versions in `package.json` differ from public `registry.npmjs.org`, `.github/workflows/deploy.yml` dynamically normalizes `package.json` inside the GitHub Actions runner before running `npm install --no-package-lock --legacy-peer-deps`. Do not enable `cache: 'npm'` in `actions/setup-node@v4` because the repository uses `bun.lock` rather than `package-lock.json`.

---

## 8. Knowledge-Gated Inquiry Quizzes (v2)

### 8.1 Gate Model — `useGateProgress.ts` 〔ALL〕
Each competition stage (`70m` / `50m` / `90m`) has its own gate with three sequential states:

```ts
type GateState = 'unread' | 'read' | 'passed';

interface StageGate {
  stageId: string;
  state: GateState;          // unread → read → passed
  sourceScrollPct: number;   // 0..1, how far the student has scrolled
  sourceDwellMs: number;     // accumulated time on the reader
  attempts: Record<string, number>;   // per-question attempt count
  passedAt?: number;         // timestamp
}
```

- **Transitions**:
  - `unread → read`: requires `sourceScrollPct >= 0.95` AND `sourceDwellMs >= 20000` (20s minimum). Both conditions, not either. These thresholds protect against instant-scroll skipping without making reading feel punishing.
  - `read → passed`: requires every question in the stage's set answered correctly at least once.
  - `passed` is sticky. Re-entering the stage in the same browser session never re-locks it. Persistence is via `localStorage` under key `archery.gate.v2`.
- **Reset affordance**: `BottomControlDock` offers `重設本關卡` (requires one confirm click) so a teacher or student can redo the quiz deliberately.

### 8.2 Source Reader — `SourceReader.tsx` + `stageQuizBank.ts` 〔ALL〕
- **Layout**: full-height scroll container inside `StageGateModal` on the left column (60% width); quiz panel on the right column (40%). On screens `< 768px`, stack vertically with the quiz below the reader.
- **Content shape**:
```ts
interface QuizSource {
  stageId: string;
  title: string;
  objective: 'OBJ-TECH' | 'OBJ-IDENTITY' | 'OBJ-PEER' | 'OBJ-HK';
  blocks: Array<
    | { type: 'para'; text: string }
    | { type: 'quote'; text: string; attribution: string }
    | { type: 'fact'; label: string; value: string }
    | { type: 'image'; src: string; caption: string }
  >;
  estimatedReadSeconds: number;   // shown to the student up front
  questions: QuizQuestion[];
}
```
- **Reading instrumentation**: use `IntersectionObserver` on a sentinel `<div>` at the end of the content to compute `sourceScrollPct`; accumulate `sourceDwellMs` via `visibilitychange`-aware timer (pause when the tab is hidden).
- **Visual completion signal**: when `read` conditions are met, a subtle `✓ 資料已閱讀` badge appears at the top of the reader and the quiz panel un-dims.
- **No paywall-style punishment**: students may still scroll back and re-read while answering. The reader stays open until the gate passes or the student explicitly closes it (closing while `unread` reverts to the locked state, with the progress preserved).

### 8.3 Quiz Engine — `QuizQuestionCard.tsx` + `stageQuizBank.ts` 〔ALL〕
- **Question shape**:
```ts
interface QuizQuestion {
  id: string;
  objective: 'OBJ-TECH' | 'OBJ-IDENTITY' | 'OBJ-PEER' | 'OBJ-HK';
  stem: string;                 // the question
  options: string[];            // 3–4 options, traditional Chinese
  correctIndex: number;
  explanation: string;          // shown after any answer, right or wrong
  sourceBlockRefs: number[];    // indices into QuizSource.blocks that contain the answer
}
```
- **Mandatory rule**: every question MUST be answerable from `sourceBlockRefs` alone. If a question's answer requires outside knowledge, rewrite the source or drop the question.
- **Answer flow (per question)**:
  1. Student selects an option → it locks in immediately (no "submit all at the end").
  2. Feedback appears inline: `✓ 正確` or `✗ 再想想`, followed by `explanation`, followed by `查看資料出處` which scrolls the reader to the referenced block and highlights it.
  3. On a wrong answer, the option is greyed out and the student may try again; `attempts[qid]` increments. Wrong answers never lock the question — the goal is comprehension, not punishment.
  4. When `correctIndex` is chosen, the question is permanently solved for this session and contributes to the `read → passed` transition.
- **Progress indicator**: right panel shows `已答對 2 / 4` at the top, filled dots per question.
- **Passing moment**: once all questions are correct, the quiz panel shows a `本關卡准入已解鎖` banner and a single `進入射箭場` button. Clicking it closes the modal and unlocks drawing. No auto-close — the student clicks deliberately.

### 8.4 Question Bank Composition — `stageQuizBank.ts` 〔ALL〕
Each stage must ship **3–5 questions** covering at least three different objectives. Suggested stage mapping (content lives in `stageQuizBank.ts`, source excerpts reused from `sourceAnchors.ts` where possible):

| Stage | Primary objective coverage | Sample source theme | Sample question stems |
| :--- | :--- | :--- | :--- |
| **70m** | `OBJ-IDENTITY` + `OBJ-HK` | 張娟娟2008年北京奧運金牌、香港中華傳統弓總會 | 根據資料，張娟娟2008年的金牌為何被視為「打破壟斷」？ / 香港在傳統射藝傳承中扮演什麼角色？ |
| **50m** | `OBJ-TECH` | 峙峪石鏃 → 漢鐵鏃 → 碳纖維材料演化、複合弓凸輪力學 | 箭鏃材質從石質到複合材料的演變，主要受什麼因素驅動？ / 根據材料，複合弓的凸輪設計主要解決什麼問題？ |
| **90m** | `OBJ-IDENTITY` + `OBJ-TECH` | 《考工記·弓人》複合弓工藝 + 現代生物力學訓練 | 《考工記》記載的製弓工藝與現代複合材料弓，在哪些方面目標一致？ |

- **Option-writing rules (CRITICAL)**:
  - Distractors must be plausible readings of the source (e.g. a partial quote, a common misconception), never absurd throwaways. **`以上皆是` / `以上皆非` are banned** — they shortcut comprehension.
  - Never place the correct answer in a fixed position across a stage's question set.
  - No trick wording, no double negatives. The question tests reading comprehension of the source, not test-taking skill.
  - Every `explanation` must cite the source in plain language: `資料提到：「…」，因此…`.

### 8.5 Optional Heritages Quiz — `HKHeritagePanel.tsx` 〔OBJ-HK〕
- The heritage panel is viewable freely (not gate-locked) so students can explore at will.
- A single `測驗你的認識` button at the panel's footer opens 2 MC questions from `stageQuizBank.ts` under a `heritage-hk` pseudo-stage. Passing this pseudo-stage is not required to shoot; it awards a `香港射藝探究徽章` shown in `ExamSummaryModal`.
- This keeps the main gate motivating without over-locking optional exploration.

### 8.6 Material Lab & Mechanics Overlay — 〔OBJ-TECH〕
- `MaterialEvolutionLab.tsx` and `MechanicsOverlay.tsx` remain as described in the original design, plus one addition: after a student passes the `50m` stage's quiz, the mechanics overlay's built-in inquiry prompt is replaced with `試運用剛才學到的原理：改變弓臂材料的彈性模量，觀察軌跡如何變化`, linking back to the material lab.
- Both overlays remain read-only observation; they never alter `BallisticsEngine` outputs.
- `sportsTechCases.ts` remains the source of the national sports-tech data card in `ShotScoreBanner.tsx`, with the same copy discipline (factual, sourced, no invented programme names, no unsupported superlatives).

### 8.7 Peer Relay — `RelayHandoffModal.tsx` + `useRelaySession.ts` 〔OBJ-PEER〕
- **Flow**:
  1. Student A completes a round (6 or 12 arrows). `ExamSummaryModal.tsx` gains a `邀請搭檔接力` button.
  2. A handoff code is generated: `base64url(JSON)` of `{ v, stageId, gateCertificate, shots: numericSummary, quizAttempts, telemetrySummary }`. Copy-to-clipboard plus a visible short code.
  3. `gateCertificate` is a compact proof that A passed the stage — `{ stageId, passedAt, questionsSolved: string[] }` (IDs only, no free text, no answers).
  4. Student B opens the link or pastes the code. Two cases:
     - **If B has already passed the same stage**: they skip straight to the comparison view (no re-quiz, no re-read).
     - **If B has not passed**: they are shown A's reading result as a preview (`你的搭檔已研讀此關卡，你可以先自行閱讀資料並作答`), but the reader and quiz do **not** auto-unlock — B must still complete them. This preserves the "every student engages with the material" intent.
  5. After B's round, `RelayHandoffModal` shows a paired comparison: A's and B's telemetry side by side, both students' quiz attempt counts, and the reflection prompt `你們的協作如何改變了射擊結果？這與國家隊團體項目的分工有何相似之處？`
- **Constraints**:
  - Payload cap **2 KB**. Truncate `shots` to `{ count, avgScore, bestScore, avgDrift }`. Never encode full trajectories.
  - **No personal data, no names, no free-text reflections in the URL hash.** `quizAttempts` carries only question IDs and integer counts.
  - Handle malformed/foreign hash values defensively: parse in `try/catch`, show `接力碼無效` and clear the hash. Never trust `gateCertificate` for integrity-critical gating in a way that would let a user forge a full pass for a stage they never read — if integrity matters, re-verify `questionsSolved` against the local question bank and only mark those specific questions as solved, not the whole stage. *(Design rationale: keep the incentive to actually read.)*

### 8.8 HK Heritage Anchors — `hkHeritageNotes.ts` + `sourceAnchors.ts` 〔OBJ-HK〕
- **Presentation**: a clickable exhibition board prop placed at the side of the range in `ArcheryScene` (out of the sightline, e.g. `x ≈ -8, z ≈ 12`). Opens a centred modal listing short, dated, verifiable entries:
  - 香港中華傳統弓總會（2018年成立）推廣傳統射藝，教練赴內地拜訪弓箭師傅交流工藝
  - 香港海防博物館藏亞洲傳統射藝展品，含二千多年前秦末漢初單木弓
  - 香港青年赴青海參加傳統射箭比賽
  - 香港大專院校射藝學會赴內地學藝
  - 屏山鄧氏宗族：清代出過多位武舉人，文物館藏清朝官兵箭
- **Framing rule (CRITICAL)**: Hong Kong must be portrayed as an **active participant in an ongoing cultural exchange** within the national tradition, never as an outside observer of "Chinese" archery. Every entry pairs a Hong Kong fact with its mainland institutional or historical counterpart.
- **Source discipline**: `sourceAnchors.ts` holds the original-material excerpts used both for the heritage panel and for `stageQuizBank.ts`. Each excerpt needs `{ id, title, excerpt, institution, dateNote }`. Do not fabricate quotations or statistics. If a claim cannot be tied to a listed source anchor, drop it.

### 8.9 Student-Authored Extension — `史料標註` 〔OBJ-PEER〕
- Optional worksheet inside `StageGateModal` after a pass: students pick keywords from `sourceAnchors.ts` and tag them onto timeline nodes or 3D props. Stored locally; exportable as a handoff code for the partner.
- **No LLM call by the app.** If AI assistance is offered, it is a copyable prompt template plus a mandatory human fact-check checklist (`來源是否可追溯？ 數字是否與原始材料一致？ 是否避免了誇大或情緒化表述？ 是否說明了與香港／國家的關聯？`).

---

## 9. Verification Checklist for Agents
Before completing any code modification turn:
1. Run `compile_applet` and `lint_applet` together to verify zero TypeScript or Vite bundling errors.
2. Ensure `/metadata.json` retains its original `name` field.
3. Verify that all user-facing copy uses Traditional Chinese (`繁體中文`) with accurate Olympic archery terminology (e.g., `反曲弓`, `10環 / X環`, `70米奧運標準距離`, `張娟娟`, `六藝射禮`).
4. **HUD regression**: confirm the centre `50%, 50%` region is occupied only by the sight pin *except* when `StageGateModal` is open and the stage is locked; confirm no other overlay exceeds the peripheral zones defined in Section 5.
5. **Physics regression**: confirm `BallisticsEngine` outputs and sway/stamina behaviour are unchanged when all v2 toggles are off, and unchanged when on.
6. **Gate regression (CRITICAL)**:
   - Confirm drawing is impossible when `gatePassed === false`, and pointer-down produces the peripheral hint rather than silence.
   - Confirm `unread → read` requires **both** scroll ≥ 95% and dwell ≥ 20s.
   - Confirm `read → passed` requires every question answered correctly at least once.
   - Confirm `passed` persists across reloads in the same browser (when `localStorage` is available) and resets gracefully in private mode.
7. **Quiz content check**: for every `QuizQuestion`, confirm the correct answer is derivable from `sourceBlockRefs` alone. Reject any question that fails this.
8. **Offline regression**: with the network blocked, confirm the reader, quiz, gate transitions, heritage panel, material lab, and relay all still function (static-bundle path).
9. **No-dependency check**: confirm `/package.json` dependency list is byte-identical to the pre-change version.
10. **Relay safety**: confirm handoff codes contain no free-text reflection or personal data, that `gateCertificate` only ever marks specific question IDs as solved (never the whole stage for a peer who has not read), and that malformed hashes fail gracefully.
11. **Framing check** for any `OBJ-HK` or `OBJ-IDENTITY` copy: Hong Kong is an active participant; national development is described through cumulative capability, not bare superlatives.
12. **Interaction lock**: confirm non-gate panels are disabled during a draw and re-enable cleanly after release; confirm the gate cannot be opened mid-draw either.
