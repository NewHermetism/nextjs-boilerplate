const ensureTrailingSlash = (value: string) =>
  (value.endsWith('/') ? value : `${value}/`);

export const resolveSocketApiUrl = (fallback: string) => {
  const envSocketUrl = import.meta.env?.VITE_VDASH_SOCKET_URL?.trim();

  if (envSocketUrl) {
    return ensureTrailingSlash(envSocketUrl);
  }

  return ensureTrailingSlash(fallback);
};
