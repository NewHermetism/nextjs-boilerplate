// CharacterModal.tsx
import Phaser from 'phaser';
import PlayScene from './PlayScene';

class CharacterModal extends Phaser.GameObjects.Container {
  public scene: PlayScene;

  private background: Phaser.GameObjects.Graphics;
  private closeButton: Phaser.GameObjects.Text;
  private titleText: Phaser.GameObjects.Text;
  private infoText: Phaser.GameObjects.Text;
  private selectText: Phaser.GameObjects.Text;
  private selectButton: Phaser.GameObjects.Graphics;
  private characters: Phaser.GameObjects.Image[] = [];
  private lockedIndexes: number[] = [];

  constructor(scene: PlayScene, x: number, y: number) {
    super(scene, x, y);
    this.scene = scene;

    const width = 400;
    const height = 250;

    // Background Modal
    this.background = scene.add
      .graphics()
      .fillStyle(0x9c80c4, 1) // Purple background
      .fillRoundedRect(0, 0, width, height, 20)
      .lineStyle(3, 0x6e4b9e, 1)
      .strokeRoundedRect(0, 0, width, height, 20);
    this.add(this.background);

    // Title Text
    this.titleText = scene.add
      .text(width / 2, 30, 'CHOOSE YOUR CHARACTER', {
        fontSize: '16px',
        fontFamily: 'Arial',
        color: '#FFFFFF',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);
    this.add(this.titleText);

    this.infoText = scene.add
      .text(
        width / 2,
        170,
        '* Click on locked characters to buy the needed NFT',
        {
          fontSize: '10px',
          fontFamily: 'Arial',
          color: '#FFFFFF',
          fontStyle: 'normal'
        }
      )
      .setOrigin(0.5);
    this.add(this.infoText);

    // Character Sprites
    const character1 = scene.add.image(width / 2 - 120, 110, 'character1');
    const character2 = scene.add
      .image(width / 2, 110, 'character2')
      .setScale(0.8);
    const character3 = scene.add.image(width / 2 + 120, 110, 'character3');

    // Add characters to array
    this.characters = [character1, character2, character3];

    this.characters.forEach((char, index) => {
      char.setInteractive();
      const buyLinks = [
        'https://xoxno.com/collection/SUPERVIC-f07785', // index 0
        'https://xoxno.com/collection/MINIBOSSES-104b7f', // index 1
        'https://xoxno.com/collection/VICBITS-da9df7' // index 2
      ];
      char.on('pointerdown', () => {
        // Check lockedIndexes dynamically (not closure) to get current state
        if (this.lockedIndexes.includes(index)) {
          console.log(`Character ${index} is locked, opening marketplace:`, buyLinks[index]);
          window.open(buyLinks[index], '_blank');
        } else {
          console.log(`Character ${index} is unlocked, selecting...`);
          this.selectCharacter(index);
        }
      });
      this.add(char);
    });

    this.updateCharacterOpacity();
    this.lockUnavailableCharacters();

    // Select Button
    this.selectButton = scene.add
      .graphics({ x: -(x / 2) + 40, y: height / 2 - 23 })
      .fillStyle(0x28a745, 1)
      .fillRoundedRect(0, 0, 80, 28, 10)
      .lineStyle(2, 0x6e4b9e, 1)
      .strokeRoundedRect(0, 0, 80, 28, 10)
      .setInteractive(
        new Phaser.Geom.Rectangle(0, 0, 80, 28),
        Phaser.Geom.Rectangle.Contains
      );

    this.selectText = scene.add
      .text(-(x / 2) + 80, height / 2 - 10, 'Select', {
        fontSize: '20px',
        color: '#ffffff'
      })
      .setOrigin(0.5);

    const buttonContainer = scene.add.container(x, y, [
      this.selectButton,
      this.selectText
    ]);

    this.add(buttonContainer);

    this.selectButton.on('pointerdown', () => {
      this.hide();
    });

    // Close Button
    this.closeButton = scene.add
      .text(width - 25, 10, 'X', {
        fontSize: '16px',
        color: '#FFFFFF',
        fontStyle: 'bold'
      })
      .setInteractive();

    this.closeButton.on('pointerdown', () => this.hide());
    this.add(this.closeButton);

    this.enableCursorPointer([
      this.closeButton,
      this.selectButton,
      ...this.characters
    ]);

    this.setDepth(3);
    // Add modal to scene
    scene.add.existing(this);
  }

  selectCharacter(index: number) {
    this.scene.SocketHandler.setVDashSelectedCharacter(index);

    this.scene.handleSetCharacterSelect(index);
  }

  public setLockedCharacters(indexes: number[]) {
    this.lockedIndexes = indexes;
    this.lockUnavailableCharacters();
  }

  lockUnavailableCharacters() {
    this.characters.forEach((char, index) => {
      if (this.lockedIndexes.includes(index)) {
        // Make it gray
        char.setTint(0x888888);

        // Lock icon
        const lockIcon = this.scene.add
          .image(char.x, char.y, 'lock')
          .setScale(0.04);
        this.add(lockIcon);

        // Remove interactivity
        // char.disableInteractive();
      }
    });
  }

  show() {
    this.setVisible(true);
  }

  hide() {
    this.setVisible(false);
  }

  updateCharacterOpacity() {
    this.characters.forEach((char, index) => {
      char.setAlpha(index === this.scene.selectedCharacterIndex ? 1 : 0.5); // Selected = full opacity, others = faded
    });
  }

  enableCursorPointer(
    buttons: (
      | Phaser.GameObjects.Image
      | Phaser.GameObjects.Text
      | Phaser.GameObjects.Graphics
    )[]
  ) {
    buttons.forEach((button) => {
      button.on('pointerover', () => {
        this.scene.input.manager.canvas.style.cursor = 'pointer';
      });
      button.on('pointerout', () => {
        this.scene.input.manager.canvas.style.cursor = 'default';
      });
    });
  }
}

export default CharacterModal;
