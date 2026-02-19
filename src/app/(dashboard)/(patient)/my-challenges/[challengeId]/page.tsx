"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import {
  ArrowLeft,
  Target,
  Loader2,
  CheckCircle2,
  Circle,
  Users,
  FileText,
  ExternalLink,
  Book,
  Headphones,
  Video,
  Trophy,
  MessageSquare,
  UserPlus,
  Edit,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CheckinForm } from "@/components/ui/checkin-form";
import { ChallengeProgress } from "@/components/ui/challenge-progress";
import { ChallengeBadges } from "@/components/ui/challenge-badges";
import { ChallengeInviteDialog } from "@/components/ui/challenge-invite-dialog";
import { ChallengeChat } from "@/components/ui/challenge-chat";
import { VideoPlayer } from "@/components/ui/video-player";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Checkin {
  id: string;
  day_number: number;
  checkin_date: string;
  evidence_type: string;
  evidence_url?: string;
  notes?: string;
  points_earned: number;
  verified_by_professional: boolean;
  is_public?: boolean;
}

export default function ChallengePurchaseDetailPage() {
  useUserStoreInit();
  const params = useParams();
  const router = useRouter();
  const userId = useUserId();
  const supabase = createClient();

  // purchaseId comes from the URL segment
  const purchaseId = params.challengeId as string;

  const [purchase, setPurchase] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [isCheckinDialogOpen, setIsCheckinDialogOpen] = useState(false);
  const [nextDayNumber, setNextDayNumber] = useState(1);

  const [challengeResources, setChallengeResources] = useState<any[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);

  const [participantsCount, setParticipantsCount] = useState<number>(0);
  const [participants, setParticipants] = useState<
    Array<{ id: string; first_name: string | null; last_name: string | null; avatar_url: string | null; type?: string | null }>
  >([]);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  // ── Load everything on mount ──────────────────────────────────────────────
  useEffect(() => {
    if (!purchaseId) return;
    loadPurchase();
  }, [purchaseId]);

  const loadPurchase = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("challenge_purchases")
        .select(`
          id,
          challenge_id,
          participant_id,
          access_granted,
          started_at,
          completed_at,
          created_at,
          schedule_days,
          challenges(
            id,
            title,
            description,
            short_description,
            cover_image_url,
            duration_days,
            difficulty_level,
            category,
            created_by_type,
            created_by_user_id,
            linked_professional_id,
            is_active,
            is_public,
            professional_applications:challenges_linked_professional_id_fkey(
              first_name,
              last_name,
              profile_photo,
              is_verified
            )
          )
        `)
        .eq("id", purchaseId)
        .single();

      if (error || !data) {
        toast.error("No se encontró el reto");
        router.push("/my-challenges");
        return;
      }

      const challenge = Array.isArray(data.challenges) ? data.challenges[0] : data.challenges;
      setPurchase({ ...data, challenge });

      // Load rest in parallel
      await Promise.all([
        fetchCheckins(purchaseId),
        fetchResources(challenge.id),
        fetchParticipantsCount(challenge.id, challenge.created_by_type, challenge.created_by_user_id),
        fetchChallengeParticipants(challenge.id, challenge.created_by_type, challenge.created_by_user_id),
      ]);
    } catch (err) {
      console.error("Error loading purchase:", err);
      toast.error("Error al cargar el reto");
      router.push("/my-challenges");
    } finally {
      setLoading(false);
    }
  };

  // ── Day number calculation ────────────────────────────────────────────────
  useEffect(() => {
    if (!purchase) return;
    const startRef = purchase.started_at || purchase.created_at;
    if (!startRef) { setNextDayNumber(1); return; }
    const start = new Date(startRef);
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const todayParsed = new Date(todayStr + "T12:00:00Z");
    const startOnly = { y: start.getUTCFullYear(), m: start.getUTCMonth(), d: start.getUTCDate() };
    const todayOnly = { y: todayParsed.getUTCFullYear(), m: todayParsed.getUTCMonth(), d: todayParsed.getUTCDate() };
    const diffDays = Math.floor(
      (Date.UTC(todayOnly.y, todayOnly.m, todayOnly.d) - Date.UTC(startOnly.y, startOnly.m, startOnly.d)) /
        (24 * 60 * 60 * 1000)
    );
    const day = diffDays + 1;
    const maxDay = purchase.challenge?.duration_days ?? 999;
    setNextDayNumber(Math.min(Math.max(day, 1), maxDay));
  }, [purchase]);

  // Refresh checkins on tab focus
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") fetchCheckins(purchaseId);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [purchaseId]);

  // ── Data fetchers ─────────────────────────────────────────────────────────
  const fetchCheckins = async (challengePurchaseId: string) => {
    try {
      const res = await fetch(`/api/challenges/checkins?challenge_purchase_id=${challengePurchaseId}`);
      const data = await res.json();
      if (res.ok) setCheckins(data.checkins || []);
    } catch (err) {
      console.error("Error fetching checkins:", err);
    }
  };

  const fetchResources = async (challengeId: string) => {
    try {
      setLoadingResources(true);
      const res = await fetch(`/api/challenges/${challengeId}/resources`);
      const data = await res.json();
      if (res.ok) setChallengeResources(data.resources || []);
    } catch (err) {
      console.error("Error fetching resources:", err);
    } finally {
      setLoadingResources(false);
    }
  };

  const fetchParticipantsCount = async (challengeId: string, createdByType?: string, createdByUserId?: string) => {
    try {
      const { count, error } = await supabase
        .from("challenge_purchases")
        .select("id", { count: "exact", head: true })
        .eq("challenge_id", challengeId)
        .eq("access_granted", true);

      if (!error && count !== null) {
        let total = count;
        if (createdByType === "professional") {
          const { count: creatorCount } = await supabase
            .from("challenge_purchases")
            .select("id", { count: "exact", head: true })
            .eq("challenge_id", challengeId)
            .eq("participant_id", createdByUserId)
            .eq("access_granted", true);
          if (creatorCount === 0) total = count + 1;
        }
        setParticipantsCount(total);
      }
    } catch (err) {
      console.error("Error fetching participants count:", err);
    }
  };

  const fetchChallengeParticipants = async (challengeId: string, createdByType?: string, createdByUserId?: string) => {
    try {
      const { data: purchases, error } = await supabase
        .from("challenge_purchases")
        .select("participant_id")
        .eq("challenge_id", challengeId)
        .eq("access_granted", true);

      if (error) throw error;

      const participantIds = [
        ...new Set(
          (purchases || []).map((p: { participant_id: string }) => p.participant_id).filter(Boolean)
        ),
      ] as string[];

      if (createdByType === "professional" && createdByUserId && !participantIds.includes(createdByUserId)) {
        participantIds.push(createdByUserId);
      }

      if (participantIds.length === 0) { setParticipants([]); return; }

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url, type")
        .in("id", participantIds);

      if (profilesError) throw profilesError;

      const professionalIds = (profilesData || []).filter((p) => p.type === "professional").map((p) => p.id);
      const photoMap = new Map<string, string>();
      if (professionalIds.length > 0) {
        const { data: proApps } = await supabase
          .from("professional_applications")
          .select("user_id, profile_photo")
          .in("user_id", professionalIds);
        (proApps || []).forEach((pa) => {
          if (pa.profile_photo) photoMap.set(pa.user_id, pa.profile_photo);
        });
      }

      setParticipants(
        (profilesData || []).map((p) => ({
          id: p.id,
          first_name: p.first_name ?? null,
          last_name: p.last_name ?? null,
          avatar_url: photoMap.get(p.id) ?? p.avatar_url ?? null,
          type: p.type ?? null,
        }))
      );
    } catch (err) {
      console.error("Error fetching challenge participants:", err);
      setParticipants([]);
    }
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handlePublishCheckin = async (checkinId: string, isPublic: boolean) => {
    try {
      const res = await fetch("/api/challenges/checkins/publish", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkin_id: checkinId, is_public: !isPublic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al publicar el check-in");
      toast.success(isPublic ? "Check-in ocultado del feed" : "Check-in publicado en el feed");
      setCheckins((prev) => prev.map((c) => (c.id === checkinId ? { ...c, is_public: !isPublic } : c)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al publicar el check-in");
    }
  };

  const handleCheckinComplete = async (data?: { completed: true; challenge_purchase_id: string }) => {
    setIsCheckinDialogOpen(false);
    if (data?.completed && data.challenge_purchase_id) {
      router.push(`/my-challenges/completed?challenge=${data.challenge_purchase_id}`);
      return;
    }
    await fetchCheckins(purchaseId);
    // refresh purchase to update completed_at
    loadPurchase();
  };

  const getShareUrl = () =>
    typeof window !== "undefined"
      ? `${window.location.origin}/my-challenges?challenge=${purchaseId}`
      : `https://www.holistia.io/my-challenges?challenge=${purchaseId}`;

  const handleShareAchievement = async (action: "whatsapp" | "copy") => {
    const title = purchase?.challenge?.title || "Reto";
    const message = `¡Completé el reto "${title}" en Holistia! 🎉 ${getShareUrl()}`;
    if (action === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    } else {
      try {
        await navigator.clipboard.writeText(message);
        toast.success("Enlace copiado al portapapeles");
      } catch {
        toast.error("No se pudo copiar el enlace");
      }
    }
  };

  // ── Resource helpers ──────────────────────────────────────────────────────
  const getResourceIcon = (resourceType: string) => {
    switch (resourceType) {
      case "ebook":
      case "pdf":
        return <Book className="h-4 w-4" />;
      case "audio":
        return <Headphones className="h-4 w-4" />;
      case "video":
        return <Video className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatResourceInfo = (resource: any) => {
    const parts: string[] = [];
    if (resource.pages_count) parts.push(`${resource.pages_count} páginas`);
    if (resource.duration_minutes) parts.push(`${resource.duration_minutes} min`);
    if (resource.file_size_bytes) parts.push(`${(resource.file_size_bytes / (1024 * 1024)).toFixed(2)} MB`);
    return parts.length > 0 ? ` • ${parts.join(" • ")}` : "";
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-48 w-full rounded-xl mb-6" />
        <Skeleton className="h-10 w-full mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!purchase) return null;

  const challenge = purchase.challenge;
  const scheduleDays: number[] = purchase.schedule_days ?? [];
  const isChallengeActive = challenge?.is_active === true;
  const isCreator = challenge?.created_by_user_id === userId;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.push("/my-challenges")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Mis Retos
        </Button>
      </div>

      {/* Challenge header card */}
      <Card className="mb-6 overflow-hidden gap-0">
        <div className="relative h-48">
          {challenge?.cover_image_url ? (
            <Image
              src={challenge.cover_image_url}
              alt={challenge.title}
              fill
              className="object-cover"
              sizes="100vw"
            />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <Target className="h-16 w-16 text-primary/40" />
            </div>
          )}
          <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
            {isCreator && <Badge variant="default">Creado por ti</Badge>}
            {purchase.completed_at && <Badge className="bg-green-600 hover:bg-green-600">Completado</Badge>}
            {!isChallengeActive && <Badge variant="secondary">Inactivo</Badge>}
          </div>
        </div>
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-2xl mb-1">{challenge?.title}</CardTitle>
              {challenge?.professional_applications && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground">
                    {challenge.professional_applications.first_name}{" "}
                    {challenge.professional_applications.last_name}
                  </span>
                  {challenge.professional_applications.is_verified && <VerifiedBadge size={14} />}
                </div>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              {isCreator && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/my-challenges/${challenge.id}/edit`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
              {purchase.completed_at && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Share2 className="h-4 w-4 mr-2" />
                      Compartir logro
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleShareAchievement("whatsapp")}>
                      Compartir en WhatsApp
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShareAchievement("copy")}>
                      Copiar enlace
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="progress" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="progress">
            <Target className="h-4 w-4 mr-1" />
            Progreso
          </TabsTrigger>
          <TabsTrigger value="checkins">
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Check-ins
          </TabsTrigger>
          <TabsTrigger value="badges">
            <Trophy className="h-4 w-4 mr-1" />
            Badges
          </TabsTrigger>
          <TabsTrigger value="resources">
            <FileText className="h-4 w-4 mr-1" />
            Recursos
          </TabsTrigger>
          <TabsTrigger value="chat">
            <Users className="h-4 w-4 mr-1" />
            Participantes
          </TabsTrigger>
        </TabsList>

        {/* ── Progress tab ──────────────────────────────────────────────────── */}
        <TabsContent value="progress" className="space-y-4">
          <ChallengeProgress
            challengePurchaseId={purchase.id}
            challengeDurationDays={challenge?.duration_days}
          />
        </TabsContent>

        {/* ── Check-ins tab ─────────────────────────────────────────────────── */}
        <TabsContent value="checkins" className="space-y-4">
          <Card className="py-4">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle>Check-ins Diarios</CardTitle>
                <Button
                  onClick={() => setIsCheckinDialogOpen(true)}
                  disabled={!purchase.access_granted}
                >
                  Nuevo Check-in
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {checkins.length === 0 ? (
                <div className="text-center py-8">
                  <Circle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Aún no has completado ningún check-in
                  </p>
                  <Button onClick={() => setIsCheckinDialogOpen(true)}>
                    Comenzar Día 1
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {Array.from({ length: challenge?.duration_days || 30 }, (_, i) => i + 1).map((day) => {
                    const dayCheckins = checkins.filter((c) => c.day_number === day);
                    const startRef = purchase.started_at || purchase.created_at;
                    const startDate = startRef ? new Date(startRef) : new Date();
                    const dayDate = new Date(startDate);
                    dayDate.setHours(0, 0, 0, 0);
                    dayDate.setDate(dayDate.getDate() + (day - 1));
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const isPastDay = dayDate < today;
                    const hasCheckins = dayCheckins.length > 0;

                    const activeSchedule = scheduleDays.length > 0 ? scheduleDays : null;
                    const isScheduledDay = activeSchedule ? activeSchedule.includes(dayDate.getDay()) : false;
                    const isMissedScheduled = isScheduledDay && !hasCheckins && isPastDay;
                    const isLateDay = !activeSchedule && dayCheckins.length === 0 && isPastDay;

                    const containerClass = hasCheckins
                      ? isScheduledDay
                        ? "bg-green-50 border-green-200"
                        : "bg-green-50/60 border-green-100"
                      : isMissedScheduled
                      ? "bg-amber-50/80 border-amber-200"
                      : isLateDay
                      ? "bg-amber-50/80 border-amber-200"
                      : "bg-muted/30 border-border";

                    return (
                      <div
                        key={day}
                        className={`flex items-start gap-4 p-4 border rounded-lg ${containerClass}`}
                      >
                        <div className="shrink-0 pt-0.5">
                          {hasCheckins ? (
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                          ) : (
                            <Circle
                              className={cn(
                                "h-6 w-6",
                                isMissedScheduled ? "text-amber-500" : "text-muted-foreground"
                              )}
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 space-y-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">Día {day}</span>
                            {isScheduledDay && (
                              <Badge
                                variant="outline"
                                className="text-primary border-primary/30 bg-primary/5 text-xs"
                              >
                                Programado
                              </Badge>
                            )}
                            {(isMissedScheduled || isLateDay) && (
                              <Badge
                                variant="outline"
                                className="text-amber-700 border-amber-300 bg-amber-100/80 text-xs"
                              >
                                {isMissedScheduled
                                  ? "Día programado no cumplido"
                                  : "Día de reto no cumplido"}
                              </Badge>
                            )}
                          </div>
                          {dayCheckins.length > 0 && (
                            <div className="space-y-3">
                              {dayCheckins.map((checkin) => (
                                <div
                                  key={checkin.id}
                                  className="text-sm text-muted-foreground border-l-2 border-green-300 pl-3 py-1"
                                >
                                  {checkin.notes && <p className="mb-1">{checkin.notes}</p>}
                                  {checkin.evidence_url && (
                                    <div className="mt-2">
                                      {checkin.evidence_type === "video" ? (
                                        <div className="rounded-lg overflow-hidden w-full max-w-[200px] h-[120px]">
                                          <VideoPlayer
                                            url={checkin.evidence_url}
                                            className="w-full h-full"
                                            fill
                                          />
                                        </div>
                                      ) : checkin.evidence_type === "photo" ? (
                                        <Image
                                          src={checkin.evidence_url}
                                          alt="Evidencia"
                                          width={100}
                                          height={100}
                                          className="rounded-lg object-cover"
                                        />
                                      ) : null}
                                    </div>
                                  )}
                                  <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
                                    <div className="flex items-center gap-2">
                                      <p className="text-xs">
                                        {(() => {
                                          const [y, m, d] = checkin.checkin_date.split("-").map(Number);
                                          return new Date(y, m - 1, d).toLocaleDateString("es-MX");
                                        })()}
                                      </p>
                                      <Badge variant="secondary" className="text-xs">
                                        +{checkin.points_earned} pts
                                      </Badge>
                                      {checkin.verified_by_professional && (
                                        <Badge variant="default" className="text-xs">
                                          Verificado
                                        </Badge>
                                      )}
                                    </div>
                                    {isChallengeActive &&
                                      (checkin.is_public ? (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-7 text-xs"
                                          onClick={() => handlePublishCheckin(checkin.id, true)}
                                        >
                                          Ocultar
                                        </Button>
                                      ) : (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-7 text-xs"
                                          onClick={() => handlePublishCheckin(checkin.id, false)}
                                        >
                                          Publicar
                                        </Button>
                                      ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Badges tab ────────────────────────────────────────────────────── */}
        <TabsContent value="badges">
          <ChallengeBadges challengePurchaseId={purchase.id} />
        </TabsContent>

        {/* ── Resources tab ─────────────────────────────────────────────────── */}
        <TabsContent value="resources" className="space-y-4">
          <Card className="py-4">
            <CardHeader>
              <CardTitle>Recursos y Enlaces</CardTitle>
              <p className="text-sm text-muted-foreground">
                Materiales adicionales proporcionados por el profesional
              </p>
            </CardHeader>
            <CardContent>
              {loadingResources ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : challengeResources.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay recursos disponibles para este reto</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {challengeResources.map((resource) => (
                    <div
                      key={resource.id}
                      className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="shrink-0 mt-1">{getResourceIcon(resource.resource_type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm mb-1">{resource.title}</h4>
                            {resource.description && (
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                {resource.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="outline" className="text-xs">
                                {resource.resource_type === "ebook"
                                  ? "Workbook"
                                  : resource.resource_type === "audio"
                                  ? "Audio"
                                  : resource.resource_type === "video"
                                  ? "Video"
                                  : resource.resource_type === "pdf"
                                  ? "PDF"
                                  : resource.resource_type === "link"
                                  ? "Enlace"
                                  : "Otro"}
                              </Badge>
                              {formatResourceInfo(resource)}
                            </div>
                          </div>
                        </div>
                        {resource.url && (
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                          >
                            Abrir recurso
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Chat / Participants tab ────────────────────────────────────────── */}
        <TabsContent value="chat">
          <Card className="py-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Participantes del Reto
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {participantsCount >= 2
                  ? `Comunícate con los otros participantes del reto (${participantsCount} participantes)`
                  : participantsCount === 1
                  ? "Invita a alguien más para desbloquear el chat del reto"
                  : "Invita a otros usuarios para chatear y trabajar juntos en el reto"}
              </p>
            </CardHeader>
            <CardContent>
              {(participants.length > 0 ||
                (challenge?.created_by_type !== "professional" && participantsCount < 5)) && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-3">
                    Participantes {participants.length > 0 && `(${participants.length})`}
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {participants.map((p) => (
                      <Link
                        key={p.id}
                        href={`/profile/${p.id}`}
                        className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors min-w-0 shrink-0"
                      >
                        <div className="h-10 w-10 rounded-full overflow-hidden shrink-0 bg-muted">
                          {p.avatar_url ? (
                            <Image
                              src={p.avatar_url}
                              alt=""
                              width={40}
                              height={40}
                              className="h-10 w-10 object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 flex items-center justify-center text-sm font-medium text-muted-foreground">
                              {p.first_name?.[0]}
                              {p.last_name?.[0] || "?"}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex flex-col">
                          <span className="text-sm font-medium truncate max-w-[120px]">
                            {p.first_name} {p.last_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {p.type === "professional"
                              ? "Profesional"
                              : p.type === "admin"
                              ? "Administrador"
                              : "Paciente"}
                          </span>
                        </div>
                      </Link>
                    ))}
                    {challenge?.created_by_type !== "professional" && participantsCount < 5 && (
                      <button
                        type="button"
                        onClick={() => setIsInviteDialogOpen(true)}
                        className="flex items-center gap-2 p-3 rounded-lg border border-dashed bg-muted/30 hover:bg-muted/60 transition-colors min-w-0 shrink-0 text-muted-foreground hover:text-foreground"
                      >
                        <div className="h-10 w-10 rounded-full shrink-0 bg-muted flex items-center justify-center">
                          <UserPlus className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-medium">Invitar</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {participantsCount >= 2 ? (
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Chat del Reto
                  </h4>
                  <div className="h-[400px] min-h-0 flex flex-col">
                    <ChallengeChat
                      challengeId={purchase.challenge_id}
                      currentUserId={userId || ""}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center border rounded-lg bg-muted/30">
                  <div className="rounded-full bg-muted p-6 mb-4">
                    <MessageSquare className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Invita a alguien para chatear</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md">
                    Cuando haya al menos dos participantes en el reto, aquí podrás chatear con ellos.
                  </p>
                  <Button onClick={() => setIsInviteDialogOpen(true)} size="lg" className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Invitar Participantes
                  </Button>
                  <p className="text-xs text-muted-foreground mt-4">
                    Puedes invitar hasta {5 - participantsCount} usuario(s) más
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Dialogs ──────────────────────────────────────────────────────────── */}
      <ChallengeInviteDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        challengeId={purchase.challenge_id}
        challengeTitle={challenge?.title || ""}
        currentParticipants={participantsCount}
        onInviteSuccess={() => {
          fetchParticipantsCount(
            purchase.challenge_id,
            challenge?.created_by_type,
            challenge?.created_by_user_id
          );
          fetchChallengeParticipants(
            purchase.challenge_id,
            challenge?.created_by_type,
            challenge?.created_by_user_id
          );
        }}
      />

      <Dialog open={isCheckinDialogOpen} onOpenChange={setIsCheckinDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Check-in - Día {nextDayNumber}</DialogTitle>
            <DialogDescription>
              Completa tu check-in diario para ganar puntos y mantener tu racha
            </DialogDescription>
          </DialogHeader>
          <CheckinForm
            challengePurchaseId={purchase.id}
            dayNumber={nextDayNumber}
            challengeDurationDays={challenge?.duration_days}
            scheduleDays={scheduleDays.length > 0 ? scheduleDays : null}
            onCheckinComplete={handleCheckinComplete}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
