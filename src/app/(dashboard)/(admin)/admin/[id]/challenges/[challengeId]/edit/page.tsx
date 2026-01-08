"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ChallengeForm } from "@/components/challenges/challenge-form";
import { ChallengeResourcesManager } from "@/components/challenges/challenge-resources-manager";
import { ChallengeMeetingsManager } from "@/components/challenges/challenge-meetings-manager";
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
  is_active: boolean;
}

export default function EditAdminChallengePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const adminId = params.id as string;
  const challengeId = params.challengeId as string;
  const professionalId = searchParams.get('professional_id');

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("challenges")
          .select("*")
          .eq("id", challengeId)
          .single();

        if (error) throw error;

        setChallenge(data);
      } catch (error) {
        console.error("Error fetching challenge:", error);
        toast.error("Error al cargar el reto");
        const redirectPath = professionalId 
          ? `/admin/${adminId}/professionals/${professionalId}`
          : `/admin/${adminId}/challenges`;
        router.push(redirectPath);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenge();
  }, [challengeId, adminId, professionalId, router, supabase]);

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

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="flex h-16 items-center gap-4 px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const redirectPath = professionalId 
                ? `/admin/${adminId}/professionals/${professionalId}`
                : `/admin/${adminId}/challenges`;
              router.push(redirectPath);
            }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Editar Reto</h1>
        </div>
      </div>

      <div className="py-4 px-6">
        <div className="max-w-3xl mx-auto py-4 space-y-6">
          <ChallengeForm
            userId={adminId}
            challenge={challenge}
            redirectPath={professionalId 
              ? `/admin/${adminId}/professionals/${professionalId}`
              : `/admin/${adminId}/challenges`}
            userType="admin"
          />

          <ChallengeResourcesManager challengeId={challengeId} />

          <ChallengeMeetingsManager challengeId={challengeId} />
        </div>
      </div>
    </div>
  );
}
