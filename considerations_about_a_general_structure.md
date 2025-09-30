# Considerations About a General Structure

## Context & Goals
- Current Phaser + React setup works for the Dino runner but couples gameplay, UI, and integrations in ways that are hard to reuse.
- We want a structure that scales to multiple runner-style games, supports wallet integrations, leaderboards, and theming without deep code rewrites.
- Aim for deterministic behaviour and testable modules while keeping the door open for live ops content (new characters, skins, NFTs, power-ups).

## Pain Points in the Existing Codebase
- **Scene responsibility creep:** `PlayScene` handles sockets, audio, UI callbacks, and game logic; `Menu` manages mute state and direct Scene access. This makes substitution or reuse difficult.
- **Scattered configuration:** hitboxes, obstacle weights, and audio keys live in TypeScript switch statements spread across managers. Adding a new theme requires code edits in multiple files.
- **Weak UI ↔ gameplay contract:** React components call into Phaser via refs/backdoor callbacks. There is no shared state management, so feature additions (e.g., new modals or boost mechanics) risk regressions.
- **Duplicated cross-cutting concerns:** audio control, persistence, socket event mapping, and analytics hooks are reinvented per scene.
- **Limited automation:** minimal separation between deterministic logic and Phaser-specific rendering makes unit/system testing tough.

## Design Principles
- **Data-first configuration:** represent characters, obstacles, sounds, and unlock rules in JSON/YAML (or TS maps) consumed by an engine, not embedded in code.
- **Layered architecture:** separate core runner mechanics, integration services, UI shell, and rendering.
- **Event-driven communication:** React shell and Phaser scenes talk via shared event bus/store rather than direct references.
- **Extensible integrations:** wallet, leaderboard, analytics, and A/B testing connect through defined interfaces so swapping providers is straightforward.
- **Deterministic core:** isolate game state updates (physics, scoring, obstacle spawning) from rendering for reliable simulation and automated testing.

## Proposed Architecture

### 1. Core Runner Engine
- Encapsulate game loop logic, obstacle generation, scoring, hit detection, and difficulty curves in a renderer-agnostic module.
- Expose lifecycle hooks (`onGameStart`, `onSpawnObstacle`, `onCollision`, `onTick`); the Phaser Adapter implements rendering and physics updates using these callbacks.
- Support seeding for consistent replay/testing.

### 2. Configuration Layer
- Pack themes (characters, backgrounds, obstacles, audio) into config files: `theme.json`, `obstacles.json`, `audio.json`.
- Define hitboxes via ratios or polygon sets per asset; auto-generate Phaser bodies from config.
- Wallet/NFT gating stored in config flags referencing external entitlements (e.g., `requiresNft: 'blue_victor'`).

### 3. Shared Services
- **AudioService:** central mute state, playlists, SFX channels. Emits events consumed by both UI and scenes.
- **ProfileService:** wraps wallet auth, NFT ownership, and player preferences, caching data and exposing reactive state.
- **LeaderboardService:** abstracts API/websocket; exposes async fetch + event streams.
- **PersistenceService:** handles localStorage/session for mute, difficulty settings, last character, etc.
- Each service injectable so local/dev builds can stub them.

### 4. Event Bus / State Store
- Use a lightweight event emitter (or Zustand/Redux) shared by UI and engine.
- Standard events: `game:start`, `game:over`, `audio:muteChanged`, `profile:updated`, `leaderboard:openRequest`, etc.
- Enables React components to subscribe without tight coupling; also simplifies analytics hooks.

### 5. Renderer Adapters
- **PhaserAdapter:** subscribes to engine outputs, instantiates scenes, applies physics, manages sprites, and relays input events back to the engine.
- Adapter manages asset loading per theme and instantiates UI overlays (menus, modals) as separate scenes/layers to avoid monolithic `PlayScene`.

### 6. React Shell
- Handles routing, authentication, and modals using the shared state store.
- `GameContainer` component mounts the Phaser canvas, injects theme/config, and listens to events (e.g., show leaderboard modal when engine publishes `leaderboard:openRequest`).
- UI components (mute button, character selector) dispatch actions via the event bus, not directly on the Phaser scene.

### 7. Integration Points
- Provide interfaces for wallet providers (MultiversX, WalletConnect, etc.) behind `WalletIntegration` service.
- Leaderboard endpoint schema defined once; allow swapping to local mock or production API.
- Analytics hook interface enabling custom event forwarding per deployment.

### 8. Tooling & Testing
- Build fixture packs for configs; run static validation (e.g., ensure hitbox ratios make sense).
- Unit test core engine with deterministic seeds.
- Integration tests: headless Phaser (arcade physics) with mocked services to validate obstacle spawning, scoring, and audio events.
- Snapshot tests for React menus and modals.

## Roadmap Sketch

### Phase 0 – Discovery & Validation (1 sprint)
- Audit existing gameplay features, socket events, wallet flows, audio assets.
- Document current data requirements (characters, obstacles, leaderboards).
- Identify must-keep behaviours vs. optional legacy quirks.

### Phase 1 – Core Extraction (2 sprints)
- Carve out runner mechanics into standalone module (no Phaser imports).
- Introduce event bus/state store shared between React and engine.
- Ensure current game runs using adapter pattern without feature regression.

### Phase 2 – Service Layer & Audio (1-2 sprints)
- Implement AudioService with persistent mute state (localStorage/registry) and SFX channels.
- Wrap wallet/profile/leaderboard access in injectible services.
- Update React shell and Phaser adapter to use services + event bus.

### Phase 3 – Configuration Pipeline (2 sprints)
- Define config schemas for themes, characters, obstacles, audio.
- Migrate existing assets to config-driven system; auto-generate hitboxes.
- Build validation scripts and docs for adding new themes.

### Phase 4 – React Shell Refinement (1 sprint)
- Refactor menus/modals to subscribe to store events instead of direct scene callbacks.
- Implement UI components (audio toggle, character selector) using shared services.
- Add analytics hook support for start/stop, score submissions.

### Phase 5 – Testing & Tooling (ongoing)
- Add unit/System tests around engine, audio, obstacles.
- Integrate CI steps for config validation, lint, build, and basic gameplay smoke tests.
- Document developer workflows (adding character, tuning difficulty, wiring new wallet provider).

### Phase 6 – Optional Enhancements
- Support multiple game modes (endless, time trial) via config.
- Add modular power-up system with data-driven definitions.
- Provide localization support by externalizing copy and audio cues.

## Next Actions
- Share this plan with stakeholders for scope approval.
- Prioritize Phase 1 extraction tasks and create tickets per module (engine, adapter, event bus).
- Define acceptance criteria for “engine extracted” milestone to ensure no regressions.

