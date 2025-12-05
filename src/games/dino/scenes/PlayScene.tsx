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
import type { WalletProfile } from 'hooks/useGetProfile';
import {
  type CharacterConfig,
  type CharacterId,
  getCharacterByAvatarIndexOrDefault,
  getCharacterById,
  getDefaultCharacter
} from '../config/characters.config';
import type { EnvironmentId } from '../config/environments.config';

class PlayScene extends Phaser.Scene {
  public SocketHandler: SocketHandler;
  public profile?: WalletProfile;
  public profileLoadError = false;
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
  private collisionDebugGraphic?: Phaser.GameObjects.Graphics;
  private readonly drawCollisionDebug = () => {
    if (!this.isCollisionDebugEnabled || !this.collisionDebugGraphic) {
      return;
    }

    const graphics = this.collisionDebugGraphic;
    graphics.clear();
    graphics.lineStyle(2, 0x35ff6b, 0.9);
    graphics.fillStyle(0xff4d4d, 0.7);

    const playerBody = this.dinoCharacter.body.body as Phaser.Physics.Arcade.Body;
    if (playerBody && playerBody.enable) {
      graphics.strokeRect(playerBody.x, playerBody.y, playerBody.width, playerBody.height);
      graphics.fillCircle(playerBody.center.x, playerBody.center.y, 2);
    }

    const obstacles = this.obstacleManager.group.getChildren();
    graphics.lineStyle(2, 0x4db8ff, 0.9);
    obstacles.forEach((child) => {
      const sprite = child as Phaser.Physics.Arcade.Sprite;
      const body = sprite.body as Phaser.Physics.Arcade.Body | null;
      if (!body || !body.enable) {
        return;
      }

      graphics.strokeRect(body.x, body.y, body.width, body.height);
      graphics.fillCircle(body.center.x, body.center.y, 2);
    });
  };
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
  private activeCharacterConfig: CharacterConfig = getDefaultCharacter();
  public selectedEnvironmentId?: EnvironmentId;
  private isEnvironmentPinned = false;

  public get selectedCharacterId(): CharacterId {
    return this.activeCharacterConfig.id as CharacterId;
  }

