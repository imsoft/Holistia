"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ChallengeForm } from "@/components/challenges/challenge-form";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export default function EditChallengePage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;
  const challengeId = params.challengeId as string;

  const [challenge, setChallenge] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchChallenge();
  }, [challengeId]);

  const fetchChallenge = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('challenges')
        .select(`
          id,
          title,
          description,
          short_description,
          cover_image_url,
          duration_days,
          difficulty_level,
          category,
          wellness_areas,
          created_by_type,
          linked_professional_id,
          is_active,
          created_at
        `)
        .eq('id', challengeId)
        .single();

      if (error) throw error;

      setChallenge(data);
    } catch (error) {
      console.error("Error fetching challenge:", error);
      toast.error("Error al cargar el reto");
      router.push(`/patient/${patientId}/my-challenges`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            onClick={() => router.push(`/patient/${patientId}/my-challenges`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Editar Reto Personal</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          <ChallengeForm
            userId={patientId}
            challenge={challenge}
            redirectPath={`/patient/${patientId}/my-challenges`}
          />
        </div>
      </div>
    </div>
  );
}
