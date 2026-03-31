import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Drawer, Layout, Menu } from 'antd';
import {
  HeartOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MenuOutlined,
  StarOutlined,
  DesktopOutlined,
  PlayCircleOutlined,
  BulbOutlined,
  BookOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useCategories, useIsMobile, useLanguage, useTheme } from '../../hooks';
import styles from './layout.module.less';
import collapsedLogo from '../../assets/images/user-logo.jpg';
import expandedLogo from '../../assets/images/personal-general-logo.png';

const { Header, Sider, Content } = Layout;

interface LayoutProps {
  children: React.ReactNode;
}

const iconMap: Record<string, React.ReactNode> = {
  'linecons-star': <StarOutlined />,
  'linecons-cog': <DesktopOutlined />,
  'linecons-video': <PlayCircleOutlined />,
  'linecons-doc': <BookOutlined />,
  'linecons-lightbulb': <BulbOutlined />,
  'linecons-heart': <HeartOutlined />,
};

const AppLayout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { categories } = useCategories();
  const { language, transName } = useLanguage();
  const { theme } = useTheme();
  const isMobile = useIsMobile();

  const selectedKey = `#${location.pathname}`;

  const menuItems = useMemo(() => {
    return [
      ...categories.map((category, index) => ({
        key: `#/category-${index}`,
        icon: iconMap[category.icon] || <AppstoreOutlined />,
        label: <Link to={`/category-${index}`}>{transName(category)}</Link>,
      })),
      {
        key: '#/about',
        icon: <HeartOutlined />,
        label: <Link to="/about">{language === 'zh' ? '关于' : 'About'}</Link>,
      },
    ];
  }, [categories, transName, language]);

  const handleToggleMenu = () => {
    if (isMobile) {
      setMobileMenuOpen(true);
      return;
    }
    setCollapsed(prev => !prev);
  };

  return (
    <Layout
      className={[
        styles.layout,
        collapsed ? styles.layoutCollapsed : '',
        isMobile ? styles.layoutMobile : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {!isMobile && (
        <Sider
          collapsible
          className={styles.sider}
          collapsed={collapsed}
          collapsedWidth={80}
          trigger={null}
          width={260}
        >
          <div className={styles.logo}>
            {collapsed ? (
              <img alt="Logo" src={collapsedLogo} />
            ) : (
              <img alt="Logo" src={expandedLogo} />
            )}
          </div>
          <div className={styles.siderMenu}>
            <Menu
              className={styles.menu}
              items={menuItems}
              mode="inline"
              selectedKeys={[selectedKey]}
              theme={theme === 'dark' ? 'dark' : 'light'}
            />
          </div>
        </Sider>
      )}
      <Layout>
        <Header className={styles.header}>
          <div className={styles.trigger}>
            {React.createElement(
              isMobile
                ? MenuOutlined
                : collapsed
                  ? MenuUnfoldOutlined
                  : MenuFoldOutlined,
              {
                onClick: handleToggleMenu,
                className: styles.triggerIcon,
              }
            )}
          </div>
        </Header>
        <Content className={styles.content}>{children}</Content>
      </Layout>

      <Drawer
        className={styles.mobileDrawer}
        open={mobileMenuOpen}
        placement="left"
        title={null}
        width={260}
        onClose={() => setMobileMenuOpen(false)}
      >
        <div className={styles.logo}>
          <img alt="Logo" src={expandedLogo} />
        </div>
        <Menu
          className={styles.menu}
          items={menuItems}
          mode="inline"
          selectedKeys={[selectedKey]}
          theme={theme === 'dark' ? 'dark' : 'light'}
          onClick={() => setMobileMenuOpen(false)}
        />
      </Drawer>
    </Layout>
  );
};

export default AppLayout;
