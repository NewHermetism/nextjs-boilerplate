# Critique of Current Structure

## Scene Soup & Responsibility Creep
- `PlayScene` is a god object handling rendering, sockets, audio, UI callbacks, and game state in one 400+ line class (`src/games/dino/scenes/PlayScene.tsx`). Any new feature forces edits to the same monolith.
- `Menu` pokes directly into the scene’s internals to control mute state and registry values (`src/games/dino/scenes/Menu.tsx`), making UI changes inseparable from engine logic.
- Socket handling lives in helpers, yet the scene instantiates and owns them, blocking reuse in other game modes.

## Hard-Coded Data Everywhere
- Obstacle hitboxes, scales, and spawn tuning are baked into TypeScript objects (`src/games/dino/scenes/ObstacleManager.ts`), so adding content requires code edits and manual guesswork.
- Character music selection is hard-coded ternaries; wallet/NFT gating is scattered across hooks and scenes—no central config declares unlock rules.
- Assets are referenced by raw strings (e.g., `/images/head_${avatar + 1}.png`) with no loader or validation.

## Fragile UI ↔ Gameplay Contract
- React components call hooks conditionally (`src/pages/Game/components/LeaderboardModal/LeaderboardModal.tsx`, `src/wrappers/AuthRedirectWrapper/AuthRedirectWrapper.tsx`), violating hook rules and risking runtime bugs.
- UI elements communicate with Phaser scenes via ad-hoc callbacks instead of a shared state bus, so every new modal requires threading more references through constructors.

## Lint Debt & Hygiene
- Repository ignores dozens of lint errors: import ordering, quote rules, conditional hooks, prettier formatting, unused variables (`yarn lint` output highlights multiple offenders).
- `@ts-ignore` comments hide type issues instead of addressing them (`src/games/dino/helpers/SocketHandler.ts`).

## Lifecycle & Input Issues
- Event listeners are added on window but not consistently removed; audio objects are recreated without teardown (`src/games/dino/scenes/PlayScene.tsx`).
- Jump/input logic fires based purely on menu visibility (`src/games/dino/scenes/InputManager.ts`), enabling actions (and sounds) after the game ends.

## Path Back to Order
1. **Extract a core runner engine** that encapsulates game state, scoring, and obstacle generation; let Phaser act as a rendering adapter.
2. **Centralize configuration** (characters, obstacles, audio, unlock rules) in validated data files consumed by the engine/UI.
3. **Introduce a shared event bus/services layer** for audio, profile, leaderboard, and persistence so React and Phaser communicate through defined events.
4. **Refactor React components** to obey hook rules and subscribe to the shared store; eliminate direct scene mutation from UI widgets.
5. **Enforce lint/tests in CI** and fix existing violations to stop shipping brittle code.
6. **Modularize integrations** (wallet, sockets, analytics) behind interfaces, enabling new games or modes to reuse the platform without surgery.

Without these steps the code remains a fragile tangle; implementing them turns the project into a reusable, maintainable game platform.

