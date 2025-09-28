// Constants.ts
interface CharacterBackground {
  ground: string;
  city1?: string;
  city2?: string;
  city?: string;
  sky: string;
  cloud?: string;
}

interface CharacterConfig {
  name: string;
  background: CharacterBackground;
  obstacles: string[];
  obstacleWeights: number[];
}

export const CHARACTER_CONFIG: { [key: number]: CharacterConfig } = {
  0: {
    // Pijamas (White)
    name: 'WHITE',
    background: {
      ground: 'white_ground',
      city1: 'white_city_1',
      city2: 'white_city_2',
      sky: 'white_sky'
      // No cloud for white
    },
    obstacles: [
      'enemy-lava',
      'enemy-fireball',
      'enemy-toxic-waste',
      'enemy-boss',
      'enemy-bone'
    ],
    obstacleWeights: [0.3, 0.2, 0.2, 0.2, 0.1]
  },
  1: {
    // Boss
    name: 'BOSS',
    background: {
      ground: 'boss_ground',
      city1: 'boss_city_1',
      city2: 'boss_city_2',
      sky: 'boss_sky',
      cloud: 'boss_cloud'
    },
    obstacles: [
      'enemy-seringe',
      'enemy-fireball',
      'obsticle-small',
      'obsticle-big',
      'enemy-white',
      'enemy-blue'
    ],
    obstacleWeights: [0.2, 0.2, 0.2, 0.2, 0.1, 0.1]
  },
  2: {
    // Blue
    name: 'BLUE',
    background: {
      ground: 'blue_ground',
      city: 'blue_city',
      sky: 'blue_sky',
      cloud: 'blue_cloud'
    },
    obstacles: [
      'enemy-lava',
      'enemy-fireball',
      'enemy-toxic-waste',
      'enemy-boss',
      'enemy-bone'
    ],
    obstacleWeights: [0.3, 0.2, 0.2, 0.2, 0.1]
  }
};

export const GAME_SETTINGS = {
  INITIAL_GAME_SPEED: 12,
  JUMP_SPEED: 1550,
  GRAVITY: 5000,
  RESPAWN_TIME: 0,
  ON_GROUND_POSITION: 30,
  SCORE_UPDATE_DELAY: 1000 / 10,
  GAME_SPEED_INCREMENT: 0.005,
  OBSTACLE_DISTANCE_MIN: 500,
  OBSTACLE_DISTANCE_MAX: 1000
};

export const SOUND_CONFIG = {
  JUMP: { volume: 0.2 },
  HIT: { volume: 0.2 },
  REACH: { volume: 0.2 }
};
