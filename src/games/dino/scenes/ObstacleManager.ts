import Phaser from 'phaser';
import { GAME_SETTINGS, CHARACTER_CONFIG } from './Constants';
import PlayScene from './PlayScene';

export default class ObstacleManager {
  private scene: PlayScene;
  private obstacles: Phaser.Physics.Arcade.Group;
  private respawnTime: number = 0;
  private onGroundPosition: number;

  constructor(scene: PlayScene) {
    this.scene = scene;
    this.obstacles = this.scene.physics.add.group();
    this.onGroundPosition = GAME_SETTINGS.ON_GROUND_POSITION;
    this.initAnims();
  }

  get group() {
    return this.obstacles;
  }

  private initAnims() {
    const animConfigs = [
      { key: 'enemy-fireball', frames: 'energy', end: 3, rate: 6 },
      { key: 'enemy-seringe', frames: 'seringe', end: 3, rate: 6 },
      { key: 'enemy-lava', frames: 'lava', end: 5, rate: 6 },
      { key: 'enemy-toxic-waste', frames: 'toxic-waste', end: 5, rate: 6 },
      { key: 'enemy-bone', frames: 'bone', end: 7, rate: 10 },
      { key: 'enemy-boss', frames: 'idle_boss', end: 5, rate: 6 },
      { key: 'enemy-white', frames: 'idle_pijamas', end: 3, rate: 6 },
      { key: 'enemy-blue', frames: 'idle_blue', end: 3, rate: 6 }
    ];

    animConfigs.forEach((config) => {
      this.scene.anims.create({
        key: config.key,
        frames: this.scene.anims.generateFrameNumbers(config.frames, {
          start: 0,
          end: config.end
        }),
        frameRate: config.rate,
        repeat: -1
      });
    });
  }

  placeObstacle(): Phaser.Physics.Arcade.Sprite | null {
    try {
      const config = CHARACTER_CONFIG[this.scene.selectedCharacterIndex];
      if (!config) return null;

      // Clean up any existing off-screen obstacles first
      this.cleanupObstacles();

      const distance = Phaser.Math.Between(
        GAME_SETTINGS.OBSTACLE_DISTANCE_MIN,
        GAME_SETTINGS.OBSTACLE_DISTANCE_MAX
      );
      const { width, height } = this.scene.scale;

      const obstacleType = this.getWeightedRandomObstacle(
        config.obstacles,
        config.obstacleWeights
      );

      const obstacle = this.createObstacle(
        obstacleType,
        width + distance,
        height - this.getObstacleYPosition(obstacleType)
      );

      this.configureObstaclePhysics(obstacle, obstacleType);
      return obstacle;
    } catch (error) {
      console.error('Error placing obstacle:', error);
      return null;
    }
  }

  private cleanupObstacles() {
    const children = this.obstacles.getChildren();
    for (let i = children.length - 1; i >= 0; i--) {
      const sprite = children[i] as Phaser.Physics.Arcade.Sprite;
      if (sprite.x + sprite.width < 0 || !sprite.active) {
        this.obstacles.killAndHide(sprite);
      }
    }
  }

  private getObstacleYPosition(obstacleType: string): number {
    // Base position (ground level)
    const basePosition = this.onGroundPosition;

    // Additional offset for certain obstacle types
    const additionalOffset =
      obstacleType === 'enemy-fireball'
        ? 30 + Math.floor(Math.random() * 70)
        : obstacleType.includes('enemy-')
        ? 20
        : 0;

    // Special vertical adjustments for specific enemies
    const verticalAdjustments: Record<string, number> = {
      'enemy-white': -20, // Move white enemy 20px up
      'enemy-blue': -20, // Move blue enemy 20px up
      'enemy-boss': -20,
      'enemy-lava': -20,
      'enemy-toxic-waste': -20
      // Add more adjustments here if needed
    };

    // Apply special adjustment if this is a specified enemy type
    const specialAdjustment = verticalAdjustments[obstacleType] || 0;

    // Return the total Y position (base + offset + adjustment)
    return basePosition + additionalOffset + specialAdjustment;
  }

