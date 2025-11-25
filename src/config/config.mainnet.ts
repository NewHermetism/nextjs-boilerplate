import { EnvironmentsEnum } from 'types';
import { resolveSocketApiUrl } from './socketUrl';

export * from './sharedConfig';

export const API_URL = 'https://api.multiversx.com';
export const sampleAuthenticatedDomains = [API_URL];
export const environment = EnvironmentsEnum.mainnet;

export const SOCKET_API_URL = resolveSocketApiUrl(
  'https://vdash-api.supervictornft.com/'
);
export const WEBSITE_URL = 'https://supervictornft.com/';
