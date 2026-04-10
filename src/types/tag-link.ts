export type TagLinkPosition = 'header' | 'footer';

export type TagLinkTarget = '_self' | '_blank';
export type TagLinkIconType = 'none' | 'antd' | 'image';

export interface TagLinkItem {
  id: string;
  name: string;
  en_name: string;
  url: string;
  isExternal: boolean;
  position: TagLinkPosition;
  target?: TagLinkTarget;
  iconType?: TagLinkIconType;
  iconName?: string;
  iconUrl?: string;
  order: number;
  enabled: boolean;
}
