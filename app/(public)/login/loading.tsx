import { Skeleton } from "@/app/_components/skeleton"

export default function LoginLoading() {
  return (
    <main className="flex min-h-dvh">
      {/* Branding panel */}
      <aside
        className="hidden lg:flex flex-col justify-between w-80 shrink-0 p-10"
        style={{
          background: "var(--color-surface)",
          borderRight: "1px solid var(--color-border)",
        }}
      >
        <Skeleton className="h-5 w-24" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-3/4" />
        </div>
        <Skeleton className="h-3 w-20" />
      </aside>

      {/* Form skeleton */}
      <section className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-5 w-28 mb-1" />
            <Skeleton className="h-3 w-40" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-9 w-full" />
          </div>
          <Skeleton className="h-10 w-full mt-2" />
        </div>
      </section>
    </main>
  )
}
