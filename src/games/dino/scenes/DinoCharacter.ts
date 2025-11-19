// DinoCharacter.ts
import Phaser from 'phaser';
import { GAME_SETTINGS, SOUND_CONFIG } from './Constants';
import PlayScene from './PlayScene';
import { CHARACTERS, CharacterConfig } from '../config/characters.config';
import type { CharacterAnimationState } from '../config/assetKeys';

export default class DinoCharacter {
  private scene: PlayScene;
  private sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private onGroundPosition: number;
  private jumpSound: Phaser.Sound.BaseSound;

  constructor(scene: PlayScene, x: number, y: number) {
    this.scene = scene;
    this.onGroundPosition = GAME_SETTINGS.ON_GROUND_POSITION;

    const initialConfig = this.getSelectedCharacterConfig();
    const initialTexture = initialConfig.animations.idle.sheet.key;

    // Create sprite with precise hitbox matching sprite body
    this.sprite = this.scene.physics.add
      .sprite(70, y, initialTexture)
      .setCollideWorldBounds(true)
      .setGravityY(GAME_SETTINGS.GRAVITY)
      .setBodySize(85, 88)
      .setDepth(1)
      .setOrigin(0, 1)
      .setOffset(19, this.onGroundPosition + 22);

    this.jumpSound = this.scene.sound.add('jump', SOUND_CONFIG.JUMP);

    this.initAnims();
    this.updateCharacter();
  }

  get body() {
    return this.sprite;
  }

  initAnims() {
    CHARACTERS.forEach((character) => {
      (Object.entries(character.animations) as [
        CharacterAnimationState,
        CharacterConfig['animations'][CharacterAnimationState]
      ][]).forEach(([, animation]) => {
        if (this.scene.anims.exists(animation.animation.key)) {
          return;
        }
        this.scene.anims.create({
          key: animation.animation.key,
          frames: this.scene.anims.generateFrameNumbers(animation.sheet.key, {
            start: animation.animation.startFrame,
            end: animation.animation.endFrame
          }),
          frameRate: animation.animation.frameRate,
          repeat: animation.animation.repeat
        });
      });
    });
  }

  updateCharacter() {
    const config = this.getSelectedCharacterConfig();
    const pose = config.body.idle;
    this.sprite
      .play(config.animations.idle.animation.key, true)
      .setBodySize(pose.width, pose.height)
      .setSize(pose.width, pose.height)
      .setOffset(pose.offsetX, this.onGroundPosition + pose.offsetYFromGround);
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
    const config = this.getSelectedCharacterConfig();
    const pose = config.body.running;
    this.sprite
      .play(config.animations.running.animation.key, true)
      .setBodySize(pose.width, pose.height)
      .setSize(pose.width, pose.height)
      .setOffset(pose.offsetX, this.onGroundPosition + pose.offsetYFromGround);
  }

  updateAnimation() {
    if (
      this.sprite.body.y !==
      this.scene.scale.height - this.sprite.body.height
    ) {
      // In air
      const config = this.getSelectedCharacterConfig();
      this.sprite.setFrame(config.airFrame);
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

  private getSelectedCharacterConfig(): CharacterConfig {
    return this.scene.getActiveCharacterConfig();
  }
}
