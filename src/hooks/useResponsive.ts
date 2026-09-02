import { useWindowDimensions } from 'react-native';

export interface ResponsiveInfo {
  width: number;
  height: number;
  isSmallMobile: boolean; // < 375px
  isMobile: boolean;      // < 768px
  isTablet: boolean;      // 768px - 1023px
  isDesktop: boolean;     // >= 1024px
  isWideScreen: boolean;  // >= 768px (Tablet or Desktop)
  contentMaxWidth: number;
}

export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();

  const isSmallMobile = width < 375;
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;
  const isWideScreen = width >= 768;

  let contentMaxWidth = 768;
  if (width >= 1440) {
    contentMaxWidth = 960;
  } else if (width >= 1024) {
    contentMaxWidth = 840;
  } else if (width >= 768) {
    contentMaxWidth = 720;
  } else {
    contentMaxWidth = width;
  }

  return {
    width,
    height,
    isSmallMobile,
    isMobile,
    isTablet,
    isDesktop,
    isWideScreen,
    contentMaxWidth,
  };
}
