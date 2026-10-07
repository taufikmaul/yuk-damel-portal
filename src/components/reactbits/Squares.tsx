import { useEffect, useRef } from 'react';

interface SquaresProps {
  direction?: 'up' | 'down' | 'left' | 'right' | 'diagonal';
  speed?: number;
  borderColor?: string;
  squareSize?: number;
  hoverFillColor?: string;
  className?: string;
}

export function Squares({
  direction = 'diagonal',
  speed = 0.5,
  borderColor = 'rgba(255, 255, 255, 0.06)',
  squareSize = 40,
  hoverFillColor = 'rgba(169, 72, 76, 0.2)',
  className = '',
}: SquaresProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoveredSquareRef = useRef<{ x: number; y: number; opacity: number } | null>(null);
  const offsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      const startX = Math.floor((mouseX - (offsetRef.current.x % squareSize)) / squareSize);
      const startY = Math.floor((mouseY - (offsetRef.current.y % squareSize)) / squareSize);

      hoveredSquareRef.current = {
        x: startX,
        y: startY,
        opacity: 1,
      };
    };

    const handleMouseLeave = () => {
      // slowly fade out in loop
    };

    window.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Update offsets based on direction
      const currentSpeed = speed;
      if (direction === 'left') offsetRef.current.x -= currentSpeed;
      if (direction === 'right') offsetRef.current.x += currentSpeed;
      if (direction === 'up') offsetRef.current.y -= currentSpeed;
      if (direction === 'down') offsetRef.current.y += currentSpeed;
      if (direction === 'diagonal') {
        offsetRef.current.x -= currentSpeed * 0.7;
        offsetRef.current.y -= currentSpeed * 0.7;
      }

      const offsetX = offsetRef.current.x % squareSize;
      const offsetY = offsetRef.current.y % squareSize;

      // Draw hovered square if active
      if (hoveredSquareRef.current) {
        const { x, y, opacity } = hoveredSquareRef.current;
        if (opacity > 0) {
          ctx.save();
          ctx.fillStyle = hoverFillColor;
          ctx.globalAlpha = opacity;
          ctx.fillRect(
            x * squareSize + offsetX,
            y * squareSize + offsetY,
            squareSize,
            squareSize
          );
          ctx.restore();
          hoveredSquareRef.current.opacity -= 0.02;
          if (hoveredSquareRef.current.opacity <= 0) {
            hoveredSquareRef.current = null;
          }
        }
      }

      // Draw grid
      ctx.lineWidth = 1;
      ctx.strokeStyle = borderColor;

      const numCols = Math.ceil(width / squareSize) + 2;
      const numRows = Math.ceil(height / squareSize) + 2;

      for (let i = -1; i < numCols; i++) {
        for (let j = -1; j < numRows; j++) {
          const posX = i * squareSize + offsetX;
          const posY = j * squareSize + offsetY;
          ctx.strokeRect(posX, posY, squareSize, squareSize);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [direction, speed, borderColor, squareSize, hoverFillColor]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-auto w-full h-full ${className}`}
      style={{ display: 'block' }}
    />
  );
}
