import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Tag } from 'antd';
import {
  BookOutlined,
  CoffeeOutlined,
  GithubOutlined,
  GlobalOutlined,
  HeartOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  StarOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import type { TagLinkItem } from '@/types';
import styles from './tag-link-list.module.less';

interface TagLinkListProps {
  items: TagLinkItem[];
  language: 'zh' | 'en';
  location: 'header' | 'footer';
  currentPath?: string;
  onTagClick?: (item: TagLinkItem) => void;
}

const antdIconMap: Record<string, React.ReactNode> = {
  HomeOutlined: <HomeOutlined />,
  InfoCircleOutlined: <InfoCircleOutlined />,
  LinkOutlined: <LinkOutlined />,
  GlobalOutlined: <GlobalOutlined />,
  GithubOutlined: <GithubOutlined />,
  StarOutlined: <StarOutlined />,
  HeartOutlined: <HeartOutlined />,
  ToolOutlined: <ToolOutlined />,
  BookOutlined: <BookOutlined />,
  CoffeeOutlined: <CoffeeOutlined />,
};

const renderTagIcon = (
  item: TagLinkItem,
  isImageBroken: boolean,
  onImageError: (id: string) => void
): React.ReactNode => {
  if (item.iconType === 'image' && item.iconUrl) {
    if (isImageBroken) {
      return <LinkOutlined />;
    }
    return (
      <img
        alt=""
        className={styles.customIcon}
        src={item.iconUrl}
        onError={() => onImageError(item.id)}
      />
    );
  }
  if (item.iconType === 'antd' && item.iconName) {
    return antdIconMap[item.iconName] || null;
  }
  return null;
};

const TagLinkList: React.FC<TagLinkListProps> = ({
  items,
  language,
  location,
  currentPath,
  onTagClick,
}) => {
  const [brokenImageIconIds, setBrokenImageIconIds] = useState<string[]>([]);
  const sortedEnabledItems = useMemo(
    () =>
      [...items].filter(item => item.enabled).sort((a, b) => a.order - b.order),
    [items]
  );

  const handleImageError = (id: string) => {
    setBrokenImageIconIds(prev => (prev.includes(id) ? prev : [...prev, id]));
  };

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
        const icon = renderTagIcon(
          item,
          brokenImageIconIds.includes(item.id),
          handleImageError
        );
        const tagContent = (
          <span className={styles.tagContent}>
            {icon ? <span className={styles.iconWrap}>{icon}</span> : null}
            <span>{label}</span>
          </span>
        );

        return item.isExternal ? (
          <a
            key={item.id}
            href={item.url}
            rel="noopener noreferrer"
            target={item.target || '_blank'}
            onClick={() => onTagClick?.(item)}
          >
            <Tag className={tagClassName}>{tagContent}</Tag>
          </a>
        ) : (
          <Link key={item.id} to={item.url} onClick={() => onTagClick?.(item)}>
            <Tag className={tagClassName}>{tagContent}</Tag>
          </Link>
        );
      })}
    </div>
  );
};

export default TagLinkList;
