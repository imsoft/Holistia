"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ServiceForm } from "@/components/services/service-form";
import { Service } from "@/types/service";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";

export default function EditAdminServicePage() {
  useUserStoreInit();
  const params = useParams();
  const router = useRouter();
  const professionalId = params.professionalId as string;
  const serviceId = params.serviceId as string;
  const [service, setService] = useState<Service | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Obtener el servicio
        const { data: serviceData, error: serviceError } = await supabase
          .from("professional_services")
          .select("*")
          .eq("id", serviceId)
          .single();

        if (serviceError) throw serviceError;
        setService(serviceData);

        // Obtener el user_id del profesional
        const { data: professionalData, error: professionalError } = await supabase
          .from('professional_applications')
          .select('user_id')
          .eq('id', professionalId)
          .single();

        if (professionalError) throw professionalError;
        setUserId(professionalData?.user_id || null);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Error al cargar el servicio");
        router.push(`/admin/professionals/${professionalId}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [serviceId, professionalId, router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Cargando servicio...</p>
        </div>
      </div>
    );
  }

  if (!service || !userId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">Servicio no encontrado</p>
          <Button onClick={() => router.push(`/admin/professionals/${professionalId}`)}>
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex h-16 items-center gap-4 px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/admin/professionals/${professionalId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Editar Servicio</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-4 px-6">
        <div className="max-w-3xl mx-auto">
          <ServiceForm
            professionalId={professionalId}
            userId={userId}
            service={service}
            redirectPath={`/admin/professionals/${professionalId}`}
          />
        </div>
      </div>
    </div>
  );
}
