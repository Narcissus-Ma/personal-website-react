import { useEffect, useRef } from 'react';
import { useSiteStore } from '../stores';

export const useCategories = () => {
  const { categories, setCategories, setSearchEngines, loadFromServer } =
    useSiteStore();
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current) {
      return;
    }
    if (categories.length === 0) {
      loadFromServer().catch(() => {
        console.log(
          'Failed to load categories from server, use local data instead.'
        );
        import('../data/data.json').then(data => {
          const siteData = data.default || data;
          setCategories(siteData.categories || siteData);
          if (siteData.searchEngines) {
            setSearchEngines(siteData.searchEngines);
          }
        });
      });
    }
    hasLoaded.current = true;
  }, [categories.length, setCategories, setSearchEngines, loadFromServer]);

  return { categories, setCategories };
};
