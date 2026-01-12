"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ServiceForm } from "@/components/holistic-centers/service-form";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";

export default function NewHolisticCenterServicePage() {
  useUserStoreInit();
  const params = useParams();
  const router = useRouter();
  const adminId = useUserId();
  const centerId = params.centerId as string;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="flex h-16 items-center gap-4 px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/admin/holistic-centers`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Nuevo Servicio</h1>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          <ServiceForm
            centerId={centerId}
            service={null}
            redirectPath={`/admin/holistic-centers`}
          />
        </div>
      </div>
    </div>
  );
}
