import Phaser from 'phaser';
import { InventoryEntry, POWERUPS, PowerupConfig } from '../config/powerups.config';
import PlayScene from './PlayScene';

type TabKey = 'powerups' | 'inventory';

type ShopMenuOptions = {
  onClose: () => void;
  title?: string;
};

type TabButton = {
  key: TabKey;
  rect: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
};

type PowerupCard = {
  powerup: PowerupConfig;
  container: Phaser.GameObjects.Container;
  frame: Phaser.GameObjects.Rectangle;
  icon: Phaser.GameObjects.Image;
  name: Phaser.GameObjects.Text;
};

const BASE_CANVAS_WIDTH = 1280;
const BASE_CANVAS_HEIGHT = 720;
const BASE_MODAL_WIDTH = 980;
const BASE_MODAL_HEIGHT = 560;
const BASE_PADDING = 26;
const BASE_TAB_HEIGHT = 48;
const BASE_CARD_SIZE = 150;
const BASE_CARD_GAP = 18;
const BASE_DETAIL_WIDTH = 320;

const snap = (value: number) => Math.round(value);

class ShopMenu extends Phaser.GameObjects.Container {
  public scene: PlayScene;
  private dim: Phaser.GameObjects.Rectangle;
  private panel: Phaser.GameObjects.Rectangle;
  private headerText: Phaser.GameObjects.Text;
  private closeButton: Phaser.GameObjects.Text;
  private tabButtons: TabButton[] = [];
  private activeTab: TabKey = 'powerups';
  private gridContainer: Phaser.GameObjects.Container;
  private detailContainer: Phaser.GameObjects.Container;
  private inventoryContainer: Phaser.GameObjects.Container;
  private cards: PowerupCard[] = [];
  private powerups: PowerupConfig[];
  private selectedPowerup?: PowerupConfig;
  private inventory: InventoryEntry[] = [];
  private layoutScale: number;
  private modalWidth: number;
  private modalHeight: number;
  private modalLeft: number;
  private modalTop: number;
  private padding: number;
  private cardSize: number;
  private cardGap: number;
  private detailWidth: number;
  private gridTop: number;
  private gridLeft: number;
  private contentHeight: number;
  private onClose: () => void;
  private title: string;

  // Detail refs
  private detailIcon!: Phaser.GameObjects.Image;
  private detailTitle!: Phaser.GameObjects.Text;
  private detailType!: Phaser.GameObjects.Text;
  private detailPrice!: Phaser.GameObjects.Text;
  private buyButton!: Phaser.GameObjects.Rectangle;
  private buyLabel!: Phaser.GameObjects.Text;

