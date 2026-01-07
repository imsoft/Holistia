"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ChallengeForm } from "@/components/challenges/challenge-form";

export default function NewAdminChallengePage() {
  const params = useParams();
  const router = useRouter();
  const adminId = params.id as string;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="flex h-16 items-center gap-4 px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/admin/${adminId}/challenges`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Crear Nuevo Reto</h1>
        </div>
      </div>

      <div className="py-4 px-6">
        <div className="max-w-3xl mx-auto py-4">
          <ChallengeForm
            userId={adminId}
            challenge={null}
            redirectPath={`/admin/${adminId}/challenges`}
            userType="admin"
          />
        </div>
      </div>
    </div>
  );
}
