import { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  to: number;
  from?: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  separator?: string;
}

export function CountUp({
  to,
  from = 0,
  duration = 1.2,
  className = '',
  prefix = '',
  suffix = '',
  separator = '.',
}: CountUpProps) {
  const [value, setValue] = useState(from);
  const startTimeRef = useRef<number | null>(null);
  const startValRef = useRef(from);
  const targetValRef = useRef(to);

  useEffect(() => {
    startValRef.current = value;
    targetValRef.current = to;
    startTimeRef.current = null;

    let animId: number;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / (duration * 1000), 1);
      // easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const currentVal = Math.round(
        startValRef.current + (targetValRef.current - startValRef.current) * easeProgress
      );

      setValue(currentVal);

      if (progress < 1) {
        animId = requestAnimationFrame(animate);
      }
    };

    animId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animId);
  }, [to, duration]);

  const formatNumber = (num: number) => {
    const numStr = num.toString();
    return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  };

  return (
    <span className={className}>
      {prefix}
      {formatNumber(value)}
      {suffix}
    </span>
  );
}