  constructor(scene: PlayScene, options: ShopMenuOptions) {
    super(scene, 0, 0);
    this.scene = scene;
    this.onClose = options.onClose;
    this.title = options.title ?? 'Store';
    this.powerups = POWERUPS;

    const canvasWidth = scene.scale.width;
    const canvasHeight = scene.scale.height;
    this.layoutScale = Math.min(canvasWidth / BASE_CANVAS_WIDTH, canvasHeight / BASE_CANVAS_HEIGHT);
    const scaled = (value: number) => snap(value * this.layoutScale);

    this.modalWidth = scaled(BASE_MODAL_WIDTH);
    this.modalHeight = scaled(BASE_MODAL_HEIGHT);
    this.modalLeft = (canvasWidth - this.modalWidth) / 2;
    this.modalTop = (canvasHeight - this.modalHeight) / 2;
    this.padding = scaled(BASE_PADDING);
    this.cardSize = scaled(BASE_CARD_SIZE);
    this.cardGap = scaled(BASE_CARD_GAP);
    this.detailWidth = scaled(BASE_DETAIL_WIDTH);

    // Dim backdrop
    this.dim = scene.add
      .rectangle(0, 0, canvasWidth, canvasHeight, 0x000000, 0.5)
      .setOrigin(0)
      .setInteractive();

    // Panel background (single container for easy layout)
    this.panel = scene.add
      .rectangle(this.modalLeft, this.modalTop, this.modalWidth, this.modalHeight, 0x0e122c, 0.94)
      .setOrigin(0);
    this.panel.setStrokeStyle(3, 0x9fb4ff, 0.35);

    // Header
    this.headerText = scene.add.text(this.modalLeft + this.padding, this.modalTop + this.padding, this.title.toUpperCase(), {
      fontSize: `${scaled(22)}px`,
      color: '#cdd6ff',
      fontStyle: 'bold',
      letterSpacing: 1
    });

    this.closeButton = scene.add
      .text(this.modalLeft + this.modalWidth - this.padding, this.modalTop + this.padding, 'X', {
        fontSize: `${scaled(20)}px`,
        color: '#ffffff',
        fontStyle: 'bold'
      })
      .setOrigin(1, 0)
      .setInteractive();
    this.closeButton.on('pointerdown', () => {
      this.hide();
      this.onClose();
    });

    // Tabs row
    const tabsTop =
      this.modalTop + this.padding + snap(BASE_TAB_HEIGHT * 0.3 * this.layoutScale) + this.headerText.height;
    this.createTabs(this.modalLeft + this.padding, tabsTop, scaled(BASE_TAB_HEIGHT));

    // Main area positions (bound to modal)
    this.gridTop = tabsTop + scaled(BASE_TAB_HEIGHT) + this.padding;
    this.gridLeft = this.modalLeft + this.padding;
    const detailLeft = this.modalLeft + this.modalWidth - this.detailWidth - this.padding;
    this.contentHeight = this.modalHeight - (this.gridTop - this.modalTop) - this.padding * 2;

    this.gridContainer = scene.add.container(this.gridLeft, this.gridTop);
    this.detailContainer = scene.add.container(detailLeft, this.gridTop);
    this.detailContainer.setSize(this.detailWidth, this.contentHeight);
    this.inventoryContainer = scene.add.container(this.gridLeft, this.gridTop);

    this.add([
      this.dim,
      this.panel,
      this.headerText,
      this.closeButton,
      ...this.tabButtons.map((t) => t.rect),
      ...this.tabButtons.map((t) => t.label),
      this.gridContainer,
      this.detailContainer,
      this.inventoryContainer
    ]);
    this.setDepth(4);
    this.scene.add.existing(this);

    this.buildDetailPanel();
    this.renderPowerupGrid();
    this.renderInventory();
    this.setActiveTab('powerups');
    this.hide();
  }

  show() {
    this.setVisible(true);
    this.dim.setVisible(true);
  }

  hide() {
    this.setVisible(false);
    this.dim.setVisible(false);
  }

  setInventory(entries: InventoryEntry[]) {
    this.inventory = entries;
    if (this.activeTab === 'inventory') {
      this.renderInventory();
    }
  }

  private createTabs(left: number, top: number, height: number) {
    const tabs: { key: TabKey; label: string }[] = [
      { key: 'powerups', label: 'Powerups' },
      { key: 'inventory', label: 'Inventory' }
    ];

    tabs.forEach((tab, index) => {
      const width = snap(140 * this.layoutScale);
      const x = left + index * (width + this.padding / 2);

      const rect = this.scene.add
        .rectangle(x, top, width, height, 0x171d3d, 0.85)
        .setOrigin(0)
        .setInteractive();
      rect.setStrokeStyle(2, 0x28345c, 0.85);
      rect.setDepth(10);

      const label = this.scene.add.text(x + width / 2, top + height / 2, tab.label.toUpperCase(), {
        fontSize: `${Math.max(12, snap(12 * this.layoutScale))}px`,
        color: '#cdd6ff',
        fontStyle: 'bold',
        letterSpacing: 1
      });
      label.setOrigin(0.5);
      label.setDepth(11);

      rect.on('pointerdown', () => this.setActiveTab(tab.key));
      this.enableCursorPointer([rect]);

      this.tabButtons.push({ key: tab.key, rect, label });
    });
  }

  private setActiveTab(tab: TabKey) {
    this.activeTab = tab;
    this.tabButtons.forEach((btn) => {
      const isActive = btn.key === tab;
      btn.rect.setFillStyle(isActive ? 0x1f274f : 0x171d3d, 0.95);
      btn.rect.setStrokeStyle(2, isActive ? 0x9fb4ff : 0x28345c, 0.9);
      btn.label.setColor(isActive ? '#ffffff' : '#9db2d8');
    });

    const isCatalog = tab === 'powerups';
    this.gridContainer.setVisible(isCatalog);
    this.detailContainer.setVisible(isCatalog);
    this.inventoryContainer.setVisible(!isCatalog);

    if (!isCatalog) {
      this.renderInventory();
    }
  }

