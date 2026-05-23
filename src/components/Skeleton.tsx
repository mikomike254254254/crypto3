import { useTheme } from "../context/ThemeContext";

type SkeletonProps = {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "xl" | "full";
};

const roundedMap = {
  sm: "rounded-md",
  md: "rounded-lg",
  lg: "rounded-xl",
  xl: "rounded-2xl",
  full: "rounded-full",
};

export function Skeleton({ className = "", rounded = "md" }: SkeletonProps) {
  const { isDark } = useTheme();
  return (
    <div
      className={`skeleton-shimmer relative overflow-hidden ${roundedMap[rounded]} ${
        isDark ? "bg-neutral-800" : "bg-neutral-200"
      } ${className}`}
      aria-hidden
    />
  );
}

export function SkeletonLine({ width = "w-full", height = "h-4" }: { width?: string; height?: string }) {
  return <Skeleton className={`${width} ${height}`} />;
}
