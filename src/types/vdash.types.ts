// TEMP types to replace missing external `vdash-utils` during local dev
// Remove if project adds the official package/types.

export type VDashScore = {
  avatar: number; // 0=WHITE, 1=BOSS, 2=BLUE
  player_address: string;
  reward: number | string;
  score: number | string;
};

export type AvatarEnum = 0 | 1 | 2;

export interface VdashProfile {
  selected_character: AvatarEnum;
  has_white_pijama_nft: boolean;
  has_boss_nft: boolean;
  has_blue_victor_nft: boolean;
}

