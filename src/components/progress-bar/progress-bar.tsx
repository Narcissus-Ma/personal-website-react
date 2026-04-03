import { useEffect, useRef } from 'react';

import styles from './progress-bar.module.less';

export function ProgressBar() {
  const progressRef = useRef<HTMLDivElement>(null);
  const progressParentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          if (progressParentRef.current) {
            progressParentRef.current.classList.add('loaded');
          }
        }, 500);
      }
      if (progressRef.current) {
        progressRef.current.style.width = `${progress}%`;
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div ref={progressParentRef} className={styles.progressParent}>
      <div ref={progressRef} className={styles.progress}></div>
    </div>
  );
}
