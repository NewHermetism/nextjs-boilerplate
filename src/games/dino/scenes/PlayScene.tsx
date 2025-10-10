// PlayScene.tsx
import Phaser from 'phaser';
import CharacterModal from './CharacterModal';
import Menu from './Menu';
import DinoCharacter from './DinoCharacter';
import ObstacleManager from './ObstacleManager';
import EnvironmentManager from './EnvironmentManager';
import ScoreManager from './ScoreManager';
import InputManager from './InputManager';
import UIManager from './UIManager';
import { GAME_SETTINGS, SOUND_CONFIG } from './Constants';
import SocketHandler from '../helpers/SocketHandler';
import { isTablet, isMobile } from 'react-device-detect';
import { VdashProfile } from '../vdash-utils/types/vdash/profile';

class PlayScene extends Phaser.Scene {
  public SocketHandler: SocketHandler;
  public profile?: VdashProfile;
  public gameId?: string;

  public gameSpeed: number;
  private isGameRunning: boolean;
  private hitSound!: Phaser.Sound.BaseSound;
  private startTrigger!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private backgroundMusic?: Phaser.Sound.BaseSound;
  private isAudioMuted = false;
  private isDebugMenuVisible = false;
  private isCollisionDebugEnabled = false;
  private debugMenuElement?: HTMLDivElement;
  private debugCollisionButton?: HTMLButtonElement;
  private debugMenuToggleHandler?: () => void;
  private physicsDebugGraphic?: Phaser.GameObjects.Graphics;
  private handleMuteChange = (isMuted: boolean) => {
    this.applyGlobalMute(isMuted);
  };

  // Managers
  private dinoCharacter!: DinoCharacter;
  private obstacleManager!: ObstacleManager;
  private environmentManager!: EnvironmentManager;
  private scoreManager!: ScoreManager;
  private inputManager!: InputManager;
  private uiManager!: UIManager;

  // External components
  private characterModal!: CharacterModal;
  private menu!: Menu;
  public selectedCharacterIndex: number = 0;
  private showLeaderBoard: () => void;
  private updateVisibility?: () => void;
  private checkLeadearboardVisibility: () => boolean;
  public handleSetCharacterSelect = (index: number): boolean => {
    this.selectedCharacterIndex = index;
    const canUpdateScene = this.environmentManager && this.characterModal;
    if (canUpdateScene) {
      this.environmentManager.onSelectCharacter();
      this.characterModal.updateCharacterOpacity();
    }

    // Update music when character is selected
    if (this.isGameRunning) {
      const musicKey =
        index === 0
          ? 'pijamas_music'
          : index === 1
          ? 'boss_music'
          : 'blue_music';

      this.startBackgroundMusic(musicKey);
    }

    return Boolean(canUpdateScene);
  };

  constructor(
    accessToken: string,
    showLeaderBoard: () => void,
    checkLeadearboardVisibility: () => boolean
  ) {
    super('PlayScene');
    this.gameSpeed = GAME_SETTINGS.INITIAL_GAME_SPEED;
    this.isGameRunning = false;
    this.showLeaderBoard = showLeaderBoard;
    this.checkLeadearboardVisibility = checkLeadearboardVisibility;
    this.SocketHandler = new SocketHandler({ accessToken, scene: this });
    this.SocketHandler.getProfile();
  }

