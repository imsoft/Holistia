import { SkeletonProfile } from "@/components/ui/skeleton-profile";

export default function ProfessionalProfileLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <SkeletonProfile />
    </div>
  );
}
