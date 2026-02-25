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
              value={language}
              onChange={(value) => setLanguage(value as 'zh' | 'en')}
              className={styles.languageSelect}
              size="large"
            >
              {languageOptions.map((opt) => (
                <Select.Option key={opt.key} value={opt.key}>
                  <Space>
                    <img src={opt.flag} alt={opt.name} style={{ width: 16, height: 16 }} />
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
                  type="text"
                  icon={<SettingOutlined />}
                  href="/manage"
                  size="large"
                />
              </Tooltip>
              <Tooltip title="GitHub">
                <Button
                  type="text"
                  icon={<GithubOutlined />}
                  href="https://github.com/Narcissus-Ma"
                  target="_blank"
                  size="large"
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
              {item.web && <WebItem item={item} transName={transName} id={`category-${idx}`} />}
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
