import { SOCKET_API_URL } from 'config';
import { io, Socket } from 'socket.io-client';
import { EventType } from 'types';
import PlayScene from '../scenes/PlayScene';
// NOTE: using local temp types for offline dev
import { VdashProfile, AvatarEnum } from 'types/vdash.types';

export default class SocketHandler {
  scene: PlayScene;
  socket: Socket;
  accessToken: string;

  constructor({
    accessToken,
    scene
  }: {
    accessToken: string;
    scene: PlayScene;
  }) {
    this.scene = scene;
    this.accessToken = accessToken;
    const disableAuth = import.meta.env.VITE_DISABLE_AUTH === 'true';

    // TEMP: offline stub mode for development
    // Do not connect to socket server; set default profile/gameId and no-op methods
    if (disableAuth) {
      // Minimal defaults to unlock gameplay locally
      const profile: VdashProfile = {
        selected_character: 1,
        has_white_pijama_nft: true,
        has_boss_nft: true,
        has_blue_victor_nft: true
      };
      this.scene.profile = profile;
      this.scene.gameId = 'dev-local';
      // @ts-ignore - mark socket as undefined in stub mode
      this.socket = undefined as unknown as Socket;
      return;
    }

    this.socket = io(SOCKET_API_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log('Game: Connected to server');
      console.log('Player ID:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Game: Disconnected from server');
    });

    this.socket.on('error', (error) => {
      console.error('Game: Socket error:', error);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Game: Connection error:', error);
    });

    this.socket.on('sendVDashStartGame', ({ id }: { id: string }) => {
      this.scene.gameId = id;
    });

    this.socket.on('getVDashProfile', (profile: VdashProfile) => {
      this.scene.profile = profile;
      if (!this.scene.handleSetCharacterSelect(profile.selected_character)) {
        this.getProfile();
      }
    });
  }

  getProfile = () => {
    const disableAuth = import.meta.env.VITE_DISABLE_AUTH === 'true';
    if (disableAuth) return; // TEMP: offline stub
    this.socket.emit('getVDashProfile', {
      accessToken: this.accessToken
    });
  };

  setVDashSelectedCharacter = (selected_character: AvatarEnum) => {
    const disableAuth = import.meta.env.VITE_DISABLE_AUTH === 'true';
    if (disableAuth) return; // TEMP: offline stub
    this.socket.emit('setVDashSelectedCharacter', {
      accessToken: this.accessToken,
      selected_character
    });
  };

  startGameEvent = () => {
    const disableAuth = import.meta.env.VITE_DISABLE_AUTH === 'true';
    if (disableAuth) {
      // Keep gameplay loop running locally even without backend
      this.scene.gameId = this.scene.gameId ?? 'dev-local';
      return;
    }
    this.socket.emit('sendVDashEvent', {
      accessToken: this.accessToken,
      timestamp: Date.now(),
      type: EventType.START,
      avatar: this.scene.selectedCharacterIndex
    });
  };

  sendVDashEvent = (type: EventType.JUMP | EventType.CREATE_OBSTACLE) => {
    const disableAuth = import.meta.env.VITE_DISABLE_AUTH === 'true';
    if (disableAuth) return; // TEMP: offline stub
    this.socket.emit('sendVDashEvent', {
      accessToken: this.accessToken,
      timestamp: Date.now(),
      type,
      game_id: this.scene.gameId,
      avatar: this.scene.selectedCharacterIndex
    });
  };

  endGameEvent = (score: string) => {
    const disableAuth = import.meta.env.VITE_DISABLE_AUTH === 'true';
    if (disableAuth) {
      // Preserve local session ID so the update loop continues after restart
      this.scene.gameId = this.scene.gameId ?? 'dev-local';
      return;
    }
    this.socket.emit('sendVDashEvent', {
      accessToken: this.accessToken,
      timestamp: Date.now(),
      game_id: this.scene.gameId,
      score,
      type: EventType.END,
      avatar: this.scene.selectedCharacterIndex
    });
    this.scene.gameId = undefined;
  };
}
