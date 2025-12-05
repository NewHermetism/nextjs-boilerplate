import Phaser from 'phaser';
import { GAME_SETTINGS } from './Constants';
import PlayScene from './PlayScene';
import {
  CharacterId,
  getCharacterById
} from '../config/characters.config';

type BodyAnchor = 'bottom' | 'center' | 'top';

interface RectBodyConfig {
  widthRatio: number;
  heightRatio: number;
  offsetXRatio?: number;
  offsetYRatio?: number;
  bottomPaddingRatio?: number;
  anchor?: BodyAnchor;
}

interface AutoPaddingConfig {
  all?: number;
  x?: number;
  y?: number;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

interface ObstacleBodyConfig {
  scale?: number;
  flipX?: boolean;
  body?: Partial<RectBodyConfig>;
  autoPadding?: AutoPaddingConfig;
}

const DEFAULT_BODY_METRICS: RectBodyConfig = {
  widthRatio: 0.85,
  heightRatio: 0.85,
  offsetXRatio: 0.075,
  offsetYRatio: 0.075,
  anchor: 'top'
};

const OBSTACLE_BODY_CONFIG: Record<string, ObstacleBodyConfig> = {
  'obsticle-small': {
    scale: 1.8,
    autoPadding: { top: 6, left: 6, right: 6, bottom: 2 }
  },
  'obsticle-big': {
    scale: 1.8,
    autoPadding: { top: 6, left: 10, right: 10, bottom: 2 }
  },
  'enemy-seringe': {
    scale: 1.2,
    autoPadding: { all: 4 },
    body: { anchor: 'center' }
  },
  'enemy-lava': {
    scale: 1.4,
    autoPadding: { left: 12, right: 12, top: 8, bottom: 12 }
  },
  'enemy-bone': {
    scale: 1.3,
    autoPadding: { all: 4 },
    body: { anchor: 'center' }
  },
  'enemy-boss': {
    scale: 1,
    flipX: true,
    autoPadding: { left: 18, right: 24, top: 12 },
    body: {
      anchor: 'bottom',
      widthRatio: 0.6,
      heightRatio: 0.82,
      offsetXRatio: 0.2,
      bottomPaddingRatio: 0.02
    }
  },
  'enemy-white': {
    scale: 1,
    flipX: true,
    autoPadding: { left: 12, right: 18, top: 10 },
    body: {
      anchor: 'bottom',
      widthRatio: 0.62,
      heightRatio: 0.8,
      offsetXRatio: 0.19,
      bottomPaddingRatio: 0.02
    }
  },
  'enemy-blue': {
    scale: 1,
    flipX: true,
    autoPadding: { left: 10, right: 16, top: 10 },
    body: {
      anchor: 'bottom',
      widthRatio: 0.62,
      heightRatio: 0.8,
      offsetXRatio: 0.19,
      bottomPaddingRatio: 0.02
    }
  },
  'enemy-fireball': {
    scale: 1.3,
    autoPadding: { all: 6 },
    body: { anchor: 'center' }
  },
  'enemy-toxic-waste': {
    scale: 1.5,
    autoPadding: { left: 14, right: 14, top: 10, bottom: 10 }
  }
};

export default class ObstacleManager {
  private scene: PlayScene;
  private obstacles: Phaser.Physics.Arcade.Group;
  private respawnTime: number = 0;
  private onGroundPosition: number;
  private readonly autoBodyCache = new Map<string, RectBodyConfig>();

  constructor(scene: PlayScene) {
    this.scene = scene;
    this.obstacles = this.scene.physics.add.group();
    this.onGroundPosition = GAME_SETTINGS.ON_GROUND_POSITION;
    this.initAnims();
  }

  get group() {
    return this.obstacles;
  }

