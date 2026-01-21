"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { BlockCreatorTabs } from "@/components/ui/block-creator-tabs";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export default function NewAvailabilityBlockPage() {
  const router = useRouter();
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const fetchProfessionalData = async () => {
      try {
        setLoading(true);
        
        // Obtener el usuario autenticado
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          throw new Error('Usuario no autenticado');
        }
        
        setUserId(user.id);

        // Obtener el professional_id usando el user_id
        const { data, error } = await supabase
          .from("professional_applications")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error fetching professional ID:", error);
          if (error.code === 'PGRST116') {
            toast.error("No se encontró una aplicación profesional asociada");
          } else {
            toast.error("Error al cargar datos del profesional");
          }
          router.push(`/availability`);
          return;
        }

        setProfessionalId(data.id);
      } catch (error) {
        console.error("Error fetching professional data:", error);
        const errorMessage = error instanceof Error ? error.message : "Error al cargar datos del profesional";
        toast.error(errorMessage);
        router.push(`/availability`);
      } finally {
        setLoading(false);
      }
    };

    fetchProfessionalData();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!professionalId || !userId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="flex h-16 items-center gap-4 px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/availability`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Crear Nuevo Bloqueo</h1>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          <BlockCreatorTabs
            professionalId={professionalId}
            userId={userId}
            onBlockCreated={() => router.push(`/availability`)}
            onCancel={() => router.push(`/availability`)}
          />
        </div>
      </div>
    </div>
  );
}
