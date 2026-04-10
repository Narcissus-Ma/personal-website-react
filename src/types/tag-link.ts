export type TagLinkPosition = 'header' | 'footer';

export type TagLinkTarget = '_self' | '_blank';

export interface TagLinkItem {
  id: string;
  name: string;
  en_name: string;
  url: string;
  isExternal: boolean;
  position: TagLinkPosition;
  target?: TagLinkTarget;
  order: number;
  enabled: boolean;
}
