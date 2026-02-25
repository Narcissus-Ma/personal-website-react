import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  HeartOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  StarOutlined,
  DesktopOutlined,
  PlayCircleOutlined,
  BulbOutlined,
  BookOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useCategories, useLanguage } from '../../hooks';
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
  const { categories } = useCategories();
  const { transName } = useLanguage();

  const selectedKey = location.hash.slice(2) || location.pathname;

  const menuItems = [
    ...categories.map((category, index) => ({
      key: `category-${index}`,
      icon: iconMap[category.icon] || <AppstoreOutlined />,
      label: <Link to={`/#/category-${index}`}>{transName(category)}</Link>,
    })),
    {
      key: '/about',
      icon: <HeartOutlined />,
      label: <Link to="/about">关于</Link>,
    },
  ];

  return (
    <Layout
      className={`${styles.layout} ${collapsed ? styles.layoutCollapsed : ''}`}
    >
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
        <Menu
          className={styles.menu}
          items={menuItems}
          mode="inline"
          selectedKeys={[selectedKey]}
          theme="light"
        />
      </Sider>
      <Layout>
        <Header className={styles.header}>
          <div className={styles.trigger}>
            {React.createElement(
              collapsed ? MenuUnfoldOutlined : MenuFoldOutlined,
              {
                onClick: () => setCollapsed(!collapsed),
                className: styles.triggerIcon,
              }
            )}
          </div>
        </Header>
        <Content className={styles.content}>{children}</Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
