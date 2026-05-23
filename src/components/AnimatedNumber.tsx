import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  format?: (value: number) => string;
  className?: string;
  duration?: number;
}

export function AnimatedNumber({ value, format, className = "", duration = 600 }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const frameRef = useRef<number>();
  const startRef = useRef(0);
  const fromRef = useRef(value);

  useEffect(() => {
    fromRef.current = display;
    startRef.current = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = fromRef.current + (value - fromRef.current) * eased;
      setDisplay(next);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [value, duration]);

  const text = format ? format(display) : display.toLocaleString("en-US", { maximumFractionDigits: 2 });

  return <span className={`tabular-nums ${className}`}>{text}</span>;
}
