import React from 'react';
import { Layout } from 'antd';
import { useLanguage } from '@/hooks';
import { useSiteStore } from '@/stores';
import TagLinkList from '../tag-link-list';
import styles from './footer.module.less';

const { Footer: AntFooter } = Layout;

const Footer: React.FC = () => {
  const { footerTagLinks } = useSiteStore();
  const { language } = useLanguage();

  return (
    <AntFooter className={styles.footer}>
      <div className={styles.footerContent}>
        <p className={styles.copyright}>
          © {new Date().getFullYear()} Personal Website Navigation
        </p>
        <div className={styles.links}>
          <TagLinkList
            items={footerTagLinks}
            language={language}
            location="footer"
          />
        </div>
      </div>
    </AntFooter>
  );
};

export default Footer;
