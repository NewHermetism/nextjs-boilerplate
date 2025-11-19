--

## TABLE OF CONTENTS

1. [General Architecture](#general-architecture)
2. [Configuration and Environments](#configuration-and-environments)
3. [Database](#database)
4. [API REST Endpoints](#api-rest-endpoints)
5. [WebSocket Events (Socket.io)](#websocket-events-socketio)
6. [Business Controllers](#business-controllers)
7. [MultiversX Integration](#multiversx-integration)
8. [Cron Jobs](#cron-jobs)
9. [Authentication and Security](#authentication-and-security)
10. [File Structure](#file-structure)

---

## GENERAL ARCHITECTURE

### Technology Stack
- **Runtime:** Node.js 18 (Alpine Linux)
- **Framework:** Express.js 4.18
- **WebSocket:** Socket.io 4.8
- **Database:** PostgreSQL 15
- **Language:** TypeScript 5.3
- **Blockchain:** MultiversX SDK

### Docker Containers
```
victor-api_api_1  → Port 3001 (API)
api-db            → Port 5432 (PostgreSQL)
```

### Entry Point
**File:** `/home/vdash/victor-api/src/app.ts`

```typescript
import express from 'express';
import cors from 'cors';
import { initSocket } from './socket';
import { initCrons } from './crons';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// REST Endpoints
app.get('/', (req, res) => res.send('Hello World!'));
app.get('/rewards', getRewards);
app.get('/leaderboard', getLeaderboard);
app.get('/last-leaderboard', getLastLeaderboard);

// Server
const server = app.listen(PORT);

// Socket.io
initSocket(server);

// Cron Jobs
initCrons();
```

---

## CONFIGURATION AND ENVIRONMENTS

### Configuration Files

**Location:** `/home/vdash/victor-api/src/config/`

#### `config.mainnet.ts` (PRODUCTION - CURRENT)
```typescript
export const config = {
  // Frontend
  DAPP_URL: 'https://supervictornft.com',

  // Blockchain
  MVX_API_URL: 'https://api.multiversx.com',
  CHAIN_ID: '1',

  // NFT Collections (Characters)
  WHITE_PIJAMA_NFT_COLLECTION: 'SUPERVIC-f07785',
  BOSS_NFT_COLLECTION: 'MINIBOSSES-104b7f',
  BLUE_VICTOR_NFT_COLLECTION: 'VICBITS-da9df7',

  // Rewards Token
  REWARDS_TOKEN: 'VICTOR-9fa27f',

  // Cron Schedule
  REWARDS_CRON: '0 20 * * 0', // Sundays 8 PM (Europe/Bucharest)
  REWARDS_CRON_TIMEZONE: 'Europe/Bucharest'
};
```

#### `config.devnet.ts` (DEVELOPMENT)
```typescript
export const config = {
  DAPP_URL: '*', // Accepts any origin
  MVX_API_URL: 'https://devnet-api.multiversx.com',
  CHAIN_ID: 'D',

  // All collections use the same one in devnet
  WHITE_PIJAMA_NFT_COLLECTION: 'BEEF-d85a2f',
  BOSS_NFT_COLLECTION: 'BEEF-d85a2f',
  BLUE_VICTOR_NFT_COLLECTION: 'BEEF-d85a2f',

  REWARDS_TOKEN: 'VICTOR-d80ece',
  REWARDS_CRON: '0 0 */2 * *' // Every 2 hours
};
```

#### `config.devnet-local.ts` (LOCAL)
```typescript
export const config = {
  DAPP_URL: 'https://localhost:3000',
  // Rest same as devnet
};
```

### Environment Variables

**File:** `/home/vdash/victor-api/.env`

```env
NODE_ENV=production
POSTGRES_ADMIN=admin
POSTGRES_ADMIN_PASSWORD=Qwer123$
```

### Configuration Selection

**File:** `/home/vdash/victor-api/entrypoint.sh`

```bash
if [ "$NODE_ENV" = "production" ]; then
  cp src/config/config.mainnet.ts src/config/config.ts
elif [ "$NODE_ENV" = "development" ]; then
  cp src/config/config.devnet.ts src/config/config.ts
else
  cp src/config/config.devnet-local.ts src/config/config.ts
fi
```

---

## DATABASE

### Connection

**File:** `/home/vdash/victor-api/src/database/index.ts`

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'postgres',
  port: 5432,
  database: 'mydatabase',
  user: process.env.POSTGRES_ADMIN,
  password: process.env.POSTGRES_ADMIN_PASSWORD
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
```

### Table Schema

#### 1. `vdash_events`
**Purpose:** Log all game events (anti-cheat)

```sql
CREATE TABLE vdash_events (
    id UUID PRIMARY KEY,
    game_id UUID,
    player_address VARCHAR(62) NOT NULL,
    event_type vdash_event_type NOT NULL, -- ENUM: START, END, JUMP, CREATE_OBSTACLE
    score INTEGER,
    avatar INTEGER NOT NULL, -- 0=Pajama, 1=Boss, 2=Blue
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_vdash_events_avatar ON vdash_events(avatar);
CREATE INDEX idx_vdash_events_player ON vdash_events(player_address);
CREATE INDEX idx_vdash_events_game ON vdash_events(game_id);
CREATE INDEX idx_vdash_events_timestamp ON vdash_events(timestamp);
```

**Current data:** 23,195 events

#### 2. `vdash_scores`
**Purpose:** Final scores for leaderboard

```sql
CREATE TABLE vdash_scores (
    id UUID PRIMARY KEY,
    game_id UUID,
    player_address VARCHAR(62) NOT NULL,
    score INTEGER NOT NULL,
    avatar INTEGER NOT NULL,
    reward VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_vdash_scores_avatar ON vdash_scores(avatar);
CREATE INDEX idx_vdash_scores_player ON vdash_scores(player_address);
CREATE INDEX idx_vdash_scores_score ON vdash_scores(score DESC);
CREATE INDEX idx_vdash_scores_timestamp ON vdash_scores(timestamp);
```

**Current data:** 7,829 scores from 72 unique players

#### 3. `vdash_profiles`
**Purpose:** User profiles with NFT ownership

```sql
CREATE TABLE vdash_profiles (
    id UUID PRIMARY KEY,
    address VARCHAR(62) NOT NULL UNIQUE,
    has_white_pijama_nft BOOLEAN DEFAULT false,
    has_blue_victor_nft BOOLEAN DEFAULT false,
    has_boss_nft BOOLEAN DEFAULT false,
    selected_character INTEGER, -- 0, 1, or 2
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_vdash_profiles_address ON vdash_profiles(address);
```

**Current data:** 177 profiles

#### 4. `vdash_rewards`
**Purpose:** Log of weekly reward distributions

```sql
CREATE TABLE vdash_rewards (
    id UUID PRIMARY KEY,
    rewards JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**JSONB Structure:**
```json
{
  "1": {
    "address": "erd1...",
    "score": 2942,
    "value": 365.85,
    "distributed": true,
    "nonce": 332
  },
  "2": { ... },
  ...
  "100": { ... }
}
```

**Current data:** 23 completed distributions

---

## API REST ENDPOINTS

### GET `/`
**Purpose:** Health check

**Response:**
```
"Hello World!"
```

---

### GET `/rewards`
**Purpose:** Get latest reward distributions

**Controller:** `/home/vdash/victor-api/src/controllers/vdash/leaderboard.ts`

**Query params:** None

**Response:**
```json
[
  {
    "id": "675dabd3-b896-4291-9241-8613f90b609c",
    "rewards": {
      "1": { "address": "erd1...", "value": 365.85, ... },
      ...
    },
    "created_at": "2025-11-16T18:00:00.179Z"
  }
]
```

**Implementation:**
```typescript
app.get('/rewards', async (req, res) => {
  const rewards = await getRewards(10); // Last 10
  res.json(rewards);
});
```

---

### GET `/leaderboard`
**Purpose:** Current week leaderboard (top 10)

**Controller:** `/home/vdash/victor-api/src/controllers/vdash/leaderboard.ts`

**Query params:** None

**Response:**
```json
{
  "leaderboard": [
    {
      "playerAddress": "erd1ggas5zumg7y57mhqmjs07jdehl07kf32uver3ystdpaspkhyztvs5y7f0v",
      "score": 2942,
      "avatar": 1,
      "timestamp": "2025-11-16T10:30:00Z",
      "reward": 365.85
    },
    ...
  ]
}
```

**Logic:**
- Filters scores after last reward distribution
- One score per player (highest)
- Avatar priority: Boss(1) > Pajama(0) > Blue(2)
- Calculates theoretical rewards

---

### GET `/last-leaderboard`
**Purpose:** Previous week leaderboard (top 100)

**Response:** Similar to `/leaderboard` but with top 100 from previous period

---

## WEBSOCKET EVENTS (Socket.io)

### Configuration

**File:** `/home/vdash/victor-api/src/socket/index.ts`

```typescript
import { Server } from 'socket.io';
import { config } from '../config';

export const initSocket = (server: any) => {
  const io = new Server(server, {
    cors: {
      origin: config.DAPP_URL,
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected');

    // Event handlers...
  });
};
```

---

### Events: Client → Server

#### 1. `requestAuthCode`
**Payload:** None
**Purpose:** Placeholder (not implemented)
**Handler:** `/home/vdash/victor-api/src/socket/index.ts:33-35`

---

#### 2. `getProfile`
**Payload:**
```typescript
{
  accessToken: string
}
```

**Purpose:** Get user's basic address

**Response Event:** `getProfile` or `getProfileError`

**Response:**
```json
{
  "address": "erd1..."
}
```

**Handler:** `/home/vdash/victor-api/src/socket/index.ts:38-51`

**Implementation:**
```typescript
socket.on('getProfile', async (payload) => {
  const address = await verifySignature(payload.accessToken);
  if (address) {
    socket.emit('getProfile', { address });
  } else {
    socket.emit('getProfileError', { error: 'Invalid token' });
  }
});
```

---

#### 3. `getVDashProfile`
**Payload:**
```typescript
{
  accessToken: string
}
```

**Purpose:** Get complete profile with NFTs and selected character

**Response Event:** `getVDashProfile` or `getVDashProfileError`

**Response:**
```json
{
  "id": "uuid",
  "address": "erd1...",
  "has_white_pijama_nft": true,
  "has_blue_victor_nft": false,
  "has_boss_nft": true,
  "selected_character": 1,
  "created_at": "2025-06-15T10:00:00Z",
  "updated_at": "2025-11-18T12:30:00Z"
}
```

**Process:**
1. Verify `accessToken`
2. Get user's NFTs from MultiversX API
3. Verify ownership of the 3 collections
4. Create/update profile in DB
5. Auto-select character if first time
6. Return complete profile

**Controller:** `/home/vdash/victor-api/src/controllers/vdash/profile.ts:19-67`

---

#### 4. `setVDashSelectedCharacter`
**Payload:**
```typescript
{
  accessToken: string,
  selected_character: 0 | 1 | 2
}
```

**Purpose:** Change selected character/avatar

**Validation:**
- 0 = White Pajama → Must have `has_white_pijama_nft: true`
- 1 = Boss → Must have `has_boss_nft: true`
- 2 = Blue Victor → Always allowed (default)

**Response Event:** `getVDashProfile` or `setVDashSelectedCharacterError`

**Response:** Updated profile (same format as `getVDashProfile`)

**Controller:** `/home/vdash/victor-api/src/controllers/vdash/profile.ts:69-109`

---

#### 5. `sendVDashEvent`
**Payload:**
```typescript
// Event Type: START
{
  accessToken: string,
  type: 'START',
  score: 0,
  avatar: 0 | 1 | 2,
  timestamp: number // Unix milliseconds
}

// Event Type: END
{
  accessToken: string,
  type: 'END',
  game_id: string,
  score: number,
  avatar: 0 | 1 | 2,
  timestamp: number
}

// Event Type: JUMP
{
  accessToken: string,
  type: 'JUMP',
  game_id: string,
  score: number,
  avatar: 0 | 1 | 2,
  timestamp: number
}

// Event Type: CREATE_OBSTACLE
{
  accessToken: string,
  type: 'CREATE_OBSTACLE',
  game_id: string,
  score: number,
  avatar: 0 | 1 | 2,
  timestamp: number
}
```

**Purpose:** Process game events

**Response Events:**
- `START` → `sendVDashStartGame` with `{ game_id: string }`
- Others → No response (logging only)
- Error → `sendVDashEventError`

**Process:**
1. Verify `accessToken`
2. Validate ownership of selected avatar's NFT
3. **START:** Generate UUID for `game_id`, save event
4. **END:** Save event + save final score
5. **JUMP/CREATE_OBSTACLE:** Only save event (anti-cheat)

**Controller:** `/home/vdash/victor-api/src/controllers/vdash/event.ts`

**Anti-cheat validation:**
```typescript
// Verify user owns the avatar's NFT
const profile = await getVDashProfileDB(address);

if (avatar === 0 && !profile.has_white_pijama_nft) {
  throw new Error('You do not own the White Pajama NFT');
}
if (avatar === 1 && !profile.has_boss_nft) {
  throw new Error('You do not own the Boss NFT');
}
// Avatar 2 (Blue) always allowed
```

---

#### 6. `getLeaderboard`
**Payload:**
```typescript
{
  limit: number // Example: 10, 100
}
```

**Purpose:** Get leaderboard with calculated rewards

**Response Event:** `getLeaderboard` or `getLeaderboardError`

**Response:**
```json
{
  "leaderboard": [
    {
      "playerAddress": "erd1...",
      "score": 2942,
      "avatar": 1,
      "timestamp": "2025-11-16T10:30:00Z",
      "reward": 365.85
    },
    ...
  ]
}
```

**Controller:** `/home/vdash/victor-api/src/controllers/vdash/leaderboard.ts`

---

### Events: Server → Client

- `getProfile` - User's address
- `getProfileError` - Authentication error
- `getVDashProfile` - Complete profile
- `getVDashProfileError` - Error getting profile
- `setVDashSelectedCharacterError` - Error changing character
- `sendVDashStartGame` - Game ID for new match
- `sendVDashEventError` - Error processing event
- `getLeaderboard` - Leaderboard data
- `getLeaderboardError` - Error getting leaderboard
- `unauthorized` - Invalid token

---

## BUSINESS CONTROLLERS

### Profile Controller

**File:** `/home/vdash/victor-api/src/controllers/vdash/profile.ts`

#### `getVDashProfile(socket, payload)`
1. Verifies token
2. Gets user's NFTs (MultiversX API)
3. Updates/creates profile in DB
4. Auto-selects character if new
5. Emits complete profile

#### `setVDashSelectedCharacter(socket, payload)`
1. Verifies token
2. Validates character's NFT ownership
3. Updates `selected_character` in DB
4. Emits updated profile

---

### Event Controller

**File:** `/home/vdash/victor-api/src/controllers/vdash/event.ts`

#### `sendVDashEvent(socket, payload)`
1. Verifies token
2. Validates avatar's NFT ownership
3. Processes based on event type:
   - **START:** Generates `game_id`, saves event, returns ID
   - **END:** Saves event + final score
   - **JUMP/CREATE_OBSTACLE:** Only saves event
4. Error handling

---

### Leaderboard Controller

**File:** `/home/vdash/victor-api/src/controllers/vdash/leaderboard.ts`

#### `getLeaderboard(limit)`
1. Gets timestamp of last reward
2. Queries scores after that date
3. One score per player (maximum)
4. Calculates theoretical rewards
5. Returns top N

#### `getLastLeaderboard(limit)`
Similar but for previous period (before last reward)

---

### Rewards Controller

**File:** `/home/vdash/victor-api/src/controllers/vdash/rewards.ts`

#### `extractRewards()`
**Purpose:** Calculate reward distribution

**Process:**
1. Get top 100 scores of current period
2. Apply percentages by ranking:
   ```
   Rank 1:  30.0% (300 VICTOR)
   Rank 2:  15.0% (150 VICTOR)
   Rank 3:  10.0% (100 VICTOR)
   ...
   Rank 51-100: 0.1% each (1 VICTOR)
   ```
3. If fewer than 100 players, adjust percentages
4. Save to `vdash_rewards` table as JSONB
5. Return reward ID

**Total distribution:** 1000 VICTOR tokens

---

## MULTIVERSX INTEGRATION

### Account NFTs

**File:** `/home/vdash/victor-api/src/mvx_api/account_nfts.ts`

#### `getAccountNFTs(address, collections[])`
**Purpose:** Get user's NFTs

**API Endpoint:**
```
GET {MVX_API_URL}/accounts/{address}/nfts?collections={col1},{col2},{col3}
```

**Example:**
```typescript
const nfts = await getAccountNFTs(
  'erd1...',
  ['SUPERVIC-f07785', 'MINIBOSSES-104b7f', 'VICBITS-da9df7']
);
```

**Response:**
```json
[
  {
    "identifier": "SUPERVIC-f07785-01",
    "collection": "SUPERVIC-f07785",
    "name": "SuperVictor #1",
    "url": "https://media.elrond.com/nfts/..."
  }
]
```

---

### Send Transaction

**File:** `/home/vdash/victor-api/src/utils/send_transaction.ts`

#### `sendESDTTransaction(receiverAddress, tokenId, amount)`
**Purpose:** Send VICTOR tokens as rewards

**Process:**
1. Load wallet from `vdash_wallet.pem`
2. Get account nonce
3. Create ESDT transaction
4. Sign with private key
5. Send to MultiversX API
6. Return transaction nonce

**Example:**
```typescript
const nonce = await sendESDTTransaction(
  'erd1...',
  'VICTOR-9fa27f',
  BigInt(365850000000000000000) // 365.85 VICTOR
);
```

**Wallet file:** `/home/vdash/victor-api/vdash_wallet.pem`

---

### Native Auth

**File:** `/home/vdash/victor-api/src/utils/verify_signature.ts`

#### `verifySignature(accessToken)`
**Purpose:** Validate authentication token

**SDK:** `@multiversx/sdk-native-auth-server`

**Configuration:**
```typescript
const nativeAuth = new NativeAuthServer({
  apiUrl: config.MVX_API_URL,
  acceptedOrigins: [config.DAPP_URL],
  maxExpirySeconds: 86400 // 24 hours
});
```

**Process:**
1. Verify cryptographic signature
2. Validate origin (DAPP_URL)
3. Check expiration
4. Extract wallet address
5. Return address or null

**Example:**
```typescript
const address = await verifySignature('ZXJkMXF...');
// Returns: "erd1..." or null
```

---

## CRON JOBS

### Rewards Distribution Cron

**File:** `/home/vdash/victor-api/src/crons/vdash/rewards.ts`

**Schedule:**
- **Production:** `0 20 * * 0` (Sundays 8 PM, Europe/Bucharest)
- **Devnet:** `0 0 */2 * *` (Every 2 hours)

**Process:**

#### Phase 1: Extract Rewards
```typescript
cron.schedule('0 20 * * 0', async () => {
  const rewardId = await extractRewards();
  await distributRewards(rewardId);
}, {
  timezone: 'Europe/Bucharest'
});
```

#### Phase 2: Distribute Rewards
1. Get reward record by ID
2. Iterate over each ranking (1-100)
3. For each one:
   - Check if already distributed
   - Mark as distributed in DB (prevent double-spend)
   - Send blockchain transaction
   - Save transaction nonce
   - Wait 10 seconds
   - If fails → rollback "distributed" flag

**Transactions:**
- Token: `VICTOR-9fa27f` (mainnet)
- Decimals: 18
- Sender: Wallet from `vdash_wallet.pem`

---

## AUTHENTICATION AND SECURITY

### MultiversX Native Auth

**Flow:**
1. Frontend generates challenge with Native Auth Client
2. User signs with wallet (xPortal, DeFi Wallet, etc.)
3. Frontend receives `accessToken` (signed message)
4. Frontend sends `accessToken` in each request
5. Backend validates with `verifySignature()`

**Token contains:**
- User's address
- Creation timestamp
- Origin (DAPP_URL)
- Cryptographic signature

**Validation:**
- Valid signature ✓
- Origin matches config ✓
- Not expired (< 24h) ✓

---

### NFT Ownership Verification

**Fraud prevention:**
```typescript
// Before allowing play with an avatar
const profile = await getVDashProfileDB(address);

if (avatar === 1 && !profile.has_boss_nft) {
  throw new Error('You do not own the Boss NFT');
}
```

**Ownership update:**
- Verified every time they get profile (`getVDashProfile`)
- Calls MultiversX API to confirm current NFTs
- Updates flags in database

---

### Reward Distribution Safety

**Double payment prevention:**
```typescript
// Mark as distributed BEFORE sending
await updateRewards(rewardId, {
  [`${rank}.distributed`]: true
});

try {
  // Send transaction
  const nonce = await sendESDTTransaction(...);

  // Save nonce
  await updateRewards(rewardId, {
    [`${rank}.nonce`]: nonce
  });
} catch (error) {
  // If fails, revert flag
  await updateRewards(rewardId, {
    [`${rank}.distributed`]: false
  });
  throw error;
}
```

---

## FILE STRUCTURE

```
/home/vdash/victor-api/
├── src/
│   ├── app.ts                          # Entry point (54 lines)
│   │
│   ├── config/
│   │   ├── config.mainnet.ts          # Production config
│   │   ├── config.devnet.ts           # Devnet config
│   │   ├── config.devnet-local.ts     # Local config
│   │   └── index.ts                   # Export active config
│   │
│   ├── controllers/vdash/
│   │   ├── event.ts                   # Process game events (71 lines)
│   │   ├── leaderboard.ts             # Get leaderboards
│   │   ├── profile.ts                 # Profile management (110 lines)
│   │   └── rewards.ts                 # Rewards calculation (100 lines)
│   │
│   ├── crons/
│   │   ├── index.ts                   # Initialize crons
│   │   └── vdash/
│   │       └── rewards.ts             # Distribution cron (55 lines)
│   │
│   ├── database/
│   │   ├── index.ts                   # PostgreSQL pool
│   │   └── vdash/
│   │       ├── events.ts              # CRUD events
│   │       ├── profiles.ts            # CRUD profiles
│   │       ├── rewards.ts             # CRUD rewards
│   │       └── scores.ts              # CRUD scores (141 lines)
│   │
│   ├── mvx_api/
│   │   ├── account.ts                 # Account API
│   │   ├── account_nfts.ts            # Get NFTs (28 lines)
│   │   └── transaction.ts             # Transaction info
│   │
│   ├── socket/
│   │   ├── index.ts                   # Socket.io handlers (112 lines)
│   │   └── utils.ts                   # Utilities
│   │
│   ├── types/
│   │   └── request.ts                 # TypeScript types
│   │
│   ├── utils/
│   │   ├── get_query_from_object.ts   # SQL helper
│   │   ├── send_transaction.ts        # Send blockchain txs (112 lines)
│   │   └── verify_signature.ts        # Validate Native Auth (20 lines)
│   │
│   └── vdash-utils/                   # Git submodule
│       └── types/                     # Shared types
│
├── sql/
│   ├── init.sql                       # Initial schema
│   └── migrations/
│       ├── 2025_04_06.sql            # Add vdash_profiles
│       └── 2025_04_27.sql            # Add vdash_rewards
│
├── dist/                              # Compiled JavaScript
├── node_modules/                      # Dependencies
│
├── docker-compose.yml                 # Docker mainnet
├── docker-compose-devnet.yml          # Docker devnet
├── docker-compose-mainnet.yml         # Docker mainnet alternative
│
├── Dockerfile                         # API image
├── entrypoint.sh                      # Startup script
├── entrypoint-db.sh                   # DB script
│
├── package.json                       # NPM dependencies
├── tsconfig.json                      # TypeScript config
├── .env                              # Environment variables
├── vdash_wallet.pem                  # Private wallet (rewards)
└── README.md
```

---

## MAIN DEPENDENCIES

```json
{
  "dependencies": {
    "@multiversx/sdk-core": "14.0.2",
    "@multiversx/sdk-native-auth-server": "2.0.0",
    "@multiversx/sdk-wallet": "^4.6.0",
    "cors": "^2.8.5",
    "cron": "^4.3.0",
    "express": "^4.18.2",
    "lodash": "^4.17.21",
    "pg": "^8.11.3",
    "socket.io": "^4.8.1",
    "uuid": "^11.1.0"
  }
}
```

---

## USEFUL COMMANDS

### Development
```bash
npm run dev        # Nodemon with ts-node
npm run build      # Compile TypeScript
npm run start      # Run production
```

### Docker
```bash
# Mainnet
docker-compose up -d
docker-compose logs -f api

# Devnet
docker-compose -f docker-compose-devnet.yml up -d

# Restart
docker-compose restart api
```

### Database
```bash
# Access PostgreSQL
docker exec -it api-db psql -U admin -d mydatabase

# Backup
docker exec api-db pg_dump -U admin mydatabase > backup.sql

# Restore
cat backup.sql | docker exec -i api-db psql -U admin -d mydatabase
```

---

## CURRENT METRICS

- **Uptime:** 5 continuous months
- **Registered events:** 23,195
- **Completed matches:** 7,829
- **Unique players:** 72
- **Created profiles:** 177
- **Distributed rewards:** 23 weekly cycles
- **Port:** 3001
- **Database:** PostgreSQL 15 (5432)


```