  create() {
    const { height } = this.scale;

    this.sound.pauseOnBlur = false;
    this.sound.pauseOnHide = false;

    // Initialize background music
    const initialMute = this.getInitialMuteState();
    this.applyGlobalMute(initialMute);
    this.startBackgroundMusic('menu_music');

    // Setup device orientation check
    this.setupOrientationCheck();

    // Load sounds
    this.hitSound = this.sound.add('hit', SOUND_CONFIG.HIT);
    this.hitSound.setMute(this.isAudioMuted);

    // Create start trigger
    this.startTrigger = this.physics.add
      .sprite(0, 10, 'triggerTexture')
      .setOrigin(0, 1)
      .setImmovable(true)
      .setY(150)
      .setOffset(0, GAME_SETTINGS.ON_GROUND_POSITION);

    // Initialize character modal
    this.characterModal = new CharacterModal(
      this,
      this.scale.width / 2 - 210,
      this.scale.height / 2 - 125
    );
    this.characterModal.hide();

    // Initialize menu callback
    const handleShowAvatarModal = () => {
      if (!this.checkLeadearboardVisibility()) {
        const lockedIndexes: number[] = [];
        if (this.profile) {
          if (!this.profile.has_white_pijama_nft) lockedIndexes.push(0);
          if (!this.profile.has_boss_nft) lockedIndexes.push(1);
          if (!this.profile.has_blue_victor_nft) lockedIndexes.push(2);
        }
        this.characterModal.setLockedCharacters(lockedIndexes);
        this.characterModal.show();
      }
    };

    const handleShowLeadearboard = () => {
      if (!this.characterModal.visible) {
        this.showLeaderBoard();
      }
    };

    const handlePlayMenu = () => {
      if (!this.characterModal.visible && !this.checkLeadearboardVisibility()) {
        // Wait for profile to load before allowing game start
        if (!this.profile) {
          if (this.profileLoadError) {
            console.error('[PLAY] Cannot play: Backend connection failed');
            console.error('[PLAY] Please refresh the page and try again');
          } else {
            console.warn('[PLAY] Profile is still loading, please wait');
          }
          handleShowAvatarModal();
          return;
        }

        // Check if user has any NFT
        const hasAnyNFT =
          this.profile.has_white_pijama_nft ||
          this.profile.has_boss_nft ||
          this.profile.has_blue_victor_nft;

        if (hasAnyNFT) {
          console.log('[PLAY] User has NFT, starting game');
          this.menu.hide();
          this.SocketHandler.startGameEvent();
          this.restartGame();
        } else {
          console.log('[PLAY] User has no NFTs, showing purchase modal');
          handleShowAvatarModal();
        }
      }
    };

    const handleRestartMenu = () => {
      if (!this.menu.visible && !this.checkLeadearboardVisibility()) {
        this.SocketHandler.startGameEvent();
        this.restartGame();
      }
    };

    // Initialize menu
    this.menu = new Menu(
      this,
      0,
      0,
      handleShowAvatarModal,
      handleShowLeadearboard,
      handlePlayMenu
    );

    // Initialize managers
    this.environmentManager = new EnvironmentManager(this);
    this.dinoCharacter = new DinoCharacter(this, 0, height);
    this.obstacleManager = new ObstacleManager(this);
    this.uiManager = new UIManager(this, this.characterModal, this.menu);
    this.scoreManager = new ScoreManager(this);

    // Initialize input manager with callbacks
    this.inputManager = new InputManager(
      this,
      () => {
        if (!this.menu.visible && this.isGameRunning) {
          this.dinoCharacter.jump();
        }
      },
      handleRestartMenu,
      () => this.uiManager.showMenu(),
      () => this.handleBackButton()
    );

    // Setup UI input handlers
    this.inputManager.setupUIInputs(
      this.uiManager.restartButton,
      this.uiManager.menuButton,
      this.uiManager.getBackButton
    );

    // Initialize colliders
    this.initColliders();

    // Initialize start trigger
    this.initStartTrigger();

    this.game.events.on('audio:mute-changed', this.handleMuteChange, this);

    if (this.input.keyboard) {
      this.debugMenuToggleHandler = () => this.toggleDebugMenu();
      this.input.keyboard.on('keydown-P', this.debugMenuToggleHandler);
    }
  }

  private getInitialMuteState() {
    const stored = this.registry.get('audioMuted');
    if (typeof stored === 'boolean') {
      return stored;
    }
    return this.sound.mute;
  }

