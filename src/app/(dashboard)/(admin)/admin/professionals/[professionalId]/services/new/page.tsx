"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ServiceForm } from "@/components/services/service-form";
import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";

export default function NewAdminServicePage() {
  useUserStoreInit();
  const params = useParams();
  const router = useRouter();
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
      <div className="admin-page-shell p-4 sm:p-6">
        <div className="animate-pulse space-y-4 w-full max-w-2xl mx-auto">
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
            <div className="h-24 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="admin-page-shell flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No se pudo obtener la información del profesional</p>
          <Button onClick={() => router.push(`/admin/professionals/${professionalId}`)}>
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-shell">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-header-inner admin-page-header-inner-row">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/admin/professionals/${professionalId}`)}
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
            redirectPath={`/admin/professionals/${professionalId}`}
          />
        </div>
      </div>
    </div>
  );
}
