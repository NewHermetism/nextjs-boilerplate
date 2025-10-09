# Debug Guide - Login, Wallet & NFT Issues

## Summary of Changes

### Latest Update: Resilient Backend Communication

**NEW FEATURES:**
- ✅ **Automatic Retry Mechanism**: Profile requests retry up to 3 times (5 seconds each)
- ✅ **Clear Error States**: Visual feedback in debug UI when backend fails
- ✅ **Better Error Messages**: Console logs explain exactly what went wrong
- ✅ **Graceful Degradation**: Game won't crash if backend is down

### Previous Updates

I've added comprehensive debug logging throughout the authentication and game initialization flow. All console logs will now help you identify exactly where the problem is.

## What I Found

### Code Flow Analysis

1. **Authentication Flow** (`src/pages/Game/Game.tsx`):
   - Uses `useGetLoginInfo()` hook to get `tokenLogin.nativeAuthToken`
   - This token is required to initialize the Phaser game
   - The game won't start without a valid token

2. **Game Initialization** (`src/games/dino/scenes/PlayScene.tsx`):
   - Constructor receives the `accessToken`
   - Immediately creates a `SocketHandler` instance
   - Calls `SocketHandler.getProfile()` to fetch user profile from backend

3. **Profile Loading** (`src/games/dino/helpers/SocketHandler.ts`):
   - Connects to `https://vdash-api.supervictornft.com/`
   - Emits `getVDashProfile` event with the access token
   - Waits for `getVDashProfile` response with NFT ownership data
   - **CRITICAL**: Profile may not arrive before user tries to interact!

4. **Character Selection & NFT Check** (`src/games/dino/scenes/PlayScene.tsx` lines 120-173):
   - When user clicks "Avatar" or "Play" buttons, checks `this.profile`
   - If `profile` is undefined → locks all characters
   - If `profile` exists → checks NFT flags:
     - `has_white_pijama_nft` (Character 0)
     - `has_boss_nft` (Character 1)
     - `has_blue_victor_nft` (Character 2)
   - User can only play if they own at least one NFT

### Potential Issues Identified

1. **Race Condition**: Profile loading is asynchronous. If backend is slow or socket connection fails, `this.profile` stays undefined.

2. **Socket Connection Failures**: If socket doesn't connect to backend, profile will never load.

3. **Backend Issues**: The backend at `https://vdash-api.supervictornft.com/` must:
   - Accept the socket connection
   - Validate the JWT token
   - Query NFT ownership for the wallet address
   - Return the profile data

4. **Token Issues**: If the JWT token is invalid, expired, or malformed, backend may not respond.

## Debug Logging Added

### Game.tsx
- Logs authentication state when component loads
- Shows token availability and length
- Logs Phaser game initialization

### AuthRedirectWrapper.tsx
- Logs authentication checks
- Shows redirect decisions

### PlayScene.tsx
- Logs constructor initialization
- Shows token info
- Logs when profile is requested
- Shows current state in create() method
- **Debug UI in top-right corner** shows:
  - Wallet address
  - Profile loaded status
  - NFT ownership for each character

### SocketHandler.ts
- Logs socket connection status
- Logs connection errors with details
- Shows when profile is requested
- Logs socket state (connected/disconnected)
- **5-second timeout warning** if profile doesn't arrive
- Enhanced profile response logging

## How to Debug

### Step 1: Start the Application
```bash
npm run dev
```

### Step 2: Open Browser Console
Open Developer Tools (F12) and go to the Console tab.

### Step 3: Login with Your Wallet
Login with the wallet that owns NFTs. Watch for these logs:

```
🔐 AuthRedirectWrapper: Checking authentication
✅ AuthRedirectWrapper: User is logged in and authorized
🔐 Game.tsx - Authentication State: {hasToken: true, ...}
🎮 Game.tsx - Initializing Phaser game with token
✅ Game.tsx - Phaser game initialized successfully
```

### Step 4: Watch for PlayScene Initialization
```
🎬 PlayScene: Constructor called
🔐 PlayScene: Access Token Info: {hasToken: true, tokenLength: xxx, ...}
🔌 PlayScene: Initializing SocketHandler...
📞 PlayScene: Requesting profile from backend...
```

### Step 5: Monitor Socket Connection
```
🔌 SocketHandler: Connected to server
🆔 Player ID: xxxxx
🌐 Socket API URL: https://vdash-api.supervictornft.com/
```

**If you see this instead:**
```
❌ SocketHandler: Connection error: ...
```
Then the backend is not reachable or refusing connections.

### Step 6: Watch for Profile Response

