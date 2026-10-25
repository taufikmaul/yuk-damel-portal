import { useEffect, useRef } from 'react';

export function ScrollProgressBar() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;

    const updateScroll = () => {
      if (!barRef.current) return;
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalScroll > 0 ? (window.scrollY / totalScroll) * 100 : 0;
      barRef.current.style.transform = `scaleX(${Math.min(1, Math.max(0, progress / 100))})`;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateScroll);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    updateScroll();

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      ref={barRef}
      aria-hidden="true"
      className="h-[2px] bg-[#a9484c] fixed top-0 left-0 right-0 z-[60] origin-left pointer-events-none transition-transform duration-75"
      style={{ transform: 'scaleX(0)' }}
    />
  );
}
