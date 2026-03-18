import { create } from 'zustand';

export type Language = 'zh' | 'en';

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
}

const STORAGE_KEY = 'app_language';

const getInitialLanguage = (): Language => {
  if (typeof window === 'undefined') return 'zh';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'zh' || stored === 'en') return stored;
  } catch {
    // ignore
  }
  return 'zh';
};

export const useLanguageStore = create<LanguageState>(set => {
  const initialLanguage = getInitialLanguage();

  return {
    language: initialLanguage,
    setLanguage: (language: Language) => {
      set({ language });
      try {
        window.localStorage.setItem(STORAGE_KEY, language);
      } catch {
        // ignore
      }
    },
  };
});
