export const isTestModeEnabled = () => {
  const flag = import.meta.env.VITE_TEST_MODE;

  return flag === 'true' || flag === '1';
};
