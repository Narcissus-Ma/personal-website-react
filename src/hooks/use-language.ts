import { useState, useCallback } from 'react';

export type Language = 'zh' | 'en';

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
  const [language, setLanguage] = useState<Language>('zh');

  const transName = useCallback(
    (item: { name: string; en_name: string }): string => {
      return language === 'zh' ? item.name : item.en_name;
    },
    [language]
  );

  return { language, setLanguage, transName, languageOptions };
};
