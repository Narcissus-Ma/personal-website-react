import { create } from 'zustand';
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from 'zustand/middleware';
import type { Website } from '@/types';

const STORAGE_KEY = 'personal-website-recent-sites';
const STORAGE_VERSION = 1;

interface RecentSitesPersistedState {
  recentWebsites: Website[];
}

/**
 * 最近打开网站状态
 *
 * 该状态只保存浏览器本地的最近打开网站，不参与服务端站点数据同步。
 */
interface RecentSitesState {
  /** 最近点击过的网站快照，按最近点击顺序排列 */
  recentWebsites: Website[];
  /** 添加网站记录，并将重复网站移动到列表首位 */
  addRecentWebsite: (website: Website) => void;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const normalizeWebsite = (value: unknown): Website | null => {
  if (!isRecord(value)) {
    return null;
  }

  const { url, logo, title, desc, is_hot: isHot } = value;
  if (
    typeof url !== 'string' ||
    url.trim() === '' ||
    typeof logo !== 'string' ||
    logo.trim() === '' ||
    typeof title !== 'string' ||
    title.trim() === ''
  ) {
    return null;
  }

  const website: Website = {
    url,
    logo,
    title,
    desc: typeof desc === 'string' ? desc : '',
  };

  if (typeof isHot === 'boolean') {
    website.is_hot = isHot;
  }

  return website;
};

const normalizeRecentWebsites = (value: unknown): Website[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const seenUrls = new Set<string>();
  const websites: Website[] = [];

  value.forEach(item => {
    const website = normalizeWebsite(item);
    if (!website || seenUrls.has(website.url)) {
      return;
    }

    seenUrls.add(website.url);
    websites.push(website);
  });

  return websites;
};

const extractPersistedWebsites = (value: unknown): Website[] => {
  if (!isRecord(value)) {
    return [];
  }

  return normalizeRecentWebsites(value.recentWebsites);
};

const reportStorageError = (operation: string): void => {
  console.warn(
    `最近打开记录本地存储${operation}失败，将继续使用当前页面内存状态。`
  );
};

const createSafeLocalStorage = (): StateStorage => ({
  getItem: name => {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      return window.localStorage.getItem(name);
    } catch {
      reportStorageError('读取');
      return null;
    }
  },
  setItem: (name, value) => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(name, value);
    } catch {
      reportStorageError('写入');
    }
  },
  removeItem: name => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.removeItem(name);
    } catch {
      reportStorageError('删除');
    }
  },
});

const persistedStorage = createJSONStorage<RecentSitesPersistedState>(() =>
  createSafeLocalStorage()
);

export const useRecentSitesStore = create<RecentSitesState>()(
  persist(
    set => ({
      recentWebsites: [],
      addRecentWebsite: website =>
        set(state => ({
          recentWebsites: [
            website,
            ...state.recentWebsites.filter(item => item.url !== website.url),
          ],
        })),
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: persistedStorage,
      partialize: state => ({
        recentWebsites: state.recentWebsites,
      }),
      migrate: (persistedState, version) => ({
        recentWebsites:
          version === STORAGE_VERSION
            ? extractPersistedWebsites(persistedState)
            : [],
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        recentWebsites: extractPersistedWebsites(persistedState),
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.warn('最近打开记录恢复失败，将使用空列表。');
        }
      },
    }
  )
);
