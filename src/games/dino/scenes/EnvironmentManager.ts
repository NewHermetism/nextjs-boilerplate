// EnvironmentManager.ts
import Phaser from 'phaser';
import { CHARACTER_CONFIG } from './Constants';
import PlayScene from './PlayScene';

export default class EnvironmentManager {
  private scene: PlayScene;
  private ground: Phaser.GameObjects.TileSprite;
  private cloud: Phaser.GameObjects.TileSprite | null;
  private sky: Phaser.GameObjects.TileSprite;
  private city1: Phaser.GameObjects.TileSprite;
  private city2: Phaser.GameObjects.TileSprite | null;
  private decorations: Phaser.GameObjects.Group;

  constructor(scene: PlayScene) {
    this.scene = scene;
    const { width, height } = this.scene.scale;

    // Initialize with null for optional elements
    this.cloud = null;
    this.city2 = null;

    const defaultConfig =
      CHARACTER_CONFIG[this.scene.selectedCharacterIndex].background;

    // Create required background layers
    this.sky = this.scene.add
      .tileSprite(0, height, width, 0, defaultConfig.sky)
      .setOrigin(0, 1);

    if (defaultConfig.city) {
      this.city1 = this.scene.add
        .tileSprite(0, height, width, 0, defaultConfig.city!)
        .setOrigin(0, 1);
      this.city2 = this.scene.add
        .tileSprite(0, height, width, 0, defaultConfig.city!)
        .setOrigin(0, 1);
    } else {
      this.city1 = this.scene.add
        .tileSprite(0, height, width, 0, defaultConfig.city1!)
        .setOrigin(0, 1);

      this.city2 = this.scene.add
        .tileSprite(0, height, width, 0, defaultConfig.city2!)
        .setOrigin(0, 1);
    }

    this.ground = this.scene.add
      .tileSprite(0, height, width, 67, defaultConfig.ground)
      .setOrigin(0, 1);

    if (defaultConfig.cloud) {
      this.cloud = this.scene.add
        .tileSprite(0, 309, width, 310, defaultConfig.cloud)
        .setOrigin(0, 1);
    } else {
      // Init by default to be used if character is changed and have cloud
      // bug fix for change from pijama to boss or blue character
      this.cloud = this.scene.add
        .tileSprite(0, 309, width, 310, defaultConfig.sky)
        .setOrigin(0, 1)
        .setVisible(false);
    }

    // Create decorations group
    this.decorations = this.scene.add.group();
    this.decorations.setAlpha(0);
  }

  onSelectCharacter() {
    const config = CHARACTER_CONFIG[this.scene.selectedCharacterIndex];
    if (!config) return;

    const { width, height } = this.scene.scale;
    const bg = config.background;

    // Update required background layers
    this.ground.setTexture(bg.ground).setVisible(true);
    this.ground.setVisible(true);
    this.sky.setTexture(bg.sky);

    // Handle cloud (optional)
    if (bg.cloud) {
      if (!this.cloud) {
        this.cloud = this.scene.add
          .tileSprite(0, 209, width, 210, bg.cloud)
          .setOrigin(0, 1);
      } else {
        this.cloud.setVisible(true);
        this.cloud.setTexture(bg.cloud);
      }
    } else if (this.cloud?.visible) {
      this.cloud.setVisible(false);
    }

    // Handle city layers
    if (bg.city) {
      // Blue character case - single city layer
      if (!this.city1) {
        this.city2 = this.scene.add
          .tileSprite(0, height, width, 0, bg.city)
          .setOrigin(0, 1);
      } else {
        this.city1.setTexture(bg.city);
      }
      if (this.city2?.visible) {
        this.city2.setVisible(false);
      }
    } else {
      // Other characters with city1 and city2
      if (bg.city1) {
        this.city1.setTexture(bg.city1);
      }

      if (bg.city2) {
        if (!this.city2) {
          this.city2 = this.scene.add
            .tileSprite(0, height, width, 0, bg.city2)
            .setOrigin(0, 1);
        } else {
          this.city2.setVisible(true);
          this.city2.setTexture(bg.city2);
        }
      } else if (this.city2?.visible) {
        this.city2.setVisible(false);
      }
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
