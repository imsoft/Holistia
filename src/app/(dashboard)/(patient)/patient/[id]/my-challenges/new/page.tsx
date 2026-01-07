"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ChallengeForm } from "@/components/challenges/challenge-form";

export default function NewChallengePage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex h-16 items-center gap-4 px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/patient/${patientId}/my-challenges`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Nuevo Reto Personal</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-4 px-6">
        <div className="max-w-3xl mx-auto">
          <ChallengeForm
            userId={patientId}
            challenge={null}
            redirectPath={`/patient/${patientId}/my-challenges`}
          />
        </div>
      </div>
    </div>
  );
}
