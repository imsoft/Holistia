"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { BlockCreatorTabs } from "@/components/ui/block-creator-tabs";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export default function NewAvailabilityBlockPage() {
  const params = useParams();
  const router = useRouter();
  const professionalUserId = params.id as string;

  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const fetchProfessionalId = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("professional_applications")
          .select("id")
          .eq("user_id", professionalUserId)
          .single();

        if (error) throw error;

        setProfessionalId(data.id);
      } catch (error) {
        console.error("Error fetching professional ID:", error);
        toast.error("Error al cargar datos del profesional");
        router.push(`/professional/${professionalUserId}/availability`);
      } finally {
        setLoading(false);
      }
    };

    fetchProfessionalId();
  }, [professionalUserId, router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!professionalId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="flex h-16 items-center gap-4 px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/professional/${professionalUserId}/availability`)}
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
            userId={professionalUserId}
            onBlockCreated={() => router.push(`/professional/${professionalUserId}/availability`)}
            onCancel={() => router.push(`/professional/${professionalUserId}/availability`)}
          />
        </div>
      </div>
    </div>
  );
}
