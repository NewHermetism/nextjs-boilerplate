import { WebWalletLoginButtonPropsType } from '@multiversx/sdk-dapp/UI/webWallet/WebWalletLoginButton/WebWalletLoginButton';
import { CrossWindowLoginButton } from 'components/sdkDappComponents';

export const WebWalletLoginWrapper = ({
  ...commonProps
}: WebWalletLoginButtonPropsType) => {
  return (
    <CrossWindowLoginButton
      loginButtonText='Web Wallet'
      data-testid='webWalletLoginBtn'
      className='!mr-0 !rounded-none !rounded-l-md'
      {...commonProps}
    />
  );
};
