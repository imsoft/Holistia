"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  is_active: boolean;
}

export default function EditAdminChallengePage() {
  useUserStoreInit();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const adminId = useUserId();
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
          ? `/admin/professionals/${professionalId}`
          : `/admin/challenges`;
        router.push(redirectPath);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenge();
  }, [challengeId, adminId, professionalId, router, supabase]);

  if (loading) {
    return (
      <div className="admin-page-shell flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!challenge) {
    return null;
  }

  return (
    <div className="admin-page-shell">
      <div className="admin-page-header">
        <div className="admin-page-header-inner admin-page-header-inner-row">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const redirectPath = professionalId 
                ? `/admin/professionals/${professionalId}`
                : `/admin/challenges`;
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
            userId={adminId || ''}
            challenge={challenge}
            redirectPath={professionalId
              ? `/admin/professionals/${professionalId}`
              : `/admin/challenges`}
            userType="admin"
          />
        </div>
      </div>
    </div>
  );
}
