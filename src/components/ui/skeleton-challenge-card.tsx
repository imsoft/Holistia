import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonChallengeCard() {
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden py-4">
      {/* Cover Image */}
      <Skeleton className="h-48 w-full" />

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-6 w-3/4" />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonChallengeGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonChallengeCard key={i} />
      ))}
    </div>
  );
}
