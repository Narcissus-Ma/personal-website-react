import { create } from 'zustand';
import { API_BASE } from '@/config/api-base';
import type {
  BackgroundImage,
  Category,
  SearchEngine,
  SiteData,
  TagLinkItem,
  Website,
} from '../types';

const DEFAULT_BACKGROUNDS: BackgroundImage[] = [
  {
    name: '默认背景',
    url: null,
  },
];

const DEFAULT_HEADER_TAG_LINKS: TagLinkItem[] = [
  {
    id: 'about',
    name: '关于我',
    en_name: 'About',
    url: '/about',
    isExternal: false,
    position: 'header',
    target: '_self',
    order: 1,
    enabled: true,
  },
];

const DEFAULT_FOOTER_TAG_LINKS: TagLinkItem[] = [
  {
    id: 'friend-github',
    name: 'GitHub',
    en_name: 'GitHub',
    url: 'https://github.com/Narcissus-Ma',
    isExternal: true,
    position: 'footer',
    target: '_blank',
    order: 1,
    enabled: true,
  },
];

interface SiteStore extends SiteData {
  setCategories: (categories: Category[]) => void;
  setSearchEngines: (engines: SearchEngine[]) => void;
  setBackgrounds: (backgrounds: BackgroundImage[]) => void;
  setHeaderTagLinks: (tagLinks: TagLinkItem[]) => void;
  setFooterTagLinks: (tagLinks: TagLinkItem[]) => void;
  addCategory: (category: Category) => void;
  updateCategory: (index: number, category: Category) => void;
  deleteCategory: (index: number) => void;
  reorderCategories: (oldIndex: number, newIndex: number) => void;
  addWebsite: (categoryIndex: number, website: Website) => void;
  updateWebsite: (
    categoryIndex: number,
    siteIndex: number,
    website: Website
  ) => void;
  deleteWebsite: (categoryIndex: number, siteIndex: number) => void;
  moveWebsite: (
    fromCategoryIndex: number,
    toCategoryIndex: number,
    siteIndex: number
  ) => void;
  reorderWebsites: (
    categoryIndex: number,
    oldIndex: number,
    newIndex: number
  ) => void;
  addSearchEngine: (engine: SearchEngine) => void;
  updateSearchEngine: (index: number, engine: SearchEngine) => void;
  deleteSearchEngine: (index: number) => void;
  reorderSearchEngines: (oldIndex: number, newIndex: number) => void;
  setDefaultEngine: (index: number) => void;
  addBackground: (background: BackgroundImage) => void;
  updateBackground: (index: number, background: BackgroundImage) => void;
  deleteBackground: (index: number) => void;
  addTagLink: (position: 'header' | 'footer', tagLink: TagLinkItem) => void;
  updateTagLink: (
    position: 'header' | 'footer',
    tagLinkId: string,
    tagLink: Partial<TagLinkItem>
  ) => void;
  deleteTagLink: (position: 'header' | 'footer', tagLinkId: string) => void;
  reorderTagLinks: (
    position: 'header' | 'footer',
    oldIndex: number,
    newIndex: number
  ) => void;
  saveToServer: () => Promise<void>;
  loadFromServer: () => Promise<void>;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

const normalizeBackgrounds = (
  backgrounds: BackgroundImage[] | undefined
): BackgroundImage[] => {
  if (!backgrounds || backgrounds.length === 0) {
    return DEFAULT_BACKGROUNDS;
  }

  const hasDefaultBackground = backgrounds.some(item => item.url === null);
  if (hasDefaultBackground) {
    return backgrounds;
  }

  return [...DEFAULT_BACKGROUNDS, ...backgrounds];
};

const normalizeTagLinks = (
  tagLinks: TagLinkItem[] | undefined,
  position: 'header' | 'footer',
  fallback: TagLinkItem[]
): TagLinkItem[] => {
  if (tagLinks === undefined) {
    return fallback;
  }

  if (tagLinks.length === 0) {
    return [];
  }

  const filteredLinks = tagLinks
    .filter(item => item && item.position === position && !!item.url)
    .map((item, index) => ({
      ...item,
      target: item.target || (item.isExternal ? '_blank' : '_self'),
      order: typeof item.order === 'number' ? item.order : index + 1,
      enabled: typeof item.enabled === 'boolean' ? item.enabled : true,
    }))
    .sort((a, b) => a.order - b.order);

  return filteredLinks.length > 0 ? filteredLinks : fallback;
};

const getTagLinkKey = (position: 'header' | 'footer') =>
  position === 'header' ? 'headerTagLinks' : 'footerTagLinks';

export const useSiteStore = create<SiteStore>((set, get) => ({
  categories: [],
  searchEngines: [],
  backgrounds: DEFAULT_BACKGROUNDS,
  headerTagLinks: DEFAULT_HEADER_TAG_LINKS,
  footerTagLinks: DEFAULT_FOOTER_TAG_LINKS,
  isLoading: true,
  setIsLoading: isLoading => set({ isLoading }),
  setCategories: categories => set({ categories }),
  setSearchEngines: searchEngines => set({ searchEngines }),
  setBackgrounds: backgrounds =>
    set({ backgrounds: normalizeBackgrounds(backgrounds) }),
  setHeaderTagLinks: headerTagLinks =>
    set({
      headerTagLinks: normalizeTagLinks(
        headerTagLinks,
        'header',
        DEFAULT_HEADER_TAG_LINKS
      ),
    }),
  setFooterTagLinks: footerTagLinks =>
    set({
      footerTagLinks: normalizeTagLinks(
        footerTagLinks,
        'footer',
        DEFAULT_FOOTER_TAG_LINKS
      ),
    }),
  addCategory: category =>
    set(state => ({ categories: [...state.categories, category] })),
  updateCategory: (index, category) =>
    set(state => {
      const newCategories = [...state.categories];
      newCategories[index] = category;
      return { categories: newCategories };
    }),
  deleteCategory: index =>
    set(state => {
      if (state.categories.length <= 1) return state;
      const newCategories = [...state.categories];
      newCategories.splice(index, 1);
      return { categories: newCategories };
    }),
  reorderCategories: (oldIndex, newIndex) =>
    set(state => {
      if (oldIndex === newIndex) return state;
      const newCategories = [...state.categories];
      if (
        oldIndex < 0 ||
        newIndex < 0 ||
        oldIndex >= newCategories.length ||
        newIndex >= newCategories.length
      ) {
        return state;
      }
      const [movedItem] = newCategories.splice(oldIndex, 1);
      if (!movedItem) return state;
      newCategories.splice(newIndex, 0, movedItem);
      return { categories: newCategories };
    }),
  addWebsite: (categoryIndex, website) =>
    set(state => {
      const newCategories = [...state.categories];
      newCategories[categoryIndex].web = [
        ...(newCategories[categoryIndex].web || []),
        website,
      ];
      return { categories: newCategories };
    }),
  updateWebsite: (categoryIndex, siteIndex, website) =>
    set(state => {
      const newCategories = [...state.categories];
      if (newCategories[categoryIndex].web) {
        newCategories[categoryIndex].web![siteIndex] = website;
      }
      return { categories: newCategories };
    }),
  deleteWebsite: (categoryIndex, siteIndex) =>
    set(state => {
      const newCategories = [...state.categories];
      if (newCategories[categoryIndex].web) {
        newCategories[categoryIndex].web!.splice(siteIndex, 1);
      }
      return { categories: newCategories };
    }),
  moveWebsite: (fromCategoryIndex, toCategoryIndex, siteIndex) =>
    set(state => {
      const newCategories = [...state.categories];
      if (
        newCategories[fromCategoryIndex].web &&
        newCategories[toCategoryIndex].web !== undefined
      ) {
        const website = newCategories[fromCategoryIndex].web![siteIndex];
        newCategories[fromCategoryIndex].web!.splice(siteIndex, 1);
        newCategories[toCategoryIndex].web = [
          ...(newCategories[toCategoryIndex].web || []),
          website,
        ];
      }
      return { categories: newCategories };
    }),
  reorderWebsites: (categoryIndex, oldIndex, newIndex) =>
    set(state => {
      const newCategories = [...state.categories];
      if (newCategories[categoryIndex].web) {
        const websites = [...newCategories[categoryIndex].web!];
        const [movedItem] = websites.splice(oldIndex, 1);
        websites.splice(newIndex, 0, movedItem);
        newCategories[categoryIndex].web = websites;
      }
      return { categories: newCategories };
    }),
  addSearchEngine: engine =>
    set(state => ({ searchEngines: [...state.searchEngines, engine] })),
  updateSearchEngine: (index, engine) =>
    set(state => {
      const newEngines = [...state.searchEngines];
      newEngines[index] = engine;
      return { searchEngines: newEngines };
    }),
  deleteSearchEngine: index =>
    set(state => {
      const newEngines = [...state.searchEngines];
      newEngines.splice(index, 1);
      return { searchEngines: newEngines };
    }),
  reorderSearchEngines: (oldIndex, newIndex) =>
    set(state => {
      if (oldIndex === newIndex) return state;
      const newEngines = [...state.searchEngines];
      if (
        oldIndex < 0 ||
        newIndex < 0 ||
        oldIndex >= newEngines.length ||
        newIndex >= newEngines.length
      ) {
        return state;
      }
      const [movedItem] = newEngines.splice(oldIndex, 1);
      if (!movedItem) return state;
      newEngines.splice(newIndex, 0, movedItem);
      return { searchEngines: newEngines };
    }),
  setDefaultEngine: () => {},
  addBackground: background =>
    set(state => ({ backgrounds: [...state.backgrounds, background] })),
  updateBackground: (index, background) =>
    set(state => {
      const newBackgrounds = [...state.backgrounds];
      newBackgrounds[index] = background;
      return { backgrounds: normalizeBackgrounds(newBackgrounds) };
    }),
  deleteBackground: index =>
    set(state => {
      const target = state.backgrounds[index];
      if (!target || target.url === null) {
        return state;
      }
      const newBackgrounds = [...state.backgrounds];
      newBackgrounds.splice(index, 1);
      return { backgrounds: normalizeBackgrounds(newBackgrounds) };
    }),
  addTagLink: (position, tagLink) =>
    set(state => {
      const key = getTagLinkKey(position);
      const currentLinks = [...state[key]];
      const nextLink = {
        ...tagLink,
        position,
        target: tagLink.target || (tagLink.isExternal ? '_blank' : '_self'),
        order: currentLinks.length + 1,
      };
      return {
        [key]: [...currentLinks, nextLink],
      } as Pick<SiteStore, typeof key>;
    }),
  updateTagLink: (position, tagLinkId, tagLink) =>
    set(state => {
      const key = getTagLinkKey(position);
      const currentLinks = [...state[key]];
      const nextLinks = currentLinks.map(item => {
        if (item.id !== tagLinkId) return item;
        const merged = { ...item, ...tagLink, position };
        return {
          ...merged,
          target: merged.target || (merged.isExternal ? '_blank' : '_self'),
        };
      });
      return { [key]: nextLinks } as Pick<SiteStore, typeof key>;
    }),
  deleteTagLink: (position, tagLinkId) =>
    set(state => {
      const key = getTagLinkKey(position);
      const currentLinks = [...state[key]];
      const nextLinks = currentLinks
        .filter(item => item.id !== tagLinkId)
        .map((item, index) => ({ ...item, order: index + 1 }));
      return { [key]: nextLinks } as Pick<SiteStore, typeof key>;
    }),
  reorderTagLinks: (position, oldIndex, newIndex) =>
    set(state => {
      if (oldIndex === newIndex) return state;
      const key = getTagLinkKey(position);
      const currentLinks = [...state[key]];
      if (
        oldIndex < 0 ||
        newIndex < 0 ||
        oldIndex >= currentLinks.length ||
        newIndex >= currentLinks.length
      ) {
        return state;
      }
      const [movedItem] = currentLinks.splice(oldIndex, 1);
      if (!movedItem) return state;
      currentLinks.splice(newIndex, 0, movedItem);
      return {
        [key]: currentLinks.map((item, index) => ({
          ...item,
          order: index + 1,
        })),
      } as Pick<SiteStore, typeof key>;
    }),
  loadFromServer: async () => {
    try {
      set({ isLoading: true });
      const response = await fetch(`${API_BASE}/data`);
      if (!response.ok) {
        throw new Error('Failed to load data');
      }
      const data = await response.json();
      set({
        categories: data.categories || [],
        searchEngines: data.searchEngines || [],
        backgrounds: normalizeBackgrounds(data.backgrounds),
        headerTagLinks: normalizeTagLinks(
          data.headerTagLinks,
          'header',
          DEFAULT_HEADER_TAG_LINKS
        ),
        footerTagLinks: normalizeTagLinks(
          data.footerTagLinks,
          'footer',
          DEFAULT_FOOTER_TAG_LINKS
        ),
        isLoading: false,
      });
    } catch (error) {
      console.error('Error loading data:', error);
      set({ isLoading: false });
      throw error;
    }
  },
  saveToServer: async () => {
    const {
      categories,
      searchEngines,
      backgrounds,
      headerTagLinks,
      footerTagLinks,
    } = get();
    const response = await fetch(`${API_BASE}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categories,
        searchEngines,
        backgrounds,
        headerTagLinks,
        footerTagLinks,
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to save data');
    }
  },
}));
