import { PropsWithChildren } from 'react';
import { useLocation } from 'react-router-dom';

import { RouteNamesEnum } from 'localConstants';
import { useGetAccountInfo, useGetIsLoggedIn } from 'hooks';
import { isTestModeEnabled } from 'utils/isTestModeEnabled';

const ALLOWED_ADDRESS = 'erd13n03l3nndty29uqrrzdvz9kx7065dc42qqc4z9ft6fjan6932x7svate2d';

export const AccessGuard = ({ children }: PropsWithChildren) => {
  const { address } = useGetAccountInfo();
  const isLoggedIn = useGetIsLoggedIn();
  const { pathname } = useLocation();

  if (isTestModeEnabled()) {
    return <>{children}</>;
  }

  const isUnlockRoute = pathname === RouteNamesEnum.unlock;
  if (!isLoggedIn || isUnlockRoute) {
    return <>{children}</>;
  }

  const normalized = (address ?? '').trim().toLowerCase();
  const isAllowed = normalized === ALLOWED_ADDRESS;

  if (isAllowed) {
    return <>{children}</>;
  }

  return (
    <div className='flex flex-col items-center justify-center w-full h-full py-16 px-4 text-center text-white gap-3'>
      <div className='text-2xl font-bold tracking-wide'>USER WITHOUT ACESS</div>
      <div className='text-sm text-red-200/80 max-w-xl'>
        The connected wallet is not permitted to access this application.
      </div>
    </div>
  );
};
