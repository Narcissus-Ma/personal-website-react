import React from 'react';
import { Card, Tag } from 'antd';
import { Category, Website } from '../../types';
import styles from './web-item.module.less';

interface WebItemProps {
  item: Category | Website;
  transName: (item: Category) => string;
  id?: string;
}

const WebItem: React.FC<WebItemProps> = ({ item, transName, id }) => {
  if ('web' in item && item.web) {
    return (
      <div className={styles.categorySection} id={id}>
        <div className={styles.categoryHeader}>
          <h3 className={styles.categoryTitle}>
            {item.icon && <span className={styles.icon}>{item.icon}</span>}
            {transName(item)}
          </h3>
        </div>
        <div className={styles.webGrid}>
          {item.web.map((web, idx) => (
            <Card
              key={idx}
              className={styles.webCard}
              onClick={() => window.open(web.url, '_blank')}
              hoverable
              cover={
                <div className={styles.logoWrapper}>
                  <img
                    src={web.logo}
                    alt={web.title}
                    className={styles.webLogo}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://img1.tucang.cc/api/image/show/e1306a391e2a2a324370bfee481f497b';
                    }}
                  />
                </div>
              }
            >
              <Card.Meta
                title={<span className={styles.webTitle}>{web.title}</span>}
                description={<span className={styles.webDesc}>{web.desc}</span>}
              />
              {web.is_hot && (
                <Tag color="red" className={styles.hotTag}>
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
