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
  private backgroundMusic!: Phaser.Sound.BaseSound;

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
    if (this.environmentManager && this.characterModal) {
      this.environmentManager.onSelectCharacter();
      this.characterModal.updateCharacterOpacity();
      return true;
    }
    return false;

    // Update music when character is selected
    if (this.isGameRunning) {
      const musicKey =
        index === 0
          ? 'pijamas_music'
          : index === 1
          ? 'boss_music'
          : 'blue_music';

      if (this.backgroundMusic) {
        this.backgroundMusic.stop();
      }
      this.backgroundMusic = this.sound.add(musicKey, {
        volume: 0.15,
        loop: true
      });
      this.backgroundMusic.play();
    }
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

    // Initialize background music
    this.backgroundMusic = this.sound.add('menu_music', {
      volume: 0.15,
      loop: true
    });
    this.backgroundMusic.play();

    // Setup device orientation check
    this.setupOrientationCheck();

    // Load sounds
    this.hitSound = this.sound.add('hit', SOUND_CONFIG.HIT);

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
        if (!this.menu.visible) this.dinoCharacter.jump();
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
    this.backgroundMusic.stop();
  }

  private handleBackButton() {
    this.uiManager.showMenu();
    this.scoreManager.stopScoring();
    this.physics.pause();
    this.isGameRunning = false;
    this.anims.pauseAll();
    this.gameSpeed = GAME_SETTINGS.INITIAL_GAME_SPEED;
    this.backgroundMusic.stop();
    this.backgroundMusic = this.sound.add('menu_music', {
      volume: 0.15,
      loop: true
    });
    this.backgroundMusic.play();
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

    this.backgroundMusic.stop();
    this.backgroundMusic = this.sound.add(musicKey, {
      volume: 0.15,
      loop: true
    });
    this.backgroundMusic.play();
  }

  update(time: number, delta: number): void {
    if (!this.isGameRunning || !this.gameId) {
      return;
    }

    // Update environment
    this.environmentManager.update(this.gameSpeed);

    // Update obstacles
    this.obstacleManager.update(delta, this.gameSpeed);

    // Update character animation
    this.dinoCharacter.updateAnimation();
  }

  shutdown() {
    if (this.updateVisibility) {
      window.removeEventListener('resize', this.updateVisibility);
    }
    this.events.off('characterChanged');
  }
}

export default PlayScene;
