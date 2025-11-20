import Phaser from 'phaser';
import PlayScene from './PlayScene';
import {
  CHARACTERS,
  type CharacterConfig,
  type CharacterId,
  getDefaultCharacter
} from '../config/characters.config';
import {
  ENVIRONMENTS,
  type EnvironmentConfig,
  type EnvironmentId
} from '../config/environments.config';

type SelectionTab = 'characters' | 'maps';

interface CharacterCardEntry {
  config: CharacterConfig;
  container: Phaser.GameObjects.Container;
  frame: Phaser.GameObjects.Rectangle;
  thumbnail: Phaser.GameObjects.Image;
  statusText: Phaser.GameObjects.Text;
  lockIcon?: Phaser.GameObjects.Image;
  hitArea: Phaser.GameObjects.Zone;
}

interface EnvironmentCardEntry {
  config: EnvironmentConfig;
  container: Phaser.GameObjects.Container;
  frame: Phaser.GameObjects.Rectangle;
  statusText: Phaser.GameObjects.Text;
  lockIcon?: Phaser.GameObjects.Image;
  hitArea: Phaser.GameObjects.Zone;
}

interface TabButtonComponents {
  container: Phaser.GameObjects.Container;
  background: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
}

// Relative sizes (percentages of canvas dimensions)
const BASE_CANVAS_WIDTH = 1280;
const BASE_CANVAS_HEIGHT = 720;

const BASE_MODAL_WIDTH = 780;
const BASE_MODAL_HEIGHT = 460;
const BASE_SECTION_PADDING = 30;
const BASE_CONTENT_TOP = 190;
const BASE_CARD_VERTICAL_GAP = 40;
const BASE_CARD_HORIZONTAL_GAP = 40;
const CHARACTER_COLUMNS = 3;
const MAP_COLUMNS = 3;
const BASE_BUTTON_WIDTH = 200;
const BASE_BUTTON_HEIGHT = 42;
const BASE_BUTTON_BOTTOM_OFFSET = 60;

const BASE_TAB_WIDTH = 200;
const BASE_TAB_HEIGHT = 60;
const BASE_TAB_GAP = 25;
const BASE_TAB_TOP = 40;

const BASE_CARD_WIDTH = 170;
const BASE_CARD_HEIGHT = 210;

const CARD_LABEL_OFFSET = 36;
const BASE_PREVIEW_HEIGHT = 180;

type MapLayerKey = 'sky' | 'city' | 'city2' | 'cloud' | 'ground';

const MAP_LAYER_LAYOUT: { key: MapLayerKey; height: number; offset: number }[] = [
  { key: 'sky', height: 140, offset: 70 },
  { key: 'city', height: 120, offset: 60 },
  { key: 'city2', height: 110, offset: 50 },
  { key: 'cloud', height: 90, offset: 30 },
  { key: 'ground', height: 100, offset: 80 }
];

const snap = (value: number) => Math.round(value);

class CharacterModal extends Phaser.GameObjects.Container {
  public scene: PlayScene;

  private background: Phaser.GameObjects.Graphics;
  private closeButton: Phaser.GameObjects.Text;
  private confirmButton: Phaser.GameObjects.Graphics;
  private confirmText: Phaser.GameObjects.Text;
  private characterCards: CharacterCardEntry[] = [];
  private environmentCards: EnvironmentCardEntry[] = [];
  private characterSection!: Phaser.GameObjects.Container;
  private mapSection!: Phaser.GameObjects.Container;
  private activeTab: SelectionTab = 'characters';
  private tabButtons: Partial<Record<SelectionTab, TabButtonComponents>> = {};

