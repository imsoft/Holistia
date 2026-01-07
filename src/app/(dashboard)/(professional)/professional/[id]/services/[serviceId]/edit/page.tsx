"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ServiceForm } from "@/components/services/service-form";
import { Service } from "@/types/service";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export default function EditServicePage() {
  const params = useParams();
  const router = useRouter();
  const professionalId = params.id as string;
  const serviceId = params.serviceId as string;
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchService = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("professional_services")
          .select("*")
          .eq("id", serviceId)
          .single();

        if (error) throw error;
        setService(data);
      } catch (error) {
        console.error("Error fetching service:", error);
        toast.error("Error al cargar el servicio");
        router.push(`/professional/${professionalId}/services`);
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [serviceId, supabase, router, professionalId]);

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

  if (!service) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Servicio no encontrado</p>
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
            onClick={() => router.push(`/professional/${professionalId}/services`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Editar Servicio</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          <ServiceForm
            professionalId={professionalId}
            userId={professionalId}
            service={service}
            redirectPath={`/professional/${professionalId}/services`}
          />
        </div>
      </div>
    </div>
  );
}