**SUCCESS:**
```
🔄 SocketHandler: Requesting profile from backend... (Attempt 1/3)
📤 Emitting getVDashProfile event with: {socketConnected: true, ...}
✅ Received profile from backend: {...}
🎮 NFT Ownership Details:
   White Pijama (Character 0): ✅ OWNED
   Boss (Character 1): ❌ NOT OWNED
   Blue Victor (Character 2): ❌ NOT OWNED
```

**AUTOMATIC RETRY (if backend is slow):**
```
⏱️ TIMEOUT: Profile not received after 5 seconds! (Attempt 1/3)
🔄 Retrying profile request... (1/3)
🔄 SocketHandler: Requesting profile from backend... (Attempt 2/3)
```

**FINAL FAILURE (after 3 attempts × 5 seconds = 15 seconds):**
```
⏱️ TIMEOUT: Profile not received after 5 seconds! (Attempt 3/3)
❌ FATAL: Failed to load profile after multiple attempts!
Backend server at https://vdash-api.supervictornft.com/ is not responding.
Please check:
1. Backend server is running
2. Socket.io endpoint is accessible
3. getVDashProfile event handler is implemented
4. JWT token validation is working
```

The debug UI will show: `Profile: ERROR ❌` and `⚠️ Backend Not Responding!`

### Step 7: Check Debug UI
Look at the **top-right corner** of the game screen. You'll see one of these states:

**LOADING STATE (while waiting for backend):**
```
🔐 DEBUG INFO
Wallet: erd1abc...xyz123
Profile: LOADING... ⏳
```

**SUCCESS STATE:**
```
🔐 DEBUG INFO
Wallet: erd1abc...xyz123
Profile: LOADED ✅
White Pijama NFT: ✅
Boss NFT: ❌
Blue Victor NFT: ❌
Selected: Character 0
```

**ERROR STATE (backend failed after retries):**
```
🔐 DEBUG INFO
Wallet: erd1abc...xyz123
Profile: ERROR ❌
⚠️ Backend Not Responding!
Check console for details
```

### Step 8: Try to Play
Click the "Play" button or "Avatar" button and watch for:
```
📊 Profile NFT ownership: {white_pijama: true, boss: false, blue_victor: false}
🔒 Locked character indexes: [1, 2]
✅ User has NFT, starting game...
```

**If you see:**
```
⚠️ Profile is undefined! Backend may not have responded.
🔒 Locked character indexes: [0, 1, 2]
```
Then all characters are locked because the profile didn't load.

## Common Issues & Solutions

### Issue 1: "Profile is undefined"
**Symptoms**: All characters locked, can't play
**Causes**:
- Socket not connected to backend
- Backend not responding
- Backend error processing token

**Check**:
1. Is socket connected? Look for "🔌 SocketHandler: Connected to server"
2. Did profile request timeout? Look for "⏱️ TIMEOUT"
3. Check backend logs if you have access

**Solution**: Ensure backend is running and accessible at `https://vdash-api.supervictornft.com/`

### Issue 2: "Socket is not connected"
**Symptoms**: Error message in console about socket connection
**Causes**:
- Backend server is down
- CORS issues
- Network connectivity issues

**Check**:
1. Can you access `https://vdash-api.supervictornft.com/` in browser?
2. Check browser Network tab for failed requests
3. Look for CORS errors in console

**Solution**: Fix backend server or CORS configuration

### Issue 3: "Characters are locked even though I own NFTs"
**Symptoms**: Profile loads but NFT flags are all false
**Causes**:
- Backend not querying NFT ownership correctly
- Wrong wallet address in token
- NFTs on different address

**Check**:
1. Look at Debug UI - does wallet address match your NFT-holding wallet?
2. Check the profile response in console - what do the NFT flags say?
3. Verify on blockchain explorer that this wallet owns the NFTs

**Solution**: Check backend NFT verification logic

### Issue 4: "No authentication token available"
**Symptoms**: Game doesn't initialize at all
**Causes**:
- Not logged in
- Login failed
- Token expired

**Check**:
1. Are you on the game page after logging in?
2. Look for "⚠️ Game.tsx - No authentication token available"

**Solution**: Try logging out and logging in again

## Backend Checklist

If the backend is under your control, verify:

1. ✅ Socket.io server is running
2. ✅ CORS allows connections from your frontend origin
3. ✅ `getVDashProfile` event handler exists
4. ✅ JWT token validation works
5. ✅ NFT ownership queries work correctly
6. ✅ Profile response includes all required fields:
   - `has_white_pijama_nft`
   - `has_boss_nft`
   - `has_blue_victor_nft`
   - `selected_character`

## Next Steps

1. **Run the application** with `npm run dev`
2. **Login with your wallet**
3. **Open Console** and watch the logs carefully
4. **Share the console logs** with me if you still have issues

The debug logs will tell you exactly where the problem is!
