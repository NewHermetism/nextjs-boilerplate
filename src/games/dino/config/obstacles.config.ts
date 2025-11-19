export type ObstacleTextureKey =
  | 'energy'
  | 'bone'
  | 'seringe'
  | 'lava'
  | 'toxic-waste'
  | 'obsticle-small'
  | 'obsticle-big';

export interface ObstacleAssetConfig {
  key: ObstacleTextureKey;
  type: 'image' | 'spritesheet';
  path: string;
  frameWidth?: number;
  frameHeight?: number;
}

export const OBSTACLE_ASSETS: Record<ObstacleTextureKey, ObstacleAssetConfig> = {
  energy: {
    key: 'energy',
    type: 'spritesheet',
    path: '/assets/environments/white-city/obstacles/energy.png',
    frameWidth: 44,
    frameHeight: 26
  },
  bone: {
    key: 'bone',
    type: 'spritesheet',
    path: '/assets/environments/white-city/obstacles/bone.png',
    frameWidth: 36,
    frameHeight: 35
  },
  seringe: {
    key: 'seringe',
    type: 'spritesheet',
    path: '/assets/environments/boss-city/obstacles/seringe.png',
    frameWidth: 49,
    frameHeight: 34
  },
  lava: {
    key: 'lava',
    type: 'spritesheet',
    path: '/assets/environments/white-city/obstacles/lava.png',
    frameWidth: 68,
    frameHeight: 38
  },
  'toxic-waste': {
    key: 'toxic-waste',
    type: 'spritesheet',
    path: '/assets/environments/white-city/obstacles/toxic_waste.png',
    frameWidth: 65,
    frameHeight: 56
  },
  'obsticle-small': {
    key: 'obsticle-small',
    type: 'image',
    path: '/assets/environments/boss-city/obstacles/spikes_small.png'
  },
  'obsticle-big': {
    key: 'obsticle-big',
    type: 'image',
    path: '/assets/environments/boss-city/obstacles/spikes_big.png'
  }
};