  // Calculated dimensions based on canvas size
  private modalWidth: number;
  private modalHeight: number;
  private sectionLeft: number;
  private sectionWidth: number;
  private sectionSidePadding: number;
  private sectionContentTop: number;
  private cardVerticalGap: number;
  private cardHorizontalGap: number;
  private buttonWidth: number;
  private buttonHeight: number;
  private buttonBottomOffset: number;
  private tabWidth: number;
  private tabHeight: number;
  private tabGap: number;
  private tabTop: number;
  private characterCardWidth: number;
  private characterCardHeight: number;
  private mapCardWidth: number;
  private mapCardHeight: number;
  private cardLabelOffset: number;
  private layoutScale: number;
  private unlockedCharacterIds = new Set<CharacterId>();
  private unlockedEnvironmentIds = new Set<EnvironmentId>();
  private activeCharacterId: CharacterId = getDefaultCharacter().id as CharacterId;
  private pendingCharacterId: CharacterId = this.activeCharacterId;
  private activeEnvironmentId?: EnvironmentId;
  private pendingEnvironmentId?: EnvironmentId;

  constructor(scene: PlayScene) {
    super(scene, 0, 0);
    this.scene = scene;
    scene.cameras.main.setRoundPixels(true);

    // Calculate all dimensions based on canvas size using a consistent scale
    const canvasWidth = scene.scale.width;
    const canvasHeight = scene.scale.height;
    this.layoutScale = Math.min(canvasWidth / BASE_CANVAS_WIDTH, canvasHeight / BASE_CANVAS_HEIGHT);

    const scaled = (value: number) => snap(value * this.layoutScale);

    this.modalWidth = scaled(BASE_MODAL_WIDTH);
    this.modalHeight = scaled(BASE_MODAL_HEIGHT);
    this.sectionSidePadding = scaled(BASE_SECTION_PADDING);
    this.sectionContentTop = scaled(BASE_CONTENT_TOP);
    this.cardVerticalGap = scaled(BASE_CARD_VERTICAL_GAP);
    this.cardHorizontalGap = scaled(BASE_CARD_HORIZONTAL_GAP);
    this.buttonWidth = scaled(BASE_BUTTON_WIDTH);
    this.buttonHeight = scaled(BASE_BUTTON_HEIGHT);
    this.buttonBottomOffset = scaled(BASE_BUTTON_BOTTOM_OFFSET);
    this.tabWidth = scaled(BASE_TAB_WIDTH);
    this.tabHeight = scaled(BASE_TAB_HEIGHT);
    this.tabGap = scaled(BASE_TAB_GAP);
    this.tabTop = scaled(BASE_TAB_TOP);
    this.characterCardWidth = scaled(BASE_CARD_WIDTH);
    this.characterCardHeight = scaled(BASE_CARD_HEIGHT);
    this.mapCardWidth = scaled(BASE_CARD_WIDTH);
    this.mapCardHeight = scaled(BASE_CARD_HEIGHT);
    this.cardLabelOffset = scaled(CARD_LABEL_OFFSET);

    this.sectionLeft = this.sectionSidePadding;
    this.sectionWidth = this.modalWidth - this.sectionSidePadding * 2;

    this.background = scene.add
      .graphics()
      .fillStyle(0x1e0f2b, 0.95)
      .fillRoundedRect(0, 0, this.modalWidth, this.modalHeight, 20)
      .lineStyle(3, 0x6e4b9e, 1)
      .strokeRoundedRect(0, 0, this.modalWidth, this.modalHeight, 20);
    this.add(this.background);

    this.createCharacterSection();
    this.createMapSection();
    this.createTabs();
    this.createConfirmButton();

    this.closeButton = scene.add
      .text(this.modalWidth - 30, 14, 'X', {
        fontSize: '16px',
        color: '#FFFFFF',
        fontStyle: 'bold'
      })
      .setInteractive();
    this.closeButton.on('pointerdown', () => this.hide());
    this.add(this.closeButton);

    this.setActiveTab('characters');

    const tabTargets = Object.values(this.tabButtons).filter(
      (tab): tab is TabButtonComponents => Boolean(tab)
    );

    this.enableCursorPointer([
      this.closeButton,
      this.confirmButton,
      ...tabTargets.map((tab) => tab.background),
      ...this.characterCards.map((card) => card.hitArea),
      ...this.environmentCards.map((card) => card.hitArea)
    ]);

    this.updateCharacterLocks();
    this.updateEnvironmentLocks();
    this.setActiveCharacter(this.scene.selectedCharacterId);
    this.setActiveEnvironment(this.scene.getActiveEnvironmentId());

    this.setDepth(3);
    scene.add.existing(this);
    const offsetX = (scene.scale.width - this.modalWidth) / 2;
    const offsetY = (scene.scale.height - this.modalHeight) / 2;
    this.setPosition(offsetX, offsetY);
    this.hide();
  }

