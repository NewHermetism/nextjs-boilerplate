import Phaser from 'phaser';
import { CHARACTERS } from '../config/characters.config';
import { ENVIRONMENTS } from '../config/environments.config';
import { OBSTACLE_ASSETS } from '../config/obstacles.config';
import { POWERUPS } from '../config/powerups.config';

class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    // Add loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: 'Loading...',
      style: {
        font: '20px monospace',
        color: '#ffffff'
      }
    });
    loadingText.setOrigin(0.5, 0.5);

    // Loading progress events
    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // Background music
    this.load.audio('menu_music', '/assets/music/menu.ogg');

    // Sound effects
    this.load.audio('jump', '/assets/jump.m4a');
    this.load.audio('hit', '/assets/hit.m4a');
    this.load.audio('reach', '/assets/reach.m4a');

    // Music button textures
    this.load.image('music_on', '/assets/ui/icons/audio-button-on.png');
    this.load.image('music_off', '/assets/ui/icons/audio-button-off.png');

    ENVIRONMENTS.forEach((environment) => {
      Object.values(environment.layers).forEach((layer) => {
        if (layer) {
          this.load.image(layer.key, layer.path);
        }
      });
    });

    this.load.image('restart', '/assets/ui/icons/restart.png');
    this.load.image('back_button', '/assets/ui/icons/back.png');
    CHARACTERS.forEach((character) => {
      this.load.image(character.thumbnail.key, character.thumbnail.path);
      this.load.audio(character.music.key, character.music.path);

      Object.values(character.animations).forEach((animation) => {
        this.load.spritesheet(animation.sheet.key, animation.sheet.path, {
          frameWidth: animation.sheet.frameWidth,
          frameHeight: animation.sheet.frameHeight
        });
      });
    });

    this.load.image('menu_background', '/assets/shared/menu_background.png');
    this.load.image('game_name', '/assets/shared/game_name.png');
    this.load.image('lock', '/assets/ui/icons/lock.png');
    this.load.image('footer', '/assets/shared/footer.png');
    this.load.image('avatar', '/assets/ui/buttons/avatar.png');
    this.load.image('play', '/assets/ui/buttons/play.png');
    this.load.image('store', '/assets/ui/buttons/store.png');
    this.load.image('leaderboard', '/assets/ui/buttons/leaderboard.png');

    POWERUPS.forEach((powerup) => {
      this.load.image(powerup.icon.key, powerup.icon.path);
    });

    Object.values(OBSTACLE_ASSETS).forEach((asset) => {
      if (asset.type === 'spritesheet' && asset.frameWidth && asset.frameHeight) {
        this.load.spritesheet(asset.key, asset.path, {
          frameWidth: asset.frameWidth,
          frameHeight: asset.frameHeight
        });
        return;
      }

      this.load.image(asset.key, asset.path);
    });
  }

  create() {
    // Wait a short moment to ensure all assets are properly loaded
    this.time.delayedCall(100, () => {
      this.scene.start('PlayScene');
    });
  }
}

export default PreloadScene;
