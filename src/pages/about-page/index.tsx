import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Typography, Space, Tag } from 'antd';
import {
  ArrowLeftOutlined,
  GithubOutlined,
  GlobalOutlined,
  SafetyCertificateOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import AppLayout from '../../components/layout';
import styles from './about-page.module.less';

const { Title, Paragraph, Text } = Typography;

const AboutPage: React.FC = () => {
  const features = [
    { icon: <GlobalOutlined />, text: '网站分类管理' },
    { icon: <ApiOutlined />, text: '多搜索引擎支持' },
    { icon: <SafetyCertificateOutlined />, text: '数据持久化' },
    { icon: <GlobalOutlined />, text: '响应式设计' },
  ];

  return (
    <AppLayout>
      <div className={styles.about}>
        <div className={styles.header}>
          <Link to="/" className={styles.backBtn}>
            <ArrowLeftOutlined /> 返回首页
          </Link>
          <Title level={2}>关于本站</Title>
        </div>

        <Card className={styles.card}>
          <Title level={4}>项目介绍</Title>
          <Paragraph>
            Personal Website Navigation 是一个个人网站导航平台，用于整理和收藏常用网站资源。
            本项目采用 React + TypeScript + Ant Design 技术栈构建。
          </Paragraph>
        </Card>

        <Card title="技术栈" className={styles.card}>
          <Space wrap>
            <Tag color="blue">React 18</Tag>
            <Tag color="blue">TypeScript</Tag>
            <Tag color="processing">Vite</Tag>
            <Tag color="green">Ant Design</Tag>
            <Tag color="orange">Zustand</Tag>
            <Tag color="purple">Less</Tag>
          </Space>
        </Card>

        <Card title="功能特性" className={styles.card}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {features.map((feature, index) => (
              <div key={index} className={styles.feature}>
                <span className={styles.featureIcon}>{feature.icon}</span>
                <Text>{feature.text}</Text>
              </div>
            ))}
          </Space>
        </Card>

        <Card className={styles.card}>
          <Title level={4}>联系方式</Title>
          <Paragraph>
            <Space>
              <GithubOutlined />
              <Text copyable>
                <a href="https://github.com/Narcissus-Ma" target="_blank" rel="noopener noreferrer">
                  Narcissus-Ma
                </a>
              </Text>
            </Space>
          </Paragraph>
        </Card>
      </div>
    </AppLayout>
  );
};

export default AboutPage;