  private createTabs() {
    const tabs: { key: SelectionTab; label: string }[] = [
      { key: 'characters', label: 'Characters' },
      { key: 'maps', label: 'Maps' }
    ];
    const totalWidth = tabs.length * this.tabWidth + (tabs.length - 1) * this.tabGap;
    const startX = snap((this.modalWidth - totalWidth) / 2 + this.tabWidth / 2);

    tabs.forEach((tab, index) => {
      const container = this.scene.add.container(
        snap(startX + index * (this.tabWidth + this.tabGap)),
        this.tabTop
      );

      const background = this.scene.add
        .rectangle(0, 0, this.tabWidth, this.tabHeight, 0x1b0b2e, 0.85)
        .setStrokeStyle(2, 0xffffff, 0.25)
        .setInteractive();
      background.on('pointerdown', () => this.setActiveTab(tab.key));

      const label = this.scene.add
        .text(0, 0, tab.label.toUpperCase(), {
          fontSize: '16px',
          color: '#FFFFFF',
          fontStyle: 'bold'
        })
        .setOrigin(0.5);

      container.add([background, label]);
      this.add(container);
      this.tabButtons[tab.key] = { container, background, label };
    });
  }

  private createCharacterSection() {
    this.characterSection = this.scene.add.container(0, 0);
    this.add(this.characterSection);

    this.characterCards = CHARACTERS.map((config, index) => {
      const { x, y } = this.getCardPosition(
        index,
        CHARACTERS.length,
        CHARACTER_COLUMNS,
        this.sectionLeft,
        this.sectionWidth,
        this.characterCardWidth,
        this.characterCardHeight
      );
      const container = this.scene.add.container(x, y);

      const background = this.scene.add
        .rectangle(0, 0, this.characterCardWidth, this.characterCardHeight, 0x140a1e, 0.9)
        .setStrokeStyle(2, 0xffffff, 0.2);
      const frame = this.scene.add
        .rectangle(0, 0, this.characterCardWidth, this.characterCardHeight)
        .setStrokeStyle(3, 0xffffff, 0.4)
        .setFillStyle(0, 0);

      const thumbnail = this.scene.add
        .image(0, -Math.round(this.characterCardHeight * 0.12), config.thumbnail.key)
        .setOrigin(0.5);
      const maxThumbHeight = this.characterCardHeight * 0.65;
      const requestedScale = config.thumbnail.scale ?? 1;
      const heightScale = maxThumbHeight / thumbnail.height;
      const appliedScale = Math.min(requestedScale, heightScale);
      thumbnail.setScale(appliedScale);

      const label = this.scene.add
        .text(x, y + this.characterCardHeight / 2 + this.cardLabelOffset, config.label, {
          fontSize: '13px',
          color: '#FFFFFF',
          fontStyle: 'bold'
        })
        .setOrigin(0.5);

      const hitArea = this.scene.add
        .zone(0, 0, this.characterCardWidth, this.characterCardHeight)
        .setInteractive();
      hitArea.on('pointerdown', () => {
        if (!this.unlockedCharacterIds.has(config.id as CharacterId)) {
          window.open(config.marketplaceUrl, '_blank');
          return;
        }
        this.pendingCharacterId = config.id as CharacterId;
        this.updateCharacterSelection();
        this.confirmCharacterSelection();
        this.setActiveTab('maps');
      });

      const lockIcon = this.scene.add.image(0, 0, 'lock').setScale(0.03).setVisible(false);
      lockIcon.setOrigin(0.5);

      this.characterSection.add(label);
      container.add([background, frame, thumbnail, hitArea, lockIcon]);
      this.characterSection.add(container);

      return {
        config,
        container,
        frame,
        thumbnail,
        statusText: label,
        lockIcon,
        hitArea
      } satisfies CharacterCardEntry;
    });

    this.characterSection.setVisible(true);
  }