  private getObstacleTextureKey(type: string): string {
    // Animated enemies that borrow character sprite sheets
    const characterEnemy: Partial<Record<string, CharacterId>> = {
      'enemy-boss': 'mini-boss',
      'enemy-white': 'white-pijama',
      'enemy-blue': 'blue-victor'
    };

    const characterId = characterEnemy[type];
    if (characterId) {
      const character = getCharacterById(characterId);
      if (character) {
        return character.animations.idle.sheet.key;
      }
    }

    // Fireball reuses the "energy" spritesheet
    if (type === 'enemy-fireball') {
      return 'energy';
    }

    // Default: strip the prefix for enemy-* or use the raw type key
    return type.startsWith('enemy-') ? type.replace('enemy-', '') : type;
  }

  private initAnims() {
    const animConfigs = [
      { key: 'enemy-fireball', frames: 'energy', end: 3, rate: 6 },
      { key: 'enemy-seringe', frames: 'seringe', end: 3, rate: 6 },
      { key: 'enemy-lava', frames: 'lava', end: 5, rate: 6 },
      { key: 'enemy-toxic-waste', frames: 'toxic-waste', end: 5, rate: 6 },
      { key: 'enemy-bone', frames: 'bone', end: 7, rate: 10 }
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

    const characterEnemies: Array<{
      key: string;
      characterId: CharacterId;
    }> = [
      { key: 'enemy-boss', characterId: 'mini-boss' },
      { key: 'enemy-white', characterId: 'white-pijama' },
      { key: 'enemy-blue', characterId: 'blue-victor' }
    ];

    characterEnemies.forEach(({ key, characterId }) => {
      const character = getCharacterById(characterId);
      if (!character) {
        return;
      }
      const idleAnimation = character.animations.idle;
      this.scene.anims.create({
        key,
        frames: this.scene.anims.generateFrameNumbers(idleAnimation.sheet.key, {
          start: idleAnimation.animation.startFrame,
          end: idleAnimation.animation.endFrame
        }),
        frameRate: idleAnimation.animation.frameRate,
        repeat: idleAnimation.animation.repeat
      });
    });
  }

  placeObstacle(): Phaser.Physics.Arcade.Sprite | null {
    try {
      const characterConfig = this.scene.getActiveCharacterConfig();
      const obstacles = characterConfig.obstacles;
      const obstacleWeights = characterConfig.obstacleWeights;
      if (!obstacles.length) {
        return null;
      }

      // Clean up any existing off-screen obstacles first
      this.cleanupObstacles();

      const distance = Phaser.Math.Between(
        GAME_SETTINGS.OBSTACLE_DISTANCE_MIN,
        GAME_SETTINGS.OBSTACLE_DISTANCE_MAX
      );
      const { width, height } = this.scene.scale;

      const obstacleType = this.getWeightedRandomObstacle(
        obstacles,
        obstacleWeights
      );

      const obstacle = this.createObstacle(
        obstacleType,
        width + distance,
        height - this.getObstacleYPosition(obstacleType)
      );
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
      const isOffscreen = sprite.x + sprite.width < -50;
      if (isOffscreen || !sprite.active || !sprite.body?.enable) {
        this.obstacles.remove(sprite, true, true);
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
    const texture = this.getObstacleTextureKey(type);
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
    const config = OBSTACLE_BODY_CONFIG[type];

    obstacle.setScale(config?.scale ?? 1);

    if (typeof config?.flipX === 'boolean') {
      obstacle.setFlipX(config.flipX);
    }

    const body = obstacle.body as Phaser.Physics.Arcade.Body | null;
    if (!body) return;

    const metrics = this.resolveBodyMetrics(obstacle.texture.key, config);
    const mergedMetrics: RectBodyConfig = {
      ...metrics,
      ...(config?.body ?? {})
    };

    const displayWidth = obstacle.displayWidth;
    const displayHeight = obstacle.displayHeight;

    const {
      widthRatio,
      heightRatio,
      offsetXRatio = 0,
      offsetYRatio = 0,
      bottomPaddingRatio = 0,
      anchor = 'top'
    } = mergedMetrics;

    const bodyWidth = Math.max(displayWidth * widthRatio, 1);
    const bodyHeight = Math.max(displayHeight * heightRatio, 1);
    const offsetX = displayWidth * offsetXRatio;

    let offsetY: number;
    if (anchor === 'bottom') {
      offsetY =
        displayHeight - bodyHeight - displayHeight * Math.max(bottomPaddingRatio, 0);
    } else if (anchor === 'center') {
      offsetY =
        displayHeight / 2 - bodyHeight / 2 + displayHeight * offsetYRatio;
    } else {
      offsetY = displayHeight * offsetYRatio;
    }

    body.setSize(bodyWidth, bodyHeight);
    body.setOffset(offsetX, offsetY);
    body.setAllowGravity(false);
    this.setObstacleVelocity(body);
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
    // Keep physics bodies moving so overlap checks can't be skipped on low FPS
    const velocityX = -this.scene.gameSpeed * 60; // convert px/frame@60fps to px/sec
    this.obstacles.setVelocityX(velocityX);

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

  private resolveBodyMetrics(
    textureKey: string,
    config?: ObstacleBodyConfig
  ): RectBodyConfig {
    const cached = this.autoBodyCache.get(textureKey);
    if (cached) {
      return cached;
    }

    const texture = this.scene.textures.get(textureKey);
    if (!texture) {
      this.autoBodyCache.set(textureKey, DEFAULT_BODY_METRICS);
      return DEFAULT_BODY_METRICS;
    }

    const frames = Object.values(texture.frames).filter(Boolean);

    if (frames.length === 0) {
      this.autoBodyCache.set(textureKey, DEFAULT_BODY_METRICS);
      return DEFAULT_BODY_METRICS;
    }

    const padding = this.resolvePadding(config?.autoPadding);

    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    frames.forEach((frame) => {
      const width = frame.cutWidth;
      const height = frame.cutHeight;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const alpha = frame.getPixelAlpha(x, y);
          if (alpha > 16) {
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
          }
        }
      }
    });

    if (
      minX === Number.POSITIVE_INFINITY ||
      minY === Number.POSITIVE_INFINITY ||
      maxX === Number.NEGATIVE_INFINITY ||
      maxY === Number.NEGATIVE_INFINITY
    ) {
      this.autoBodyCache.set(textureKey, DEFAULT_BODY_METRICS);
      return DEFAULT_BODY_METRICS;
    }

    const baseWidth = frames[0].cutWidth;
    const baseHeight = frames[0].cutHeight;

    const paddedMinX = Math.max(minX + padding.left, 0);
    const paddedMaxX = Math.min(maxX - padding.right, baseWidth - 1);
    const paddedMinY = Math.max(minY + padding.top, 0);
    const paddedMaxY = Math.min(maxY - padding.bottom, baseHeight - 1);

    const widthPx = Math.max(paddedMaxX - paddedMinX + 1, 1);
    const heightPx = Math.max(paddedMaxY - paddedMinY + 1, 1);

    const metrics: RectBodyConfig = {
      widthRatio: widthPx / baseWidth,
      heightRatio: heightPx / baseHeight,
      offsetXRatio: paddedMinX / baseWidth,
      offsetYRatio: paddedMinY / baseHeight,
      anchor: 'top'
    };

    this.autoBodyCache.set(textureKey, metrics);
    return metrics;
  }

  private resolvePadding(padding?: AutoPaddingConfig) {
    const all = padding?.all ?? 0;
    const padX = padding?.x ?? all;
    const padY = padding?.y ?? all;
    return {
      left: Math.max(padding?.left ?? padX, 0),
      right: Math.max(padding?.right ?? padX, 0),
      top: Math.max(padding?.top ?? padY, 0),
      bottom: Math.max(padding?.bottom ?? padY, 0)
    };
  }

  private setObstacleVelocity(body: Phaser.Physics.Arcade.Body) {
    body.setVelocityX(-this.scene.gameSpeed * 60);
  }
}
