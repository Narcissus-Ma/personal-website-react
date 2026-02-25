import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  HomeOutlined,
  HeartOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  StarOutlined,
  DesktopOutlined,
  PlayCircleOutlined,
  CustomerServiceOutlined,
  PictureOutlined,
  BulbOutlined,
  BookOutlined,
  RocketOutlined,
  GlobalOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useCategories, useLanguage } from '../../hooks';
import styles from './layout.module.less';

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

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: <Link to="/">首页</Link>,
    },
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
    <Layout className={styles.layout}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={260}
        className={styles.sider}
      >
        <div className={styles.logo}>
          {collapsed ? (
            <img src="/assets/images/user-logo.jpg" alt="Logo" />
          ) : (
            <img src="/assets/images/personal-general-logo.png" alt="Logo" />
          )}
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          className={styles.menu}
        />
      </Sider>
      <Layout>
        <Header className={styles.header}>
          <div className={styles.trigger}>
            {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
              onClick: () => setCollapsed(!collapsed),
              className: styles.triggerIcon,
            })}
          </div>
        </Header>
        <Content className={styles.content}>{children}</Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
