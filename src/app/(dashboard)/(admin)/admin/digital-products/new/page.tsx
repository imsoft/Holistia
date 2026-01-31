"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { DigitalProductForm } from "@/components/digital-products/digital-product-form";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";

function NewAdminDigitalProductPageContent() {
  useUserStoreInit();
  const router = useRouter();
  const searchParams = useSearchParams();
  const adminId = useUserId();
  const professionalId = searchParams.get('professional_id');

  if (!professionalId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Se requiere el ID del profesional</p>
          <Button onClick={() => router.push(`/admin/professionals`)}>
            Volver a Profesionales
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="flex h-16 items-center gap-4 px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/admin/professionals/${professionalId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Crear Nuevo Programa</h1>
        </div>
      </div>

      <div className="py-4 px-6">
        <div className="max-w-3xl mx-auto">
          <DigitalProductForm
            professionalId={professionalId}
            product={null}
            redirectPath={`/admin/professionals/${professionalId}`}
            isAdminContext={true}
          />
        </div>
      </div>
    </div>
  );
}

export default function NewAdminDigitalProductPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background p-6">
        <div className="animate-pulse space-y-4 w-full max-w-2xl mx-auto">
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
            <div className="h-24 bg-muted rounded" />
        </div>
      </div>
    }>
      <NewAdminDigitalProductPageContent />
    </Suspense>
  );
}
