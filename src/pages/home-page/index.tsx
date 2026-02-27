import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Select, Button, Space, Tooltip } from 'antd';
import { GithubOutlined, SettingOutlined } from '@ant-design/icons';
import AppLayout from '@/components/layout';
import { WebItem, SearchBox, Footer, AuthModal } from '../../components';
import { useLanguage } from '../../hooks';
import styles from './home-page.module.less';
import { useSiteStore, useAuthStore } from '@/stores';

const HomePage: React.FC = () => {
  const { categories } = useSiteStore();
  const { language, setLanguage, transName, languageOptions } = useLanguage();
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [authModalVisible, setAuthModalVisible] = useState(false);

  useEffect(() => {
    const pathname = location.pathname;
    if (pathname && pathname.startsWith('/category-')) {
      setTimeout(() => {
        const element = document.getElementById(pathname.slice(1));
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [location]);

  const handleManageClick = () => {
    if (isAuthenticated) {
      navigate('/manage');
    } else {
      setAuthModalVisible(true);
    }
  };

  const handleAuthSuccess = () => {
    navigate('/manage');
  };

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
                  icon={<SettingOutlined />}
                  size="large"
                  type="text"
                  onClick={handleManageClick}
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

        <AuthModal
          visible={authModalVisible}
          onClose={() => setAuthModalVisible(false)}
          onSuccess={handleAuthSuccess}
        />
      </div>
    </AppLayout>
  );
};

export default HomePage;
