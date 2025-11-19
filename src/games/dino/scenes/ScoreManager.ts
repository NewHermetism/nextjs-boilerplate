// ScoreManager.ts
import Phaser from 'phaser';
import { round } from 'lodash';
import { GAME_SETTINGS, SOUND_CONFIG } from './Constants';
import PlayScene from './PlayScene';

export default class ScoreManager {
  private scene: PlayScene;
  private scoreText: Phaser.GameObjects.Text;
  private highScoreText: Phaser.GameObjects.Text;
  private score: number = 0;
  private reachSound: Phaser.Sound.BaseSound;
  private scoreTimer: Phaser.Time.TimerEvent | null = null;

  constructor(scene: PlayScene) {
    this.scene = scene;
    this.scene.SocketHandler;
    const { width } = this.scene.scale;

    // Create score text
    this.scoreText = this.scene.add
      .text(width, 0, '00000', {
        color: '#fff',
        font: '900 35px Courier',
        resolution: 5
      })
      .setOrigin(1, 0)
      .setAlpha(0);

    // Create high score text
    this.highScoreText = this.scene.add
      .text(0, 0, '00000', {
        color: '#fff',
        font: '900 35px Courier',
        resolution: 5
      })
      .setOrigin(1, 0)
      .setAlpha(0);

    // Load sound
    this.reachSound = this.scene.sound.add('reach', SOUND_CONFIG.REACH);
  }

  get currentScore() {
    return this.score;
  }

  get scoreDisplay() {
    return this.scoreText;
  }

  get highScoreDisplay() {
    return this.highScoreText;
  }

  getScoreIncrementalValue(): number {
    const { avatarIndex } = this.scene.getActiveCharacterConfig();
    switch (avatarIndex) {
      case 0:
        return 1.1;
      case 1:
        return 1.2;
      case 2:
        return 1;
    }
    return 1;
  }

  startScoring(onScoreUpdate: (gameSpeed: number) => void) {
    this.score = 0;
    this.scoreText.setAlpha(1);
    this.updateScoreDisplay();

    // Start score timer
    this.scoreTimer = this.scene.time.addEvent({
      delay: GAME_SETTINGS.SCORE_UPDATE_DELAY,
      loop: true,
      callbackScope: this,
      callback: () => {
        if (!this.scene.gameId) return;

        const scoreIncrementalValue = this.getScoreIncrementalValue();
        this.score = round(this.score + scoreIncrementalValue, 1);

        const gameSpeed =
          GAME_SETTINGS.INITIAL_GAME_SPEED +
          (this.score / scoreIncrementalValue) *
            GAME_SETTINGS.GAME_SPEED_INCREMENT;

        // Call callback with updated game speed
        onScoreUpdate(gameSpeed);

        // Check for milestone
        if (this.score % 100 === 0) {
          this.reachSound.play();

          // Flash score
          this.scene.tweens.add({
            targets: this.scoreText,
            duration: 100,
            repeat: 3,
            alpha: 0,
            yoyo: true
          });
        }

        this.updateScoreDisplay();
      }
    });
  }

  updateScoreDisplay() {
    const scoreAux = round(this.score);
    // Format score with leading zeros
    const score = Array.from(String(scoreAux), Number);
    for (let i = 0; i < 5 - String(scoreAux).length; i++) {
      score.unshift(0);
    }

    this.scoreText.setText(score.join(''));
  }

  updateHighScore() {
    // Position high score text
    this.highScoreText.x = this.scoreText.x - this.scoreText.width - 20;

    // Get current high score
    const highScore = this.highScoreText.text.substr(
      this.highScoreText.text.length - 5
    );

    // Update if new high score
    const newScore =
      Number(this.scoreText.text) > Number(highScore)
        ? this.scoreText.text
        : highScore;

    this.highScoreText.setText('HI ' + newScore);
    this.highScoreText.setAlpha(1);
  }

  stopScoring() {
    if (this.scoreTimer) {
      this.scoreTimer.remove();
      this.scoreTimer = null;
    }

    this.scene.SocketHandler.endGameEvent(this.scoreText.text);

    this.updateHighScore();
  }

  reset() {
    this.score = 0;
    this.updateScoreDisplay();
    this.scoreText.setAlpha(1);
  }
}
