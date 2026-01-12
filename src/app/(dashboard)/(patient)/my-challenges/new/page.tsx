"use client";

import { useParams } from "next/navigation";
import { ChallengeForm } from "@/components/challenges/challenge-form";

export default function NewChallengePage() {
  const params = useParams();
  const patientId = params.id as string;

  return (
    <div className="py-4 px-6">
      <div className="max-w-3xl mx-auto py-4">
        <ChallengeForm
          userId={patientId}
          challenge={null}
          redirectPath={`/patient/${patientId}/my-challenges`}
        />
      </div>
    </div>
  );
}
