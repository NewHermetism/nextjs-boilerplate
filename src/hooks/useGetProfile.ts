import { useEffect, useMemo, useState } from 'react';
import { useGetLoginInfo } from './sdkDappHooks';
import { useSocket } from 'pages/Providers/socket';

export interface WalletProfile {
  selected_character: number | null;
  has_white_pijama_nft: boolean;
  has_boss_nft: boolean;
  has_blue_victor_nft: boolean;
  [key: string]: unknown;
}

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

export const normalizeWalletProfile = (
  rawProfile: unknown
): WalletProfile | undefined => {
  if (rawProfile == null || typeof rawProfile !== 'object') {
    return undefined;
  }

  const profile = rawProfile as Record<string, unknown>;

  const selectedCharacter =
    typeof profile.selected_character === 'number'
      ? profile.selected_character
      : typeof profile.selected_character === 'string'
      ? Number.parseInt(profile.selected_character, 10)
      : null;

  return {
    ...profile,
    selected_character: Number.isNaN(selectedCharacter)
      ? null
      : selectedCharacter,
    has_white_pijama_nft: normalizeBoolean(profile.has_white_pijama_nft),
    has_boss_nft: normalizeBoolean(profile.has_boss_nft),
    has_blue_victor_nft: normalizeBoolean(profile.has_blue_victor_nft)
  } satisfies WalletProfile;
};

export const useGetProfile = () => {
  const [profile, setProfile] = useState<WalletProfile | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>();
  const { tokenLogin, isLoggedIn } = useGetLoginInfo();

  const { getProfile } = useSocket();

  const accessToken = useMemo(
    () => tokenLogin?.nativeAuthToken ?? null,
    [tokenLogin?.nativeAuthToken]
  );

  useEffect(() => {
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
  }, [accessToken, getProfile, isLoggedIn]);

  return { profile, isLoading };
};
