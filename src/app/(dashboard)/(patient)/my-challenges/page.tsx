"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import {
  Calendar,
  Target,
  Loader2,
  CheckCircle2,
  Plus,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { stripHtml } from "@/lib/text-utils";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { Skeleton } from "@/components/ui/skeleton";

interface CreatedChallenge {
  id: string;
  title: string;
  description: string;
  short_description?: string;
  cover_image_url?: string;
  duration_days?: number;
  difficulty_level?: string;
  category?: string;
  wellness_areas?: string[];
  created_by_type: "professional" | "patient" | "admin";
  linked_professional_id?: string;
  is_active: boolean;
  created_at: string;
  professional_applications?: {
    first_name: string;
    last_name: string;
    profile_photo?: string;
    is_verified?: boolean;
  };
}

export default function MyChallengesPage() {
  useUserStoreInit();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = useUserId();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [allChallenges, setAllChallenges] = useState<any[]>([]);
  const [filteredChallenges, setFilteredChallenges] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [completionFilter, setCompletionFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");

  useEffect(() => {
    fetchChallenges();
  }, []);

  // Navigate to challenge detail from query param
  useEffect(() => {
    const challengeId = searchParams.get("challenge");
    if (challengeId && allChallenges.length > 0) {
      const challenge = allChallenges.find((c: any) => c.id === challengeId || c.purchaseId === challengeId);
      if (challenge) {
        navigateToChallenge(challenge);
        if (window.history.replaceState) {
          window.history.replaceState({}, "", "/my-challenges");
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, allChallenges.length]);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) { toast.error("Debes iniciar sesión"); return; }

      // Participating challenges
      const { data: purchases, error } = await supabase
        .from("challenge_purchases")
        .select(`
          id,
          challenge_id,
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
            cover_image_position,
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
        .eq("participant_id", user.id)
        .eq("access_granted", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const transformedPurchases = (purchases || []).map((purchase: any) => {
        const challenge =
          Array.isArray(purchase.challenges) && purchase.challenges.length > 0
            ? purchase.challenges[0]
            : purchase.challenges;
        return {
          id: purchase.id,
          challenge_id: purchase.challenge_id,
          access_granted: purchase.access_granted,
          started_at: purchase.started_at,
          completed_at: purchase.completed_at,
          created_at: purchase.created_at,
          schedule_days: purchase.schedule_days ?? null,
          challenge: { ...challenge, is_active: challenge?.is_active ?? true },
        };
      });

      // Created challenges
      const { data: created, error: createdError } = await supabase
        .from("challenges")
        .select(`
          id,
          title,
          description,
          short_description,
          cover_image_url,
          cover_image_position,
          duration_days,
          difficulty_level,
          category,
          created_by_type,
          created_by_user_id,
          linked_professional_id,
          is_active,
          is_public,
          created_at,
          professional_applications!challenges_linked_professional_id_fkey(
            first_name,
            last_name,
            profile_photo,
            is_verified
          )
        `)
        .eq("created_by_user_id", user.id)
        .order("created_at", { ascending: false });

      if (createdError) throw createdError;

      const transformedCreated = (created || []).map((challenge: any) => ({
        ...challenge,
        is_active: challenge.is_active ?? true,
        professional_applications:
          Array.isArray(challenge.professional_applications) &&
          challenge.professional_applications.length > 0
            ? challenge.professional_applications[0]
            : undefined,
      }));

      // Combine into flat list
      const participatingChallenges = transformedPurchases.map((p: any) => ({
        ...p.challenge,
        purchaseId: p.id,
        type: "participating" as const,
        access_granted: p.access_granted,
        started_at: p.started_at,
        completed_at: p.completed_at,
        created_at: p.created_at,
        schedule_days: p.schedule_days ?? null,
      }));

      const createdChallengesFlat = transformedCreated.map((c: any) => ({
        ...c,
        type: "created" as const,
        purchaseId: null as string | null,
      }));

      const createdChallengeIds = new Set(transformedCreated.map((c: any) => c.id));
      const participatingWithCreatedFlag = participatingChallenges.map((c: any) => {
        if (createdChallengeIds.has(c.id) || c.created_by_user_id === user.id) {
          return { ...c, type: "created" as const };
        }
        return c;
      });

      const challengeIds = new Set(participatingWithCreatedFlag.map((c: any) => c.id));
      const uniqueCreated = createdChallengesFlat.filter((c: any) => !challengeIds.has(c.id));
      const combined = [...participatingWithCreatedFlag, ...uniqueCreated];

      setAllChallenges(combined);
      setFilteredChallenges(combined);
    } catch (err) {
      console.error("Error fetching challenges:", err);
      toast.error("Error al cargar retos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    applyFilters();
  }, [searchTerm, typeFilter, statusFilter, completionFilter, difficultyFilter, allChallenges]);

  const applyFilters = () => {
    let filtered = [...allChallenges];
    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (typeFilter !== "all") filtered = filtered.filter((c) => c.type === typeFilter);
    if (statusFilter !== "all") {
      filtered = filtered.filter((c) => {
        if (c.type === "created") return statusFilter === "active" ? c.is_active : !c.is_active;
        return true;
      });
    }
    if (completionFilter !== "all") {
      filtered = filtered.filter((c) => {
        const isCompleted = !!c.completed_at;
        return completionFilter === "completed" ? isCompleted : !isCompleted;
      });
    }
    if (difficultyFilter !== "all") filtered = filtered.filter((c) => c.difficulty_level === difficultyFilter);
    setFilteredChallenges(filtered);
  };

  // Navigate to the detail page.
  // For participating: use purchaseId directly.
  // For created: auto-create a purchase first (so the detail page has one), then navigate.
  const navigateToChallenge = async (challenge: any) => {
    if (challenge.type === "participating" && challenge.purchaseId) {
      router.push(`/my-challenges/${challenge.purchaseId}`);
      return;
    }

    // created challenge — get or create purchase
    try {
      const res = await fetch(`/api/challenges/${challenge.id}/purchase?user_id=${userId || ""}`);
      const data = await res.json();

      if (res.ok && data.purchase) {
        router.push(`/my-challenges/${data.purchase.id}`);
        return;
      }

      // Create purchase automatically
      const createRes = await fetch(`/api/challenges/${challenge.id}/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auto_join: true }),
      });
      const createData = await createRes.json();
      if (createRes.ok && createData.purchase) {
        router.push(`/my-challenges/${createData.purchase.id}`);
      } else {
        toast.error("No se pudo abrir el reto");
      }
    } catch (err) {
      console.error("Error navigating to challenge:", err);
      toast.error("Error al abrir el reto");
    }
  };

  const getDifficultyLabel = (level?: string) => {
    const labels: Record<string, string> = {
      beginner: "Principiante",
      intermediate: "Intermedio",
      advanced: "Avanzado",
      expert: "Experto",
    };
    return labels[level || ""] || level || "N/A";
  };

  const getDifficultyColor = (level?: string) => {
    const colors: Record<string, string> = {
      beginner: "bg-green-100 text-green-800",
      intermediate: "bg-blue-100 text-blue-800",
      advanced: "bg-orange-100 text-orange-800",
      expert: "bg-red-100 text-red-800",
    };
    return colors[level || ""] || "bg-gray-100 text-gray-800";
  };


  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Skeleton className="h-10 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="mb-6">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden gap-0 min-h-[400px] flex flex-col">
              <Skeleton className="h-40 w-full" />
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="flex-1 pb-4">
                <div className="flex items-center gap-2 mb-4">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                </div>
              </CardContent>
              <div className="px-6 pb-6">
                <Skeleton className="h-10 w-full" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Mis Retos</h1>
          <p className="text-muted-foreground">
            Gestiona tus retos activos y completa tus check-ins diarios
          </p>
        </div>
        <Button onClick={() => router.push("/my-challenges/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Crear Reto Personal
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar retos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Tipo de reto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="participating">En los que participo</SelectItem>
            <SelectItem value="created">Que creé</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={completionFilter} onValueChange={setCompletionFilter}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Progreso" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">En progreso</SelectItem>
            <SelectItem value="completed">Completados</SelectItem>
          </SelectContent>
        </Select>
        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Dificultad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las dificultades</SelectItem>
            <SelectItem value="beginner">Principiante</SelectItem>
            <SelectItem value="intermediate">Intermedio</SelectItem>
            <SelectItem value="advanced">Avanzado</SelectItem>
            <SelectItem value="expert">Experto</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Challenge grid */}
      {filteredChallenges.length === 0 ? (
        <Card className="py-4">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {allChallenges.length === 0
                ? "No tienes retos aún"
                : "No se encontraron retos con los filtros aplicados"}
            </h3>
            <p className="text-muted-foreground text-center mb-6">
              {allChallenges.length === 0
                ? "Explora los retos disponibles o crea tu propio reto personalizado"
                : "Intenta ajustar los filtros para ver más resultados"}
            </p>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <a href="/explore/challenges">Explorar Retos</a>
              </Button>
              <Button onClick={() => router.push("/my-challenges/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Reto
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredChallenges.map((challenge) => (
            <Card
              key={`${challenge.type}-${challenge.id}`}
              className="hover:shadow-lg transition-shadow overflow-hidden cursor-pointer gap-0 min-h-[400px] flex flex-col relative"
              onClick={() => navigateToChallenge(challenge)}
            >
              <div className="absolute top-0 left-0 right-0 h-40">
                {challenge.cover_image_url ? (
                  <Image
                    src={challenge.cover_image_url}
                    alt={challenge.title}
                    fill
                    className="object-cover rounded-t-lg"
                    style={{ objectPosition: challenge.cover_image_position || "50% 50%" }}
                    sizes="100vw"
                  />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center rounded-t-lg">
                    <Target className="h-12 w-12 text-primary/40" />
                  </div>
                )}
                {challenge.type === "created" && !challenge.is_active && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary">Inactivo</Badge>
                  </div>
                )}
                {challenge.completed_at && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-green-600 hover:bg-green-600">Completado</Badge>
                  </div>
                )}
                {challenge.type === "created" && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="default">Creado por ti</Badge>
                  </div>
                )}
              </div>
              <div className="h-40" />
              <CardHeader className="pt-4 pb-2">
                <CardTitle className="text-lg line-clamp-2">{challenge.title}</CardTitle>
                {challenge.professional_applications && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-muted-foreground">
                      {challenge.professional_applications.first_name}{" "}
                      {challenge.professional_applications.last_name}
                    </span>
                    {challenge.professional_applications.is_verified && <VerifiedBadge size={14} />}
                  </div>
                )}
              </CardHeader>
              <CardContent className="flex-1 pb-2">
                <div className="flex flex-wrap items-center gap-2 text-sm mb-3">
                  {challenge.duration_days && (
                    <Badge variant="outline" className="text-xs">
                      <Calendar className="h-3 w-3 mr-1" />
                      {challenge.duration_days} días
                    </Badge>
                  )}
                  {challenge.difficulty_level && (
                    <Badge
                      className={cn("text-xs", getDifficultyColor(challenge.difficulty_level))}
                    >
                      {getDifficultyLabel(challenge.difficulty_level)}
                    </Badge>
                  )}
                  {challenge.completed_at && (
                    <Badge
                      variant="secondary"
                      className="text-xs bg-green-100 text-green-800 border-green-200"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Completado el{" "}
                      {new Date(challenge.completed_at).toLocaleDateString("es-MX")}
                    </Badge>
                  )}
                </div>
                {challenge.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                    {stripHtml(challenge.description)}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

    </div>
  );
}
