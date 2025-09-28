import { PropsWithChildren, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RouteNamesEnum } from 'localConstants';
import { useGetIsLoggedIn } from '../../hooks';

interface AuthRedirectWrapperPropsType extends PropsWithChildren {
  requireAuth?: boolean;
}

export const AuthRedirectWrapper = ({
  children,
  requireAuth = true
}: AuthRedirectWrapperPropsType) => {
  // TEMP DEV FLAG: set VITE_DISABLE_AUTH=true to bypass auth redirects
  // Remove or set to false for production deployments
  const disableAuth = import.meta.env.VITE_DISABLE_AUTH === 'true';

  // In dev mode with auth disabled, skip redirects entirely
  if (disableAuth) {
    return <>{children}</>;
  }

  const isLoggedIn = useGetIsLoggedIn();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn && !requireAuth) {
      navigate(RouteNamesEnum.home);

      return;
    }

    if (!isLoggedIn && requireAuth) {
      navigate(RouteNamesEnum.unlock);
    }
  }, [isLoggedIn]);

  return <>{children}</>;
};
