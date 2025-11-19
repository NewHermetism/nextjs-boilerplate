const sanitizeId = (value: string) => value.trim().toLowerCase();

export type CharacterAssetVariant =
  | 'thumbnail'
  | 'idle'
  | 'running';

export type CharacterAnimationState = 'idle' | 'running';
export type EnvironmentLayer = 'ground' | 'sky' | 'cloud' | 'city' | 'city1' | 'city2';

export const characterTextureKey = (
  characterId: string,
  variant: CharacterAssetVariant
) => `character.${sanitizeId(characterId)}.${variant}`;

export const characterAnimationKey = (
  characterId: string,
  animation: CharacterAnimationState
) => `character.${sanitizeId(characterId)}.anim.${animation}`;

export const characterAudioKey = (
  characterId: string,
  name: 'music'
) => `character.${sanitizeId(characterId)}.${name}`;

export const environmentTextureKey = (
  environmentId: string,
  layer: EnvironmentLayer
) => `environment.${sanitizeId(environmentId)}.${layer}`;
