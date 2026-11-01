import * as React from 'react';
import { cn } from '@/lib/utils';

export type TextTickerAnimationType = 'auto' | 'scroll' | 'bounce';

export interface TextTickerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  duration?: number;
  loop?: boolean;
  bounce?: boolean;
  scrollSpeed?: number;
  marqueeDelay?: number;
  repeatSpacer?: number;
  animationType?: TextTickerAnimationType;
  hoverOnly?: boolean;
  pauseOnHover?: boolean;
  gradientMask?: boolean;
  shouldAnimateTreshold?: number;
  disabled?: boolean;
  className?: string;
  textClassName?: string;
}

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(extractText).join('');
  }
  if (React.isValidElement(node)) {
    return extractText((node.props as any).children);
  }
  return '';
}

export const TextTicker = React.forwardRef<HTMLDivElement, TextTickerProps>(
  (
    {
      children,
      duration: durationProp,
      loop = true,
      bounce = true,
      scrollSpeed = 35,
      marqueeDelay = 1200,
      repeatSpacer = 40,
      animationType = 'bounce',
      hoverOnly = false,
      pauseOnHover = true,
      gradientMask = true,
      shouldAnimateTreshold = 2,
      disabled = false,
      className,
      textClassName,
      onMouseEnter,
      onMouseLeave,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const contentRef = React.useRef<HTMLSpanElement | null>(null);
    const animationRef = React.useRef<Animation | null>(null);

    const [isOverflowing, setIsOverflowing] = React.useState(false);
    const [overflowDistance, setOverflowDistance] = React.useState(0);
    const [contentWidth, setContentWidth] = React.useState(0);
    const [isHovered, setIsHovered] = React.useState(false);

    React.useImperativeHandle(ref, () => containerRef.current as HTMLDivElement);

    const textContent = React.useMemo(() => extractText(children), [children]);

    const resolvedType: 'scroll' | 'bounce' =
      animationType === 'scroll'
        ? 'scroll'
        : animationType === 'bounce' || bounce
        ? 'bounce'
        : 'bounce';

    const measure = React.useCallback(() => {
      if (!containerRef.current || !contentRef.current || disabled) {
        setIsOverflowing(false);
        setOverflowDistance(0);
        setContentWidth(0);
        return;
      }

      const containerWidth = containerRef.current.clientWidth;
      const measuredContentWidth = contentRef.current.scrollWidth;

      const delta = measuredContentWidth - containerWidth;
      if (delta > shouldAnimateTreshold) {
        setIsOverflowing(true);
        setOverflowDistance(delta);
        setContentWidth(measuredContentWidth);
      } else {
        setIsOverflowing(false);
        setOverflowDistance(0);
        setContentWidth(measuredContentWidth);
      }
    }, [disabled, shouldAnimateTreshold]);

    React.useEffect(() => {
      measure();

      if (typeof ResizeObserver === 'undefined') return;

      const observer = new ResizeObserver(() => {
        measure();
      });

      if (containerRef.current) observer.observe(containerRef.current);
      if (contentRef.current) observer.observe(contentRef.current);

      return () => {
        observer.disconnect();
      };
    }, [measure, children]);

    React.useEffect(() => {
      if (animationRef.current) {
        animationRef.current.cancel();
        animationRef.current = null;
      }

      if (!isOverflowing || disabled || !contentRef.current) {
        return;
      }

      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

      if (prefersReducedMotion) {
        return;
      }

      if (hoverOnly && !isHovered) {
        return;
      }

      const target = contentRef.current;

      if (resolvedType === 'bounce') {
        const travelMs = durationProp ?? Math.max(1200, (overflowDistance / scrollSpeed) * 1000);
        const startPauseMs = marqueeDelay;
        const endPauseMs = Math.min(1000, marqueeDelay * 0.75);
        const returnPauseMs = Math.min(800, marqueeDelay * 0.5);

        const totalMs = startPauseMs + travelMs + endPauseMs + travelMs + returnPauseMs;

        const p1 = startPauseMs / totalMs;
        const p2 = (startPauseMs + travelMs) / totalMs;
        const p3 = (startPauseMs + travelMs + endPauseMs) / totalMs;
        const p4 = (startPauseMs + travelMs + endPauseMs + travelMs) / totalMs;

        const keyframes: Keyframe[] = [
          { transform: 'translateX(0px)', offset: 0 },
          { transform: 'translateX(0px)', offset: p1 },
          { transform: `translateX(-${overflowDistance}px)`, offset: p2 },
          { transform: `translateX(-${overflowDistance}px)`, offset: p3 },
          { transform: 'translateX(0px)', offset: p4 },
          { transform: 'translateX(0px)', offset: 1 },
        ];

        try {
          const anim = target.animate(keyframes, {
            duration: totalMs,
            iterations: loop ? Infinity : 1,
            easing: 'ease-in-out',
            fill: 'both',
          });

          animationRef.current = anim;
        } catch {
          // Fallback
        }
      } else {
        const totalDistance = contentWidth + repeatSpacer;
        const travelMs = durationProp ?? (totalDistance / scrollSpeed) * 1000;

        const keyframes: Keyframe[] = [
          { transform: 'translateX(0px)' },
          { transform: `translateX(-${totalDistance}px)` },
        ];

        try {
          const anim = target.animate(keyframes, {
            duration: travelMs,
            delay: marqueeDelay,
            iterations: loop ? Infinity : 1,
            easing: 'linear',
            fill: 'both',
          });

          animationRef.current = anim;
        } catch {
          // Fallback
        }
      }

      return () => {
        if (animationRef.current) {
          animationRef.current.cancel();
          animationRef.current = null;
        }
      };
    }, [
      isOverflowing,
      disabled,
      overflowDistance,
      contentWidth,
      resolvedType,
      durationProp,
      scrollSpeed,
      marqueeDelay,
      repeatSpacer,
      loop,
      hoverOnly,
      isHovered,
    ]);

    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
      setIsHovered(true);
      if (pauseOnHover && !hoverOnly && animationRef.current && animationRef.current.playState === 'running') {
        animationRef.current.pause();
      }
      onMouseEnter?.(e);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
      setIsHovered(false);
      if (pauseOnHover && !hoverOnly && animationRef.current && animationRef.current.playState === 'paused') {
        animationRef.current.play();
      }
      onMouseLeave?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLDivElement>) => {
      setIsHovered(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
      setIsHovered(false);
      onBlur?.(e);
    };

    const maskStyle: React.CSSProperties = React.useMemo(() => {
      if (!isOverflowing || !gradientMask) return {};

      if (resolvedType === 'scroll') {
        return {
          maskImage: 'linear-gradient(to right, transparent, black 8px, black calc(100% - 12px), transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 8px, black calc(100% - 12px), transparent)',
        };
      }

      return {
        maskImage: 'linear-gradient(to right, black calc(100% - 14px), transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, black calc(100% - 14px), transparent 100%)',
      };
    }, [isOverflowing, gradientMask, resolvedType]);

    if (!isOverflowing) {
      return (
        <div
          ref={containerRef}
          className={cn('inline-flex max-w-full items-center min-w-0 truncate', className)}
          title={textContent || undefined}
          {...props}
        >
          <span ref={contentRef} className={cn('truncate', textClassName)}>
            {children}
          </span>
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        data-slot="text-ticker"
        data-overflow={isOverflowing}
        className={cn(
          'relative inline-flex max-w-full min-w-0 items-center overflow-hidden select-none',
          className
        )}
        style={{ ...maskStyle, ...props.style }}
        title={textContent || undefined}
        aria-label={textContent || undefined}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      >
        <span
          ref={contentRef}
          className={cn(
            'inline-flex items-center whitespace-nowrap will-change-transform',
            textClassName
          )}
        >
          <span>{children}</span>
          {resolvedType === 'scroll' && isOverflowing && (
            <span
              style={{ marginLeft: repeatSpacer }}
              aria-hidden="true"
              className="select-none opacity-90"
            >
              {children}
            </span>
          )}
        </span>
      </div>
    );
  }
);

TextTicker.displayName = 'TextTicker';

export default TextTicker;
