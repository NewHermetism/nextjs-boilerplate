import Phaser from 'phaser';

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
    this.load.audio('boss_music', '/assets/music/boss.ogg');
    this.load.audio('pijamas_music', '/assets/music/pijamas.ogg');
    this.load.audio('blue_music', '/assets/music/blue.ogg');

    // Sound effects
    this.load.audio('jump', '/assets/jump.m4a');
    this.load.audio('hit', '/assets/hit.m4a');
    this.load.audio('reach', '/assets/reach.m4a');

    // Music button textures
    this.load.image('music_on', '/assets/Audio_Button_On.png');
    this.load.image('music_off', '/assets/Audio_Button_Off.png');

    // Boss Envoirement
    this.load.image('boss_ground', '/assets/envoirements/boss/ground.png');
    this.load.image('boss_city_1', '/assets/envoirements/boss/city1.png');
    this.load.image('boss_city_2', '/assets/envoirements/boss/city2.png');
    this.load.image('boss_sky', '/assets/envoirements/boss/sky.png');
    this.load.image('boss_cloud', '/assets/envoirements/boss/clouds.png');

    // Blue Envoirement
    this.load.image('blue_ground', '/assets/envoirements/blue/ground.png');
    this.load.image('blue_city', '/assets/envoirements/blue/city.png');
    this.load.image('blue_sky', '/assets/envoirements/blue/sky.png');
    this.load.image('blue_cloud', '/assets/envoirements/blue/clouds.png');

    // White Envoirement
    this.load.image('white_ground', '/assets/envoirements/white/ground.png');
    this.load.image('white_city_1', '/assets/envoirements/white/city1.png');
    this.load.image('white_city_2', '/assets/envoirements/white/city2.png');
    this.load.image('white_sky', '/assets/envoirements/white/sky.png');

    this.load.image('restart', '/assets/restart.png');
    this.load.image('back_button', '/assets/back.png');
    this.load.image('character1', '/assets/characters/pijamas/1.png');
    this.load.image('character2', '/assets/characters/mini_boss/1.png');
    this.load.image('character3', '/assets/characters/blue/1.png');
    this.load.image('menu_background', '/assets/objects/menu_background.png');
    this.load.image('game_name', '/assets/objects/game_name.png');
    this.load.image('lock', '/assets/objects/lock.png');
    this.load.image('footer', '/assets/objects/footer.png');
    this.load.image('avatar', '/assets/objects/buttons/avatar.png');
    this.load.image('play', '/assets/objects/buttons/play.png');
    this.load.image('store', '/assets/objects/buttons/store.png');
    this.load.image('leaderboard', '/assets/objects/buttons/leaderboard.png');

    this.load.spritesheet(
      'idle_boss',
      '/assets/characters/mini_boss/idle.png',
      {
        frameWidth: 94,
        frameHeight: 120
      }
    );

    this.load.spritesheet(
      'running_boss',
      '/assets/characters/mini_boss/running.png',
      {
        frameWidth: 123,
        frameHeight: 117
      }
    );

    this.load.spritesheet(
      'idle_pijamas',
      '/assets/characters/pijamas/idle.png',
      {
        frameWidth: 45,
        frameHeight: 96
      }
    );

    this.load.spritesheet(
      'running_pijamas',
      '/assets/characters/pijamas/running_pijamas.png',
      {
        frameWidth: 80,
        frameHeight: 100
      }
    );

    this.load.spritesheet(
      'idle_blue',
      '/assets/characters/blue/blue_idle.png',
      {
        frameWidth: 40,
        frameHeight: 88
      }
    );

    this.load.spritesheet(
      'running_blue',
      '/assets/characters/blue/blue_run.png',
      {
        frameWidth: 60,
        frameHeight: 100
      }
    );

    this.load.spritesheet('energy', '/assets/objects/energy/energy.png', {
      frameWidth: 44,
      frameHeight: 26
    });

    this.load.spritesheet('bone', '/assets/objects/bone/bone.png', {
      frameWidth: 36,
      frameHeight: 35
    });

    this.load.spritesheet('seringe', '/assets/objects/seringe/seringe.png', {
      frameWidth: 49,
      frameHeight: 34
    });

    this.load.spritesheet('lava', '/assets/objects/lava/lava.png', {
      frameWidth: 68,
      frameHeight: 38
    });

    this.load.spritesheet(
      'toxic-waste',
      '/assets/objects/toxic_waste/toxic_waste.png',
      {
        frameWidth: 65,
        frameHeight: 56
      }
    );

    this.load.image(
      'obsticle-small',
      '/assets/objects/spikes/spikes_small.png'
    );
    this.load.image('obsticle-big', '/assets/objects/spikes/spikes_big.png');
  }

  create() {
    // Wait a short moment to ensure all assets are properly loaded
    this.time.delayedCall(100, () => {
      this.scene.start('PlayScene');
    });
  }
}

export default PreloadScene;
