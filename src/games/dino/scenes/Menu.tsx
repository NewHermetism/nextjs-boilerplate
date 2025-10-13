import Phaser from 'phaser';

class Menu extends Phaser.GameObjects.Container {
  private menuBackground: Phaser.GameObjects.Image;
  private gameName: Phaser.GameObjects.Image;
  private footer: Phaser.GameObjects.Image;
  private playButton: Phaser.GameObjects.Image;
  private avatarButton: Phaser.GameObjects.Image;
  private leaderboardButton: Phaser.GameObjects.Image;
  private storeButton: Phaser.GameObjects.Image;
  private musicButton: Phaser.GameObjects.Image;
  private onAvatarSelect: () => void;
  private onLeaderBoardSelect: () => void;
  private onPlaySelect: () => void;
  private isMusicOn: boolean = true;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    onAvatarSelect: () => void,
    onLeaderBoardSelect: () => void,
    onPlaySelect: () => void
  ) {
    super(scene, x, y);

    const width = this.scene.scale.width;
    const height = this.scene.scale.height;

    this.onAvatarSelect = onAvatarSelect;
    this.onLeaderBoardSelect = onLeaderBoardSelect;
    this.onPlaySelect = onPlaySelect;

    // Background
    this.menuBackground = scene.add
      .image(width / 2, height / 2, 'menu_background')
      .setDisplaySize(width, height);

    this.gameName = scene.add
      .image(width / 2, height / 2 - 100, 'game_name')
      .setScale(0.4);

    this.footer = scene.add
      .image(width / 2 + 8, height / 2 + 200, 'footer')
      .setDisplaySize(width, height)
      .setScale(0.4);

    this.playButton = scene.add
      .image(width / 2, height / 2, 'play')
      .setScale(0.2)
      .setInteractive();

    this.avatarButton = scene.add
      .image(width / 2 - 42, height / 2 + 36, 'avatar')
      .setScale(0.2)
      .setInteractive();

    this.leaderboardButton = scene.add
      .image(width / 2 + 42, height / 2 + 27, 'leaderboard')
      .setScale(0.2)
      .setInteractive();

    this.storeButton = scene.add
      .image(width / 2 + 42, height / 2 + 47, 'store')
      .setScale(0.2)
      .setInteractive();

    // Add music button in top right corner
    this.musicButton = scene.add
      .image(width - 30, 30, 'music_on')
      .setScale(0.35)
      .setInteractive();

    this.add([
      this.menuBackground,
      this.gameName,
      this.playButton,
      this.avatarButton,
      this.leaderboardButton,
      this.storeButton,
      this.musicButton,
      this.footer
    ]);
    this.enableCursorPointer([
      this.playButton,
      this.avatarButton,
      this.leaderboardButton,
      this.storeButton,
      this.musicButton
    ]);

    const storedMuted = this.scene.registry.get('audioMuted');
    if (typeof storedMuted === 'boolean') {
      this.isMusicOn = !storedMuted;
    } else {
      this.scene.registry.set('audioMuted', false);
      this.isMusicOn = true;
    }

    this.updateMusicState(this.isMusicOn, { emitEvent: false, syncSound: false });

    this.handleInputs();
    this.setDepth(2);
    // Add items
    scene.add.existing(this);
  }

  show() {
    this.setVisible(true);
  }

  hide() {
    this.setVisible(false);
  }

  enableCursorPointer(buttons: Phaser.GameObjects.Image[]) {
    buttons.forEach((button) => {
      button.on('pointerover', () => {
        this.scene.input.manager.canvas.style.cursor = 'pointer';
      });
      button.on('pointerout', () => {
        this.scene.input.manager.canvas.style.cursor = 'default';
      });
    });
  }

  handleInputs() {
    this.playButton.on('pointerdown', () => {
      this.onPlaySelect();
    });

    this.leaderboardButton.on('pointerdown', () => {
      this.onLeaderBoardSelect();
    });

    this.avatarButton.on('pointerdown', () => {
      this.onAvatarSelect();
    });

    this.musicButton.on('pointerdown', () => {
      this.toggleMusic();
    });
  }

  private toggleMusic() {
    this.updateMusicState(!this.isMusicOn);
  }

  private updateMusicState(
    isOn: boolean,
    options: { emitEvent?: boolean; syncSound?: boolean } = {}
  ) {
    const { emitEvent = true, syncSound = true } = options;

    this.isMusicOn = isOn;
    const isMuted = !isOn;

    if (this.musicButton) {
      this.musicButton.setTexture(isOn ? 'music_on' : 'music_off');
    }

    this.scene.registry.set('audioMuted', isMuted);

    if (syncSound) {
      if (isOn) {
        this.scene.sound.resumeAll();
      } else {
        this.scene.sound.pauseAll();
      }
    }

    if (emitEvent) {
      this.scene.game.events.emit('audio:mute-changed', isMuted);
    }
  }
}
export default Menu;