  private renderPowerupGrid() {
    this.gridContainer.removeAll(true);
    this.cards.forEach((card) => card.container.destroy());
    this.cards = [];

    const availableWidth = this.modalWidth - this.detailWidth - this.padding * 3;
    const columns = Math.max(2, Math.floor(availableWidth / (this.cardSize + this.cardGap)));

    this.powerups.forEach((powerup, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = col * (this.cardSize + this.cardGap);
      const y = row * (this.cardSize + this.cardGap);

      const card = this.createPowerupCard(powerup, x, y);
      this.gridContainer.add(card.container);
      this.cards.push(card);
    });

    if (!this.selectedPowerup && this.powerups.length) {
      this.selectPowerup(this.powerups[0]);
    } else if (this.selectedPowerup) {
      this.selectPowerup(this.selectedPowerup);
    }
  }

  private createPowerupCard(powerup: PowerupConfig, x: number, y: number): PowerupCard {
    const container = this.scene.add.container(x, y);

    const hit = this.scene.add
      .rectangle(0, 0, this.cardSize, this.cardSize, 0xffffff, 0)
      .setOrigin(0);

    const frame = this.scene.add
      .rectangle(0, 0, this.cardSize, this.cardSize, 0x141a37, 0.9)
      .setOrigin(0);
    frame.setStrokeStyle(2, 0x28345c, 0.9);

    const iconBg = this.scene.add
      .rectangle(this.cardSize / 2, this.cardSize / 2.2, this.cardSize * 0.78, this.cardSize * 0.78, 0x0f132b, 0.85)
      .setOrigin(0.5);
    iconBg.setStrokeStyle(2, 0x1f294b, 0.85);

    const icon = this.scene.add
      .image(this.cardSize / 2, this.cardSize / 2.2, powerup.icon.key)
      .setDisplaySize(this.cardSize * 0.7, this.cardSize * 0.7);

    const name = this.scene.add.text(this.cardSize / 2, this.cardSize - this.padding * 0.6, powerup.label, {
      fontSize: `${Math.max(13, snap(13 * this.layoutScale))}px`,
      color: '#dfe7ff',
      fontStyle: 'bold'
    });
    name.setOrigin(0.5);

    container.add([hit, frame, iconBg, icon, name]);
    container.setSize(this.cardSize, this.cardSize);
    hit.setInteractive();
    hit.on('pointerdown', () => this.selectPowerup(powerup));
    hit.on('pointerover', () => {
      frame.setStrokeStyle(3, 0x9fb4ff, 0.95);
      name.setColor('#ffffff');
    });
    hit.on('pointerout', () => {
      const isActive = this.selectedPowerup?.id === powerup.id;
      frame.setStrokeStyle(3, isActive ? 0x9fb4ff : 0x28345c, 0.95);
      name.setColor(isActive ? '#ffffff' : '#dfe7ff');
    });

    this.enableCursorPointer([hit]);

    return { powerup, container, frame, icon, name };
  }

  private selectPowerup(powerup: PowerupConfig) {
    this.selectedPowerup = powerup;
    this.cards.forEach((card) => {
      const isActive = card.powerup.id === powerup.id;
      card.frame.setStrokeStyle(3, isActive ? 0x9fb4ff : 0x28345c, 0.95);
      card.icon.setAlpha(isActive ? 1 : 0.85);
      card.name.setColor(isActive ? '#ffffff' : '#dfe7ff');
    });
    this.updateDetail(powerup);
  }

