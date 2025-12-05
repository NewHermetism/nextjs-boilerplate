> Architecture

  - React 18 + Vite + TypeScript front-end bootstraps inside DappProvider, Axios
  interceptors, router, and BatchTransactionsContextProvider, so every page inherits
  MultiversX config, wallet modals, and SDK-managed HTTP behavior (src/App.tsx:1-80).
  - Layout wraps all routes with the socket context, shared header/footer, and either
  the sdk-dapp AuthenticatedRoutesWrapper or a temporary VITE_DISABLE_AUTH bypass for
  offline dev (src/components/Layout/Layout.tsx:10-37).
  - Routes are intentionally simple: / for the marketing/leaderboard landing
  and /game for the Phaser runner, with /unlock as the login screen (src/routes/
  routes.ts:9-20, src/localConstants/routes/routeNames.enums.ts:1-5). Home keeps
  visitors unauthenticated but still wires hooks for profile/leaderboard reads and
  NFT promos (src/pages/Home/Home.tsx:1-95).
  - Build/start scripts always copy an environment-specific config (config.devnet|
  testnet|mainnet) into src/config/index.ts, then run Vite, keeping API bases,
  socket URLs, and wallet metadata centralized (package.json:32-48, src/config/
  config.devnet.ts:1-10, src/config/sharedConfig.ts:1-6).
  - Assets for Phaser are served out of public/assets and enumerated once during
  preload, covering music, sprites, UI elements, and background layers, so the
  runtime never hardcodes paths outside PreloadScene (src/games/dino/scenes/
  PreloadScene.tsx:42-178).

  Wallet Authentication & Session Flow

  - MultiversX native auth is on by default (nativeAuth = true in src/config/
  sharedConfig.ts:1-6), so every login method (WalletConnect, browser extension, web
  wallet cross-window, Ledger, Metamask proxy) on the Unlock page passes nativeAuth
  plus a callbackRoute into sdk-dapp components or the iframe hook (src/pages/Unlock/
  Unlock.tsx:25-187).
  - AuthRedirectWrapper protects routes by observing sdk-dapp’s useGetIsLoggedIn;
  authenticated users can’t see /unlock, and unauthenticated players are
  bounced there unless VITE_DISABLE_AUTH is set for development (src/wrappers/
  AuthRedirectWrapper/AuthRedirectWrapper.tsx:10-38).
  - The header surfaces a Connect CTA (linked to /unlock) or a Logout button; logout
  clears session storage and dispatches the sdk-dapp logout helper so all MultiversX
  providers close cleanly (src/components/Layout/Header/Header.tsx:32-114).
  - SocketProvider hangs off the layout so React hooks share a single socket.io-
  client connection to SOCKET_API_URL. It exposes isConnected, the raw socket for
  event-based hooks, and a getProfile(accessToken) helper; unauthorized events
  trigger sdk-dapp’s logout flow (src/pages/Providers/socket.tsx:1-132).
  - useGetProfile pulls the sdk-dapp login info, grabs the native auth token, and
  calls getProfile so the React shell can keep NFT ownership data in sync with wallet
  state (src/hooks/useGetProfile.ts:1-23). useGetLeaderboard prefers sockets but
  gracefully falls back to a public HTTP endpoint so guests can still see scores
  (src/hooks/useGetLeaderboard.ts:1-122).
  - The /game route instantiates Phaser only when a tokenLogin.nativeAuthToken exists
  (or auth is disabled), then passes the token into PlayScene. That keeps the SDK-
  driven wallet session in React while the arcade scene reuses the same token for
  backend verification (src/pages/Game/Game.tsx:13-99).

  Gameplay & NFT Linkage

  - PlayScene is the monolithic coordinator: it spins up managers for characters,
  environment, obstacles, scoring, inputs, UI overlays, debug menus, and a bespoke
  SocketHandler. It requests the player's profile as soon as it’s constructed to know
  which avatars are unlocked and to hydrate the scene’s selectedCharacterIndex (src/
  games/dino/scenes/PlayScene.tsx:17-215).
  - SocketHandler opens its own socket connection, reusing the same SOCKET_API_URL
  but staying scoped to gameplay events. It fetches the VDash profile, persists
  avatar selections, and emits START/JUMP/CREATE_OBSTACLE/END events tagged with the
  player’s native-auth token and gameId, ensuring the backend can verify real wallet
  ownership for rewards (src/games/dino/helpers/SocketHandler.ts:13-138).
  - VdashProfile mirrors the backend payload: selected_character plus booleans
  has_white_pijama_nft, has_boss_nft, and has_blue_victor_nft, tying on-chain
  assets directly to game entitlements (src/types/vdash.types.ts:4-18). PlayScene
  checks those booleans before letting someone start; without at least one NFT, it
  forces the avatar modal open instead of running the loop (src/games/dino/scenes/
  PlayScene.tsx:124-156).
  - CharacterModal visualizes the three avatars, greys out locked slots, and links
  directly to the relevant XOXNO collection if you tap a locked character. Selecting
  an unlocked avatar both updates the scene and calls setVDashSelectedCharacter
  so the backend knows which NFT skin is active (src/games/dino/scenes/
  CharacterModal.tsx:59-169).
  - Asset-to-NFT mapping is data-driven: CHARACTER_CONFIG pairs each avatar
  index with the appropriate background layers and obstacle weights (src/games/
  dino/scenes/Constants.ts:18-94), EnvironmentManager swaps those layers when
  selectedCharacterIndex changes (src/games/dino/scenes/EnvironmentManager.ts:15-
  199), DinoCharacter loads the right animation set and hitboxes per avatar (src/
  games/dino/scenes/DinoCharacter.ts:12-195), and ObstacleManager selects obstacles
  using the per-character weight tables while configuring per-sprite physics bodies
  (src/games/dino/scenes/ObstacleManager.ts:1-260).
  - UI components woven into the scene keep the NFT context visible: Menu handles
  avatar, leaderboard, store, and music controls (src/games/dino/scenes/Menu.tsx:3-
  164); ScoreManager adjusts scoring cadence and dispatches END events that include
  the avatar ID and final score (src/games/dino/scenes/ScoreManager.ts:1-158);
  UIManager shows restart/back/menu overlays when collisions occur (src/games/dino/
  scenes/UIManager.ts:1-82).
  - Leaderboards in both the React shell and the game modal render the avatar
  column using VDashScore.avatar, so whatever NFT skin you used during the run is
  reflected visually for other players (src/pages/Game/components/LeaderboardModal/
  LeaderboardModal.tsx:13-105).
  - Because both React and Phaser maintain sockets, there’s a deliberate split in
  responsibilities: React’s socket is for profile/leaderboard data accessible to
  any route, while the scene-level handler is optimized for low-latency gameplay
  telemetry. Both are gated by the same native-auth token, creating a full chain
  from wallet login → NFT ownership verification → runtime entitlements → score
  submission.

  Overall, the repo layers MultiversX-native authentication and sockets around a
  Phaser endless runner so only wallet owners of the project’s NFTs can play with
  (and earn from) their characters, while still keeping the marketing site and
  leaderboard accessible to everyone. Natural next steps, if you need deeper insight,
  would be (1) reviewing the backend event contract for sendVDashEvent to understand
  how scores get validated, or (2) consolidating the dual socket connections if you
  plan to share more state between React and Phaser.

  Recent updates

  - Added /editor route to surface the existing prototype editor inside the React
  shell via an iframe pointed at the static HTML (src/pages/Editor/index.tsx:1-17,
  src/routes/routes.ts:1-20, src/localConstants/routes/routeNames.enums.ts:1-6).
  The raw editor HTML is copied into the build as public/editor/index.html so Vite
  can serve it directly (test_editor/index.html → public/editor/index.html).
  - Tweaked the /editor iframe container to use full available width with a tall
  viewport so the embedded canvas renders horizontally instead of being cramped
  (src/pages/Editor/index.tsx:1-17).
  - Added AccessGuard to restrict the /editor route (outside of test mode) to a
  single wallet address, showing “USER WITHOUT ACESS” for others. Guard checks the
  pathname so it only activates on /editor and never affects the game or other pages
  (src/components/AccessGuard/AccessGuard.tsx:1-42, src/pages/Editor/index.tsx:1-28).
  - Editor iframe now uses the raw HTML embedded via srcDoc instead of a public
  static file, so the guarded route controls access and there’s no direct static
  URL to bypass (src/pages/Editor/index.tsx:1-33; removed public/editor/index.html).