  private applyGlobalMute(isMuted: boolean) {
    this.isAudioMuted = isMuted;
    this.sound.setMute(isMuted);
    this.sound.sounds.forEach((sound) => {
      if (sound === this.backgroundMusic) {
        if (isMuted && sound.isPlaying) {
          sound.pause();
          sound.setMute(true);
        }
        if (!isMuted && sound.isPaused) {
          sound.setMute(false);
          sound.resume();
        } else if (!isMuted) {
          sound.setMute(false);
        }
        return;
      }

      sound.setMute(isMuted);
    });

    if (!isMuted && this.backgroundMusic && !this.backgroundMusic.isPlaying) {
      this.backgroundMusic.play();
    }
  }

  private startBackgroundMusic(key: string) {
    const shouldReuse = this.backgroundMusic?.key === key;

    if (!shouldReuse && this.backgroundMusic) {
      this.backgroundMusic.stop();
      this.backgroundMusic.destroy();
      this.backgroundMusic = undefined;
    }

    if (!this.backgroundMusic || !shouldReuse) {
      this.backgroundMusic = this.sound.add(key, {
        volume: 0.15,
        loop: true
      });
      this.backgroundMusic.setMute(this.isAudioMuted);
    }

    if (!this.backgroundMusic) return;

    if (this.backgroundMusic.isPaused) {
      this.backgroundMusic.resume();
    } else {
      const seekPosition = shouldReuse ? this.backgroundMusic.seek ?? 0 : 0;
      this.backgroundMusic.stop();
      this.backgroundMusic.play({ seek: seekPosition });
    }

    if (this.isAudioMuted) {
      this.backgroundMusic.pause();
      this.backgroundMusic.setMute(true);
    }
  }

  private toggleDebugMenu() {
    if (!this.debugMenuElement) {
      this.createDebugMenu();
    }

    this.isDebugMenuVisible = !this.isDebugMenuVisible;
    if (this.debugMenuElement) {
      this.debugMenuElement.style.display = this.isDebugMenuVisible ? 'block' : 'none';
    }
  }

  private createDebugMenu() {
    const menu = document.createElement('div');
    menu.style.position = 'fixed';
    menu.style.top = '1rem';
    menu.style.right = '1rem';
    menu.style.zIndex = '9999';
    menu.style.background = 'rgba(14,18,44,0.95)';
    menu.style.border = '1px solid #6e4b9e';
    menu.style.borderRadius = '12px';
    menu.style.padding = '16px';
    menu.style.minWidth = '220px';
    menu.style.fontFamily = 'monospace';
    menu.style.color = '#fff';
    menu.style.boxShadow = '0 10px 25px rgba(0,0,0,0.45)';

    const title = document.createElement('div');
    title.textContent = 'Debug Menu';
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '12px';
    title.style.letterSpacing = '0.08em';
    menu.appendChild(title);

    const hint = document.createElement('div');
    hint.textContent = 'Press P to toggle';
    hint.style.fontSize = '12px';
    hint.style.opacity = '0.7';
    hint.style.marginBottom = '12px';
    menu.appendChild(hint);

    const collisionButton = document.createElement('button');
    collisionButton.type = 'button';
    collisionButton.style.display = 'block';
    collisionButton.style.width = '100%';
    collisionButton.style.padding = '8px 12px';
    collisionButton.style.marginBottom = '8px';
    collisionButton.style.background = '#6e4b9e';
    collisionButton.style.border = 'none';
    collisionButton.style.borderRadius = '8px';
    collisionButton.style.cursor = 'pointer';
    collisionButton.style.color = '#fff';
    collisionButton.style.fontWeight = '600';
    collisionButton.addEventListener('mouseenter', () => {
      collisionButton.style.background = '#815abd';
    });
    collisionButton.addEventListener('mouseleave', () => {
      collisionButton.style.background = '#6e4b9e';
    });
    collisionButton.addEventListener('click', () => {
      this.setCollisionDebug(!this.isCollisionDebugEnabled);
    });
    menu.appendChild(collisionButton);

    document.body.appendChild(menu);

    this.debugMenuElement = menu as HTMLDivElement;
    this.debugCollisionButton = collisionButton;
    this.updateCollisionButtonLabel();
    this.debugMenuElement.style.display = this.isDebugMenuVisible ? 'block' : 'none';
  }

