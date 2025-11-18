import { PropsWithChildren, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RouteNamesEnum } from 'localConstants';
import { useGetIsLoggedIn } from '../../hooks';
import { isTestModeEnabled } from 'utils/isTestModeEnabled';

interface AuthRedirectWrapperPropsType extends PropsWithChildren {
  requireAuth?: boolean;
}

export const AuthRedirectWrapper = ({
  children,
  requireAuth = true
}: AuthRedirectWrapperPropsType) => {
  const isLoggedIn = useGetIsLoggedIn();
  const navigate = useNavigate();
  const effectiveIsLoggedIn = isTestModeEnabled() ? true : isLoggedIn;

  useEffect(() => {
    if (effectiveIsLoggedIn && !requireAuth) {
      navigate(RouteNamesEnum.home);

      return;
    }

    if (!effectiveIsLoggedIn && requireAuth) {
      navigate(RouteNamesEnum.unlock);
    }
  }, [effectiveIsLoggedIn, requireAuth, navigate]);

  return <>{children}</>;
};
