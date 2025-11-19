import { SOCKET_API_URL } from 'config';
import {
  CHARACTERS,
  type CharacterConfig
} from 'games/dino/config/characters.config';
import {
  ENVIRONMENTS,
  type EnvironmentConfig
} from 'games/dino/config/environments.config';

export interface CatalogResponse {
  characters: CharacterConfig[];
  environments: EnvironmentConfig[];
}

const withTrailingSlash = (url: string) => (url.endsWith('/') ? url : `${url}/`);

const normalizeCatalog = (payload: unknown): CatalogResponse => {
  if (
    payload &&
    typeof payload === 'object' &&
    Array.isArray((payload as CatalogResponse).characters) &&
    Array.isArray((payload as CatalogResponse).environments)
  ) {
    return payload as CatalogResponse;
  }

  return DEFAULT_CATALOG;
};

export const DEFAULT_CATALOG: CatalogResponse = {
  characters: CHARACTERS,
  environments: ENVIRONMENTS
};

export const fetchCatalog = async (): Promise<CatalogResponse> => {
  const endpoint = `${withTrailingSlash(SOCKET_API_URL)}catalog`;
  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error(`Catalog request failed with status ${response.status}`);
  }

  const payload = await response.json();
  return normalizeCatalog(payload);
};