  private createObstacle(
    type: string,
    x: number,
    y: number
  ): Phaser.Physics.Arcade.Sprite {
    const texture = type.replace('enemy-', '');
    const obstacle = this.obstacles
      .create(x, y, texture)
      .setOrigin(0, 1) // Set origin to bottom-left
      .setImmovable(true);

    // Play animation if it's an animated obstacle
    if (type.includes('enemy-')) {
      obstacle.play(type);
    }

    // Configure physics after creation
    this.configureObstaclePhysics(obstacle, type);

    return obstacle;
  }

  private configureObstaclePhysics(
    obstacle: Phaser.Physics.Arcade.Sprite,
    type: string
  ) {
    const config = this.getObstaclePhysicsConfig(type);
    obstacle.setScale(config.scale);

    if (config.flipX) {
      obstacle.setFlipX(true);
    }

    if (obstacle.body) {
      // Set circular hitbox
      const radius = Math.min(config.width, config.height) / 2;
      obstacle.body.setCircle(
        radius,
        config.width / 2 - radius + (config.offsetX || 0),
        config.height / 2 - radius + (config.offsetY || 0)
      );
    }
  }

  private getObstaclePhysicsConfig(type: string) {
    const configs: Record<string, any> = {
      'obsticle-small': {
        scale: 1.8,
        width: 50,
        height: 50,
        offsetX: 0,
        offsetY: 0
      },
      'obsticle-big': {
        scale: 1.8,
        width: 80,
        height: 80,
        offsetX: 0,
        offsetY: 20
      },
      'enemy-seringe': {
        scale: 1.2,
        width: 40,
        height: 30,
        offsetX: 0,
        offsetY: 0
      },
      'enemy-lava': {
        scale: 1.4,
        width: 60,
        height: 20,
        offsetX: 0,
        offsetY: 0
      },
      'enemy-bone': {
        scale: 1.3,
        width: 35,
        height: 35,
        offsetX: 10,
        offsetY: 10
      },
      'enemy-boss': {
        scale: 1,
        width: 84,
        height: 85,
        offsetX: 0,
        offsetY: 0,
        flipX: true
      },
      'enemy-white': {
        scale: 1,
        width: 40,
        height: 80,
        offsetX: 0,
        offsetY: 0,
        flipX: true
      },
      'enemy-blue': {
        scale: 1,
        width: 35,
        height: 65,
        offsetX: 0,
        offsetY: 0,
        flipX: true
      },
      'enemy-fireball': {
        scale: 1.3,
        width: 35,
        height: 20,
        offsetX: 20,
        offsetY: 0
      },
      'enemy-toxic-waste': {
        scale: 1.5,
        width: 40,
        height: 30,
        offsetX: 0,
        offsetY: 0
      }
    };

    return (
      configs[type] || {
        scale: 1,
        width: 50,
        height: 50,
        offsetX: 0,
        offsetY: 0
      }
    );
  }

  private getWeightedRandomObstacle(
    obstacles: string[],
    weights: number[]
  ): string {
    if (obstacles.length !== weights.length) {
      console.error('Obstacles and weights arrays must be the same length');
      return obstacles[0];
    }

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const random = Math.random() * totalWeight;

    let weightSum = 0;
    for (let i = 0; i < obstacles.length; i++) {
      weightSum += weights[i];
      if (random <= weightSum) {
        return obstacles[i];
      }
    }

    return obstacles[0];
  }

  update(delta: number, gameSpeed: number) {
    this.scene.gameSpeed = gameSpeed;
    Phaser.Actions.IncX(this.obstacles.getChildren(), -this.scene.gameSpeed);

    this.respawnTime += delta * this.scene.gameSpeed * 0.08;
    if (this.respawnTime >= 1500) {
      this.placeObstacle();
      this.respawnTime = 0;
    }

    this.cleanupObstacles();
  }

  reset() {
    this.obstacles.clear(true, true);
    this.respawnTime = 0;
  }
}
