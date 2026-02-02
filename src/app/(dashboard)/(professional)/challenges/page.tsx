"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";
import Image from "next/image";
import { toast } from "sonner";
import { getDescriptiveErrorMessage, getFullErrorMessage, isSystemError } from "@/lib/error-messages";
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  Loader2,
  User,
  TrendingUp,
  Target,
  BookOpen,
  Video,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminStatCard } from "@/components/ui/admin-stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface Challenge {
  id: string;
  professional_id?: string | null;
  created_by_user_id?: string;
  created_by_type?: 'professional' | 'patient';
  linked_patient_id?: string | null;
  linked_professional_id?: string | null;
  title: string;
  description: string;
  short_description?: string;
  cover_image_url?: string;
  duration_days?: number;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category?: string;
  wellness_areas?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  resources_count?: number;
  meetings_count?: number;
}

export default function ProfessionalChallenges() {
  useUserStoreInit();
  const router = useRouter();
  const professionalId = useUserId();
  const supabase = createClient();

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingChallenge, setDeletingChallenge] = useState<Challenge | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recent" | "name" | "duration">("recent");

  const [stats, setStats] = useState({
    totalChallenges: 0,
    activeChallenges: 0,
    totalResources: 0,
    totalMeetings: 0,
  });

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Debes iniciar sesión");
        return;
      }

      // Buscar challenges creados por este profesional usando created_by_user_id
      const { data: challengesData, error: challengesError } = await supabase
        .from('challenges')
        .select('*')
        .eq('created_by_user_id', user.id)
        .eq('created_by_type', 'professional')
        .order('created_at', { ascending: false });

      if (challengesError) {
        throw challengesError;
      }

      // OPTIMIZACIÓN: Batch queries en lugar de N+1 queries individuales
      const challengeIds = (challengesData || []).map(c => c.id);
      
      // Obtener todos los conteos en batch (solo 2 queries en total en lugar de 2 * N)
      const [
        allResourcesResult,
        allMeetingsResult
      ] = await Promise.allSettled([
        // Todos los recursos de todos los challenges
        supabase
          .from('challenge_resources')
          .select('challenge_id')
          .in('challenge_id', challengeIds)
          .eq('is_active', true),
        // Todas las reuniones de todos los challenges
        supabase
          .from('challenge_meetings')
          .select('challenge_id')
          .in('challenge_id', challengeIds)
          .eq('is_active', true)
      ]);

      // Procesar resultados de batch queries
      const allResources = allResourcesResult.status === 'fulfilled' ? (allResourcesResult.value.data || []) : [];
      const allMeetings = allMeetingsResult.status === 'fulfilled' ? (allMeetingsResult.value.data || []) : [];

      // Crear maps para contar recursos y reuniones por challenge_id
      const resourcesMap = new Map<string, number>();
      const meetingsMap = new Map<string, number>();

      // Contar recursos por challenge_id
      allResources.forEach((resource: any) => {
        const challengeId = resource.challenge_id;
        resourcesMap.set(challengeId, (resourcesMap.get(challengeId) || 0) + 1);
      });

      // Contar reuniones por challenge_id
      allMeetings.forEach((meeting: any) => {
        const challengeId = meeting.challenge_id;
        meetingsMap.set(challengeId, (meetingsMap.get(challengeId) || 0) + 1);
      });

      // Mapear challenges con sus conteos (ya no necesitamos Promise.all, todo está en memoria)
      const challengesWithCounts = (challengesData || []).map((challenge) => {
        return {
          ...challenge,
          resources_count: resourcesMap.get(challenge.id) || 0,
          meetings_count: meetingsMap.get(challenge.id) || 0,
        };
      });

      setChallenges(challengesWithCounts);

      // Calcular estadísticas (4 cards)
      const totalResources = challengesWithCounts.reduce((s, c) => s + (c.resources_count ?? 0), 0);
      const totalMeetings = challengesWithCounts.reduce((s, c) => s + (c.meetings_count ?? 0), 0);
      setStats({
        totalChallenges: challengesData?.length || 0,
        activeChallenges: challengesData?.filter((c: Challenge) => c.is_active).length || 0,
        totalResources,
        totalMeetings,
      });

    } catch (error) {
      console.error("Error fetching challenges:", error);
      toast.error("No pudimos cargar tus retos. Por favor, recarga la página e intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const filteredChallenges = useMemo(() => {
    let list = [...challenges];
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (c) =>
          c.title?.toLowerCase().includes(term) ||
          (c.description && c.description.toLowerCase().includes(term))
      );
    }
    if (statusFilter === "active") list = list.filter((c) => c.is_active);
    if (statusFilter === "inactive") list = list.filter((c) => !c.is_active);
    if (difficultyFilter !== "all") list = list.filter((c) => c.difficulty_level === difficultyFilter);
    if (sortBy === "name") list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    else if (sortBy === "duration") list.sort((a, b) => (b.duration_days ?? 0) - (a.duration_days ?? 0));
    else list.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
    return list;
  }, [challenges, searchTerm, statusFilter, difficultyFilter, sortBy]);

  const handleDelete = async () => {
    if (!deletingChallenge) return;

    try {
      const response = await fetch(`/api/challenges/${deletingChallenge.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        const errorMsg = getFullErrorMessage(data.error || "Error al eliminar reto", "Error al eliminar el reto");
        toast.error(errorMsg, { duration: 6000 });
        return;
      }

      toast.success("Reto eliminado exitosamente");
      setIsDeleteOpen(false);
      setDeletingChallenge(null);
      fetchChallenges();
    } catch (error) {
      console.error("Error deleting challenge:", error);
      const errorMsg = getFullErrorMessage(error, "Error al eliminar el reto");
      toast.error(errorMsg, { duration: 6000 });
    }
  };

  return (
    <div className="min-h-screen bg-background w-full">
      {/* Header */}
      <div className="border-b border-border bg-card w-full">
        <div className="flex flex-col sm:flex-row sm:h-16 sm:items-center justify-between px-4 sm:px-6 py-4 sm:py-0 gap-4 sm:gap-0 w-full">
          <div className="flex items-center gap-3 sm:gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                <Target className="h-5 w-5 sm:h-6 sm:w-6" />
                Mis Retos
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Crea y gestiona retos para tus usuarios
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <a href={`/challenges/participants`}>
                Ver Participantes
              </a>
            </Button>
            <Button onClick={() => router.push(`/challenges/new`)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Reto
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 py-8">
        {/* Cards de estadísticas (4 cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
          <AdminStatCard
            title="Total Retos"
            value={String(stats.totalChallenges)}
            secondaryText="Retos creados"
            tertiaryText="Por ti"
          />
          <AdminStatCard
            title="Retos Activos"
            value={String(stats.activeChallenges)}
            trend={
              stats.totalChallenges > 0
                ? {
                    value: `${Math.round((stats.activeChallenges / stats.totalChallenges) * 100)}%`,
                    positive: stats.activeChallenges > 0,
                  }
                : undefined
            }
            secondaryText={stats.totalChallenges > 0 ? "Visibles para participantes" : "Ninguno activo"}
            tertiaryText="Del total"
          />
          <AdminStatCard
            title="Total Recursos"
            value={String(stats.totalResources)}
            secondaryText="Recursos en retos"
            tertiaryText="Materiales y contenidos"
          />
          <AdminStatCard
            title="Total Reuniones"
            value={String(stats.totalMeetings)}
            secondaryText="Reuniones programadas"
            tertiaryText="En tus retos"
          />
        </div>

        {/* Filtros (máximo 4) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar reto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | "active" | "inactive")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Dificultad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="beginner">Principiante</SelectItem>
              <SelectItem value="intermediate">Intermedio</SelectItem>
              <SelectItem value="advanced">Avanzado</SelectItem>
              <SelectItem value="expert">Experto</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as "recent" | "name" | "duration")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Más recientes</SelectItem>
              <SelectItem value="name">Por nombre</SelectItem>
              <SelectItem value="duration">Por duración</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista de retos */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : challenges.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No tienes retos aún</p>
              <Button onClick={() => router.push(`/challenges/new`)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Reto
              </Button>
            </CardContent>
          </Card>
        ) : filteredChallenges.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No hay retos que coincidan con los filtros.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredChallenges.map((challenge) => (
              <Card key={challenge.id} className="overflow-hidden py-4">
                <div className="relative h-48">
                  {challenge.cover_image_url ? (
                    <Image
                      src={challenge.cover_image_url}
                      alt={challenge.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                      <Calendar className="h-12 w-12 text-primary/40" />
                    </div>
                  )}
                  {!challenge.is_active && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary">Inactivo</Badge>
                    </div>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-2">{challenge.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {challenge.duration_days && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {challenge.duration_days} {challenge.duration_days === 1 ? 'día' : 'días'}
                    </div>
                  )}
                  {challenge.linked_patient_id && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      Reto vinculado a paciente
                    </div>
                  )}
                  {challenge.linked_professional_id && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      Reto vinculado a profesional
                    </div>
                  )}
                  <div className="flex items-center gap-4 pt-2 border-t">
                    {challenge.resources_count !== undefined && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <BookOpen className="h-4 w-4" />
                        {challenge.resources_count} {challenge.resources_count === 1 ? 'recurso' : 'recursos'}
                      </div>
                    )}
                    {challenge.meetings_count !== undefined && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Video className="h-4 w-4" />
                        {challenge.meetings_count} {challenge.meetings_count === 1 ? 'reunión' : 'reuniones'}
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardContent className="pt-0">
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      onClick={() => router.push(`/challenges/${challenge.id}/progress`)}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Avances
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/challenges/${challenge.id}/edit`)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setDeletingChallenge(challenge);
                          setIsDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de confirmación de eliminación */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Eliminar Reto"
        description={`¿Estás seguro de que deseas eliminar "${deletingChallenge?.title}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
