import { useMemo } from 'react';
import { Grid } from 'antd';

type MobileBreakpoint = 'sm' | 'md';

interface UseIsMobileOptions {
  /**
   * `sm`：< 576px 视为移动端
   * `md`：< 768px 视为移动端（包含小平板）
   */
  breakpoint?: MobileBreakpoint;
}

export const useIsMobile = (options: UseIsMobileOptions = {}): boolean => {
  const { breakpoint = 'sm' } = options;
  const screens = Grid.useBreakpoint();

  return useMemo(() => {
    if (breakpoint === 'md') {
      return !screens.md;
    }
    return !screens.sm;
  }, [breakpoint, screens.md, screens.sm]);
};
