# SuperVictor Dapp — Architecture Overview

## Summary
- React + Vite + TypeScript app integrating MultiversX sdk-dapp for authentication and transactions.
- Game built with Phaser 3, embedded on the Game route and gated by native auth.
- Realtime profile and leaderboard via socket.io to a backend API.
- Home page exposes a read-only leaderboard modal so guests can browse scores without logging in.
- Environment-specific config copied into `src/config/index.ts` by scripts.

## Tech Stack
- UI: React 18, Tailwind CSS, Framer Motion
- Game: Phaser 3
- Web3: @multiversx/sdk-dapp, @multiversx/sdk-core
- Realtime: socket.io-client
- Tooling: Vite 4, TypeScript 5, Jest + @swc/jest

## App Flow
- `src/index.tsx` renders `<App />`.
- `src/App.tsx` wraps app with:
  - `DappProvider` (env + MultiversX config)
  - Axios interceptor + SDK modals
  - React Router
  - `BatchTransactionsContextProvider`
- `components/Layout/Layout.tsx` wraps content with:
  - `SocketProvider` for socket.io
  - Header/Footer
  - `AuthenticatedRoutesWrapper` to gate routes (redirects to `/unlock` if unauthenticated)

## Routes
- `src/routes/routes.ts`
  - `/` → Home (`pages/Home`) — public landing with optional leaderboard modal
  - `/game` → Game (`pages/Game`) — requires login
  - `/unlock` → Unlock (`pages/Unlock`) — wallet login
  - `*` → 404 (`pages/PageNotFound`)
- `wrappers/AuthRedirectWrapper` also redirects per page needs.

## Config and Environments
- Files: `src/config/config.devnet.ts|testnet.ts|mainnet.ts` + `sharedConfig.ts`
- Build/start scripts copy chosen env to `src/config/index.ts`
- Notable keys:
  - `API_URL`, `environment`, `sampleAuthenticatedDomains`
  - `SOCKET_API_URL` (devnet/mainnet), `WEBSITE_URL`
  - `VITE_PUBLIC_LEADERBOARD_URL` (guest leaderboard fetch)
  - Shared: `walletConnectV2ProjectId`, `nativeAuth`, `apiTimeout`

## Running and Building
- Install: `yarn install`
- Dev: `yarn start:devnet` (or `start:testnet` / `start:mainnet`)
- Build: `yarn build:devnet` (or testnet/mainnet)
- Test: `yarn test`
- Lint/Format: `yarn lint`, `yarn format`

## Socket Layer
- Global provider: `pages/Providers/socket.tsx`
  - Connects to `SOCKET_API_URL`
  - Exposes `socket`, `isConnected`, and `getProfile(accessToken)`
  - Handles `unauthorized` by logging out via sdk-dapp
- Hooks:
  - `useGetProfile` → requests profile via socket using native auth token
  - `useGetLeaderboard` → emits `getLeaderboard` over socket when connected and falls back to fetching `VITE_PUBLIC_LEADERBOARD_URL` for guest access or socket failures

## Game Architecture (Phaser)
- Entry: `pages/Game/Game.tsx`
  - Requires `tokenLogin.nativeAuthToken`
  - Mounts Phaser with `PreloadScene`, then adds `PlayScene`
  - Mobile/tablet: shows `RotateScreen` overlay when portrait
  - Leaderboard modal (state managed in React) populated via `useGetLeaderboard`
- Scenes & managers under `src/games/dino/`:
  - `scenes/PreloadScene.tsx`:
    - Loads audio, spritesheets, images, UI/button textures
    - Displays loading UI; starts `PlayScene` when complete
  - `scenes/PlayScene.tsx`:
    - Composes:
      - `Menu` (UI with play/avatar/leaderboard/music toggle)
      - `CharacterModal` (select character; locks based on NFT profile)
      - `DinoCharacter` (player sprite and anims)
      - `EnvironmentManager` (parallax layers; dynamic per character)
      - `ObstacleManager` (spawn/physics; weighted per character)
      - `ScoreManager` (score loop, milestones, game speed)
      - `InputManager` (pointer/keyboard + UI button handlers)
    - Socket integration (`helpers/SocketHandler.ts`):
      - Fetches profile, sets/receives selected avatar, emits START/CREATE_OBSTACLE/JUMP/END with timestamps and `gameId`
      - When `VITE_DISABLE_AUTH` is true, stubs profile data and preserves a local `gameId` so restarts keep the Phaser loop running
    - Mobile orientation handling: hides canvas and pauses in portrait; resumes in landscape
    - Collision flow: pause physics/anims, show game over UI, shake camera, stop music, send END event
  - `scenes/Menu.tsx`:
    - UI buttons (play/avatar/leaderboard/store) + music toggle (pause/resume all sounds)
  - `scenes/CharacterModal.tsx`:
    - Displays 3 characters; locks based on profile; links to purchase pages for locked ones; select updates scene and backend
  - `scenes/EnvironmentManager.ts`:
    - Builds background by character config; expand-to-fit intro; parallax updates
  - `scenes/ObstacleManager.ts`:
    - Weighted obstacle selection by character; physics setup with circular hit boxes; cleanup offscreen
  - `scenes/DinoCharacter.ts`:
    - Anims and hitboxes per character; jump behavior and in-air frames
  - `scenes/ScoreManager.ts`:
    - Score loop tied to constants; increases game speed over time; milestone SFX; high score tracking; sends END event
  - `scenes/Constants.ts`:
    - `CHARACTER_CONFIG`: background layers and obstacle probabilities
    - `GAME_SETTINGS`: physics and gameplay tuning
    - `SOUND_CONFIG`: volume presets

## UI Components
- Layout: Header (Connect/Logout based on auth), Footer, background styling
- `TransactionsTracker` (optional custom tracker; sdk-dapp modals also available)
- Re-exported MultiversX UI and wrappers under `components/sdkDappComponents.ts` to simplify imports and testability
- Home page cards include a `Leaderboard` CTA that opens the shared modal; modal supports overlay/Escape dismissal and scrollable content

## Notable Gaps / Potential Bugs
- Temporary local types still live under `types/vdash.types.ts`; align with upstream shared package to avoid drift
- Event cleanup: `PlayScene.shutdown()` removes `resize` listener but not `orientationchange`
- Minor: `this.scene.SocketHandler;` in `ScoreManager` constructor is a no-op
- Public leaderboard relies on `VITE_PUBLIC_LEADERBOARD_URL`; add server support/monitoring to guarantee data for guests
