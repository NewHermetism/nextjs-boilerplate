# Development Guide — Offline Mode

## Purpose
- Run the game locally without MultiversX login and without a backend.
- Useful for gameplay iteration, UI tweaks, and quick debugging.

## What It Does
- Bypasses auth redirects (no `/unlock` redirect).
- Starts Phaser game without a token.
- Skips socket connections and uses stub data for profile and leaderboard.

## How To Enable
- Create or edit `.env.local` at the project root:
  - `VITE_DISABLE_AUTH=true`
- Restart the dev server so Vite picks up the env:
  - `yarn start:devnet` (or `start:testnet` / `start:mainnet`)
- Navigate to `/game` and press Play.

## Affected Behavior (when enabled)
- Auth: No MultiversX login required; route guards are disabled.
- Sockets: No network calls; in-game and app-wide sockets are stubbed.
- Profile: A dummy profile is injected with all characters unlocked.
- Leaderboard: A local, static list is shown.

## How To Disable / Revert
- Preferred: set `VITE_DISABLE_AUTH=false` (or remove `.env.local`).
- Ensure to restart the dev server.
- Optional cleanup: search for `TEMP DEV FLAG` comments and remove the development-only branches before production.

## Files Touched For Offline Mode
- `src/components/Layout/Layout.tsx`
  - Skips `AuthenticatedRoutesWrapper` when `VITE_DISABLE_AUTH === 'true'`.
- `src/wrappers/AuthRedirectWrapper/AuthRedirectWrapper.tsx`
  - Skips per-page redirects when disabled.
- `src/pages/Game/Game.tsx`
  - Starts Phaser without a token; passes a dummy token in dev.
- `src/pages/Providers/socket.tsx`
  - Skips real socket connection; returns stubbed profile; marks connected.
- `src/games/dino/helpers/SocketHandler.ts`
  - Disables in-game socket usage; injects dummy `profile` and `gameId`.
- `src/hooks/useGetLeaderboard.ts`
  - Returns a static leaderboard in dev.
- `src/types/vdash.types.ts`
  - Temporary local types to replace missing external `vdash-utils` during dev.

## Notes & Limitations
- No real network traffic; transactions, profile updates, and game events are not sent to the backend.
- Keep this mode disabled in production. All changes are gated by `VITE_DISABLE_AUTH` and marked with `TEMP DEV FLAG` comments for easy removal.

