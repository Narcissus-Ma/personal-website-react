import { useEffect, useRef } from 'react';

import styles from './click-effect.module.less';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  life: number;
  maxLife: number;
  element: HTMLDivElement;
}

interface ClickEffectProps {
  type?: 'fireworks' | 'hearts' | 'text';
  text?: string[];
}

export function ClickEffect({
  type = 'fireworks',
  text = ['你好', '欢迎', '探索'],
}: ClickEffectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationIdRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!containerRef.current) return;

    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const x = e.clientX;
      const y = e.clientY;

      if (type === 'text') {
        const randomIndex = Math.floor(Math.random() * text.length);
        const randomText = text[randomIndex] as string;
        const textElement = document.createElement('div');
        textElement.className = styles.text as string;
        textElement.textContent = randomText;
        textElement.style.left = `${x}px`;
        textElement.style.top = `${y}px`;
        containerRef.current.appendChild(textElement);

        setTimeout(() => {
          textElement.remove();
        }, 1000);
      } else {
        const particleCount = type === 'fireworks' ? 30 : 15;
        const newParticles: Particle[] = [];

        for (let i = 0; i < particleCount; i++) {
          const angle = (Math.PI * 2 * i) / particleCount;
          const speed = Math.random() * 3 + 1;

          let color = '';
          if (type === 'fireworks') {
            const colors = [
              '#ff0000',
              '#00ff00',
              '#0000ff',
              '#ffff00',
              '#ff00ff',
              '#00ffff',
            ];
            const colorIndex = Math.floor(Math.random() * colors.length);
            color = colors[colorIndex] as string;
          } else if (type === 'hearts') {
            color = '#ff6b6b';
          }

          const particleElement = document.createElement('div');
          particleElement.className = `${styles.particle} ${type === 'hearts' ? styles.heart : ''}`;
          particleElement.style.position = 'absolute';
          particleElement.style.left = `${x}px`;
          particleElement.style.top = `${y}px`;
          particleElement.style.width = `${Math.random() * 3 + 1}px`;
          particleElement.style.height = `${Math.random() * 3 + 1}px`;
          particleElement.style.backgroundColor = color;
          particleElement.style.borderRadius = '50%';

          containerRef.current.appendChild(particleElement);

          newParticles.push({
            x,
            y,
            size: Math.random() * 30 + 1,
            speedX: Math.cos(angle) * speed,
            speedY: Math.sin(angle) * speed,
            color,
            life: 0,
            maxLife: Math.random() * 100 + 100,
            element: particleElement,
          });
        }

        particlesRef.current.push(...newParticles);
      }
    };

    window.addEventListener('click', handleClick);

    // 动画循环
    const animate = () => {
      particlesRef.current = particlesRef.current.filter(particle => {
        particle.x += particle.speedX;
        particle.y += particle.speedY + 0.2;
        particle.size *= 0.98;
        particle.life += 1;

        particle.element.style.left = `${particle.x}px`;
        particle.element.style.top = `${particle.y}px`;
        particle.element.style.width = `${particle.size}px`;
        particle.element.style.height = `${particle.size}px`;
        particle.element.style.opacity = `${1 - particle.life / particle.maxLife}`;

        if (particle.life >= particle.maxLife) {
          particle.element.remove();
          return false;
        }
        return true;
      });

      animationIdRef.current = requestAnimationFrame(animate);
    };

    animationIdRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('click', handleClick);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      particlesRef.current.forEach(particle => {
        particle.element.remove();
      });
    };
  }, [type, text]);

  return <div ref={containerRef} className={styles.container} />;
}
