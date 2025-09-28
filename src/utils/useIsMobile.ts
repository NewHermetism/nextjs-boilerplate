import { useState, useEffect } from 'react';
import { isTablet, isMobile } from 'react-device-detect';

export const useIsMobile = () => {
  const [isMobileDevice, setIsMobile] = useState<boolean>(isTablet || isMobile);
  const [isLandscape, setIsLandscape] = useState<boolean>(
    window.matchMedia('(orientation: landscape)').matches
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(isTablet || isMobile);
      setIsLandscape(window.matchMedia('(orientation: landscape)').matches);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { isMobile: isMobileDevice, isLandscape };
};