  private updateCollisionButtonLabel() {
    if (!this.debugCollisionButton) return;
    this.debugCollisionButton.textContent = this.isCollisionDebugEnabled
      ? 'Hide Collision Boxes'
      : 'Show Collision Boxes';
  }

  private setCollisionDebug(enabled: boolean) {
    this.isCollisionDebugEnabled = enabled;

    if (enabled) {
      // Always recreate to ensure fresh state
      if (this.physicsDebugGraphic) {
        this.physicsDebugGraphic.destroy();
      }

      this.physicsDebugGraphic = this.add.graphics();
      this.physicsDebugGraphic.setDepth(10000);

      // Enable debug mode
      this.physics.world.drawDebug = true;
      this.physics.world.debugGraphic = this.physicsDebugGraphic;
    } else {
      this.physics.world.drawDebug = false;
      if (this.physicsDebugGraphic) {
        this.physicsDebugGraphic.clear();
        this.physicsDebugGraphic.destroy();
        this.physicsDebugGraphic = undefined;
      }
      this.physics.world.debugGraphic = undefined;
    }

    this.updateCollisionButtonLabel();
  }

  private destroyDebugMenu() {
    if (this.debugMenuElement?.parentNode) {
      this.debugMenuElement.parentNode.removeChild(this.debugMenuElement);
    }
    this.debugMenuElement = undefined;
    this.debugCollisionButton = undefined;
  }

  private refreshCollisionDebug() {
    if (!this.isCollisionDebugEnabled || !this.physicsDebugGraphic) {
      return;
    }

    // Clear previous frame
    this.physicsDebugGraphic.clear();

    // Draw all physics bodies manually for better control
    this.physics.world.bodies.entries.forEach((body: Phaser.Physics.Arcade.Body) => {
      if (!body.enable) return;

      // Draw body bounds
      this.physicsDebugGraphic!.lineStyle(1, 0x00ff00, 1);
      this.physicsDebugGraphic!.strokeRect(
        body.x,
        body.y,
        body.width,
        body.height
      );

      // Draw center point
      this.physicsDebugGraphic!.fillStyle(0xff0000, 1);
      this.physicsDebugGraphic!.fillCircle(body.center.x, body.center.y, 2);
    });
  }

  setupOrientationCheck() {
    this.updateVisibility = () => {
      const isLandscape = window.matchMedia('(orientation: landscape)').matches;
      const { width, height } = this.scale;

      if (isMobile || isTablet) {
        if (isLandscape) {
          this.game.canvas.style.display = 'block';
          // Resize game to fit landscape
          this.scale.resize(width, height);
          // Update camera and game elements
          this.cameras.main.setSize(width, height);
          // Resume game if it was paused
          if (this.scene.isPaused()) {
            this.scene.resume();
          }
        } else {
          this.game.canvas.style.display = 'none';
          // Pause game when in portrait
          this.scene.pause();
        }
      } else {
        this.game.canvas.style.display = 'block';
        this.scale.resize(width, height);
        this.cameras.main.setSize(width, height);
      }
    };

    // Initial check
    this.updateVisibility();

    // Listen for orientation changes
    window.addEventListener('orientationchange', () => {
      // Small delay to ensure proper orientation detection
      setTimeout(() => {
        if (this.updateVisibility) {
          this.updateVisibility();
        }
      }, 100);
    });

    // Listen for window resize
    window.addEventListener('resize', this.updateVisibility);
  }

