"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { DigitalProductForm } from "@/components/digital-products/digital-product-form";

export default function NewAdminDigitalProductPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const adminId = params.id as string;
  const professionalId = searchParams.get('professional_id');

  if (!professionalId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Se requiere el ID del profesional</p>
          <Button onClick={() => router.push(`/admin/${adminId}/professionals`)}>
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
            onClick={() => router.push(`/admin/${adminId}/professionals/${professionalId}`)}
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
            redirectPath={`/admin/${adminId}/professionals/${professionalId}`}
            isAdminContext={true}
          />
        </div>
      </div>
    </div>
  );
}
