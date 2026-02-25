import { useEffect } from 'react';
import { useSiteStore } from '../stores';
import { Category } from '../types';

export const useCategories = () => {
  const { categories, setCategories } = useSiteStore();

  useEffect(() => {
    if (categories.length === 0) {
      import('../data/data.json').then((data) => {
        const siteData = data.default || data;
        setCategories(siteData.categories || siteData);
      });
    }
  }, [categories.length, setCategories]);

  return { categories, setCategories };
};
