// DinoCharacter.ts
import Phaser from 'phaser';
import { GAME_SETTINGS, SOUND_CONFIG } from './Constants';
import PlayScene from './PlayScene';

export default class DinoCharacter {
  private scene: PlayScene;
  private sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private onGroundPosition: number;
  private jumpSound: Phaser.Sound.BaseSound;

  constructor(scene: PlayScene, x: number, y: number) {
    this.scene = scene;
    this.onGroundPosition = GAME_SETTINGS.ON_GROUND_POSITION;

    // Create sprite
    this.sprite = this.scene.physics.add
      .sprite(70, y, 'idle_boss')
      .setCollideWorldBounds(true)
      .setGravityY(GAME_SETTINGS.GRAVITY)
      .setBodySize(123, 117)
      .setDepth(1)
      .setOrigin(0, 1)
      .setOffset(0, this.onGroundPosition);

    this.jumpSound = this.scene.sound.add('jump', SOUND_CONFIG.JUMP);

    this.initAnims();
    this.updateCharacter();
  }

  get body() {
    return this.sprite;
  }

  initAnims() {
    // Boss animations
    this.scene.anims.create({
      key: 'running_boss',
      frames: this.scene.anims.generateFrameNumbers('running_boss', {
        start: 0,
        end: 5
      }),
      frameRate: 10,
      repeat: -1
    });

    this.scene.anims.create({
      key: 'idle_boss',
      frames: this.scene.anims.generateFrameNumbers('idle_boss', {
        start: 0,
        end: 5
      }),
      frameRate: 6,
      repeat: -1
    });

    // Pijamas animations
    this.scene.anims.create({
      key: 'running_pijamas',
      frames: this.scene.anims.generateFrameNumbers('running_pijamas', {
        start: 0,
        end: 5
      }),
      frameRate: 10,
      repeat: -1
    });

    this.scene.anims.create({
      key: 'idle_pijamas',
      frames: this.scene.anims.generateFrameNumbers('idle_pijamas', {
        start: 0,
        end: 3
      }),
      frameRate: 10,
      repeat: -1
    });

    // Blue animations
    this.scene.anims.create({
      key: 'running_blue',
      frames: this.scene.anims.generateFrameNumbers('running_blue', {
        start: 0,
        end: 5
      }),
      frameRate: 10,
      repeat: -1
    });

    this.scene.anims.create({
      key: 'idle_blue',
      frames: this.scene.anims.generateFrameNumbers('idle_blue', {
        start: 0,
        end: 3
      }),
      frameRate: 10,
      repeat: -1
    });
  }

  updateCharacter() {
    switch (this.scene.selectedCharacterIndex) {
      case 0: // Pijamas
        this.sprite
          .play('idle_pijamas', true)
          .setBodySize(60, 100)
          .setSize(60, 100)
          .setOffset(0, this.onGroundPosition - 5);
        break;
      case 1: // Boss (default)
        this.sprite
          .play('idle_boss', true)
          .setBodySize(123, 117)
          .setSize(123, 117)
          .setOffset(0, this.onGroundPosition - 5);
        break;
      case 2: // Blue
        this.sprite
          .play('idle_blue', true)
          .setBodySize(40, 88)
          .setSize(40, 88)
          .setOffset(0, this.onGroundPosition - 5);
        break;
    }
  }

  jump() {
    if (!this.sprite.body.onFloor() || this.sprite.body.velocity.x > 0) {
      return false;
    }

    this.jumpSound.play();

    this.sprite.setVelocityY(-GAME_SETTINGS.JUMP_SPEED);
    return true;
  }

  run() {
    switch (this.scene.selectedCharacterIndex) {
      case 0: // Pijamas
        this.sprite
          .play('running_pijamas', true)
          .setBodySize(80, 100)
          .setSize(80, 100)
          .setOffset(0, this.onGroundPosition - 5);
        break;
      case 1: // Boss
        this.sprite
          .play('running_boss', true)
          .setBodySize(123, 117)
          .setDepth(1)
          .setOrigin(0, 1)
          .setOffset(0, this.onGroundPosition - 5);
        break;
      case 2: // Blue
        this.sprite
          .play('running_blue', true)
          .setBodySize(60, 100)
          .setSize(60, 100)
          .setOffset(0, this.onGroundPosition - 5);
        break;
    }
  }

  updateAnimation() {
    if (
      this.sprite.body.y !==
      this.scene.scale.height - this.sprite.body.height
    ) {
      // In air
      switch (this.scene.selectedCharacterIndex) {
        case 0:
          this.sprite.setFrame(5);
          break;
        case 1:
          this.sprite.setFrame(2);
          break;
        case 2:
          this.sprite.setFrame(3);
          break;
      }
    } else {
      // On ground - reset to normal hitbox
      this.sprite.body.setSize(this.sprite.body.width, this.sprite.body.height);
      this.run();
    }
  }

  reset() {
    this.sprite.setVelocityY(0);
    this.sprite.body.setSize(this.sprite.body.width, this.sprite.body.height);
    this.sprite.body.offset.y = this.onGroundPosition;
    this.updateCharacter();
  }
}
