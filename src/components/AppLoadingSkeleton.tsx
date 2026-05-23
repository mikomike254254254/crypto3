import { Skeleton } from "./Skeleton";
import { useTheme } from "../context/ThemeContext";

export function AppLoadingSkeleton() {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen ${isDark ? "bg-neutral-950" : "bg-neutral-100"}`}>
      <div className="mx-auto max-w-5xl px-3 sm:px-4 pt-3 pb-28">
        <div
          className={`rounded-xl border px-3 py-3 mb-4 flex items-center justify-between ${
            isDark ? "border-neutral-800 bg-neutral-950/90" : "border-neutral-200 bg-white/95"
          }`}
        >
          <div className="flex items-center gap-3">
            <Skeleton className="w-11 h-11" rounded="full" />
            <div className="space-y-2">
              <Skeleton className="w-16 h-2.5" />
              <Skeleton className="w-28 h-3.5" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="w-10 h-10" rounded="lg" />
            <Skeleton className="w-10 h-10" rounded="lg" />
          </div>
        </div>

        <Skeleton className="w-full h-44 mb-4" rounded="xl" />

        <div className="grid grid-cols-4 gap-2 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16" rounded="lg" />
          ))}
        </div>

        <Skeleton className="w-24 h-4 mb-3" />
        <div className="flex gap-2 mb-4 overflow-hidden">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="w-24 h-10 shrink-0" rounded="full" />
          ))}
        </div>

        <div className={`rounded-xl border overflow-hidden ${isDark ? "border-neutral-800" : "border-neutral-200"}`}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`flex items-center gap-3 p-4 ${i < 4 ? (isDark ? "border-b border-neutral-800" : "border-b border-neutral-100") : ""}`}
            >
              <Skeleton className="w-10 h-10 shrink-0" rounded="full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="w-32 h-3.5" />
                <Skeleton className="w-20 h-2.5" />
              </div>
              <Skeleton className="w-16 h-4" />
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:w-[460px] sm:-translate-x-1/2">
        <Skeleton className="w-full h-16" rounded="full" />
      </div>
    </div>
  );
}
