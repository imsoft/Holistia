"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { DigitalProductForm } from "@/components/digital-products/digital-product-form";

export default function NewDigitalProductPage() {
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
            onClick={() => router.push(`/professional/${professionalId}/digital-products`)}
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
            redirectPath={`/professional/${professionalId}/digital-products`}
          />
        </div>
      </div>
    </div>
  );
}
