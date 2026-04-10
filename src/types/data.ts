import type { BackgroundImage } from './background';
import type { Category } from './category';
import type { SearchEngine } from './search-engine';
import type { TagLinkItem } from './tag-link';

export interface SiteData {
  categories: Category[];
  searchEngines: SearchEngine[];
  backgrounds: BackgroundImage[];
  headerTagLinks: TagLinkItem[];
  footerTagLinks: TagLinkItem[];
}
