import { create } from 'zustand';
import { SiteData, Category, SearchEngine, Website } from '../types';

interface SiteStore extends SiteData {
  setCategories: (categories: Category[]) => void;
  setSearchEngines: (engines: SearchEngine[]) => void;
  addCategory: (category: Category) => void;
  updateCategory: (index: number, category: Category) => void;
  deleteCategory: (index: number) => void;
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
  setDefaultEngine: (index: number) => void;
  saveToServer: () => Promise<void>;
  loadFromServer: () => Promise<void>;
}

const API_BASE = 'http://localhost:3000/api';

export const useSiteStore = create<SiteStore>((set, get) => ({
  categories: [],
  searchEngines: [],
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
  setDefaultEngine: index => {},
  loadFromServer: async () => {
    try {
      const response = await fetch(`${API_BASE}/data`);
      if (!response.ok) {
        throw new Error('Failed to load data');
      }
      const data = await response.json();
      set({
        categories: data.categories || [],
        searchEngines: data.searchEngines || [],
      });
    } catch (error) {
      console.error('Error loading data:', error);
      // 如果加载失败，保持当前状态或设置默认值
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
