import { useEffect } from 'react';
import { useSiteStore } from '../stores';

export const useCategories = () => {
  const { categories, setCategories, setSearchEngines } = useSiteStore();

  useEffect(() => {
    if (categories.length === 0) {
      import('../data/data.json').then(data => {
        const siteData = data.default || data;
        setCategories(siteData.categories || siteData);
        if (siteData.searchEngines) {
          setSearchEngines(siteData.searchEngines);
        }
      });
    }
  }, [categories.length, setCategories, setSearchEngines]);

  return { categories, setCategories };
};
