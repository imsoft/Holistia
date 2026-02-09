import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationsLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <Skeleton className="h-8 w-40" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-4 rounded-lg border border-border">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
