import type { BackgroundImage } from './background';
import type { Category } from './category';
import type { SearchEngine } from './search-engine';

export interface SiteData {
  categories: Category[];
  searchEngines: SearchEngine[];
  backgrounds: BackgroundImage[];
}
