"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ServiceForm } from "@/components/holistic-centers/service-form";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  service_type: "individual" | "group";
  max_capacity: number | null;
  is_active: boolean;
}

export default function EditHolisticCenterServicePage() {
  useUserStoreInit();
  const params = useParams();
  const router = useRouter();
  const adminId = useUserId();
  const centerId = params.centerId as string;
  const serviceId = params.serviceId as string;

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const fetchService = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("holistic_center_services")
          .select("*")
          .eq("id", serviceId)
          .single();

        if (error) throw error;

        setService(data);
      } catch (error) {
        console.error("Error fetching service:", error);
        toast.error("Error al cargar el servicio");
        router.push(`/admin/holistic-centers`);
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [serviceId, adminId, router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!service) {
    return null;
  }

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
          <h1 className="text-2xl font-bold">Editar Servicio</h1>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          <ServiceForm
            centerId={centerId}
            service={service}
            redirectPath={`/admin/holistic-centers`}
          />
        </div>
      </div>
    </div>
  );
}
