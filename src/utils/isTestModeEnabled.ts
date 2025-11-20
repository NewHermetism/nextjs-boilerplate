const normalizeFlag = (value: unknown) => {
  if (typeof value !== 'string') {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === 'true' || normalized === '1';
};

export const isTestModeEnabled = () => {
  const requested = normalizeFlag(import.meta.env.VITE_TEST_MODE);
  if (!requested) {
    return false;
  }

  // Never enable test mode on production builds unless explicitly allowed.
  const allowInProd = normalizeFlag(import.meta.env.VITE_ALLOW_TEST_MODE_IN_PROD);
  if (import.meta.env.PROD && !allowInProd) {
    return false;
  }

  return true;
};
