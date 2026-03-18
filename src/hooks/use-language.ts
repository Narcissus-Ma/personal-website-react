import { useCallback } from 'react';
import { useLanguageStore } from '@/stores';
import type { Language } from '@/stores/language-store';

export type { Language } from '@/stores/language-store';

interface LanguageOption {
  key: Language;
  name: string;
  flag: string;
}

export const languageOptions: LanguageOption[] = [
  { key: 'zh', name: '简体中文', flag: './assets/images/flags/flag-cn.png' },
  { key: 'en', name: 'English', flag: './assets/images/flags/flag-us.png' },
];

export const useLanguage = () => {
  const { language, setLanguage } = useLanguageStore();

  const transName = useCallback(
    (item: { name: string; en_name: string }): string => {
      return language === 'zh' ? item.name : item.en_name;
    },
    [language]
  );

  return { language, setLanguage, transName, languageOptions };
};
