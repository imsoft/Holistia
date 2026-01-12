"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ServiceForm } from "@/components/services/service-form";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export default function NewServicePage() {
  const params = useParams();
  const router = useRouter();
  const professionalId = params.id as string;
  const [userId, setUserId] = useState<string | null>(null);
  const [actualProfessionalId, setActualProfessionalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchProfessionalData = async () => {
      try {
        // El professionalId en la URL es el user_id, no el id de professional_applications
        // Primero intentamos obtener el professional_id desde professional_applications usando user_id
        const { data: professionalData, error } = await supabase
          .from('professional_applications')
          .select('id, user_id')
          .eq('user_id', professionalId)
          .eq('status', 'approved')
          .maybeSingle();

        if (error) {
          console.error('Error fetching professional data:', error);
          toast.error('Error al cargar información del profesional');
          router.push(`/services`);
          return;
        }

        if (professionalData) {
          // El professionalId en la URL es el user_id
          setUserId(professionalData.user_id);
          // El actualProfessionalId es el id de professional_applications (necesario para crear servicios)
          setActualProfessionalId(professionalData.id);
        } else {
          // Si no se encuentra, el professionalId podría ser el id de professional_applications
          // Intentar buscar por id como fallback
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('professional_applications')
            .select('id, user_id')
            .eq('id', professionalId)
            .maybeSingle();

          if (fallbackError || !fallbackData) {
            toast.error('No se encontró información del profesional');
            router.push(`/services`);
            return;
          }

          setUserId(fallbackData.user_id);
          setActualProfessionalId(fallbackData.id);
        }
      } catch (error) {
        console.error('Error fetching professional data:', error);
        toast.error('Error al cargar información del profesional');
        router.push(`/services`);
      } finally {
        setLoading(false);
      }
    };

    if (!professionalId) {
      setLoading(false);
      return;
    }
    
    fetchProfessionalData();
  }, [professionalId, router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!userId || !actualProfessionalId) {
    return null; // El useEffect ya redirige
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex h-16 items-center gap-4 px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/services`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Nuevo Servicio</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-4 px-6">
        <div className="max-w-3xl mx-auto">
          <ServiceForm
            professionalId={actualProfessionalId}
            userId={userId}
            service={null}
            redirectPath={`/services`}
          />
        </div>
      </div>
    </div>
  );
}
