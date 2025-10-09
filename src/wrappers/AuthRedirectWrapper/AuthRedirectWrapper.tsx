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
    if (isLoggedIn && !requireAuth) {
      // If user is logged in and on the unlock page, redirect to game
      // Allow logged-in users to stay on other non-auth pages like home
      const currentPath = window.location.pathname;
      if (currentPath === RouteNamesEnum.unlock) {
        navigate(RouteNamesEnum.game);
      }
      return;
    }

    if (!isLoggedIn && requireAuth) {
      navigate(RouteNamesEnum.unlock);
    }
  }, [isLoggedIn]);

  return <>{children}</>;
};
