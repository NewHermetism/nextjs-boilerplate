import { SOCKET_API_URL } from 'config';
import { io, Socket } from 'socket.io-client';
import { EventType } from 'types';
import PlayScene from '../scenes/PlayScene';
import {
  normalizeWalletProfile,
  type WalletProfile,
  testWalletProfile
} from 'hooks/useGetProfile';
import { isTestModeEnabled } from 'utils/isTestModeEnabled';
import { getCharacterById, type CharacterId } from '../config/characters.config';

const isSecureConnection = SOCKET_API_URL.startsWith('https');

export default class SocketHandler {
  scene: PlayScene;
  socket: Socket | null = null;
  accessToken: string;
  private isDestroyed = false;
  private readonly isMocked = isTestModeEnabled();

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
    if (!normalized) {
      this.scene.profile = undefined;
      this.scene.profileLoadError = true;
      return;
    }

    this.scene.profileLoadError = false;
    this.scene.applyProfile(normalized);
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

    if (this.isMocked) {
      this.applyMockProfile();
      return;
    }

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

  private applyMockProfile = () => {
    this.scene.profileLoadError = false;
    this.scene.applyProfile(testWalletProfile);
  };

  getProfile = () => {
    if (this.isMocked) {
      this.applyMockProfile();
      return;
    }

    if (this.isDestroyed || !this.socket) {
      return;
    }

    this.socket.emit('getVDashProfile', {
      accessToken: this.accessToken
    });
  };

  setVDashSelectedCharacter = (characterId: CharacterId) => {
    if (this.isMocked) {
      const currentProfile = this.scene.profile ?? testWalletProfile;
      this.scene.applyProfile({
        ...currentProfile,
        selectedCharacterId: characterId
      });
      return;
    }

    if (!this.socket) {
      return;
    }

    const selectedCharacter = getCharacterById(characterId)?.avatarIndex;

    this.socket.emit('setVDashSelectedCharacter', {
      accessToken: this.accessToken,
      character_id: characterId,
      ...(typeof selectedCharacter === 'number'
        ? { selected_character: selectedCharacter }
        : {})
    });
  };

  startGameEvent = () => {
    if (this.isMocked) {
      if (!this.scene.gameId) {
        this.scene.gameId = `test-mode-${Date.now()}`;
      }
      return;
    }

    if (!this.socket) {
      return;
    }

    const characterId = this.scene.getActiveCharacterConfig().id;
    const avatar = this.scene.getActiveCharacterConfig().avatarIndex;
    const environmentId = this.scene.getActiveEnvironmentId();

    this.socket.emit('sendVDashEvent', {
      accessToken: this.accessToken,
      timestamp: Date.now(),
      type: EventType.START,
      character_id: characterId,
      avatar,
      environment_id: environmentId
    });
  };

  sendVDashEvent = (type: EventType.JUMP | EventType.CREATE_OBSTACLE) => {
    if (this.isMocked || !this.socket) {
      return;
    }

    const characterId = this.scene.getActiveCharacterConfig().id;
    const avatar = this.scene.getActiveCharacterConfig().avatarIndex;
    const environmentId = this.scene.getActiveEnvironmentId();

    this.socket.emit('sendVDashEvent', {
      accessToken: this.accessToken,
      timestamp: Date.now(),
      type,
      game_id: this.scene.gameId,
      character_id: characterId,
      avatar,
      environment_id: environmentId
    });
  };

  endGameEvent = (score: string) => {
    if (this.isMocked) {
      this.scene.gameId = undefined;
      return;
    }

    if (!this.socket) {
      this.scene.gameId = undefined;
      return;
    }

    const characterId = this.scene.getActiveCharacterConfig().id;
    const avatar = this.scene.getActiveCharacterConfig().avatarIndex;
    const environmentId = this.scene.getActiveEnvironmentId();
    const parsedScore = Number(score);

    this.socket.emit('sendVDashEvent', {
      accessToken: this.accessToken,
      timestamp: Date.now(),
      game_id: this.scene.gameId,
      score: Number.isFinite(parsedScore) ? parsedScore : score,
      type: EventType.END,
      character_id: characterId,
      avatar,
      environment_id: environmentId
    });
    this.scene.gameId = undefined;
  };

  destroy = () => {
    if (this.isDestroyed) {
      return;
    }

    this.isDestroyed = true;
    if (this.isMocked || !this.socket) {
      return;
    }
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
