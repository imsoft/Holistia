"use client";

import { useRouter } from "next/navigation";
import { useUserStoreInit } from "@/hooks/use-user-store-init";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { EventForm } from "@/components/ui/event-form";
import { Professional } from "@/types/event";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export default function NewEventPage() {
  useUserStoreInit();
  const router = useRouter();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchProfessionals = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("professional_applications")
        .select("id, first_name, last_name, profession")
        .eq("status", "approved");

      if (error) throw error;

      const formatted = data?.map(prof => ({
        id: prof.id,
        first_name: prof.first_name,
        last_name: prof.last_name,
        profession: prof.profession
      })) || [];

      setProfessionals(formatted);
    } catch (error) {
      console.error("Error fetching professionals:", error);
      toast.error("Error al cargar profesionales");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchProfessionals();
  }, [fetchProfessionals]);

  const handleSuccess = () => {
          router.push(`/admin/events`);
  };

  const handleCancel = () => {
          router.push(`/admin/events`);
  };

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex h-16 items-center gap-4 px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/admin/events`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Crear Nuevo Evento</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <EventForm
            event={null}
            professionals={professionals}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
}
