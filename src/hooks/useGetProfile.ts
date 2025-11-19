import { useEffect, useMemo, useState } from 'react';
import { useGetLoginInfo } from './sdkDappHooks';
import { useSocket } from 'pages/Providers/socket';

import { isTestModeEnabled } from 'utils/isTestModeEnabled'; //TEST MODE BOOLEAN.
import {
  CHARACTERS,
  type CharacterId,
  getCharacterByAvatarIndex,
  getCharacterById,
  getDefaultCharacter
} from 'games/dino/config/characters.config';
import {
  ENVIRONMENTS,
  type EnvironmentId,
  getEnvironmentById
} from 'games/dino/config/environments.config';

export interface WalletProfile {
  selectedCharacterId: CharacterId;
  selectedEnvironmentId: EnvironmentId;
  unlockedCharacters: CharacterId[];
  unlockedEnvironments: EnvironmentId[];
  raw?: Record<string, unknown>;
}

const ALL_CHARACTER_IDS = CHARACTERS.map((character) => character.id as CharacterId);
const ALL_ENVIRONMENT_IDS = ENVIRONMENTS.map(
  (environment) => environment.id as EnvironmentId
);

export const testWalletProfile: WalletProfile = {
  selectedCharacterId: ALL_CHARACTER_IDS[0],
  selectedEnvironmentId: ALL_ENVIRONMENT_IDS[0],
  unlockedCharacters: ALL_CHARACTER_IDS,
  unlockedEnvironments: ALL_ENVIRONMENT_IDS
};

const normalizeBoolean = (value: unknown) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
      return true;
    }
    if (normalized === 'false') {
      return false;
    }
    const parsed = Number(normalized);
    return !Number.isNaN(parsed) && parsed !== 0;
  }

  return false;
};

const normalizeIdList = <T extends string>(
  value: unknown,
  validValues: readonly T[]
): T[] | undefined => {
  if (Array.isArray(value)) {
    return value
      .filter((entry): entry is string => typeof entry === 'string')
      .map((entry) => entry.trim())
      .filter((entry): entry is T => validValues.includes(entry as T));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, unlocked]) => normalizeBoolean(unlocked))
      .map(([id]) => id.trim())
      .filter((id): id is T => validValues.includes(id as T));
  }

  if (value == null) {
    return undefined;
  }

  return [];
};

const deriveEnvironmentUnlocksFromCharacters = (
  characterIds: CharacterId[]
): EnvironmentId[] => {
  const derived = new Set<EnvironmentId>();
  characterIds.forEach((characterId) => {
    const character = getCharacterById(characterId);
    if (!character) {
      return;
    }
    const environmentId = character.defaultEnvironmentId as EnvironmentId | undefined;
    if (!environmentId) {
      return;
    }
    const environment = getEnvironmentById(environmentId);
    if (environment) {
      derived.add(environment.id as EnvironmentId);
    }
  });

  return Array.from(derived);
};

const mergeEnvironmentUnlocks = (
  provided: EnvironmentId[] | undefined,
  derived: EnvironmentId[]
): EnvironmentId[] => {
  const merged = new Set<EnvironmentId>();
  provided?.forEach((id) => merged.add(id));
  derived.forEach((id) => merged.add(id));

  if (!merged.size) {
    return [];
  }

  const ordered: EnvironmentId[] = [];
  ALL_ENVIRONMENT_IDS.forEach((id) => {
    if (merged.has(id)) {
      ordered.push(id);
      merged.delete(id);
    }
  });

  merged.forEach((id) => ordered.push(id));
  return ordered;
};

const resolveSelectedCharacterId = (
  profile: Record<string, unknown>,
  unlockedCharacters: CharacterId[]
): CharacterId => {
  const requestedId = profile.selectedCharacterId ?? profile.selected_character_id;
  if (typeof requestedId === 'string') {
    const normalized = requestedId.trim();
    const candidate = getCharacterById(normalized as CharacterId);
    if (candidate) {
      return candidate.id as CharacterId;
    }
  }

  const legacySelected = profile.selected_character;
  if (typeof legacySelected === 'number') {
    const byIndex = getCharacterByAvatarIndex(legacySelected);
    if (byIndex) {
      return byIndex.id as CharacterId;
    }
  }

  return unlockedCharacters[0] ?? (getDefaultCharacter().id as CharacterId);
};

