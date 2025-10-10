import { SOCKET_API_URL } from 'config';
import { io, Socket } from 'socket.io-client';
import { EventType } from 'types';
import PlayScene from '../scenes/PlayScene';
import { VdashProfile } from '../vdash-utils/types/vdash/profile';
import { AvatarEnum } from 'vdash-utils/types';

export default class SocketHandler {
  scene: PlayScene;
  socket: Socket;
  accessToken: string;
  private profileRetryCount: number = 0;
  private maxProfileRetries: number = 3;
  private profileRequestTimeout: NodeJS.Timeout | null = null;

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
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log('🔌 SocketHandler: Connected to server');
      console.log('🆔 Player ID:', this.socket?.id);
      console.log('🌐 Socket API URL:', SOCKET_API_URL);
    });

    this.socket.on('disconnect', () => {
      console.warn('⚠️ SocketHandler: Disconnected from server');
    });

    this.socket.on('error', (error) => {
      console.error('❌ SocketHandler: Socket error:', error);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ SocketHandler: Connection error:', error);
      console.error('Details:', {
        message: error.message,
        type: error.type,
        description: error.description
      });
    });

    this.socket.on('sendVDashStartGame', ({ id }: { id: string }) => {
      this.scene.gameId = id;
    });

    this.socket.on('getVDashProfile', (profile: VdashProfile) => {
      console.log('✅ Received profile from backend:', profile);
      console.log('🎮 NFT Ownership Details:', {
        'White Pijama (Character 0)': profile.has_white_pijama_nft ? '✅ OWNED' : '❌ NOT OWNED',
        'Boss (Character 1)': profile.has_boss_nft ? '✅ OWNED' : '❌ NOT OWNED',
        'Blue Victor (Character 2)': profile.has_blue_victor_nft ? '✅ OWNED' : '❌ NOT OWNED',
        'Selected Character': profile.selected_character
      });

      // Clear any pending timeout
      if (this.profileRequestTimeout) {
        clearTimeout(this.profileRequestTimeout);
        this.profileRequestTimeout = null;
      }

      // Reset retry count on successful response
      this.profileRetryCount = 0;

      this.scene.profile = profile;
      this.scene.profileLoadError = false;

      // Update debug UI
      if (this.scene.updateDebugUI) {
        this.scene.updateDebugUI();
      }

      // Update character modal if it's visible
      if (this.scene.characterModal && this.scene.characterModal.visible) {
        this.scene.refreshCharacterModal();
      }

      if (!this.scene.handleSetCharacterSelect(profile.selected_character)) {
        console.log('⚠️ Failed to set character, retrying getProfile...');
        this.getProfile();
      }
    });
  }

  getProfile = () => {
    console.log(`🔄 SocketHandler: Requesting profile from backend... (Attempt ${this.profileRetryCount + 1}/${this.maxProfileRetries})`);

    // Debug: Decode and log token origin (only on first attempt)
    if (this.profileRetryCount === 0) {
      try {
        const tokenParts = this.accessToken.split('.');
        if (tokenParts.length === 3) {
          // The token is base64url encoded, not standard base64
          // Just verify it has 3 parts, actual decoding happens in backend
          console.log('🔑 [SOCKET] Token format: Valid JWT (3 parts)');
          console.log('🌐 [SOCKET] Current page origin:', window.location.origin);
        }
      } catch (e) {
        // Ignore decode errors, backend will validate
      }
    }

    console.log('📤 Emitting getVDashProfile event with:', {
      hasAccessToken: !!this.accessToken,
      tokenLength: this.accessToken?.length || 0,
      socketConnected: this.socket.connected,
      socketId: this.socket.id
    });

    if (!this.socket.connected) {
      console.error('❌ Socket is not connected! Cannot request profile.');
      // Try to reconnect
      console.log('🔄 Attempting to reconnect socket...');
      this.socket.connect();

      // Wait for connection before retrying
      setTimeout(() => {
        if (this.socket.connected && this.profileRetryCount < this.maxProfileRetries) {
          this.profileRetryCount++;
          this.getProfile();
        }
      }, 2000);
      return;
    }

    this.socket.emit('getVDashProfile', {
      accessToken: this.accessToken
    });

    // Clear any existing timeout
    if (this.profileRequestTimeout) {
      clearTimeout(this.profileRequestTimeout);
    }

    // Set a timeout to retry or fail
    this.profileRequestTimeout = setTimeout(() => {
      if (!this.scene.profile) {
        console.error(`⏱️ TIMEOUT: Profile not received after 5 seconds! (Attempt ${this.profileRetryCount + 1}/${this.maxProfileRetries})`);

        if (this.profileRetryCount < this.maxProfileRetries - 1) {
          this.profileRetryCount++;
          console.log(`🔄 Retrying profile request... (${this.profileRetryCount}/${this.maxProfileRetries})`);
          this.getProfile();
        } else {
          console.error('❌ FATAL: Failed to load profile after multiple attempts!');
          console.error('Backend server at', SOCKET_API_URL, 'is not responding.');
          console.error('Please check:');
          console.error('1. Backend server is running');
          console.error('2. Socket.io endpoint is accessible');
          console.error('3. getVDashProfile event handler is implemented');
          console.error('4. JWT token validation is working');

          // Mark error state in scene
          this.scene.profileLoadError = true;
          if (this.scene.updateDebugUI) {
            this.scene.updateDebugUI();
          }
        }
      }
    }, 5000);
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
}
