import React from 'react';
import { Card, Tag } from 'antd';
import {
  StarOutlined,
  DesktopOutlined,
  PlayCircleOutlined,
  BookOutlined,
  BulbOutlined,
  HeartOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { Category, Website } from '../../types';
import styles from './web-item.module.less';

const iconMap: Record<string, React.ReactNode> = {
  'linecons-star': <StarOutlined />,
  'linecons-cog': <DesktopOutlined />,
  'linecons-video': <PlayCircleOutlined />,
  'linecons-doc': <BookOutlined />,
  'linecons-lightbulb': <BulbOutlined />,
  'linecons-heart': <HeartOutlined />,
};

interface WebItemProps {
  item: Category | Website;
  transName: (item: { name: string; en_name: string }) => string;
  id?: string;
}

const WebItem: React.FC<WebItemProps> = ({ item, transName, id }) => {
  if ('web' in item && item.web) {
    return (
      <div className={styles.categorySection} id={id}>
        <div className={styles.categoryHeader}>
          <h3 className={styles.categoryTitle}>
            {item.icon && (
              <span className={styles.icon}>
                {iconMap[item.icon] || <AppstoreOutlined />}
              </span>
            )}
            {transName(item)}
          </h3>
        </div>
        <div className={styles.webGrid}>
          {item.web.map((web, idx) => (
            <Card
              key={idx}
              hoverable
              className={styles.webCard}
              onClick={() => window.open(web.url, '_blank')}
            >
              <div className={styles.cardHeader}>
                <div className={styles.logoWrapper}>
                  <img
                    alt={web.title}
                    className={styles.webLogo}
                    src={web.logo}
                    onError={e => {
                      (e.target as HTMLImageElement).src =
                        'https://img1.tucang.cc/api/image/show/e1306a391e2a2a324370bfee481f497b';
                    }}
                  />
                </div>
                <span className={styles.webTitle}>{web.title}</span>
              </div>
              <div className={styles.descRow}>
                <span className={styles.webDesc}>{web.desc}</span>
              </div>
              {web.is_hot && (
                <Tag className={styles.hotTag} color="red">
                  Hot
                </Tag>
              )}
            </Card>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default WebItem;
