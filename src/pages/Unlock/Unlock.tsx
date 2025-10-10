import {
  type ExtensionLoginButtonPropsType,
  type WebWalletLoginButtonPropsType,
  type OperaWalletLoginButtonPropsType,
  type LedgerLoginButtonPropsType,
  type WalletConnectLoginButtonPropsType
} from '@multiversx/sdk-dapp/UI';
import {
  ExtensionLoginButton,
  LedgerLoginButton,
  WalletConnectLoginButton,
  WebWalletLoginButton as WebWalletUrlLoginButton,
  CrossWindowLoginButton
} from 'components/sdkDappComponents';
import { nativeAuth } from 'config';
import { FaChevronRight } from 'react-icons/fa';
import { RouteNamesEnum } from 'localConstants';
import { useNavigate } from 'react-router-dom';
import { AuthRedirectWrapper } from 'wrappers';
import { WebWalletLoginWrapper } from './components';
import { IframeLoginTypes } from '@multiversx/sdk-web-wallet-iframe-provider/out/constants';
import { useIframeLogin } from '@multiversx/sdk-dapp/hooks/login/useIframeLogin';
import { useIsMobile } from 'utils/useIsMobile';

type CommonPropsType =
  | OperaWalletLoginButtonPropsType
  | ExtensionLoginButtonPropsType
  | WebWalletLoginButtonPropsType
  | LedgerLoginButtonPropsType
  | WalletConnectLoginButtonPropsType;

// choose how you want to configure connecting to the web wallet
const USE_WEB_WALLET_CROSS_WINDOW = true;

const WebWalletLoginButton = USE_WEB_WALLET_CROSS_WINDOW
  ? CrossWindowLoginButton
  : WebWalletUrlLoginButton;

