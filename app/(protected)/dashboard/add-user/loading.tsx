import { Skeleton } from "@/app/_components/skeleton"

export default function AddUserLoading() {
  return (
    <div className="flex flex-col gap-6 px-5 py-7 lg:px-8 lg:py-8 max-w-xl">
      {/* Header */}
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-2.5 w-10" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-3.5 w-64" />
      </div>

      {/* Form skeleton */}
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-2.5 w-12" />
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-2.5 w-14" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-2.5 w-8" />
          <Skeleton className="h-9 w-full" />
        </div>
        <Skeleton className="h-10 w-full mt-1" />
      </div>
    </div>
  )
}
