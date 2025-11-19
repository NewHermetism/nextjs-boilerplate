import { useEffect, useState } from 'react';
import { DEFAULT_CATALOG, fetchCatalog, type CatalogResponse } from 'services/catalog';
import { isTestModeEnabled } from 'utils/isTestModeEnabled';

interface UseCatalogResult {
  catalog: CatalogResponse;
  loading: boolean;
  error: Error | null;
}

export const useCatalog = (): UseCatalogResult => {
  const [catalog, setCatalog] = useState<CatalogResponse>(DEFAULT_CATALOG);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    const shouldBypassNetwork = isTestModeEnabled();

    if (shouldBypassNetwork) {
      setCatalog(DEFAULT_CATALOG);
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    fetchCatalog()
      .then((data) => {
        if (!cancelled) {
          setCatalog(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }
        const normalizedError =
          err instanceof Error ? err : new Error('Unable to load catalog');
        console.error('[useCatalog] Failed to load catalog', normalizedError);
        setError(normalizedError);
        setCatalog(DEFAULT_CATALOG);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { catalog, loading, error };
};