export const Unlock = () => {
  const navigate = useNavigate();
  const { isMobile } = useIsMobile();

  // Debug: Log current origin on page load
  console.log('🌐 [UNLOCK] Current page origin:', window.location.origin);
  console.log('🌐 [UNLOCK] Full URL:', window.location.href);

  const [onInitiateLogin, { isLoading }] = useIframeLogin({
    callbackRoute: RouteNamesEnum.game,
    nativeAuth,
    onLoginRedirect: () => {
      console.log('✅ [UNLOCK] Login redirect triggered');
      navigate(RouteNamesEnum.game);
    }
  });

  const commonProps: CommonPropsType = {
    callbackRoute: RouteNamesEnum.game,
    nativeAuth,
    onLoginRedirect: () => {
      console.log('✅ [UNLOCK] onLoginRedirect called');

      // Debug: Check token after successful login
      setTimeout(() => {
        try {
          const loginInfo = localStorage.getItem('persist:loginInfo');
          if (loginInfo) {
            const parsed = JSON.parse(loginInfo);
            const tokenLogin = JSON.parse(parsed.tokenLogin || '{}');
            const token = tokenLogin.nativeAuthToken;

            if (token) {
              const payload = JSON.parse(atob(token.split('.')[1]));
              console.log('🔑 [UNLOCK] Token origin:', payload.origin);
              console.log('🌐 [UNLOCK] Page origin:', window.location.origin);
              console.log('✅ [UNLOCK] Match:', payload.origin === window.location.origin ? 'YES' : 'NO ❌');

              if (payload.origin !== window.location.origin) {
                console.error('❌ [UNLOCK] ORIGIN MISMATCH DETECTED!');
                console.error('   Expected:', window.location.origin);
                console.error('   Got:', payload.origin);
              }
            }
          }
        } catch (e) {
          console.error('❌ [UNLOCK] Error checking token:', e);
        }
      }, 500);

      navigate(RouteNamesEnum.game);
    },
    disabled: isLoading
  };

  return (
    <AuthRedirectWrapper requireAuth={false}>
      <div className='flex flex-col items-center bg-gray-900 text-white p-6 w-fit rounded-xl'>
        <div className='flex flex-col items-center mb-8'>
          <img
            src='/images/connect_logo.png'
            alt='Logo'
            width={isMobile ? 100 : 180}
            className='object-contain'
          />
          <h1 className='text-xl lg:text-3xl font-bold mt-4'>
            Step into our universe!
          </h1>
          <p className='text-gray-400 text-center max-w-md mt-2 text-base lg:text-xl'>
            Discover, collect, and own extraordinary digital collectibles that
            make an impact.
          </p>
        </div>
        <div className='w-full max-w-md'>
          <div className='mb-1'>
            <WalletConnectLoginButton
              className='!flex items-center justify-between !p-4 !bg-gray-800 rounded-xl mb-1 cursor-pointer hover:!bg-gray-700 !m-0 !border-0 w-full'
              loginButtonText='Connect xPortal App'
              {...commonProps}
            >
              <div className='flex items-center'>
                <img
                  src='/images/con_1.png'
                  alt='Logo'
                  width={30}
                  className='object-contain mr-3'
                />
                <div>xPortal App</div>
              </div>
              <div className='flex items-center'>
                <div className='mr-3 text-gray-400'>Mobile</div>
                <FaChevronRight className='text-gray-400' />
              </div>
            </WalletConnectLoginButton>
          </div>

          <div className='mb-1'>
            <ExtensionLoginButton
              className='!flex items-center justify-between !p-4 !bg-gray-800 rounded-xl mb-1 cursor-pointer hover:!bg-gray-700 !m-0 !border-0 w-full'
              loginButtonText='Connect DeFi Wallet'
              {...commonProps}
            >
              <div className='flex items-center'>
                <img
                  src='/images/con_2.png'
                  alt='Logo'
                  width={30}
                  className='object-contain mr-3'
                />
                <div>DeFi Wallet</div>
              </div>
              <div className='flex items-center'>
                <div className='mr-3 text-gray-400'>Extension</div>
                <FaChevronRight className='text-gray-400' />
              </div>
            </ExtensionLoginButton>
          </div>

          <div className='mb-1'>
            <WebWalletLoginWrapper
              className='!flex items-center justify-between !p-4 !bg-gray-800 rounded-xl mb-1 cursor-pointer hover:!bg-gray-700 !m-0 !border-0 w-full'
              {...commonProps}
            >
              <div className='flex items-center'>
                <img
                  src='/images/con_3.png'
                  alt='Logo'
                  width={30}
                  className='object-contain mr-3'
                />
                <div>Web Wallet</div>
              </div>
              <div className='flex items-center'>
                <div className='mr-3 text-gray-400'>Browser</div>
                <FaChevronRight className='text-gray-400' />
              </div>
            </WebWalletLoginWrapper>
          </div>

          <div className='mb-1'>
            <div
              className='!flex items-center justify-between !p-4 !bg-gray-800 rounded-xl mb-1 cursor-pointer hover:!bg-gray-700 !m-0 !border-0 w-full'
              loginButtonText='Metamask Proxy'
              {...commonProps}
              onClick={() => onInitiateLogin(IframeLoginTypes.metamask)}
            >
              <div className='flex items-center'>
                <img
                  src='/images/con_4.png'
                  alt='Logo'
                  width={30}
                  className='object-contain mr-3'
                />
                <div>Metamask</div>
              </div>
              <div className='flex items-center'>
                <div className='mr-3 text-gray-400'>Browser</div>
                <FaChevronRight className='text-gray-400' />
              </div>
            </div>
          </div>

          <div className='mb-1'>
            <LedgerLoginButton
              className='!flex items-center justify-between !p-4 !bg-gray-800 rounded-xl mb-1 cursor-pointer hover:!bg-gray-700 !m-0 !border-0 w-full'
              loginButtonText='Ledger'
              {...commonProps}
            >
              <div className='flex items-center'>
                <img
                  src='/images/con_5.png'
                  alt='Logo'
                  width={30}
                  className='object-contain mr-3'
                />
                <div>Ledger</div>
              </div>
              <div className='flex items-center'>
                <div className='mr-3 text-gray-400'>Hardware</div>
                <FaChevronRight className='text-gray-400' />
              </div>
            </LedgerLoginButton>
          </div>
        </div>
      </div>
    </AuthRedirectWrapper>
  );
};
