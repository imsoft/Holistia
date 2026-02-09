import { SkeletonChallengeGrid } from "@/components/ui/skeleton-challenge-card";

export default function ChallengesLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <SkeletonChallengeGrid count={6} />
    </div>
  );
}
