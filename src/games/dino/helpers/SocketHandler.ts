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
}