const resolveSelectedEnvironmentId = (
  profile: Record<string, unknown>,
  unlockedEnvironments: EnvironmentId[]
): EnvironmentId => {
  const requestedEnvironment =
    profile.selectedEnvironmentId ?? profile.selected_environment_id;
  if (typeof requestedEnvironment === 'string') {
    const normalized = requestedEnvironment.trim();
    const candidate = getEnvironmentById(normalized as EnvironmentId);
    if (candidate) {
      return candidate.id as EnvironmentId;
    }
  }

  if (unlockedEnvironments.length) {
    return unlockedEnvironments[0];
  }

  const defaultEnvironment = getEnvironmentById(
    getDefaultCharacter().defaultEnvironmentId as EnvironmentId
  );
  return (
    defaultEnvironment?.id ?? ALL_ENVIRONMENT_IDS[0]
  ) as EnvironmentId;
};

export const normalizeWalletProfile = (
  rawProfile: unknown
): WalletProfile | undefined => {
  if (rawProfile == null || typeof rawProfile !== 'object') {
    return undefined;
  }

  const profile = rawProfile as Record<string, unknown>;

  const unlockedCharactersFromProfile = normalizeIdList<CharacterId>(
    profile.profile && typeof profile.profile === 'object'
      ? (profile.profile as Record<string, unknown>).characters ?? profile.characters
      : profile.characters,
    ALL_CHARACTER_IDS
  );

  const unlockedCharacters =
    unlockedCharactersFromProfile ??
    CHARACTERS.filter((character) =>
      normalizeBoolean(profile[character.profileFlag])
    ).map((character) => character.id as CharacterId);

  const unlockedEnvironmentsFromProfile = normalizeIdList<EnvironmentId>(
    profile.profile && typeof profile.profile === 'object'
      ? (profile.profile as Record<string, unknown>).environments ?? profile.environments
      : profile.environments,
    ALL_ENVIRONMENT_IDS
  );

  const selectedCharacterId = resolveSelectedCharacterId(
    profile,
    unlockedCharacters.length ? unlockedCharacters : ALL_CHARACTER_IDS
  );

  const normalizedUnlockedCharacters =
    unlockedCharacters.length ? unlockedCharacters : [selectedCharacterId];

  const derivedEnvironmentIds = deriveEnvironmentUnlocksFromCharacters(
    normalizedUnlockedCharacters
  );

  const unlockedEnvironments = mergeEnvironmentUnlocks(
    unlockedEnvironmentsFromProfile,
    derivedEnvironmentIds
  );

  const selectedEnvironmentId = resolveSelectedEnvironmentId(
    profile,
    unlockedEnvironments.length ? unlockedEnvironments : ALL_ENVIRONMENT_IDS
  );

  const normalizedUnlockedEnvironments =
    unlockedEnvironments.length ? unlockedEnvironments : [selectedEnvironmentId];

  return {
    selectedCharacterId,
    selectedEnvironmentId,
    unlockedCharacters: normalizedUnlockedCharacters,
    unlockedEnvironments: normalizedUnlockedEnvironments,
    raw: profile
  } satisfies WalletProfile;
};

export const useGetProfile = () => {
  const testModeEnabled = isTestModeEnabled();
  const [profile, setProfile] = useState<WalletProfile | undefined>(
    testModeEnabled ? testWalletProfile : undefined
  );
  const [isLoading, setIsLoading] = useState<boolean | undefined>(
    testModeEnabled ? false : undefined
  );
  const { tokenLogin, isLoggedIn } = useGetLoginInfo();

  const { getProfile } = useSocket();

  const accessToken = useMemo(
    () => tokenLogin?.nativeAuthToken ?? null,
    [tokenLogin?.nativeAuthToken]
  );

  useEffect(() => {
    if (testModeEnabled) {
      setProfile(testWalletProfile);
      setIsLoading(false);
      return;
    }

    if (!isLoggedIn || !accessToken) {
      setProfile(undefined);
      setIsLoading(false);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);

    getProfile(accessToken)
      .then((profileRes) => {
        if (isCancelled) {
          return;
        }
        setProfile(normalizeWalletProfile(profileRes));
      })
      .catch((error) => {
        if (isCancelled) {
          return;
        }
        console.error('[useGetProfile] Unable to load profile', error);
        setProfile(undefined);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [accessToken, getProfile, isLoggedIn, testModeEnabled]);

  return { profile, isLoading };
};
