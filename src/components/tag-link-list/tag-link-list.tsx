import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Tag } from 'antd';
import type { TagLinkItem } from '@/types';
import styles from './tag-link-list.module.less';

interface TagLinkListProps {
  items: TagLinkItem[];
  language: 'zh' | 'en';
  location: 'header' | 'footer';
  currentPath?: string;
  onTagClick?: (item: TagLinkItem) => void;
}

const TagLinkList: React.FC<TagLinkListProps> = ({
  items,
  language,
  location,
  currentPath,
  onTagClick,
}) => {
  const sortedEnabledItems = useMemo(
    () =>
      [...items].filter(item => item.enabled).sort((a, b) => a.order - b.order),
    [items]
  );

  return (
    <div
      className={[
        styles.tagList,
        location === 'header' ? styles.headerList : styles.footerList,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {sortedEnabledItems.map(item => {
        const label = language === 'zh' ? item.name : item.en_name;
        const isActive =
          !!currentPath && !item.isExternal && currentPath === item.url;
        const tagClassName = [styles.tagItem, isActive ? styles.active : '']
          .filter(Boolean)
          .join(' ');

        return item.isExternal ? (
          <a
            key={item.id}
            href={item.url}
            rel="noopener noreferrer"
            target={item.target || '_blank'}
            onClick={() => onTagClick?.(item)}
          >
            <Tag className={tagClassName}>{label}</Tag>
          </a>
        ) : (
          <Link key={item.id} to={item.url} onClick={() => onTagClick?.(item)}>
            <Tag className={tagClassName}>{label}</Tag>
          </Link>
        );
      })}
    </div>
  );
};

export default TagLinkList;
