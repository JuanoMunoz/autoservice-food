import { Skeleton } from "@/app/_components/skeleton"

export default function SetRoleLoading() {
  return (
    <div className="flex flex-col gap-6 px-5 py-7 lg:px-8 lg:py-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-2.5 w-16" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-3.5 w-64" />
      </div>

      {/* Table skeleton */}
      <div
        className="rounded-sm p-4 flex flex-col gap-4"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
        }}
      >
        {/* Table Header mock */}
        <div className="grid grid-cols-4 gap-4 pb-2 border-b border-border">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-10 justify-self-end" />
        </div>

        {/* Rows mock */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="grid grid-cols-4 gap-4 py-2 items-center">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-6 w-6 justify-self-end" />
          </div>
        ))}
      </div>
    </div>
  )
}
