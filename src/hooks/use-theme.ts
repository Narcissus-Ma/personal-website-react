import { useMemo } from 'react';
import { useThemeStore } from '@/stores';
import type { ThemeMode } from '@/stores/theme-store';

interface ThemeOption {
  key: ThemeMode;
  name: string;
}

const themeOptions: ThemeOption[] = [
  { key: 'light', name: '日间模式' },
  { key: 'dark', name: '夜间模式' },
];

export const useTheme = () => {
  const {
    theme,
    setTheme,
    toggleTheme,
    selectedHomeBackground,
    selectHomeBackground,
    syncHomeBackground,
    clearHomeBackground,
  } = useThemeStore();

  const currentThemeName = useMemo(() => {
    return themeOptions.find(opt => opt.key === theme)?.name || '日间模式';
  }, [theme]);

  return {
    theme,
    setTheme,
    toggleTheme,
    themeOptions,
    currentThemeName,
    selectedHomeBackground,
    selectHomeBackground,
    syncHomeBackground,
    clearHomeBackground,
  };
};
