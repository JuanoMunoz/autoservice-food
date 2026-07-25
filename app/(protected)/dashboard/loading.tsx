import { Skeleton, SkeletonCard } from "@/app/_components/skeleton"

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-8 px-5 py-7 lg:px-8 lg:py-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-2.5 w-20" />
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-3.5 w-56" />
      </div>

      {/* Stats */}
      <div>
        <Skeleton className="h-2.5 w-16 mb-3" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>

      {/* Carouseles */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i}>
          <Skeleton className="h-2.5 w-24 mb-3" />
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 3 }).map((_, j) => (
              <div
                key={j}
                className="shrink-0 flex flex-col gap-3 p-4 rounded-sm"
                style={{
                  width: "240px",
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderLeft: "2px solid var(--color-skeleton)",
                }}
              >
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
