import { SOCKET_API_URL } from 'config';
import { io, Socket } from 'socket.io-client';
import { EventType, AvatarEnum } from 'types';
import PlayScene from '../scenes/PlayScene';
import {
  normalizeWalletProfile,
  type WalletProfile
} from 'hooks/useGetProfile';

const isSecureConnection = SOCKET_API_URL.startsWith('https');

export default class SocketHandler {
  scene: PlayScene;
  socket: Socket;
  accessToken: string;
  private isDestroyed = false;

  private readonly handleConnect = () => {
    console.log('Game: Connected to server');
    console.log('Player ID:', this.socket?.id);
    this.scene.profileLoadError = false;
    this.getProfile();
  };

  private readonly handleDisconnect = () => {
    console.log('Game: Disconnected from server');
  };

  private readonly handleError = (error: unknown) => {
    console.error('Game: Socket error:', error);
    this.scene.profileLoadError = true;
  };

  private readonly handleConnectError = (error: unknown) => {
    console.error('Game: Connection error:', error);
    this.scene.profileLoadError = true;
  };

  private readonly handleUnauthorized = () => {
    console.error('Game: Unauthorized socket response, ending session');
    this.scene.profileLoadError = true;
  };

  private readonly handleStartGame = ({ id }: { id: string }) => {
    this.scene.gameId = id;
  };

  private readonly handleProfile = (profile: unknown) => {
    const normalized = normalizeWalletProfile(profile);
    this.scene.profile = normalized;
    this.scene.profileLoadError = false;
    const characterIndex =
      normalized && typeof normalized.selected_character === 'number'
        ? normalized.selected_character
        : 0;
    this.scene.handleSetCharacterSelect(characterIndex);
  };

  private readonly handleProfileError = (error: unknown) => {
    console.error('Game: Failed to load profile', error);
    this.scene.profileLoadError = true;
  };

  constructor({
    accessToken,
    scene
  }: {
    accessToken: string;
    scene: PlayScene;
  }) {
    this.scene = scene;
    this.accessToken = accessToken;

    this.socket = io(SOCKET_API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      secure: isSecureConnection,
      auth: {
        accessToken
      }
    });

    this.socket.on('connect', this.handleConnect);
    this.socket.on('disconnect', this.handleDisconnect);
    this.socket.on('error', this.handleError);
    this.socket.on('connect_error', this.handleConnectError);
    this.socket.on('unauthorized', this.handleUnauthorized);
    this.socket.on('sendVDashStartGame', this.handleStartGame);
    this.socket.on('getVDashProfile', this.handleProfile);
    this.socket.on('getVDashProfileError', this.handleProfileError);
  }

  getProfile = () => {
    if (this.isDestroyed) {
      return;
    }

    this.socket.emit('getVDashProfile', {
      accessToken: this.accessToken
    });
  };

  setVDashSelectedCharacter = (selected_character: AvatarEnum) => {
    this.socket.emit('setVDashSelectedCharacter', {
      accessToken: this.accessToken,
      selected_character
    });
  };

  startGameEvent = () => {
    this.socket.emit('sendVDashEvent', {
      accessToken: this.accessToken,
      timestamp: Date.now(),
      type: EventType.START,
      avatar: this.scene.selectedCharacterIndex
    });
  };

  sendVDashEvent = (type: EventType.JUMP | EventType.CREATE_OBSTACLE) => {
    this.socket.emit('sendVDashEvent', {
      accessToken: this.accessToken,
      timestamp: Date.now(),
      type,
      game_id: this.scene.gameId,
      avatar: this.scene.selectedCharacterIndex
    });
  };

  endGameEvent = (score: string) => {
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

  destroy = () => {
    if (this.isDestroyed) {
      return;
    }

    this.isDestroyed = true;
    this.socket.off('connect', this.handleConnect);
    this.socket.off('disconnect', this.handleDisconnect);
    this.socket.off('error', this.handleError);
    this.socket.off('connect_error', this.handleConnectError);
    this.socket.off('unauthorized', this.handleUnauthorized);
    this.socket.off('sendVDashStartGame', this.handleStartGame);
    this.socket.off('getVDashProfile', this.handleProfile);
    this.socket.off('getVDashProfileError', this.handleProfileError);
    this.socket.disconnect();
  };
}
