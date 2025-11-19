import rawCharacters from './data/characters.json';
import {
  characterAnimationKey,
  characterAudioKey,
  CharacterAnimationState,
  characterTextureKey
} from './assetKeys';

export interface SpriteSheetAssetConfig {
  key: string;
  path: string;
  frameWidth: number;
  frameHeight: number;
}

export interface AnimationConfig {
  key: string;
  startFrame: number;
  endFrame: number;
  frameRate: number;
  repeat: number;
}

export interface CharacterAnimationAssetConfig {
  sheet: SpriteSheetAssetConfig;
  animation: AnimationConfig;
}

export interface CharacterPoseConfig {
  width: number;
  height: number;
  offsetX: number;
  offsetYFromGround: number;
}

export interface CharacterImageAsset {
  key: string;
  path: string;
  scale: number;
}

export interface CharacterAudioAsset {
  key: string;
  path: string;
}

export interface CharacterConfig {
  id: string;
  avatarIndex: number;
  label: string;
  order: number;
  defaultEnvironmentId: string;
  profileFlag: string;
  marketplaceUrl: string;
  thumbnail: CharacterImageAsset;
  music: CharacterAudioAsset;
  animations: Record<CharacterAnimationState, CharacterAnimationAssetConfig>;
  body: Record<CharacterAnimationState, CharacterPoseConfig>;
  airFrame: number;
  obstacles: string[];
  obstacleWeights: number[];
}

const characterAnimationStates: CharacterAnimationState[] = ['idle', 'running'];

type RawPoseConfig = Partial<CharacterPoseConfig> & { offsetY?: number };

const normalizePose = (pose?: RawPoseConfig): CharacterPoseConfig => ({
  width: pose?.width ?? 0,
  height: pose?.height ?? 0,
  offsetX: pose?.offsetX ?? 0,
  offsetYFromGround: pose?.offsetYFromGround ?? pose?.offsetY ?? 0
});

type RawCharacter = {
  id: string;
  avatarIndex: number;
  label: string;
  order: number;
  defaultEnvironmentId: string;
  profileFlag: string;
  marketplaceUrl: string;
  music: { path: string };
  thumbnail: { path: string; scale?: number };
  spritesheets: Record<
    CharacterAnimationState,
    { path: string; frameWidth: number; frameHeight: number }
  >;
  animations: Record<
    CharacterAnimationState,
    { frameRate?: number; repeat?: number; startFrame?: number; endFrame: number }
  >;
  body: Record<'idle' | 'running', { width: number; height: number; offsetX: number; offsetY: number }>;
  airFrame: number;
  obstacles: string[];
  obstacleWeights: number[];
};

const normalizeCharacter = (raw: RawCharacter): CharacterConfig => {
  const thumbnail: CharacterImageAsset = {
    key: characterTextureKey(raw.id, 'thumbnail'),
    path: raw.thumbnail.path,
    scale: raw.thumbnail.scale ?? 1
  };

  const music: CharacterAudioAsset = {
    key: characterAudioKey(raw.id, 'music'),
    path: raw.music.path
  };

  const animations = characterAnimationStates.reduce<Record<CharacterAnimationState, CharacterAnimationAssetConfig>>(
    (acc, state) => {
      const sheetDef = raw.spritesheets[state];
      const animationDef = raw.animations[state];
      acc[state] = {
        sheet: {
          key: characterTextureKey(raw.id, state),
          path: sheetDef.path,
          frameWidth: sheetDef.frameWidth,
          frameHeight: sheetDef.frameHeight
        },
        animation: {
          key: characterAnimationKey(raw.id, state),
          startFrame: animationDef.startFrame ?? 0,
          endFrame: animationDef.endFrame,
          frameRate: animationDef.frameRate ?? 10,
          repeat: animationDef.repeat ?? -1
        }
      };
      return acc;
    },
    {} as Record<CharacterAnimationState, CharacterAnimationAssetConfig>
  );

  const body = characterAnimationStates.reduce<Record<CharacterAnimationState, CharacterPoseConfig>>(
    (acc, state) => {
      acc[state] = normalizePose(raw.body[state]);
      return acc;
    },
    {} as Record<CharacterAnimationState, CharacterPoseConfig>
  );

  return {
    id: raw.id,
    avatarIndex: raw.avatarIndex,
    label: raw.label,
    order: raw.order,
    defaultEnvironmentId: raw.defaultEnvironmentId,
    profileFlag: raw.profileFlag,
    marketplaceUrl: raw.marketplaceUrl,
    thumbnail,
    music,
    animations,
    body,
    airFrame: raw.airFrame,
    obstacles: [...raw.obstacles],
    obstacleWeights: [...raw.obstacleWeights]
  };
};

const rawCharacterList = rawCharacters as RawCharacter[];

const normalizedCharacters = rawCharacterList
  .map(normalizeCharacter)
  .sort((a, b) => a.order - b.order);

export const CHARACTERS: CharacterConfig[] = normalizedCharacters;
export type CharacterId = (typeof normalizedCharacters)[number]['id'];

export const CHARACTER_BY_ID = new Map<CharacterId, CharacterConfig>(
  normalizedCharacters.map((character) => [character.id as CharacterId, character])
);

export const CHARACTER_BY_AVATAR_INDEX = new Map<number, CharacterConfig>(
  normalizedCharacters.map((character) => [character.avatarIndex, character])
);

export const getCharacterById = (id: CharacterId) => CHARACTER_BY_ID.get(id);
export const getCharacterByAvatarIndex = (index: number) =>
  CHARACTER_BY_AVATAR_INDEX.get(index);

export const getDefaultCharacter = () => CHARACTERS[0];

export const getCharacterByAvatarIndexOrDefault = (index: number) =>
  getCharacterByAvatarIndex(index) ?? getDefaultCharacter();
