import React from 'react';
import lottie, { AnimationItem } from 'lottie-web';

type Props = {
  src: string; // URL to JSON (can be in public/animations)
  width?: number;
  height?: number;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

const Lottie: React.FC<Props> = ({ src, width = 180, height = 120, loop = true, autoplay = true, className, style }) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const animRef = React.useRef<AnimationItem | null>(null);

  React.useEffect(() => {
    if (!containerRef.current) return;

    // Clean up previous instance if any
    if (animRef.current) {
      try { animRef.current.destroy(); } catch {}
      animRef.current = null;
    }

    const instance = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop,
      autoplay,
      path: src,
    });
    animRef.current = instance;

    return () => {
      try { instance.destroy(); } catch {}
      animRef.current = null;
    };
  }, [src, loop, autoplay]);

  // Respect reduced motion
  React.useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handle = () => {
      if (animRef.current) {
        if (media.matches) animRef.current.pause();
        else animRef.current.play();
      }
    };
    handle();
    media.addEventListener?.('change', handle);
    return () => media.removeEventListener?.('change', handle as any);
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width, height, overflow: 'hidden', ...style }}
      aria-hidden
    />
  );
};

export default Lottie;
