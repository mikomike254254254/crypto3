/** Kenya flag — horizontal stripes + shield emblem */
export function KenyaFlag({ className = "h-4 w-6", title = "Kenya" }: { className?: string; title?: string }) {
  return (
    <img
      src="https://flagcdn.com/w40/ke.png"
      srcSet="https://flagcdn.com/w80/ke.png 2x"
      alt={title}
      title={title}
      className={`inline-block object-cover rounded-[3px] border border-black/15 shadow-sm ${className}`}
      loading="lazy"
    />
  );
}
