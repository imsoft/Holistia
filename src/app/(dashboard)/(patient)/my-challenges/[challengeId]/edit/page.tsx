"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ChallengeForm } from "@/components/challenges/challenge-form";
import { ChallengeResourcesManager } from "@/components/challenges/challenge-resources-manager";
import { ChallengeMeetingsManager } from "@/components/challenges/challenge-meetings-manager";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";

export default function EditChallengePage() {
  useUserStoreInit();
  const params = useParams();
  const router = useRouter();
  const patientId = useUserId();
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
          cover_image_url,
          duration_days,
          difficulty_level,
          category,
          wellness_areas,
          created_by_type,
          created_by_user_id,
          linked_professional_id,
          price,
          currency,
          is_active,
          is_public,
          created_at
        `)
        .eq('id', challengeId)
        .single();

      if (error) throw error;

      setChallenge(data);
    } catch (error) {
      console.error("Error fetching challenge:", error);
      toast.error("Error al cargar el reto");
      router.push(`/my-challenges`);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !challenge) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="py-4 px-6">
      <div className="max-w-3xl mx-auto py-4 space-y-6">
        <ChallengeResourcesManager challengeId={challengeId} />

        <ChallengeMeetingsManager challengeId={challengeId} />

        <ChallengeForm
          userId={patientId || ''}
          challenge={challenge}
          redirectPath={`/my-challenges`}
        />
      </div>
    </div>
  );
}
