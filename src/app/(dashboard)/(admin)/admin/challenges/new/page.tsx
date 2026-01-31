"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ChallengeForm } from "@/components/challenges/challenge-form";
import { PageSkeleton } from "@/components/ui/layout-skeleton";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";

function NewAdminChallengePageContent() {
  useUserStoreInit();
  const router = useRouter();
  const searchParams = useSearchParams();
  const adminId = useUserId();
  const professionalId = searchParams.get('professional_id');

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="flex h-16 items-center gap-4 px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (professionalId) {
                router.push(`/admin/professionals/${professionalId}`);
              } else {
                router.push(`/admin/challenges`);
              }
            }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Crear Nuevo Reto</h1>
        </div>
      </div>

      <div className="py-4 px-6">
        <div className="max-w-3xl mx-auto py-4">
          <ChallengeForm
            userId={adminId || ''}
            challenge={null}
            redirectPath={professionalId ? `/admin/professionals/${professionalId}` : `/admin/challenges`}
            userType="admin"
            professionalId={professionalId || null}
          />
        </div>
      </div>
    </div>
  );
}

export default function NewAdminChallengePage() {
  return (
    <Suspense fallback={<PageSkeleton cards={3} />}>
      <NewAdminChallengePageContent />
    </Suspense>
  );
}
