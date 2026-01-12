"use client";

import { useParams, useRouter } from "next/navigation";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { EventForm } from "@/components/ui/event-form";
import { Professional, EventWorkshop } from "@/types/event";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const adminId = params.id as string;
  const eventId = params.eventId as string;
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [event, setEvent] = useState<EventWorkshop | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch event
      const { data: eventData, error: eventError } = await supabase
        .from("events_workshops")
        .select("*")
        .eq("id", eventId)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);

      // Fetch professionals
      const { data: profsData, error: profsError } = await supabase
        .from("professional_applications")
        .select("id, first_name, last_name, profession")
        .eq("status", "approved");

      if (profsError) throw profsError;

      const formatted = profsData?.map(prof => ({
        id: prof.id,
        first_name: prof.first_name,
        last_name: prof.last_name,
        profession: prof.profession
      })) || [];

      setProfessionals(formatted);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Error al cargar el evento");
      router.push(`/admin/events`);
    } finally {
      setLoading(false);
    }
  }, [supabase, eventId, router, adminId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSuccess = () => {
    router.push(`/admin/${adminId}/events`);
  };

  const handleCancel = () => {
    router.push(`/admin/${adminId}/events`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Cargando evento...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Evento no encontrado</p>
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
            onClick={() => router.push(`/admin/${adminId}/events`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Editar Evento</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <EventForm
            event={event}
            professionals={professionals}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
}
