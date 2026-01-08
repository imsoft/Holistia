"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ServiceForm } from "@/components/services/service-form";
import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function NewAdminServicePage() {
  const params = useParams();
  const router = useRouter();
  const adminId = params.id as string;
  const professionalId = params.professionalId as string;
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const { data: professionalData, error } = await supabase
          .from('professional_applications')
          .select('user_id')
          .eq('id', professionalId)
          .single();

        if (error) throw error;
        setUserId(professionalData?.user_id || null);
      } catch (error) {
        console.error('Error fetching user_id:', error);
        toast.error('Error al cargar información del profesional');
      } finally {
        setLoading(false);
      }
    };

    fetchUserId();
  }, [professionalId, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No se pudo obtener la información del profesional</p>
          <Button onClick={() => router.push(`/admin/${adminId}/professionals/${professionalId}`)}>
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
            onClick={() => router.push(`/admin/${adminId}/professionals/${professionalId}`)}
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
            redirectPath={`/admin/${adminId}/professionals/${professionalId}`}
          />
        </div>
      </div>
    </div>
  );
}
