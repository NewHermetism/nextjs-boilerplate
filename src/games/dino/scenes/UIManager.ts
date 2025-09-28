// UIManager.ts
import Phaser from 'phaser';

export default class UIManager {
  private scene: Phaser.Scene;
  private gameOverScreen!: Phaser.GameObjects.Container;
  private gameOverText!: Phaser.GameObjects.Text;
  private restart!: Phaser.GameObjects.Image;
  private backButton!: Phaser.GameObjects.Image;
  private modalButton!: Phaser.GameObjects.Graphics;
  private modalText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private highScoreText!: Phaser.GameObjects.Text;
  private characterModal: any; // CharacterModal type
  private menu: any; // Menu type

  constructor(scene: Phaser.Scene, characterModal: any, menu: any) {
    this.scene = scene;
    this.characterModal = characterModal;
    this.menu = menu;

    this.createGameOverScreen();
    this.backButton = this.scene.add
      .image(30, 30, 'back_button')
      .setScale(0.15)
      .setInteractive();
  }

  get restartButton() {
    return this.restart;
  }

  get getBackButton() {
    return this.backButton;
  }

  get menuButton() {
    return this.modalButton;
  }

  createGameOverScreen() {
    const { width, height } = this.scene.scale;

    // Create container
    this.gameOverScreen = this.scene.add
      .container(width / 2, height / 2 - 50)
      .setAlpha(0);

    // Create game over text
    this.gameOverText = this.scene.add.text(-150, -20, 'GAME OVER', {
      color: '#EE4B2B',
      font: '900 55px Courier',
      resolution: 5
    });

    // Create restart button
    this.restart = this.scene.add.image(0, 80, 'restart').setInteractive();

    // Create menu button
    this.modalButton = this.scene.add
      .graphics({ x: -50, y: 140 })
      .fillStyle(0x3498db, 1)
      .fillRoundedRect(0, 0, 100, 30, 10)
      .lineStyle(2, 0xffffff, 1)
      .strokeRoundedRect(0, 0, 100, 30, 10)
      .setInteractive(
        new Phaser.Geom.Rectangle(0, 0, 100, 30),
        Phaser.Geom.Rectangle.Contains
      );

    // Create menu button text
    this.modalText = this.scene.add
      .text(0, 140 + 15, 'Menu', {
        fontSize: '24px',
        color: '#ffffff'
      })
      .setOrigin(0.5);

    // Add elements to container
    this.gameOverScreen.add([
      this.gameOverText,
      this.restart,
      this.modalButton,
      this.modalText
    ]);
  }

  showGameOver() {
    this.gameOverScreen.setAlpha(1);
  }

  hideGameOver() {
    this.gameOverScreen.setAlpha(0);
  }

  showCharacterModal() {
    this.characterModal.show();
  }

  showMenu() {
    this.menu.show();
  }
}
