import { useEffect, useRef } from 'react';

import styles from './loading.module.less';

interface LoadingProps {
  isLoading: boolean;
}

export function Loading({ isLoading }: LoadingProps) {
  const loadingRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      if (progressRef.current) {
        progressRef.current.style.width = `${progress}%`;
      }
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!isLoading && loadingRef.current) {
      loadingRef.current.classList.add('loaded');
    }
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <>
      {/* 进度条 */}
      <div className={styles.progressParent}>
        <div ref={progressRef} className={styles.progress}></div>
      </div>
      {/* 加载动画 */}
      <div
        ref={loadingRef}
        className={styles.loadingBox}
        id="loading-box"
        onClick={() => {
          if (loadingRef.current) {
            loadingRef.current.classList.add('loaded');
          }
        }}
      >
        <div className={styles.loadingBg}>
          <img
            alt="加载头像"
            className={styles.loadingImg}
            src="https://img1.tucang.cc/api/image/show/77451257254f3851ce36fc23f98c8c70"
          />
          <div className={styles.loadingImageDot}></div>
        </div>
      </div>
    </>
  );
}
