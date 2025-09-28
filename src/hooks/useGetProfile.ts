import { useEffect, useState } from 'react';
import { useGetLoginInfo } from './sdkDappHooks';
import { useSocket } from 'pages/Providers/socket';

export const useGetProfile = () => {
  const [profile, setProfile] = useState<any>();
  const [isLoading, setIsLoading] = useState<boolean>();
  const { tokenLogin, isLoggedIn } = useGetLoginInfo();

  const { getProfile } = useSocket();

  useEffect(() => {
    if (tokenLogin && tokenLogin.nativeAuthToken) {
      setIsLoading(true);
      getProfile(tokenLogin.nativeAuthToken).then((profileRes) => {
        setProfile(profileRes);
        setIsLoading(false);
      });
    }
  }, [isLoggedIn, tokenLogin]);

  return { profile, isLoading };
};
