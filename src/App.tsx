import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useEffect } from 'react';

import {
  AxiosInterceptorContext,
  DappProvider,
  Layout,
  TransactionsToastList,
  NotificationModal,
  SignTransactionsModals
} from 'components';

import {
  apiTimeout,
  walletConnectV2ProjectId,
  environment,
  sampleAuthenticatedDomains
} from 'config';
import { RouteNamesEnum } from 'localConstants';
import { PageNotFound, Unlock } from 'pages';
import { routes } from 'routes';
import { BatchTransactionsContextProvider } from 'wrappers';

const AppContent = () => {
  // Debug: Log app initialization
  useEffect(() => {
    console.log('🚀 [APP] Application initialized');
    console.log('🌐 [APP] Current origin:', window.location.origin);
    console.log('🌐 [APP] Full URL:', window.location.href);
    console.log('🔑 [APP] NativeAuth enabled: true');
    console.log('📡 [APP] Environment:', environment);
  }, []);

  return (
    <DappProvider
      environment={environment}
      customNetworkConfig={{
        name: 'customConfig',
        apiTimeout,
        walletConnectV2ProjectId
      }}
      dappConfig={{
        shouldUseWebViewProvider: true,
        logoutRoute: RouteNamesEnum.home
      }}
      customComponents={{
        transactionTracker: {
          // uncomment this to use the custom transaction tracker
          // component: TransactionsTracker,
          props: {
            onSuccess: (sessionId: string) => {
              console.log(`Session ${sessionId} successfully completed`);
            },
            onFail: (sessionId: string, errorMessage: string) => {
              console.log(`Session ${sessionId} failed. ${errorMessage ?? ''}`);
            }
          }
        }
      }}
    >
      <AxiosInterceptorContext.Listener>
        <Layout>
          <TransactionsToastList />
          <NotificationModal />
          <SignTransactionsModals />
          <Routes>
            <Route path={RouteNamesEnum.unlock} element={<Unlock />} />
            {routes.map((route) => (
              <Route
                path={route.path}
                key={`route-key-'${route.path}`}
                element={<route.component />}
              />
            ))}
            <Route path='*' element={<PageNotFound />} />
          </Routes>
        </Layout>
      </AxiosInterceptorContext.Listener>
    </DappProvider>
  );
};

export const App = () => {
  return (
    <AxiosInterceptorContext.Provider>
      <AxiosInterceptorContext.Interceptor
        authenticatedDomains={sampleAuthenticatedDomains}
      >
        <Router>
          <BatchTransactionsContextProvider>
            <AppContent />
          </BatchTransactionsContextProvider>
        </Router>
      </AxiosInterceptorContext.Interceptor>
    </AxiosInterceptorContext.Provider>
  );
};