  private createMapSection() {
    this.mapSection = this.scene.add.container(0, 0);
    this.add(this.mapSection);

    this.environmentCards = ENVIRONMENTS.map((config, index) => {
      const { x, y } = this.getCardPosition(
        index,
        ENVIRONMENTS.length,
        MAP_COLUMNS,
        this.sectionLeft,
        this.sectionWidth,
        this.mapCardWidth,
        this.mapCardHeight
      );

      const container = this.scene.add.container(x, y);

      const background = this.scene.add
        .rectangle(0, 0, this.mapCardWidth, this.mapCardHeight, 0x06121f, 0.9)
        .setStrokeStyle(2, 0xffffff, 0.2);
      const frame = this.scene.add
        .rectangle(0, 0, this.mapCardWidth, this.mapCardHeight)
        .setStrokeStyle(3, 0xffffff, 0.4)
        .setFillStyle(0, 0);

      container.add(background);
      this.populateMapPreview(container, config);
      container.add(frame);

      const label = this.scene.add
        .text(x, y + this.mapCardHeight / 2 + this.cardLabelOffset, config.label, {
          fontSize: '13px',
          color: '#FFFFFF',
          fontStyle: 'bold'
        })
        .setOrigin(0.5);

      const hitArea = this.scene.add
        .zone(0, 0, this.mapCardWidth, this.mapCardHeight)
        .setInteractive();
      hitArea.on('pointerdown', () => {
        if (this.unlockedEnvironmentIds.has(config.id as EnvironmentId)) {
          this.pendingEnvironmentId = config.id as EnvironmentId;
          this.updateEnvironmentSelection();
          this.confirmEnvironmentSelection();
          this.hide();
        }
      });

      const lockIcon = this.scene.add.image(0, 0, 'lock').setScale(0.03).setVisible(false);
      lockIcon.setOrigin(0.5);

      this.mapSection.add(label);
      container.add([hitArea, lockIcon]);
      this.mapSection.add(container);

      return {
        config,
        container,
        frame,
        statusText: label,
        lockIcon,
        hitArea
      } satisfies EnvironmentCardEntry;
    });

    this.mapSection.setVisible(false);
  }

