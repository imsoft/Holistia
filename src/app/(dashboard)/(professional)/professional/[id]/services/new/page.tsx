"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        // Obtener el user_id del profesional desde professional_applications
        const { data: professionalData, error } = await supabase
          .from('professional_applications')
          .select('user_id')
          .eq('id', professionalId)
          .single();

        if (error) {
          console.error('Error fetching user_id:', error);
          toast.error('Error al cargar información del profesional');
          router.push(`/professional/${professionalId}/services`);
          return;
        }

        if (professionalData?.user_id) {
          setUserId(professionalData.user_id);
        } else {
          toast.error('No se encontró información del profesional');
          router.push(`/professional/${professionalId}/services`);
        }
      } catch (error) {
        console.error('Error fetching user_id:', error);
        toast.error('Error al cargar información del profesional');
        router.push(`/professional/${professionalId}/services`);
      } finally {
        setLoading(false);
      }
    };

    fetchUserId();
  }, [professionalId, router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!userId) {
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
            onClick={() => router.push(`/professional/${professionalId}/services`)}
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
            professionalId={professionalId}
            userId={userId}
            service={null}
            redirectPath={`/professional/${professionalId}/services`}
          />
        </div>
      </div>
    </div>
  );
}
