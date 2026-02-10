"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Trophy, ArrowRight, Loader2, Share2, Copy } from "lucide-react";
import { fireFireworks } from "@/lib/fireworks";

const getShareUrl = (purchaseId: string) =>
  typeof window !== "undefined"
    ? `${window.location.origin}/my-challenges?challenge=${purchaseId}`
    : `https://www.holistia.io/my-challenges?challenge=${purchaseId}`;

const getShareMessage = (title: string, purchaseId: string) =>
  `¡Completé el reto "${title}" en Holistia! 🎉 ${getShareUrl(purchaseId)}`;

export default function ChallengeCompletedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const challengePurchaseId = searchParams.get("challenge");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    challenge_title: string;
    duration_days: number;
    total_points: number;
  } | null>(null);
  const confettiFired = useRef(false);

  useEffect(() => {
    if (!challengePurchaseId) {
      router.replace("/my-challenges");
      return;
    }

    const fetchData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: purchase, error } = await supabase
        .from("challenge_purchases")
        .select(`
          id,
          challenge_id,
          challenges(title, duration_days)
        `)
        .eq("id", challengePurchaseId)
        .eq("participant_id", user.id)
        .single();

      if (error || !purchase) {
        router.replace("/my-challenges");
        return;
      }

      const ch = Array.isArray((purchase as any).challenges)
        ? (purchase as any).challenges[0]
        : (purchase as any).challenges;

      const { data: progress } = await supabase
        .from("challenge_progress")
        .select("total_points")
        .eq("challenge_purchase_id", challengePurchaseId)
        .maybeSingle();

      setData({
        challenge_title: ch?.title || "Tu reto",
        duration_days: ch?.duration_days || 0,
        total_points: progress?.total_points || 0,
      });
      setLoading(false);
    };

    fetchData();
  }, [challengePurchaseId, router]);

  useEffect(() => {
    if (loading || !data || confettiFired.current) return;
    confettiFired.current = true;
    fireFireworks();
  }, [loading, data]);

  const handleGoToChallenges = () => {
    router.push(`/my-challenges?challenge=${challengePurchaseId}`);
  };

  const handleShareWhatsApp = () => {
    if (!data?.challenge_title || !challengePurchaseId) return;
    const text = encodeURIComponent(getShareMessage(data.challenge_title, challengePurchaseId));
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  };

  const handleCopyLink = async () => {
    if (!data?.challenge_title || !challengePurchaseId) return;
    try {
      await navigator.clipboard.writeText(getShareMessage(data.challenge_title, challengePurchaseId));
      toast.success("Enlace copiado al portapapeles");
    } catch {
      toast.error("No se pudo copiar el enlace");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-background">
        <Loader2 className="h-10 w-10 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-b from-green-50 via-emerald-50/50 to-background">
      <div className="max-w-lg w-full text-center space-y-8">
        <div className="relative">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 ring-4 ring-green-200/80">
            <Trophy className="h-14 w-14 text-green-600" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            ¡Reto completado!
          </h1>
          <p className="text-lg text-muted-foreground">
            Felicidades, terminaste <strong className="text-foreground">{data?.challenge_title}</strong>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-green-100/80 border border-green-200/60 p-4">
            <p className="text-2xl font-bold text-green-800">{data?.duration_days}</p>
            <p className="text-sm text-green-700">Días completados</p>
          </div>
          <div className="rounded-xl bg-amber-100/80 border border-amber-200/60 p-4">
            <p className="text-2xl font-bold text-amber-800">{data?.total_points}</p>
            <p className="text-sm text-amber-700">Puntos totales</p>
          </div>
        </div>

        <p className="text-muted-foreground">
          Tu dedicación y constancia te llevaron hasta la meta. Revisa tus badges, comparte tu logro o explora más retos.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            size="lg"
            className="border-green-300 text-green-700 hover:bg-green-50"
            onClick={handleShareWhatsApp}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Compartir en WhatsApp
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleCopyLink}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copiar enlace
          </Button>
        </div>

        <Button
          size="lg"
          className="bg-green-600 hover:bg-green-700 text-white px-8"
          onClick={handleGoToChallenges}
        >
          Ver mi reto
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
