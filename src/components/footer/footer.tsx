import React from 'react';
import { Layout, Space } from 'antd';
import { GithubOutlined } from '@ant-design/icons';
import styles from './footer.module.less';

const { Footer: AntFooter } = Layout;

const Footer: React.FC = () => {
  return (
    <AntFooter className={styles.footer}>
      <div className={styles.footerContent}>
        <p className={styles.copyright}>
          © {new Date().getFullYear()} Personal Website Navigation
        </p>
        <Space className={styles.links}>
          <a
            href="https://github.com/Narcissus-Ma"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GithubOutlined /> GitHub
          </a>
        </Space>
      </div>
    </AntFooter>
  );
};

export default Footer;