  private createConfirmButton() {
    const buttonX = this.modalWidth / 2 - this.buttonWidth / 2;
    const buttonY = this.modalHeight - this.buttonBottomOffset;

    this.confirmButton = this.scene.add
      .graphics({ x: buttonX, y: buttonY })
      .fillStyle(0x2fb16c, 1)
      .fillRoundedRect(0, 0, this.buttonWidth, this.buttonHeight, 12)
      .lineStyle(2, 0x6e4b9e, 1)
      .strokeRoundedRect(0, 0, this.buttonWidth, this.buttonHeight, 12)
      .setInteractive(
        new Phaser.Geom.Rectangle(0, 0, this.buttonWidth, this.buttonHeight),
        Phaser.Geom.Rectangle.Contains
      );
    this.confirmButton.on('pointerdown', () => {
      if (this.activeTab === 'characters') {
        this.confirmCharacterSelection();
      } else {
        this.confirmEnvironmentSelection();
      }
    });

    this.confirmText = this.scene.add
      .text(this.modalWidth / 2, buttonY + this.buttonHeight / 2, '', {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);
    this.add(this.confirmButton);
    this.add(this.confirmText);
  }

  private setActiveTab(tab: SelectionTab) {
    this.activeTab = tab;

    // Reset pending selection to match active when switching back to characters
    if (tab === 'characters') {
      this.pendingCharacterId = this.activeCharacterId;
      this.updateCharacterSelection();
    }

    this.characterSection?.setVisible(tab === 'characters');
    this.mapSection?.setVisible(tab === 'maps');
    this.updateTabStyles();
    this.updateConfirmButtonState();
  }

  private updateTabStyles() {
    (Object.keys(this.tabButtons) as SelectionTab[]).forEach((key) => {
      const components = this.tabButtons[key];
      if (!components) {
        return;
      }
      const isActive = key === this.activeTab;
      components.background.setFillStyle(isActive ? 0x462067 : 0x12061f, isActive ? 0.95 : 0.7);
      components.background.setStrokeStyle(2, isActive ? 0xffffff : 0x6e4b9e, isActive ? 1 : 0.4);
      components.label.setAlpha(isActive ? 1 : 0.65);
    });
  }

  private updateConfirmButtonState() {
    if (!this.confirmButton || !this.confirmText) {
      return;
    }
    const label = 'Select';
    const canConfirm =
      this.activeTab === 'characters'
        ? this.pendingCharacterId !== this.activeCharacterId
        : this.pendingEnvironmentId !== undefined &&
          this.pendingEnvironmentId !== this.activeEnvironmentId;

    const alpha = canConfirm ? 1 : 0.5;
    this.confirmText.setText(label);
    this.confirmButton.setAlpha(alpha);
    this.confirmText.setAlpha(alpha);
  }

  private populateMapPreview(container: Phaser.GameObjects.Container, config: EnvironmentConfig) {
    const layers = config.layers;
    const scaled = (value: number) => snap(value * this.layoutScale);
    const cardInnerWidth = this.mapCardWidth - scaled(30);
    const cardBottom = this.mapCardHeight / 2 - scaled(8);

    const resolveKey = (entryKey: MapLayerKey) => {
      switch (entryKey) {
        case 'city':
          return layers.city?.key ?? layers.city1?.key;
        case 'city2':
          return layers.city2?.key;
        case 'cloud':
          return layers.cloud?.key;
        case 'ground':
          return layers.ground?.key;
        case 'sky':
        default:
          return layers.sky?.key;
      }
    };

    MAP_LAYER_LAYOUT.forEach(({ key, height, offset }) => {
      const resolvedKey = resolveKey(key);
      if (!resolvedKey) {
        return;
      }
      const targetHeight = scaled(height);
      const image = this.scene.add.image(0, 0, resolvedKey).setOrigin(0.5, 1);
      const widthScale = cardInnerWidth / image.width;
      const heightScale = targetHeight / image.height;
      const appliedScale = Math.min(widthScale, heightScale, 1);
      image.setScale(appliedScale);
      image.setY(cardBottom - scaled(offset));
      container.add(image);
    });
  }

  private confirmCharacterSelection() {
    if (this.pendingCharacterId === this.activeCharacterId) {
      return;
    }
    this.scene.SocketHandler.setVDashSelectedCharacter(this.pendingCharacterId);
    const updated = this.scene.handleSetCharacterSelect(this.pendingCharacterId);
    if (updated) {
      this.activeCharacterId = this.pendingCharacterId;
      this.updateCharacterSelection();
    }
  }

  private confirmEnvironmentSelection() {
    if (!this.pendingEnvironmentId || this.pendingEnvironmentId === this.activeEnvironmentId) {
      return;
    }
    this.scene.setEnvironmentSelection(this.pendingEnvironmentId);
    this.activeEnvironmentId = this.pendingEnvironmentId;
    this.updateEnvironmentSelection();
  }

  public setUnlockedCharacters(ids: CharacterId[]) {
    this.unlockedCharacterIds = new Set(ids);
    this.updateCharacterLocks();
  }

  public setUnlockedEnvironments(ids: EnvironmentId[]) {
    this.unlockedEnvironmentIds = new Set(ids);
    this.updateEnvironmentLocks();
  }

  public setActiveCharacter(characterId: CharacterId) {
    this.activeCharacterId = characterId;
    this.pendingCharacterId = characterId;
    this.updateCharacterSelection();
  }

  public setActiveEnvironment(environmentId: EnvironmentId) {
    this.activeEnvironmentId = environmentId;
    this.pendingEnvironmentId = environmentId;
    this.updateEnvironmentSelection();
  }

  show() {
    this.setVisible(true);
  }

  hide() {
    this.setVisible(false);
  }

  private updateCharacterLocks() {
    this.characterCards.forEach((card) => {
      const isUnlocked = this.unlockedCharacterIds.has(card.config.id as CharacterId);
      if (isUnlocked) {
        card.container.setAlpha(1);
        card.statusText.setAlpha(1);
        card.lockIcon?.setVisible(false);
        card.hitArea.input && (card.hitArea.input.enabled = true);
      } else {
        card.container.setAlpha(0.4);
        card.statusText.setAlpha(0.5);
        card.lockIcon?.setVisible(true);
        card.hitArea.input && (card.hitArea.input.enabled = false);
      }
    });
  }

  private updateEnvironmentLocks() {
    this.environmentCards.forEach((card) => {
      const isUnlocked = this.unlockedEnvironmentIds.has(card.config.id as EnvironmentId);
      if (isUnlocked) {
        card.container.setAlpha(1);
        card.statusText.setAlpha(1);
        card.lockIcon?.setVisible(false);
        card.hitArea.input && (card.hitArea.input.enabled = true);
      } else {
        card.container.setAlpha(0.4);
        card.statusText.setAlpha(0.5);
        card.lockIcon?.setVisible(true);
        card.hitArea.input && (card.hitArea.input.enabled = false);
      }
    });
  }

  private updateCharacterSelection() {
    this.characterCards.forEach((card) => {
      const isSelected = card.config.id === this.pendingCharacterId;
      card.frame.setStrokeStyle(3, isSelected ? 0x9ad9ff : 0xffffff, isSelected ? 1 : 0.4);
    });
    this.updateConfirmButtonState();
  }

  private updateEnvironmentSelection() {
    this.environmentCards.forEach((card) => {
      const isSelected = card.config.id === this.pendingEnvironmentId;
      card.frame.setStrokeStyle(3, isSelected ? 0x9ad9ff : 0xffffff, isSelected ? 1 : 0.4);
    });
    this.updateConfirmButtonState();
  }

  private enableCursorPointer(
    targets: (
      | Phaser.GameObjects.Text
      | Phaser.GameObjects.Graphics
      | Phaser.GameObjects.Zone
      | Phaser.GameObjects.Rectangle
    )[]
  ) {
    targets.forEach((target) => {
      target.on('pointerover', () => {
        this.scene.input.manager.canvas.style.cursor = 'pointer';
      });
      target.on('pointerout', () => {
        this.scene.input.manager.canvas.style.cursor = 'default';
      });
    });
  }

  private getCardPosition(
    index: number,
    totalItems: number,
    columns: number,
    sectionLeft: number,
    sectionWidth: number,
    cardWidth: number,
    cardHeight: number
  ) {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const rowStartIndex = row * columns;
    const cardsInRow = Math.max(1, Math.min(columns, totalItems - rowStartIndex));
    const rowWidth = cardsInRow * cardWidth + (cardsInRow - 1) * this.cardHorizontalGap;
    const rowStartX = sectionLeft + (sectionWidth - rowWidth) / 2 + cardWidth / 2;
    const x = snap(rowStartX + column * (cardWidth + this.cardHorizontalGap));
    const y = snap(this.sectionContentTop + row * (cardHeight + this.cardVerticalGap));

    return { x, y };
  }
}

export default CharacterModal;
