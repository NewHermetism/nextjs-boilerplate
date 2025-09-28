import { Button } from 'components/Button';
import { MxLink } from 'components/MxLink';

import { logout } from 'helpers';
import { useGetIsLoggedIn } from 'hooks';
import { RouteNamesEnum } from 'localConstants';
import { Link, useMatch } from 'react-router-dom';
import { IoLogOutOutline } from 'react-icons/io5';
import { CiLogout } from 'react-icons/ci';

import '@fontsource/sigmar';
import { useIsMobile } from 'utils/useIsMobile';

const callbackUrl = `${window.location.origin}/`;
const onRedirect = undefined; // use this to redirect with useNavigate to a specific page after logout
const shouldAttemptReLogin = false; // use for special cases where you want to re-login after logout
const options = {
  /*
   * @param {boolean} [shouldBroadcastLogoutAcrossTabs=true]
   * @description If your dApp supports multiple accounts on multiple tabs,
   * this param will broadcast the logout event across all tabs.
   */
  shouldBroadcastLogoutAcrossTabs: true,
  /*
   * @param {boolean} [hasConsentPopup=false]
   * @description Set it to true if you want to perform async calls before logging out on Safari.
   * It will open a consent popup for the user to confirm the action before leaving the page.
   */
  hasConsentPopup: false
};

export const Header = () => {
  const isLoggedIn = useGetIsLoggedIn();
  const { isMobile } = useIsMobile();

  const isUnlockRoute = Boolean(useMatch(RouteNamesEnum.unlock));

  const ConnectButton = isUnlockRoute ? null : (
    <MxLink
      className={`${isMobile ? '!w-auto !px-4' : 'w-0'} font-bungee`}
      to={RouteNamesEnum.unlock}
    >
      {isMobile ? <IoLogOutOutline size={25} /> : 'Connect'}
    </MxLink>
  );

  const handleLogout = () => {
    sessionStorage.clear();
    logout(
      callbackUrl,
      /*
       * following are optional params. Feel free to remove them in your implementation
       */
      onRedirect,
      shouldAttemptReLogin,
      options
    );
  };

  return (
    <header className='flex flex-row items-center align-center justify-between pl-3 pr-3 lg:pl-6 lg:pr-6 pt-1 lg:mx-9'>
      <Link
        className='flex items-center justify-between'
        to={RouteNamesEnum.home}
      >
        <img
          src='/images/logo.png'
          alt='Logo'
          width={isMobile ? 40 : 100}
          height={isMobile ? 40 : 100}
        />
      </Link>

      <div
        className={`text-base lg:text-6xl font-bold tracking-wider font-sigmar text-white`}
      >
        SUPERVICTOR UNIVERSE
      </div>

      <nav className='h-full text-sm sm:relative sm:left-auto sm:top-auto sm:flex sm:w-auto sm:flex-row sm:justify-end sm:bg-transparent'>
        <div className='flex justify-end container mx-auto items-center gap-2'>
          {/* {!isMobile && (
            <div className='flex gap-1 items-center'>
              <div className='w-2 h-2 rounded-full bg-green-500' />
              <p className='text-gray-600'>{environment}</p>
            </div>
          )} */}

          {isLoggedIn ? (
            <Button
              onClick={handleLogout}
              className={`${isMobile ? '!w-auto !px-4' : 'w-0'} stars-btn`}
            >
              {isMobile ? (
                <CiLogout color='#fff' size={25} />
              ) : (
                <strong>Close</strong>
              )}
              <div id='container-stars'>
                <div id='stars'></div>
              </div>

              <div id='glow'>
                <div className='circle'></div>
                <div className='circle'></div>
              </div>
            </Button>
          ) : (
            ConnectButton
          )}
        </div>
      </nav>
    </header>
  );
};
