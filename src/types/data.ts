import { Category } from './category';
import { SearchEngine } from './search-engine';

export interface SiteData {
  categories: Category[];
  searchEngines: SearchEngine[];
}
