import type { PropsWithChildren } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthenticatedRoutesWrapper } from 'components/sdkDappComponents';
import { RouteNamesEnum } from 'localConstants/routes';
import { routes } from 'routes/routes';
import { Footer } from './Footer';
import { Header } from './Header';
import { SocketProvider } from 'pages/Providers/socket';

export const Layout = ({ children }: PropsWithChildren) => {
  const { search } = useLocation();
  return (
    <SocketProvider>
      <div
        className={`flex min-h-screen bg-[length:850%] md:bg-[length:350%] flex-col bg-[url('/images/platform_bg.png')]`}
      >
        <Header />
        <main className='flex flex-col flex-1 justify-center items-center p-3 lg:p-6 lg:mx-9 lg:pt-0'>
          <AuthenticatedRoutesWrapper
            routes={routes}
            unlockRoute={`${RouteNamesEnum.unlock}${search}`}
          >
            {children}
          </AuthenticatedRoutesWrapper>
        </main>
        <Footer />
      </div>
    </SocketProvider>
  );
};
