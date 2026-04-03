import { create } from 'zustand';
import { API_BASE } from '@/config/api-base';
import { SiteData, Category, SearchEngine, Website } from '../types';

interface SiteStore extends SiteData {
  setCategories: (categories: Category[]) => void;
  setSearchEngines: (engines: SearchEngine[]) => void;
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
  saveToServer: () => Promise<void>;
  loadFromServer: () => Promise<void>;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

export const useSiteStore = create<SiteStore>((set, get) => ({
  categories: [],
  searchEngines: [],
  isLoading: true,
  setIsLoading: isLoading => set({ isLoading }),
  setCategories: categories => set({ categories }),
  setSearchEngines: searchEngines => set({ searchEngines }),
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
  setDefaultEngine: index => {},
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
        isLoading: false,
      });
    } catch (error) {
      console.error('Error loading data:', error);
      set({ isLoading: false });
      throw error;
    }
  },
  saveToServer: async () => {
    const { categories, searchEngines } = get();
    const response = await fetch(`${API_BASE}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categories, searchEngines }),
    });
    if (!response.ok) {
      throw new Error('Failed to save data');
    }
  },
}));
