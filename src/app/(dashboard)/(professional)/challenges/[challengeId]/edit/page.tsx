"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ChallengeForm } from "@/components/challenges/challenge-form";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

interface Challenge {
  id: string;
  professional_id?: string | null;
  created_by_user_id?: string;
  created_by_type?: 'professional' | 'patient' | 'admin';
  title: string;
  description: string;
  short_description?: string;
  cover_image_url?: string;
  duration_days?: number;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category?: string;
  wellness_areas?: string[];
  linked_patient_id?: string | null;
  linked_professional_id?: string | null;
  price?: number | null;
  currency?: string;
  is_active: boolean;
  is_public?: boolean;
}

export default function EditProfessionalChallengePage() {
  useUserStoreInit();
  const params = useParams();
  const router = useRouter();
  const professionalId = useUserId();
  const challengeId = params.challengeId as string;

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  const fetchChallenge = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("challenges")
        .select(`
          id,
          professional_id,
          created_by_user_id,
          created_by_type,
          linked_patient_id,
          linked_professional_id,
          title,
          description,
          short_description,
          cover_image_url,
          duration_days,
          difficulty_level,
          category,
          wellness_areas,
          price,
          currency,
          is_active,
          is_public,
          created_at,
          updated_at
        `)
        .eq("id", challengeId)
        .single();

      if (error) {
        console.error("❌ Error en fetchChallenge:", error);
        throw error;
      }

      console.log("✅ Challenge cargado desde BD:", {
        data,
        difficulty_level: data?.difficulty_level,
        price: data?.price,
        linked_professional_id: data?.linked_professional_id,
        cover_image_url: data?.cover_image_url,
        currency: data?.currency
      });

      setChallenge(data);
    } catch (error) {
      console.error("Error fetching challenge:", error);
      toast.error("Error al cargar el reto");
      router.push(`/challenges`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenge();
  }, [challengeId, professionalId, router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!challenge) {
    return null;
  }

  const handleFormSubmit = () => {
    setSaving(false);
    // Recargar los datos del challenge después de actualizar
    fetchChallenge();
  };

  const handleCancel = () => {
    router.push(`/challenges`);
  };

  const handleUpdate = () => {
    setSaving(true);
    // El formulario se enviará automáticamente cuando se haga submit
    const form = document.getElementById('challenge-form') as HTMLFormElement;
    if (form) {
      form.requestSubmit();
    } else {
      setSaving(false);
      toast.error("No se pudo encontrar el formulario");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="flex h-16 items-center gap-4 px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/challenges`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Editar Reto</h1>
        </div>
      </div>

      <div className="py-4 px-6">
        <div className="max-w-3xl mx-auto py-4 space-y-6">
          <ChallengeForm
            key={challenge.id}
            userId={professionalId || ''}
            challenge={challenge}
            redirectPath={`/challenges`}
            userType="professional"
            onFormSubmit={handleFormSubmit}
            showButtons={false}
          />

          {/* Botones al final absoluto - DESPUÉS de todas las cards */}
          <div className="flex gap-3 justify-end pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleUpdate}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Actualizar Reto"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
