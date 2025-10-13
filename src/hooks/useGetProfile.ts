import { useEffect, useState } from 'react';
import { useGetLoginInfo } from './sdkDappHooks';
import { useSocket } from 'pages/Providers/socket';

export const useGetProfile = () => {
  const [profile, setProfile] = useState<any>();
  const [isLoading, setIsLoading] = useState<boolean>();
  const { tokenLogin, isLoggedIn } = useGetLoginInfo();

  const { getProfile } = useSocket();

  useEffect(() => {
    const accessToken = tokenLogin?.nativeAuthToken;

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
        setProfile(profileRes);
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
  }, [getProfile, isLoggedIn, tokenLogin?.nativeAuthToken]);

  return { profile, isLoading };
};
