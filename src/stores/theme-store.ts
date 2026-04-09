import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark';

interface SyncHomeBackgroundOptions {
  isHomePage: boolean;
  backgroundUrl: string | null;
}

interface ThemeState {
  theme: ThemeMode;
  selectedHomeBackground: string | null;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  selectHomeBackground: (backgroundUrl: string | null) => void;
  syncHomeBackground: (options: SyncHomeBackgroundOptions) => void;
  clearHomeBackground: () => void;
}

const THEME_STORAGE_KEY = 'theme_mode';
const HOME_BACKGROUND_STORAGE_KEY = 'home_background';

const applyThemeToDocument = (theme: ThemeMode) => {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
};

const applyHomeBackgroundToDocument = ({
  isHomePage,
  backgroundUrl,
  theme,
}: SyncHomeBackgroundOptions & { theme: ThemeMode }) => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const isActive = isHomePage && theme === 'light' && !!backgroundUrl;

  root.dataset.homeBackground = isActive ? 'active' : 'inactive';
  root.style.setProperty(
    '--home-bg-image',
    backgroundUrl ? `url("${backgroundUrl}")` : 'none'
  );
};

const clearHomeBackgroundFromDocument = () => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.homeBackground = 'inactive';
  root.style.setProperty('--home-bg-image', 'none');
};

const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'dark';
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // ignore
  }
  return 'dark';
};

const getInitialHomeBackground = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(HOME_BACKGROUND_STORAGE_KEY);
  } catch {
    // ignore
  }
  return null;
};

export const useThemeStore = create<ThemeState>((set, get) => {
  const initialTheme = getInitialTheme();
  applyThemeToDocument(initialTheme);
  clearHomeBackgroundFromDocument();

  return {
    theme: initialTheme,
    selectedHomeBackground: getInitialHomeBackground(),
    setTheme: (theme: ThemeMode) => {
      set({ theme });
      applyThemeToDocument(theme);
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, theme);
      } catch {
        // ignore
      }
    },
    toggleTheme: () => {
      const nextTheme: ThemeMode = get().theme === 'dark' ? 'light' : 'dark';
      get().setTheme(nextTheme);
    },
    selectHomeBackground: (backgroundUrl: string | null) => {
      set({ selectedHomeBackground: backgroundUrl });
      try {
        if (backgroundUrl) {
          window.localStorage.setItem(
            HOME_BACKGROUND_STORAGE_KEY,
            backgroundUrl
          );
        } else {
          window.localStorage.removeItem(HOME_BACKGROUND_STORAGE_KEY);
        }
      } catch {
        // ignore
      }
    },
    syncHomeBackground: (options: SyncHomeBackgroundOptions) => {
      applyHomeBackgroundToDocument({
        ...options,
        theme: get().theme,
      });
    },
    clearHomeBackground: () => {
      clearHomeBackgroundFromDocument();
    },
  };
});
