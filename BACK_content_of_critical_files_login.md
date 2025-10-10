# /home/vdash/victor-api/src/config/index.ts

```typescript

root@v-dash-game-1:/home/vdash/victor-api# cat src/config/index.ts 
export const DAPP_URL = 'https://supervictornft.com';
export const MVX_API_URL = 'https://api.multiversx.com';

export const WHITE_PIJAMA_COLLECTION_INDENTIFIER = 'SUPERVIC-f07785';
export const BLUE_VICTOR_COLLECTION_INDENTIFIER = 'VICBITS-da9df7';
export const BOSS_COLLECTION_INDENTIFIER = 'MINIBOSSES-104b7f';

export const CHAIN_ID = '1';
export const VICTOR_TOKEN_IDENTIFIER = 'VICTOR-9fa27f';

export const VDASH_REWARDS_CRON_TIME = '0 20 * * 0';

```

# /home/vdash/victor-api/src/utils/verify_signature.ts 

```typescript

import { NativeAuthServer } from '@multiversx/sdk-native-auth-server';
import { MVX_API_URL, DAPP_URL } from '../config';
export const verifySignedMessage = async (accessToken: string) => {
  try {
    const server = new NativeAuthServer({
      apiUrl: MVX_API_URL,
      acceptedOrigins: [DAPP_URL],
      maxExpirySeconds: 86400
    });

    // Validate the token
    const result = await server.validate(accessToken);

    return result;
  } catch (e) {
    console.error('Verification error:', e);
    return false;
  }
};

```


# /home/vdash/victor-api/src/socket/index.ts

```typescript

import { Server as SocketServer } from 'socket.io';
import { Server } from 'http';
import { Socket } from 'socket.io';
import { DAPP_URL } from '../config';
import { AvatarEnum, VDashEndEvent, VDashEvents } from '../vdash-utils/types';
import { saveGameEvent } from '../database/vdash/events';
import { getTopScores } from '../database/vdash/scores';
import {
  getVDashProfile,
  setVDashSelectedCharacter
} from '../controllers/vdash/profile';
import { AuthRequest } from '../types/request';
import { verifyAccessToken } from './utils';
import { saveStartEvent, saveEndEvent } from '../controllers/vdash/event';
import { getLeaderboard } from '../controllers/vdash/leaderboard';

export const initializeSocket = (server: Server) => {
  const io = new SocketServer(server, {
    cors: {
      origin: DAPP_URL,
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    // Handle auth code creation
    socket.on('requestAuthCode', async () => {
      console.log('Received requestAuthCode event');
    });

    // Handle auth code verification
    socket.on('getProfile', async (data: AuthRequest) => {
      try {
        const address = await verifyAccessToken(socket, data.accessToken);
        if (address) {
          socket.emit('getProfile', {
            profile: { address }
          });
        }
      } catch (error) {
        socket.emit('getProfileError', {
          message: 'Failed to get profile'
        });
      }
    });

    socket.on('sendVDashEvent', async (event: VDashEvents) => {
      try {
        const address = await verifyAccessToken(socket, event.accessToken);
        if (address) {
          switch (event.type) {
            case 'START': {
              const gameId = await saveStartEvent({ address, event });
              return socket.emit('sendVDashStartGame', { id: gameId });
            }
            case 'END': {
              await saveEndEvent({ event: event as VDashEndEvent, address });
              break;
            }
            case 'CREATE_OBSTACLE':
            case 'JUMP': {
              await saveGameEvent(event, address);
              console.log(event.type, address, event.timestamp);
            }
          }
          // Scrie in baza de date eventul
          console.log({
            ...event,
            gameId: event.game_id,
            accessToken: undefined
          });
        }
      } catch (error) {
        socket.emit('sendVDashEventError', {
          message: 'Failed to save event'
        });
      }
    });

    socket.on('getLeaderboard', async (data: { limit: number }) => {
      console.log('getLeaderboard');
      try {
        const leaderboard = await getLeaderboard(data.limit);
        console.log('leaderboard', leaderboard);
        socket.emit('getLeaderboard', leaderboard);
      } catch (error) {
        socket.emit('getLeaderboardError', {
          message: 'Failed to get leaderboard'
        });
      }
    });

    socket.on('getVDashProfile', (data: AuthRequest) =>
      getVDashProfile(socket, data)
    );

    socket.on(
      'setVDashSelectedCharacter',
      (data: AuthRequest & { selected_character: AvatarEnum }) =>
        setVDashSelectedCharacter(socket, data)
    );
  });

  return io;
};

```


