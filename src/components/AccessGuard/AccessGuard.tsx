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

  const normalizeFlag = (value: unknown) =>
    typeof value === 'string' && ['true', '1', 'yes', 'on'].includes(value.trim().toLowerCase());
  const allowTestBypass = isTestModeEnabled() && normalizeFlag(import.meta.env.VITE_EDITOR_BYPASS);

  const renderDenied = (message: string) => (
    <div className='flex flex-col items-center justify-center w-full h-full py-16 px-4 text-center text-white gap-3'>
      <div className='text-2xl font-bold tracking-wide'>USER WITHOUT ACCESS</div>
      <div className='text-sm text-red-200/80 max-w-xl'>{message}</div>
    </div>
  );

  // Guard only applies to the editor route; everything else should pass through.
  if (!pathname.startsWith(RouteNamesEnum.editor)) {
    return <>{children}</>;
  }

  // Only bypass in test mode when explicitly allowed for the editor.
  if (allowTestBypass) {
    return <>{children}</>;
  }

  if (!isLoggedIn) {
    return renderDenied('Connect with the approved wallet address to open the editor.');
  }

  const normalized = (address ?? '').trim().toLowerCase();
  const isAllowed = normalized === ALLOWED_ADDRESS;

  if (isAllowed) {
    return <>{children}</>;
  }

  return renderDenied('The connected wallet is not permitted to access this application.');
};
