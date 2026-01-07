"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ChallengeForm } from "@/components/challenges/challenge-form";

export default function NewProfessionalChallengePage() {
  const params = useParams();
  const router = useRouter();
  const professionalId = params.id as string;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="flex h-16 items-center gap-4 px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/professional/${professionalId}/challenges`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Crear Nuevo Reto</h1>
        </div>
      </div>

      <div className="py-4 px-6">
        <div className="max-w-3xl mx-auto py-4">
          <ChallengeForm
            userId={professionalId}
            challenge={null}
            redirectPath={`/professional/${professionalId}/challenges`}
            userType="professional"
          />
        </div>
      </div>
    </div>
  );
}
