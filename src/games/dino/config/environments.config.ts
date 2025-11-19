import rawEnvironments from './data/environments.json';
import { environmentTextureKey, EnvironmentLayer } from './assetKeys';

export interface EnvironmentLayerAsset {
  key: string;
  path: string;
}

export interface EnvironmentConfig {
  id: string;
  label: string;
  layers: Partial<Record<EnvironmentLayer, EnvironmentLayerAsset>>;
}

type RawEnvironment = {
  id: string;
  label: string;
  layers: Partial<Record<EnvironmentLayer, string>>;
};

const normalizeEnvironment = (raw: RawEnvironment): EnvironmentConfig => {
  const layers = Object.entries(raw.layers).reduce<
    Partial<Record<EnvironmentLayer, EnvironmentLayerAsset>>
  >((acc, [layer, path]) => {
    if (!path) {
      return acc;
    }

    const typedLayer = layer as EnvironmentLayer;
    acc[typedLayer] = {
      key: environmentTextureKey(raw.id, typedLayer),
      path
    };
    return acc;
  }, {});

  return {
    id: raw.id,
    label: raw.label,
    layers
  };
};

const rawEnvironmentList = rawEnvironments as RawEnvironment[];

export const ENVIRONMENTS = rawEnvironmentList.map(normalizeEnvironment);
export type EnvironmentId = (typeof ENVIRONMENTS)[number]['id'];

export const ENVIRONMENT_BY_ID = new Map<EnvironmentId, EnvironmentConfig>(
  ENVIRONMENTS.map((environment) => [environment.id as EnvironmentId, environment])
);

export const getEnvironmentById = (id: EnvironmentId) => ENVIRONMENT_BY_ID.get(id);
