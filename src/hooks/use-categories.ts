import { useEffect, useRef } from 'react';
import { useSiteStore } from '../stores';
import { Category } from '@/types';

export const useCategories = () => {
  const {
    categories,
    setCategories,
    setSearchEngines,
    setBackgrounds,
    setHeaderTagLinks,
    setFooterTagLinks,
    loadFromServer,
  } = useSiteStore();
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
          setCategories((siteData.categories || siteData) as Category[]);
          if (siteData.searchEngines) {
            setSearchEngines(siteData.searchEngines);
          }
          if (siteData.backgrounds) {
            setBackgrounds(siteData.backgrounds);
          }
          if (siteData.headerTagLinks) {
            setHeaderTagLinks(siteData.headerTagLinks);
          }
          if (siteData.footerTagLinks) {
            setFooterTagLinks(siteData.footerTagLinks);
          }
        });
      });
    }
    hasLoaded.current = true;
  }, [
    categories.length,
    setCategories,
    setSearchEngines,
    setBackgrounds,
    setHeaderTagLinks,
    setFooterTagLinks,
    loadFromServer,
  ]);

  return { categories, setCategories };
};
