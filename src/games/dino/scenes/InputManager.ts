// InputManager.ts
import Phaser from 'phaser';

export default class InputManager {
  private scene: Phaser.Scene;
  private onJump: () => void;
  private onRestart: () => void;
  private onShowMenu: () => void;
  private onBackButton: () => void;

  constructor(
    scene: Phaser.Scene,
    onJump: () => void,
    onRestart: () => void,
    onShowMenu: () => void,
    onBackButton: () => void
  ) {
    this.scene = scene;
    this.onJump = onJump;
    this.onRestart = onRestart;
    this.onShowMenu = onShowMenu;
    this.onBackButton = onBackButton;

    this.setupInputs();
  }

  private setupInputs() {
    // Touch/mouse input (allow jumping on desktop too)
    if (this.scene.input) {
      this.scene.input.on(
        'pointerdown',
        () => {
          this.onJump();
        },
        this.scene
      );
    }

    // Keyboard input
    if (this.scene.input.keyboard) {
      this.scene.input.keyboard.on('keydown-SPACE', this.onJump, this.scene);
      this.scene.input.keyboard.on('keydown-UP', this.onJump, this.scene);
    }
  }

  setupUIInputs(
    restart: Phaser.GameObjects.Image,
    menuButton: Phaser.GameObjects.Graphics,
    backButton: Phaser.GameObjects.Image
  ) {
    // Restart button
    restart.on('pointerdown', this.onRestart);

    // Menu button
    menuButton.on('pointerdown', this.onShowMenu);

    // Back button
    backButton.on('pointerdown', this.onBackButton);
  }
}
