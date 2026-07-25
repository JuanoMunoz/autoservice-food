import { cn } from "@/utils/utils"

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-sm", className)}
      style={{ backgroundColor: "var(--color-skeleton)" }}
    />
  )
}


export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div
      className={cn("bg-surface rounded-sm p-4", className)}
      style={{
        border: "1px solid var(--color-border)",
        borderLeft: "2px solid var(--color-skeleton)",
      }}
    >
      <Skeleton className="h-3 w-1/3 mb-3" />
      <Skeleton className="h-5 w-1/2 mb-2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  )
}
