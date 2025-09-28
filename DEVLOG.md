# Daily Dev Notes

## 09-Sept-2025

### Offline Mode (Dev only)
- Introduced `VITE_DISABLE_AUTH=true` to run fully offline without MultiversX login and without backend sockets.
- Bypasses auth redirects, starts the game without a token, and stubs profile/leaderboard data.
- All changes are clearly marked with `TEMP DEV FLAG` comments for easy removal.
- See DEV.md for full instructions and affected files.

Reference: see DEV.md

### Frame-Rate Independence
- Fixed gameplay speed varying with monitor refresh rate (e.g., 60Hz vs 144Hz).
- Normalized manual movements by delta time (baseline 60 FPS):
  - Updated `EnvironmentManager.update(gameSpeed, delta)` to scale parallax and decorations with `deltaFactor`.
  - Updated `ObstacleManager.update(delta, gameSpeed)` to scale obstacle movement with `deltaFactor`.
  - Passed `delta` from `PlayScene.update` to `EnvironmentManager`.

Files updated:
- `src/games/dino/scenes/EnvironmentManager.ts`
- `src/games/dino/scenes/ObstacleManager.ts`
- `src/games/dino/scenes/PlayScene.tsx`

Notes:
- Respawn timing already used `delta`; no changes needed there.
- Feel free to request tuning if the feel should better match prior defaults.

