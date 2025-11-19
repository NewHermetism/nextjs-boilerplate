// EnvironmentManager.ts
import Phaser from 'phaser';
import PlayScene from './PlayScene';
import {
  ENVIRONMENTS,
  EnvironmentConfig,
  EnvironmentId,
  EnvironmentLayerAsset,
  getEnvironmentById
} from '../config/environments.config';

export default class EnvironmentManager {
  private scene: PlayScene;
  private ground: Phaser.GameObjects.TileSprite;
  private cloud: Phaser.GameObjects.TileSprite | null;
  private sky: Phaser.GameObjects.TileSprite;
  private city1: Phaser.GameObjects.TileSprite;
  private city2: Phaser.GameObjects.TileSprite | null;
  private decorations: Phaser.GameObjects.Group;
  private currentEnvironment: EnvironmentConfig;

  constructor(scene: PlayScene) {
    this.scene = scene;
    const { width, height } = this.scene.scale;

    // Initialize with null for optional elements
    this.cloud = null;
    this.city2 = null;

    this.currentEnvironment = this.resolveEnvironmentConfig();
    const layers = this.currentEnvironment.layers;
    const groundLayer = layers.ground;
    const skyLayer = layers.sky;

    if (!groundLayer || !skyLayer) {
      throw new Error(
        `[EnvironmentManager] Missing required layers for environment ${this.currentEnvironment.id}`
      );
    }

    // Create required background layers
    this.sky = this.scene.add
      .tileSprite(0, height, width, 0, skyLayer.key)
      .setOrigin(0, 1);

    if (layers.city) {
      this.city1 = this.scene.add
        .tileSprite(0, height, width, 0, layers.city.key)
        .setOrigin(0, 1);
      this.city2 = null;
    } else {
      const city1Layer = layers.city1 ?? layers.city;
      this.city1 = this.scene.add
        .tileSprite(0, height, width, 0, city1Layer?.key ?? skyLayer.key)
        .setOrigin(0, 1);

      const city2Layer = layers.city2;
      this.city2 = city2Layer
        ? this.scene.add
            .tileSprite(0, height, width, 0, city2Layer.key)
            .setOrigin(0, 1)
        : null;
    }

    this.ground = this.scene.add
      .tileSprite(0, height, width, 67, groundLayer.key)
      .setOrigin(0, 1);

    if (layers.cloud) {
      this.cloud = this.scene.add
        .tileSprite(0, 309, width, 310, layers.cloud.key)
        .setOrigin(0, 1);
    } else {
      // Init by default to be used if character is changed and have cloud
      // bug fix for change from pijama to boss or blue character
      this.cloud = this.scene.add
        .tileSprite(0, 309, width, 310, skyLayer.key)
        .setOrigin(0, 1)
        .setVisible(false);
    }

    // Create decorations group
    this.decorations = this.scene.add.group();
    this.decorations.setAlpha(0);
  }

  onSelectCharacter() {
    const nextEnvironment = this.resolveEnvironmentConfig();
    this.currentEnvironment = nextEnvironment;
    this.applyEnvironmentLayers(nextEnvironment);
  }

  private resolveEnvironmentConfig(): EnvironmentConfig {
    const selectionId = this.scene.getActiveEnvironmentId();
    const environment = getEnvironmentById(selectionId);
    return environment ?? ENVIRONMENTS[0];
  }

  private applyEnvironmentLayers(environment: EnvironmentConfig) {
    const { width, height } = this.scene.scale;
    const layers = environment.layers;
    const groundLayer = layers.ground;
    const skyLayer = layers.sky;

    if (!groundLayer || !skyLayer) {
      return;
    }

    this.ground.setTexture(groundLayer.key).setVisible(true);
    this.sky.setTexture(skyLayer.key);

    const applyCityTexture = (layer: EnvironmentLayerAsset) => {
      this.city1.setTexture(layer.key).setVisible(true);
      if (this.city2?.visible) {
        this.city2.setVisible(false);
      }
    };

    if (layers.city) {
      applyCityTexture(layers.city);
    } else {
      const city1Layer = layers.city1;
      if (city1Layer) {
        this.city1.setTexture(city1Layer.key).setVisible(true);
      }

      const city2Layer = layers.city2;
      if (city2Layer) {
        if (!this.city2) {
          this.city2 = this.scene.add
            .tileSprite(0, height, width, 0, city2Layer.key)
            .setOrigin(0, 1);
        } else {
          this.city2.setVisible(true);
          this.city2.setTexture(city2Layer.key);
        }
      } else if (this.city2?.visible) {
        this.city2.setVisible(false);
      }
    }

    if (layers.cloud) {
      if (!this.cloud) {
        this.cloud = this.scene.add
          .tileSprite(0, 309, width, 310, layers.cloud.key)
          .setOrigin(0, 1);
      } else {
        this.cloud.setTexture(layers.cloud.key).setVisible(true);
      }
    } else if (this.cloud?.visible) {
      this.cloud.setVisible(false);
    }
  }

  get environment() {
    return this.decorations;
  }

  expandBackground(width: number) {
    // Expand ground
    if (this.ground.width < width) {
      this.ground.width += 17 * 2;
    }

    // Expand cloud if exists
    if (this.cloud && this.cloud.width < width) {
      this.cloud.width += 17 * 2;
    }

    // Expand city_1
    if (this.city1.width < width) {
      this.city1.width += 17 * 2;
    }

    // Expand city_2 if exists
    if (this.city2 && this.city2.width < width) {
      this.city2.width += 17 * 2;
    }

    // Check if fully expanded
    if (this.ground.width >= width) {
      this.ground.width = width;
      if (this.cloud) this.cloud.width = width;
      this.city1.width = width;
      if (this.city2) this.city2.width = width;
      this.decorations.setAlpha(1);
      return true;
    }

    return false;
  }

  showDecorations() {
    this.decorations.setAlpha(1);
  }

  update(gameSpeed: number, delta: number) {
    // Normalize movement to 60 FPS baseline
    const deltaFactor = delta / (1000 / 60);

    // Update parallax scrolling with null checks
    this.ground.tilePositionX += gameSpeed * deltaFactor;

    if (this.cloud) {
      this.cloud.tilePositionX += (gameSpeed / 50) * deltaFactor;
    }

    this.city1.tilePositionX += (gameSpeed / 500) * deltaFactor;

    if (this.city2) {
      this.city2.tilePositionX += (gameSpeed / 500) * deltaFactor;
    }

    // Move decorations
    Phaser.Actions.IncX(this.decorations.getChildren(), -0.5 * deltaFactor);

    // Check if decorations need to be wrapped around
    this.decorations.getChildren().forEach((decoration) => {
      const image = decoration as Phaser.GameObjects.Image;
      if (image.getBounds().right < 0) {
        image.x = this.scene.scale.width + 30;
      }
    });
  }
}