  private buildDetailPanel() {
    this.detailContainer.removeAll(true);
    const width = this.detailWidth;
    const height = this.contentHeight;

    const panel = this.scene.add
      .rectangle(0, 0, width, height, 0x111731, 0.9)
      .setOrigin(0);
    panel.setStrokeStyle(2, 0x28345c, 0.85);

    const iconSize = width * 0.65;
    const iconY = this.padding * 1.0;
    this.detailIcon = this.scene.add
      .image(width / 2, iconY, this.powerups[0]?.icon.key ?? '')
      .setOrigin(0.5, 0)
      .setDisplaySize(iconSize, iconSize);

    // Hide title/type/price labels per request
    const hiddenY = iconY + iconSize + this.padding * 0.3;
    this.detailTitle = this.scene.add.text(width / 2, hiddenY, '', {
      fontSize: `${Math.max(16, snap(16 * this.layoutScale))}px`,
      color: '#ffffff',
      fontStyle: 'bold'
    });
    this.detailTitle.setOrigin(0.5).setVisible(false);

    this.detailType = this.scene.add.text(width / 2, hiddenY, '', {
      fontSize: `${Math.max(12, snap(12 * this.layoutScale))}px`,
      color: '#9db2d8',
      fontStyle: 'bold'
    });
    this.detailType.setOrigin(0.5).setVisible(false);

    this.detailPrice = this.scene.add.text(width / 2, hiddenY, '', {
      fontSize: `${Math.max(13, snap(13 * this.layoutScale))}px`,
      color: '#74e291',
      fontStyle: 'bold'
    });
    this.detailPrice.setOrigin(0.5).setVisible(false);

    const descY = iconY + iconSize + this.padding * 0.6;
    const descWidth = width - this.padding * 1.5;
    const buttonHeight = snap(46 * this.layoutScale);
    const buttonY = height - buttonHeight - this.padding;
    const spacer = this.scene.add.rectangle(
      this.padding / 1.5,
      descY,
      descWidth,
      buttonY - descY - this.padding,
      0x000000,
      0
    );

    const buttonWidth = width - this.padding * 1.4;
    this.buyButton = this.scene.add
      .rectangle(this.padding / 1.5, height - buttonHeight - this.padding, buttonWidth, buttonHeight, 0x3b7bff, 0.9)
      .setOrigin(0);
    this.buyButton.setStrokeStyle(2, 0x9fb4ff, 0.9);
    this.buyButton.setInteractive();
    this.buyButton.on('pointerdown', () => {
      // Purchase flow to be implemented
      console.log('[SHOP] Purchase flow not implemented yet');
    });

    this.buyLabel = this.scene.add.text(
      this.buyButton.x + buttonWidth / 2,
      this.buyButton.y + buttonHeight / 2,
      'Purchase',
      {
        fontSize: `${Math.max(13, snap(13 * this.layoutScale))}px`,
        color: '#ffffff',
        fontStyle: 'bold',
        letterSpacing: 0.5
      }
    );
    this.buyLabel.setOrigin(0.5);

    this.detailContainer.add([
      panel,
      this.detailIcon,
      this.detailTitle,
      this.detailType,
      this.detailPrice,
      spacer,
      this.buyButton,
      this.buyLabel
    ]);
    this.enableCursorPointer([this.buyButton]);
  }

  private updateDetail(powerup: PowerupConfig) {
    this.detailTitle.setText('');
    this.detailType.setText('');
    this.detailIcon.setTexture(powerup.icon.key);

    this.detailPrice.setText('');
    this.buyLabel.setText('Purchase');
  }

  private renderInventory() {
    this.inventoryContainer.removeAll(true);

    const width = this.modalWidth - this.detailWidth - this.padding * 3;
    const title = this.scene.add.text(0, 0, 'Inventory', {
      fontSize: `${Math.max(14, snap(14 * this.layoutScale))}px`,
      color: '#ffffff',
      fontStyle: 'bold'
    });
    this.inventoryContainer.add(title);

    if (!this.inventory.length) {
      const empty = this.scene.add.text(
        0,
        title.height + this.padding / 2,
        'Inventory is empty. Purchased powerups will appear here.',
        {
          fontSize: `${Math.max(13, snap(13 * this.layoutScale))}px`,
          color: '#cdd6ff',
          wordWrap: { width }
        }
      );
      this.inventoryContainer.add(empty);
      return;
    }

    const itemHeight = snap(56 * this.layoutScale);
    this.inventory.forEach((entry, index) => {
      const y = title.height + this.padding / 2 + index * (itemHeight + this.padding / 3);
      const itemBg = this.scene.add
        .rectangle(0, y, width, itemHeight, 0x141a37, 0.9)
        .setOrigin(0);
      itemBg.setStrokeStyle(2, 0x28345c, 0.85);

      const label = this.scene.add.text(
        this.padding / 1.5,
        y + itemHeight / 2,
        `${entry.itemId}  x${entry.quantity}`,
        {
          fontSize: `${Math.max(13, snap(13 * this.layoutScale))}px`,
          color: '#dfe7ff'
        }
      );
      label.setOrigin(0, 0.5);

      this.inventoryContainer.add([itemBg, label]);
    });
  }

  private enableCursorPointer(items: Phaser.GameObjects.GameObject[]) {
    items.forEach((item) => {
      item.on('pointerover', () => {
        this.scene.input.manager.canvas.style.cursor = 'pointer';
      });
      item.on('pointerout', () => {
        this.scene.input.manager.canvas.style.cursor = 'default';
      });
    });
  }
}

export default ShopMenu;