  public get selectedCharacterIndex(): number {
    return this.activeCharacterConfig.avatarIndex;
  }
  private showLeaderBoard: () => void;
  private updateVisibility?: () => void;
  private checkLeadearboardVisibility: () => boolean;
  public handleSetCharacterSelect = (selection: CharacterId | number): boolean => {
    const isIdSelection = typeof selection === 'string';
    const nextCharacter = isIdSelection
      ? getCharacterById(selection as CharacterId)
      : getCharacterByAvatarIndexOrDefault(selection as number);

    if (!nextCharacter) {
      return false;
    }

    this.activeCharacterConfig = nextCharacter;
    if (!this.isEnvironmentPinned) {
      this.selectedEnvironmentId =
        nextCharacter.defaultEnvironmentId as EnvironmentId;
    }
    const canUpdateScene = this.environmentManager && this.characterModal;
    if (canUpdateScene) {
      this.environmentManager.onSelectCharacter();
      this.characterModal.setActiveCharacter(this.selectedCharacterId);
      this.notifyEnvironmentChanged();
    }

    // Update music when character is selected
    if (this.isGameRunning) {
      const musicKey = this.getActiveCharacterConfig().music.key;
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
  }

  public applyProfile(profile: WalletProfile) {
    this.profile = profile;
    this.selectedEnvironmentId = profile.selectedEnvironmentId;
    this.characterModal?.setUnlockedCharacters(profile.unlockedCharacters);
    this.characterModal?.setUnlockedEnvironments(profile.unlockedEnvironments);
    this.characterModal?.setActiveEnvironment(this.getActiveEnvironmentId());
    this.handleSetCharacterSelect(profile.selectedCharacterId);
  }

  create() {
    const { height } = this.scale;

    const soundManager = this.sound as Phaser.Sound.BaseSoundManager & {
      pauseOnHide?: boolean;
    };
    soundManager.pauseOnBlur = false;
    if (typeof soundManager.pauseOnHide === 'boolean') {
      soundManager.pauseOnHide = false;
    }

    // Initialize background music
    const initialMute = this.getInitialMuteState();
    this.applyGlobalMute(initialMute);
    this.startBackgroundMusic('menu_music');

    // Setup device orientation check
    this.setupOrientationCheck();

    // Load sounds
    this.hitSound = this.sound.add('hit', SOUND_CONFIG.HIT);
    this.setSoundMute(this.hitSound, this.isAudioMuted);

    // Create start trigger
    this.startTrigger = this.physics.add
      .sprite(0, 10, 'triggerTexture')
      .setOrigin(0, 1)
      .setImmovable(true)
      .setY(150)
      .setOffset(0, GAME_SETTINGS.ON_GROUND_POSITION);

    // Initialize character modal
    this.characterModal = new CharacterModal(this);
    this.characterModal.hide();

    // Initialize menu callback
    const handleShowAvatarModal = () => {
      if (!this.checkLeadearboardVisibility()) {
        if (this.profile) {
          this.characterModal.setUnlockedCharacters(
            this.profile.unlockedCharacters
          );
          this.characterModal.setUnlockedEnvironments(
            this.profile.unlockedEnvironments
          );
          this.characterModal.setActiveEnvironment(
            this.getActiveEnvironmentId()
          );
        }
        this.characterModal.show();
      }
    };

    const handleShowLeadearboard = () => {
      if (!this.characterModal.visible) {
        this.showLeaderBoard();
      }
    };

    const handlePlayMenu = () => {
      if (
        !this.characterModal.visible &&
        !this.checkLeadearboardVisibility()
      ) {
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
        const hasAnyNFT = this.profile.unlockedCharacters.length > 0;

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

    if (this.profile) {
      this.selectedEnvironmentId = this.profile.selectedEnvironmentId;
      this.handleSetCharacterSelect(this.profile.selectedCharacterId);
      this.characterModal.setUnlockedEnvironments(
        this.profile.unlockedEnvironments
      );
      this.characterModal.setActiveEnvironment(this.getActiveEnvironmentId());
    }

    // Initialize colliders
    this.initColliders();

    // Initialize start trigger
    this.initStartTrigger();

    this.game.events.on('audio:mute-changed', this.handleMuteChange, this);

    if (this.input.keyboard) {
      this.debugMenuToggleHandler = () => this.toggleDebugMenu();
      this.input.keyboard.on('keydown-Z', this.debugMenuToggleHandler);
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
    this.registry.set('audioMuted', isMuted);

    const soundManager = this.sound as Phaser.Sound.BaseSoundManager & {
      setMute?: (value: boolean) => void;
      mute?: boolean;
    };
    if (typeof soundManager.setMute === 'function') {
      soundManager.setMute(isMuted);
    } else if (typeof soundManager.mute === 'boolean') {
      soundManager.mute = isMuted;
    }

    const managedSounds = this.getManagedSounds();
    managedSounds.forEach((sound) => {
      if (sound === this.backgroundMusic) {
        if (isMuted && sound.isPlaying) {
          sound.pause();
          this.setSoundMute(sound, true);
        }
        if (!isMuted && sound.isPaused) {
          this.setSoundMute(sound, false);
          sound.resume();
        } else if (!isMuted) {
          this.setSoundMute(sound, false);
        }
        return;
      }

      this.setSoundMute(sound, isMuted);
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
      this.setSoundMute(this.backgroundMusic, this.isAudioMuted);
    }

    if (!this.backgroundMusic) return;

    const backgroundSound = this.backgroundMusic as Phaser.Sound.BaseSound & {
      seek?: number;
    };

    if (this.isAudioMuted) {
      this.setSoundMute(backgroundSound, true);
      if (backgroundSound.isPlaying || backgroundSound.isPaused) {
        backgroundSound.stop();
      }
      return;
    }

    if (backgroundSound.isPaused) {
      backgroundSound.resume();
    } else {
      const seekPosition = shouldReuse ? backgroundSound.seek ?? 0 : 0;
      backgroundSound.stop();
      backgroundSound.play({ seek: seekPosition });
    }

    this.setSoundMute(backgroundSound, false);
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
    hint.textContent = 'Press Z to toggle';
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

  private getManagedSounds(): Phaser.Sound.BaseSound[] {
    const manager = this.sound as Phaser.Sound.BaseSoundManager & {
      sounds?: Phaser.Sound.BaseSound[];
    };
    return manager.sounds ?? [];
  }

  private setSoundMute(
    sound: Phaser.Sound.BaseSound | undefined,
    mute: boolean
  ) {
    if (!sound) {
      return;
    }

    const soundWithMute = sound as Phaser.Sound.BaseSound & {
      setMute?: (value: boolean) => void;
      mute?: boolean;
    };

    if (typeof soundWithMute.setMute === 'function') {
      soundWithMute.setMute(mute);
    } else if (typeof soundWithMute.mute === 'boolean') {
      soundWithMute.mute = mute;
    }
  }

  private setCollisionDebug(enabled: boolean) {
    this.isCollisionDebugEnabled = enabled;

    if (enabled) {
      if (!this.collisionDebugGraphic) {
        this.collisionDebugGraphic = this.add.graphics();
        this.collisionDebugGraphic.setDepth(10000);
        this.collisionDebugGraphic.setScrollFactor(0);
      }

      this.events.on(
        Phaser.Scenes.Events.POST_UPDATE,
        this.drawCollisionDebug,
        this
      );
      this.drawCollisionDebug();
    } else {
      this.events.off(
        Phaser.Scenes.Events.POST_UPDATE,
        this.drawCollisionDebug,
        this
      );

      if (this.collisionDebugGraphic) {
        this.collisionDebugGraphic.clear();
        this.collisionDebugGraphic.destroy();
        this.collisionDebugGraphic = undefined;
      }
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

  setupOrientationCheck() {
    this.updateVisibility = () => {
      const { width, height } = this.scale;

      // Always keep the game visible; previously we hid and paused on portrait,
      // which broke play inside portrait-only webviews (e.g. xPortal).
      this.game.canvas.style.display = 'block';
      this.scale.resize(width, height);
      this.cameras.main.setSize(width, height);
    };

    // Initial check
    this.updateVisibility();

    // Listen for orientation changes
    window.addEventListener('orientationchange', this.updateVisibility);
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
    this.startBackgroundMusic(this.getActiveCharacterConfig().music.key);
  }

  update(time: number, delta: number): void {
    if (!this.isGameRunning || !this.gameId) {
      if (this.isCollisionDebugEnabled) {
        this.drawCollisionDebug();
      }
      return;
    }

    // Update environment
    this.environmentManager.update(this.gameSpeed, delta);

    // Update obstacles
    this.obstacleManager.update(delta, this.gameSpeed);

    // Update character animation
    this.dinoCharacter.updateAnimation();

    // Update debug visualization last (only if enabled)
    if (this.isCollisionDebugEnabled) {
      this.drawCollisionDebug();
    }
  }

  shutdown() {
    this.SocketHandler?.destroy();
    if (this.updateVisibility) {
      window.removeEventListener('resize', this.updateVisibility);
      window.removeEventListener('orientationchange', this.updateVisibility);
    }
    this.game.events.off('audio:mute-changed', this.handleMuteChange, this);
    if (this.debugMenuToggleHandler && this.input.keyboard) {
      this.input.keyboard.off('keydown-Z', this.debugMenuToggleHandler);
      this.debugMenuToggleHandler = undefined;
    }
    if (this.isCollisionDebugEnabled) {
      this.setCollisionDebug(false);
    }
    this.destroyDebugMenu();
    this.events.off('characterChanged');
  }

  public getActiveCharacterConfig() {
    return this.activeCharacterConfig;
  }

  public getActiveEnvironmentId(): EnvironmentId {
    return (
      this.selectedEnvironmentId ??
      (this.activeCharacterConfig.defaultEnvironmentId as EnvironmentId)
    );
  }

  public setEnvironmentSelection(environmentId: EnvironmentId, pin = true) {
    this.selectedEnvironmentId = environmentId;
    this.isEnvironmentPinned = pin;
    if (this.environmentManager) {
      this.environmentManager.onSelectCharacter();
      this.notifyEnvironmentChanged();
    }
  }

  private notifyEnvironmentChanged() {
    const environmentId = this.getActiveEnvironmentId();
    this.events.emit('environment-changed', environmentId);
    this.characterModal?.setActiveEnvironment(environmentId);
  }
}

export default PlayScene;
