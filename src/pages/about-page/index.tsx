import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Typography, Space, Tag, Modal, Image } from 'antd';
import {
  ArrowLeftOutlined,
  GithubOutlined,
  GlobalOutlined,
  SafetyCertificateOutlined,
  ApiOutlined,
  WechatOutlined,
  MailOutlined,
  CoffeeOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import AppLayout from '../../components/layout';
import styles from './about-page.module.less';

const { Title, Paragraph, Text } = Typography;

const AboutPage: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
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
          <Link className={styles.backBtn} to="/">
            <ArrowLeftOutlined /> 返回首页
          </Link>
          <Title level={2}>关于本站</Title>
        </div>

        <Card className={styles.card}>
          <Title level={4}>项目介绍</Title>
          <Paragraph>
            Personal Website Navigation
            是一个个人网站导航平台，用于整理和收藏常用网站资源。 本项目采用
            React + TypeScript + Ant Design 技术栈构建。
          </Paragraph>
        </Card>

        <Card className={styles.card} title="技术栈">
          <Space wrap>
            <Tag color="blue">React 18</Tag>
            <Tag color="blue">TypeScript</Tag>
            <Tag color="processing">Vite</Tag>
            <Tag color="green">Ant Design</Tag>
            <Tag color="orange">Zustand</Tag>
            <Tag color="purple">Less</Tag>
          </Space>
        </Card>

        <Card className={styles.card} title="功能特性">
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
          <div className={styles.contactContainer}>
            <div className={styles.qrcodeSection}>
              <Image
                alt="微信二维码"
                className={styles.wechatQrcode}
                preview={false}
                src="https://img1.tucang.cc/api/image/show/3617da2bbb6b3c32bdacde706e91fcb7"
              />
              <div className={styles.qrcodeDesc}>扫描二维码添加作者微信</div>
            </div>
            <div className={styles.infoSection}>
              <Paragraph className={styles.introText}>
                如果您有想要添加的网站，或者有任何问题或建议，欢迎通过以下方式联系我：
              </Paragraph>
              <div className={styles.contactList}>
                <div className={styles.contactItem}>
                  <GithubOutlined className={styles.contactIcon} />
                  <Text>
                    GitHub：
                    <a
                      href="https://github.com/Narcissus-Ma"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      @Narcissus-Ma
                    </a>
                  </Text>
                </div>
                <div className={styles.contactItem}>
                  <WechatOutlined className={styles.contactIcon} />
                  <Text>微信：扫描左侧二维码</Text>
                </div>
                <div className={styles.contactItem}>
                  <MailOutlined className={styles.contactIcon} />
                  <Text>邮箱：577008637@qq.comm</Text>
                </div>
              </div>
              <div
                className={styles.coffeeBtn}
                onClick={() => setModalVisible(true)}
              >
                <CoffeeOutlined />
                <span>请作者喝咖啡</span>
              </div>
            </div>
          </div>
        </Card>

        <Modal
          centered
          className={styles.coffeeModal}
          closable={false}
          footer={null}
          open={modalVisible}
          title={
            <div className={styles.modalTitle}>
              <span>请作者喝咖啡</span>
              <CloseOutlined onClick={() => setModalVisible(false)} />
            </div>
          }
          onCancel={() => setModalVisible(false)}
        >
          <div className={styles.modalContent}>
            <div className={styles.qrcodeContainer}>
              <div className={styles.qrcodeItem}>
                <Image
                  alt="微信支付"
                  className={styles.qrcodeImg}
                  preview={false}
                  src="https://img1.tucang.cc/api/image/show/247b85df82d26ba81be19f0b4da5d61f"
                />
                <div className={styles.qrcodeLabel}>微信支付</div>
              </div>
              <div className={styles.qrcodeItem}>
                <Image
                  alt="支付宝"
                  className={styles.qrcodeImg}
                  preview={false}
                  src="https://img1.tucang.cc/api/image/show/35aa760f2a898ea748aecd8fda32f674"
                />
                <div className={styles.qrcodeLabel}>支付宝</div>
              </div>
            </div>
            <div className={styles.thankYouText}>感谢您的支持！</div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
};

export default AboutPage;
