import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Select, Button, Space, Tooltip } from 'antd';
import { GithubOutlined, SettingOutlined } from '@ant-design/icons';
import AppLayout from '@/components/layout';
import { WebItem, SearchBox, Footer } from '../../components';
import { useCategories, useLanguage } from '../../hooks';
import styles from './home-page.module.less';

const HomePage: React.FC = () => {
  const { categories } = useCategories();
  const { language, setLanguage, transName, languageOptions } = useLanguage();
  const location = useLocation();

  useEffect(() => {
    const hash = location.hash.slice(2);
    if (hash && hash.startsWith('category-')) {
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [location]);

  return (
    <AppLayout>
      <div className={styles.home}>
        <div className={styles.toolbar}>
          <div className={styles.left}>
            <Select
              className={styles.languageSelect}
              size="large"
              value={language}
              onChange={value => setLanguage(value as 'zh' | 'en')}
            >
              {languageOptions.map(opt => (
                <Select.Option key={opt.key} value={opt.key}>
                  <Space>
                    <img
                      alt={opt.name}
                      src={opt.flag}
                      style={{ width: 16, height: 16 }}
                    />
                    {opt.name}
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </div>
          <div className={styles.right}>
            <Space>
              <Tooltip title="管理入口">
                <Button
                  href="/manage"
                  icon={<SettingOutlined />}
                  size="large"
                  type="text"
                />
              </Tooltip>
              <Tooltip title="GitHub">
                <Button
                  href="https://github.com/Narcissus-Ma"
                  icon={<GithubOutlined />}
                  size="large"
                  target="_blank"
                  type="text"
                >
                  GitHub
                </Button>
              </Tooltip>
            </Space>
          </div>
        </div>

        <SearchBox />

        <div className={styles.content}>
          {categories.map((item, idx) => (
            <div key={idx}>
              {item.web && (
                <WebItem
                  id={`category-${idx}`}
                  item={item}
                  transName={transName}
                />
              )}
              {item.children?.map((subItem, subIdx) => (
                <WebItem key={subIdx} item={subItem} transName={transName} />
              ))}
            </div>
          ))}
        </div>

        <Footer />
      </div>
    </AppLayout>
  );
};

export default HomePage;
