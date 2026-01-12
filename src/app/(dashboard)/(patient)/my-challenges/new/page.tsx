"use client";

import { ChallengeForm } from "@/components/challenges/challenge-form";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";

export default function NewChallengePage() {
  useUserStoreInit();
  const patientId = useUserId();

  return (
    <div className="py-4 px-6">
      <div className="max-w-3xl mx-auto py-4">
        <ChallengeForm
          userId={patientId || ''}
          challenge={null}
          redirectPath={`/my-challenges`}
        />
      </div>
    </div>
  );
}