  initStartTrigger() {
    const { width, height } = this.scale;
    this.physics.add.overlap(
      this.startTrigger,
      this.dinoCharacter.body,
      () => {
        if (this.startTrigger.y === 10) {
          this.startTrigger.body.reset(0, height);
          return;
        }

        this.startTrigger.disableBody(true, true);

        const startEvent = this.time.addEvent({
          delay: 1000 / 60,
          loop: true,
          callbackScope: this,
          callback: () => {
            this.dinoCharacter.body.setVelocityX(80);
            this.dinoCharacter.run();

            // Expand background gradually
            const fullyExpanded =
              this.environmentManager.expandBackground(width);

            if (fullyExpanded) {
              this.dinoCharacter.body.setVelocityX(0);
              this.environmentManager.showDecorations();
              startEvent.remove();
            }
          }
        });
      },
      undefined,
      this
    );
  }

  initColliders() {
    this.physics.add.overlap(
      this.dinoCharacter.body,
      this.obstacleManager.group,
      (dino, obstacle) => {
        const dinoSprite = dino as Phaser.Physics.Arcade.Sprite;
        const obstacleSprite = obstacle as Phaser.Physics.Arcade.Sprite;

        if (!dinoSprite.active || !obstacleSprite.active) return;

        this.handleCollision();
      },
      undefined, // Fixed: changed from null to undefined
      this
    );
  }

  private handleCollision() {
    this.scoreManager.stopScoring();
    this.physics.pause();
    this.isGameRunning = false;
    this.anims.pauseAll();
    this.gameSpeed = GAME_SETTINGS.INITIAL_GAME_SPEED;
    this.uiManager.showGameOver();
    this.hitSound.play();
    this.cameras.main.shake(100, 0.01);
    this.backgroundMusic?.stop();
  }

  private handleBackButton() {
    this.uiManager.showMenu();
    this.scoreManager.stopScoring();
    this.physics.pause();
    this.isGameRunning = false;
    this.anims.pauseAll();
    this.gameSpeed = GAME_SETTINGS.INITIAL_GAME_SPEED;
    this.startBackgroundMusic('menu_music');
  }

  restartGame() {
    this.dinoCharacter.reset();
    this.physics.resume();
    this.obstacleManager.reset();
    this.isGameRunning = true;
    this.uiManager.hideGameOver();
    this.anims.resumeAll();
    this.scoreManager.startScoring((newGameSpeed) => {
      this.gameSpeed = newGameSpeed;
    });

    // Play character-specific music
    const musicKey =
      this.selectedCharacterIndex === 0
        ? 'pijamas_music'
        : this.selectedCharacterIndex === 1
        ? 'boss_music'
        : 'blue_music';

    this.startBackgroundMusic(musicKey);
  }

  update(time: number, delta: number): void {
    if (this.isCollisionDebugEnabled) {
      this.refreshCollisionDebug();
    }

    if (!this.isGameRunning || !this.gameId) {
      return;
    }

    // Update environment
    this.environmentManager.update(this.gameSpeed, delta);

    // Update obstacles
    this.obstacleManager.update(delta, this.gameSpeed);

    // Update character animation
    this.dinoCharacter.updateAnimation();
  }

  shutdown() {
    if (this.updateVisibility) {
      window.removeEventListener('resize', this.updateVisibility);
      window.removeEventListener('orientationchange', this.updateVisibility);
    }
    this.game.events.off('audio:mute-changed', this.handleMuteChange, this);
    if (this.debugMenuToggleHandler && this.input.keyboard) {
      this.input.keyboard.off('keydown-P', this.debugMenuToggleHandler);
      this.debugMenuToggleHandler = undefined;
    }
    if (this.isCollisionDebugEnabled) {
      this.setCollisionDebug(false);
    }
    this.destroyDebugMenu();
    if (this.physicsDebugGraphic) {
      this.physicsDebugGraphic.destroy();
      this.physicsDebugGraphic = undefined;
    }
    this.events.off('characterChanged');
  }
}

export default PlayScene;
