import Phaser from 'phaser';
import { GAME_SETTINGS, CHARACTER_CONFIG } from './Constants';
import PlayScene from './PlayScene';

type BodyAnchor = 'bottom' | 'center' | 'top';

interface RectBodyConfig {
  widthRatio: number;
  heightRatio: number;
  offsetXRatio?: number;
  bottomPaddingRatio?: number;
  offsetYRatio?: number;
  anchor?: BodyAnchor;
}

interface ObstacleBodyConfig {
  scale?: number;
  flipX?: boolean;
  body: RectBodyConfig;
}

const DEFAULT_OBSTACLE_BODY: ObstacleBodyConfig = {
  body: {
    widthRatio: 0.8,
    heightRatio: 0.8,
    offsetXRatio: 0.1,
    anchor: 'bottom'
  }
};

const OBSTACLE_BODY_CONFIG: Record<string, ObstacleBodyConfig> = {
  'obsticle-small': {
    scale: 1.8,
    body: {
      widthRatio: 0.8,
      heightRatio: 0.55,
      offsetXRatio: 0.1,
      bottomPaddingRatio: 0.05,
      anchor: 'bottom'
    }
  },
  'obsticle-big': {
    scale: 1.8,
    body: {
      widthRatio: 0.75,
      heightRatio: 0.65,
      offsetXRatio: 0.12,
      bottomPaddingRatio: 0.05,
      anchor: 'bottom'
    }
  },
  'enemy-seringe': {
    scale: 1.2,
    body: {
      widthRatio: 0.8,
      heightRatio: 0.5,
      offsetXRatio: 0.1,
      offsetYRatio: 0.05,
      anchor: 'center'
    }
  },
  'enemy-lava': {
    scale: 1.4,
    body: {
      widthRatio: 0.60,  // Only bubbling lava center
      heightRatio: 0.40,  // Danger zone of bubbling lava
      offsetXRatio: 0.20,  // Center the danger zone
      bottomPaddingRatio: 0.25,  // Leave space at bottom for ground
      anchor: 'bottom'
    }
  },
  'enemy-bone': {
    scale: 1.3,
    body: {
      widthRatio: 0.48,
      heightRatio: 0.48,
      offsetXRatio: 0.26,
      anchor: 'center'
    }
  },
  'enemy-boss': {
    scale: 1,
    flipX: true,
    body: {
      widthRatio: 0.45,
      heightRatio: 0.7,
      offsetXRatio: 0.28,
      anchor: 'bottom'
    }
  },
  'enemy-white': {
    scale: 1,
    flipX: true,
    body: {
      widthRatio: 0.45,
      heightRatio: 0.65,
      offsetXRatio: 0.28,
      anchor: 'bottom'
    }
  },
  'enemy-blue': {
    scale: 1,
    flipX: true,
    body: {
      widthRatio: 0.5,
      heightRatio: 0.65,
      offsetXRatio: 0.25,
      anchor: 'bottom'
    }
  },
  'enemy-fireball': {
    scale: 1.3,
    body: {
      widthRatio: 0.42,
      heightRatio: 0.38,
      offsetXRatio: 0.29,
      offsetYRatio: 0.02,
      anchor: 'center'
    }
  },
  'enemy-toxic-waste': {
    scale: 1.5,
    body: {
      widthRatio: 0.55,  // Main barrel body only
      heightRatio: 0.50,  // Barrel + toxic liquid
      offsetXRatio: 0.22,  // Center the barrel
      bottomPaddingRatio: 0.15,  // Leave space at bottom
      anchor: 'bottom'
    }
  }
};

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
    const config = OBSTACLE_BODY_CONFIG[type] || DEFAULT_OBSTACLE_BODY;

    obstacle.setScale(config.scale ?? 1);

    if (typeof config.flipX === 'boolean') {
      obstacle.setFlipX(config.flipX);
    }

    const body = obstacle.body as Phaser.Physics.Arcade.Body | null;
    if (!body) return;

    const displayWidth = obstacle.displayWidth;
    const displayHeight = obstacle.displayHeight;

    const {
      widthRatio,
      heightRatio,
      offsetXRatio = 0,
      bottomPaddingRatio = 0,
      offsetYRatio = 0,
      anchor = 'bottom'
    } = config.body;

    const bodyWidth = displayWidth * widthRatio;
    const bodyHeight = displayHeight * heightRatio;
    const offsetX = displayWidth * offsetXRatio;

    let offsetY = 0;

    if (anchor === 'top') {
      offsetY = displayHeight * offsetYRatio;
    } else if (anchor === 'center') {
      offsetY = displayHeight / 2 - bodyHeight / 2 + displayHeight * offsetYRatio;
    } else {
      // bottom anchor (default)
      offsetY = displayHeight - bodyHeight - displayHeight * bottomPaddingRatio;
    }

    body.setSize(bodyWidth, bodyHeight);
    body.setOffset(offsetX, offsetY);
    body.setAllowGravity(false);
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
    // Normalize movement to 60 FPS baseline
    const deltaFactor = delta / (1000 / 60);
    Phaser.Actions.IncX(
      this.obstacles.getChildren(),
      -(this.scene.gameSpeed * deltaFactor)
    );

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
