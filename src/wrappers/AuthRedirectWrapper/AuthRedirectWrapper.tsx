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
  const isLoggedIn = useGetIsLoggedIn();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🔐 AuthRedirectWrapper: Checking authentication', {
      isLoggedIn,
      requireAuth,
      currentPath: window.location.pathname
    });

    if (isLoggedIn && !requireAuth) {
      // If user is logged in and on the unlock page, redirect to game
      // Allow logged-in users to stay on other non-auth pages like home
      const currentPath = window.location.pathname;
      if (currentPath === RouteNamesEnum.unlock) {
        console.log('➡️ AuthRedirectWrapper: Redirecting logged-in user from unlock to game');
        navigate(RouteNamesEnum.game);
      }
      return;
    }

    if (!isLoggedIn && requireAuth) {
      console.warn('⚠️ AuthRedirectWrapper: User not logged in, redirecting to unlock');
      navigate(RouteNamesEnum.unlock);
    } else if (isLoggedIn && requireAuth) {
      console.log('✅ AuthRedirectWrapper: User is logged in and authorized');
    }
  }, [isLoggedIn]);

  return <>{children}</>;
};
