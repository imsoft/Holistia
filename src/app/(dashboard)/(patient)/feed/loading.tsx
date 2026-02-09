import { SkeletonPostList } from "@/components/ui/skeleton-post";

export default function FeedLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <SkeletonPostList count={4} />
    </div>
  );
}
