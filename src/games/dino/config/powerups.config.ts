export type PowerupId = 'double-up-xp' | 'phantom-dash' | 'revive';

export type ShopAvailability = 'available' | 'comingSoon';

export interface ShopAssetRef {
  key: string;
  path: string;
}

export interface PowerupConfig {
  id: PowerupId;
  label: string;
  description: string;
  type: 'consumable';
  status: ShopAvailability;
  icon: ShopAssetRef;
  // Placeholder for future pricing logic
  price?: { amount: number; currency: 'coin' | 'token' };
  maxStack?: number;
}

export interface InventoryEntry {
  itemId: PowerupId;
  quantity: number;
  type: 'powerup';
  // Future: track expiry, cooldowns, or metadata from backend
}

const toIconKey = (id: PowerupId) => `powerup.${id}.icon`;

export const POWERUPS: PowerupConfig[] = [
  {
    id: 'double-up-xp',
    label: 'Double XP',
    description: 'Temporarily doubles XP gains for a run.',
    type: 'consumable',
    status: 'comingSoon',
    icon: {
      key: toIconKey('double-up-xp'),
      path: '/assets/powerups/double_up_xp.png'
    },
    price: { amount: 150, currency: 'coin' },
    maxStack: 10
  },
  {
    id: 'phantom-dash',
    label: 'Phantom Dash',
    description: 'Phase through the next obstacle you touch.',
    type: 'consumable',
    status: 'comingSoon',
    icon: {
      key: toIconKey('phantom-dash'),
      path: '/assets/powerups/phantom_dash.png'
    },
    price: { amount: 175, currency: 'coin' },
    maxStack: 10
  },
  {
    id: 'revive',
    label: 'Revive',
    description: 'Revive once after a hit and keep your run going.',
    type: 'consumable',
    status: 'comingSoon',
    icon: {
      key: toIconKey('revive'),
      path: '/assets/powerups/revive.png'
    },
    price: { amount: 250, currency: 'coin' },
    maxStack: 5
  }
];

export const POWERUP_BY_ID = new Map(POWERUPS.map((powerup) => [powerup.id, powerup]));
