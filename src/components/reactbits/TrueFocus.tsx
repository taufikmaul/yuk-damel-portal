import { useEffect, useRef, useState } from 'react';

interface TrueFocusProps {
  sentence?: string;
  manualMode?: boolean;
  blurAmount?: number;
  borderColor?: string;
  glowColor?: string;
  animationDuration?: number;
  pauseBetweenAnimations?: number;
  className?: string;
}

export function TrueFocus({
  sentence = 'Satu Solusi Untuk Seluruh Absensi & Gaji',
  manualMode = false,
  blurAmount = 4,
  borderColor = '#a9484c',
  glowColor = 'rgba(169, 72, 76, 0.4)',
  animationDuration = 0.4,
  pauseBetweenAnimations = 1,
  className = '',
}: TrueFocusProps) {
  const words = sentence.split(' ');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastActiveIndex, setLastActiveIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [focusRect, setFocusRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    if (!manualMode) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % words.length);
      }, (animationDuration + pauseBetweenAnimations) * 1000);

      return () => clearInterval(interval);
    }
  }, [manualMode, animationDuration, pauseBetweenAnimations, words.length]);

  useEffect(() => {
    if (currentIndex === null || currentIndex === -1) return;
    if (!wordRefs.current[currentIndex] || !containerRef.current) return;

    const parentRect = containerRef.current.getBoundingClientRect();
    const activeRect = wordRefs.current[currentIndex]!.getBoundingClientRect();

    setFocusRect({
      x: activeRect.left - parentRect.left,
      y: activeRect.top - parentRect.top,
      width: activeRect.width,
      height: activeRect.height,
    });
  }, [currentIndex, words.length]);

  const handleMouseEnter = (index: number) => {
    if (manualMode) {
      setLastActiveIndex(index);
      setCurrentIndex(index);
    }
  };

  const handleMouseLeave = () => {
    if (manualMode) {
      setCurrentIndex(lastActiveIndex ?? 0);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex gap-3 justify-center items-center flex-wrap ${className}`}
    >
      {words.map((word, index) => {
        const isActive = index === currentIndex;
        return (
          <span
            key={index}
            ref={(el) => {
              wordRefs.current[index] = el;
            }}
            className="relative text-2xl sm:text-4xl lg:text-5xl font-black cursor-pointer transition-all duration-300 select-none px-1"
            style={{
              filter:
                manualMode
                  ? isActive
                    ? 'blur(0px)'
                    : `blur(${blurAmount}px)`
                  : isActive
                  ? 'blur(0px)'
                  : `blur(${blurAmount}px)`,
              opacity: isActive ? 1 : 0.35,
            }}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
          >
            {word}
          </span>
        );
      })}

      {/* Focus Box with bracket corners */}
      <div
        className="pointer-events-none absolute transition-all ease-out"
        style={{
          transform: `translate(${focusRect.x}px, ${focusRect.y}px)`,
          width: `${focusRect.width}px`,
          height: `${focusRect.height}px`,
          transitionDuration: `${animationDuration}s`,
        }}
      >
        <span
          className="absolute w-3 h-3 border-t-2 border-l-2 -top-1 -left-1 rounded-tl-sm transition-all duration-300"
          style={{
            borderColor: borderColor,
            filter: `drop-shadow(0 0 6px ${glowColor})`,
          }}
        />
        <span
          className="absolute w-3 h-3 border-t-2 border-r-2 -top-1 -right-1 rounded-tr-sm transition-all duration-300"
          style={{
            borderColor: borderColor,
            filter: `drop-shadow(0 0 6px ${glowColor})`,
          }}
        />
        <span
          className="absolute w-3 h-3 border-b-2 border-l-2 -bottom-1 -left-1 rounded-bl-sm transition-all duration-300"
          style={{
            borderColor: borderColor,
            filter: `drop-shadow(0 0 6px ${glowColor})`,
          }}
        />
        <span
          className="absolute w-3 h-3 border-b-2 border-r-2 -bottom-1 -right-1 rounded-br-sm transition-all duration-300"
          style={{
            borderColor: borderColor,
            filter: `drop-shadow(0 0 6px ${glowColor})`,
          }}
        />
      </div>
    </div>
  );
}
