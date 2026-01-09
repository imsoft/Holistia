"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Calendar, Target, Loader2, CheckCircle2, Circle, Users, Plus, Edit, Trash2, Link as LinkIcon, Book, Headphones, Video, FileText, ExternalLink } from "lucide-react";
import { CheckinForm } from "@/components/ui/checkin-form";
import { ChallengeProgress } from "@/components/ui/challenge-progress";
import { ChallengeBadges } from "@/components/ui/challenge-badges";
import { TeamInvitationsList } from "@/components/ui/team-invitations-list";
import { TeamChat } from "@/components/ui/team-chat";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { DeleteConfirmation } from "@/components/ui/confirmation-dialog";

interface ChallengePurchase {
  id: string;
  challenge_id: string;
  challenge: {
    id: string;
    title: string;
    description: string;
    short_description?: string;
    cover_image_url?: string;
    duration_days?: number;
    difficulty_level?: string;
    category?: string;
    created_by_type?: 'professional' | 'patient';
    linked_professional_id?: string;
    professional_applications?: {
      first_name: string;
      last_name: string;
      profile_photo?: string;
      is_verified?: boolean;
    };
  };
  access_granted: boolean;
  started_at?: string;
  completed_at?: string;
}

interface Checkin {
  id: string;
  day_number: number;
  checkin_date: string;
  evidence_type: string;
  evidence_url?: string;
  notes?: string;
  points_earned: number;
  verified_by_professional: boolean;
}

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
  created_by_type: 'professional' | 'patient' | 'admin';
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
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const supabase = createClient();

  const [challenges, setChallenges] = useState<ChallengePurchase[]>([]);
  const [createdChallenges, setCreatedChallenges] = useState<CreatedChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengePurchase | null>(null);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [isCheckinDialogOpen, setIsCheckinDialogOpen] = useState(false);
  const [nextDayNumber, setNextDayNumber] = useState(1);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [challengeToDelete, setChallengeToDelete] = useState<CreatedChallenge | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [challengeResources, setChallengeResources] = useState<any[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);

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

      // Obtener retos en los que el usuario participa
      const { data: purchases, error } = await supabase
        .from('challenge_purchases')
        .select(`
          id,
          challenge_id,
          access_granted,
          started_at,
          completed_at,
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
            linked_professional_id,
            professional_applications:challenges_linked_professional_id_fkey(
              first_name,
              last_name,
              profile_photo,
              is_verified
            )
          )
        `)
        .eq('participant_id', user.id)
        .eq('access_granted', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transformar datos de Supabase a formato esperado
      const transformedPurchases = (purchases || []).map((purchase: any) => ({
        id: purchase.id,
        challenge_id: purchase.challenge_id,
        access_granted: purchase.access_granted,
        started_at: purchase.started_at,
        completed_at: purchase.completed_at,
        challenge: Array.isArray(purchase.challenges) && purchase.challenges.length > 0
          ? purchase.challenges[0]
          : purchase.challenges,
      }));

      setChallenges(transformedPurchases);

      // Obtener retos creados por el usuario (todos los tipos: patient, professional, admin)
      const { data: created, error: createdError } = await supabase
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
          created_by_type,
          linked_professional_id,
          is_active,
          created_at,
          professional_applications!challenges_linked_professional_id_fkey(
            first_name,
            last_name,
            profile_photo,
            is_verified
          )
        `)
        .eq('created_by_user_id', user.id)
        .order('created_at', { ascending: false });

      if (createdError) throw createdError;

      // Transformar datos de retos creados
      const transformedCreated = (created || []).map((challenge: any) => ({
        ...challenge,
        professional_applications: Array.isArray(challenge.professional_applications) && challenge.professional_applications.length > 0
          ? challenge.professional_applications[0]
          : undefined,
      }));

      setCreatedChallenges(transformedCreated);

    } catch (error) {
      console.error("Error fetching challenges:", error);
      toast.error("Error al cargar retos");
    } finally {
      setLoading(false);
    }
  };

  const fetchCheckins = async (challengePurchaseId: string) => {
    try {
      const response = await fetch(
        `/api/challenges/checkins?challenge_purchase_id=${challengePurchaseId}`
      );
      const data = await response.json();

      if (response.ok) {
        setCheckins(data.checkins || []);
        // Calcular siguiente día
        const maxDay = data.checkins?.length > 0
          ? Math.max(...data.checkins.map((c: Checkin) => c.day_number))
          : 0;
        setNextDayNumber(maxDay + 1);
      }
    } catch (error) {
      console.error("Error fetching checkins:", error);
    }
  };

  const handleOpenChallenge = async (challenge: ChallengePurchase) => {
    setSelectedChallenge(challenge);
    await fetchCheckins(challenge.id); // challenge.id es el challenge_purchase_id
    await fetchTeam(challenge.challenge_id);
    await fetchResources(challenge.challenge_id);
  };

  const fetchResources = async (challengeId: string) => {
    try {
      setLoadingResources(true);
      const response = await fetch(`/api/challenges/${challengeId}/resources`);
      const data = await response.json();
      
      if (response.ok) {
        setChallengeResources(data.resources || []);
      }
    } catch (error) {
      console.error("Error fetching resources:", error);
    } finally {
      setLoadingResources(false);
    }
  };

  const getResourceIcon = (resourceType: string) => {
    switch (resourceType) {
      case 'ebook':
      case 'pdf':
        return <Book className="h-4 w-4" />;
      case 'audio':
        return <Headphones className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'link':
        return <LinkIcon className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatResourceInfo = (resource: any) => {
    const parts: string[] = [];
    if (resource.pages_count) {
      parts.push(`${resource.pages_count} páginas`);
    }
    if (resource.duration_minutes) {
      parts.push(`${resource.duration_minutes} min`);
    }
    if (resource.file_size_bytes) {
      const sizeMB = (resource.file_size_bytes / (1024 * 1024)).toFixed(2);
      parts.push(`${sizeMB} MB`);
    }
    return parts.length > 0 ? ` • ${parts.join(' • ')}` : '';
  };

  const fetchTeam = async (challengeId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obtener equipo del usuario para este reto
      const { data: membership } = await supabase
        .from("challenge_team_members")
        .select(`
          team:challenge_teams(
            id,
            team_name,
            challenge_id
          )
        `)
        .eq("user_id", user.id)
        .maybeSingle();

      if (membership?.team) {
        const teamData = Array.isArray(membership.team) ? membership.team[0] : membership.team;
        if (teamData && teamData.challenge_id === challengeId) {
          setTeamId(teamData.id);
          setTeamName(teamData.team_name || "Equipo sin nombre");
        } else {
          setTeamId(null);
          setTeamName(null);
        }
      } else {
        setTeamId(null);
        setTeamName(null);
      }
    } catch (error) {
      console.error("Error fetching team:", error);
      setTeamId(null);
      setTeamName(null);
    }
  };

  const handleCheckinComplete = async () => {
    if (selectedChallenge) {
      await fetchCheckins(selectedChallenge.id);
      // Refrescar progreso
      fetchChallenges();
    }
    setIsCheckinDialogOpen(false);
  };

  const getDifficultyLabel = (level?: string) => {
    const labels: Record<string, string> = {
      beginner: 'Principiante',
      intermediate: 'Intermedio',
      advanced: 'Avanzado',
      expert: 'Experto',
    };
    return labels[level || ''] || level || 'N/A';
  };

  const getDifficultyColor = (level?: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-blue-100 text-blue-800',
      advanced: 'bg-orange-100 text-orange-800',
      expert: 'bg-red-100 text-red-800',
    };
    return colors[level || ''] || 'bg-gray-100 text-gray-800';
  };

  const handleDeleteClick = (challenge: CreatedChallenge) => {
    setChallengeToDelete(challenge);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!challengeToDelete) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/challenges/${challengeToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar el reto');
      }

      toast.success('Reto eliminado exitosamente');
      fetchChallenges();
      setDeleteDialogOpen(false);
      setChallengeToDelete(null);
    } catch (error) {
      console.error('Error deleting challenge:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar el reto';
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
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
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Mis Retos</h1>
          <p className="text-muted-foreground">
            Gestiona tus retos activos y completa tus check-ins diarios
          </p>
        </div>
        <Button onClick={() => router.push(`/patient/${userId}/my-challenges/new`)}>
          <Plus className="h-4 w-4 mr-2" />
          Crear Reto Personal
        </Button>
      </div>

      {/* Invitaciones a equipos */}
      <div className="mb-6">
        <TeamInvitationsList />
      </div>

      {/* Tabs para separar retos participados y creados */}
      <Tabs defaultValue="participating" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="participating">
            Retos en los que Participo ({challenges.length})
          </TabsTrigger>
          <TabsTrigger value="created">
            Retos que Creé ({createdChallenges.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab de retos en los que participa */}
        <TabsContent value="participating">
          {challenges.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No estás participando en retos aún</h3>
                <p className="text-muted-foreground text-center mb-6">
                  Explora los retos disponibles y comienza tu transformación
                </p>
                <Button asChild>
                  <a href={`/patient/${userId}/explore/challenges`}>Explorar Retos</a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Lista de retos */}
              <div className="lg:col-span-1 space-y-4">
                {challenges.map((challenge) => (
              <Card
                key={challenge.id}
                className={`cursor-pointer hover:shadow-lg transition-shadow py-4 ${
                  selectedChallenge?.id === challenge.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleOpenChallenge(challenge)}
              >
                <div className="relative h-32">
                  {challenge.challenge.cover_image_url ? (
                    <Image
                      src={challenge.challenge.cover_image_url}
                      alt={challenge.challenge.title}
                      fill
                      className="object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                      <Target className="h-12 w-12 text-primary/40" />
                    </div>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="text-lg line-clamp-2">
                    {challenge.challenge.title}
                  </CardTitle>
                  {challenge.challenge.professional_applications && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-muted-foreground">
                        {challenge.challenge.professional_applications.first_name}{' '}
                        {challenge.challenge.professional_applications.last_name}
                      </span>
                      {challenge.challenge.professional_applications.is_verified && (
                        <VerifiedBadge size={14} />
                      )}
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm">
                    {challenge.challenge.duration_days && (
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        {challenge.challenge.duration_days} días
                      </Badge>
                    )}
                    {challenge.challenge.difficulty_level && (
                      <Badge className={`text-xs ${getDifficultyColor(challenge.challenge.difficulty_level)}`}>
                        {getDifficultyLabel(challenge.challenge.difficulty_level)}
                      </Badge>
                    )}
                  </div>
                </CardContent>
                <div className="px-6 pb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/patient/${userId}/my-challenges/${challenge.challenge_id}/team/create`);
                    }}
                  >
                    <Users className="h-4 w-4" />
                    Crear/Ver Equipo
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Detalles del reto seleccionado */}
          {selectedChallenge && (
            <div className="lg:col-span-2 space-y-6">
              <Tabs defaultValue="progress" className="w-full">
                <TabsList className={`grid w-full ${teamId ? 'grid-cols-5' : 'grid-cols-4'}`}>
                  <TabsTrigger value="progress">Progreso</TabsTrigger>
                  <TabsTrigger value="checkins">Check-ins</TabsTrigger>
                  <TabsTrigger value="badges">Badges</TabsTrigger>
                  <TabsTrigger value="resources">Recursos</TabsTrigger>
                  {teamId && (
                    <TabsTrigger value="chat" className="gap-2">
                      <Users className="h-4 w-4" />
                      Chat
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="progress" className="space-y-4">
                  <ChallengeProgress
                    challengePurchaseId={selectedChallenge.id}
                    challengeDurationDays={selectedChallenge.challenge.duration_days}
                  />
                </TabsContent>

                <TabsContent value="checkins" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Check-ins Diarios</CardTitle>
                        <Button
                          onClick={() => setIsCheckinDialogOpen(true)}
                          disabled={!selectedChallenge.access_granted}
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
                          {Array.from({ length: selectedChallenge.challenge.duration_days || 30 }, (_, i) => i + 1).map((day) => {
                            const checkin = checkins.find(c => c.day_number === day);
                            return (
                              <div
                                key={day}
                                className={`flex items-center gap-4 p-4 border rounded-lg ${
                                  checkin ? 'bg-green-50 border-green-200' : 'bg-muted/30'
                                }`}
                              >
                                <div className="flex-shrink-0">
                                  {checkin ? (
                                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                                  ) : (
                                    <Circle className="h-6 w-6 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold">Día {day}</span>
                                    {checkin && (
                                      <>
                                        <Badge variant="secondary" className="text-xs">
                                          +{checkin.points_earned} pts
                                        </Badge>
                                        {checkin.verified_by_professional && (
                                          <Badge variant="default" className="text-xs">
                                            Verificado
                                          </Badge>
                                        )}
                                      </>
                                    )}
                                  </div>
                                  {checkin && (
                                    <div className="text-sm text-muted-foreground">
                                      {checkin.notes && (
                                        <p className="mb-1">{checkin.notes}</p>
                                      )}
                                      {checkin.evidence_url && (
                                        <div className="mt-2">
                                          {checkin.evidence_type === 'photo' && (
                                            <Image
                                              src={checkin.evidence_url}
                                              alt="Evidencia"
                                              width={100}
                                              height={100}
                                              className="rounded-lg object-cover"
                                            />
                                          )}
                                        </div>
                                      )}
                                      <p className="text-xs mt-1">
                                        {new Date(checkin.checkin_date).toLocaleDateString('es-ES')}
                                      </p>
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

                <TabsContent value="badges">
                  <ChallengeBadges challengePurchaseId={selectedChallenge.id} />
                </TabsContent>

                <TabsContent value="resources" className="space-y-4">
                  <Card>
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
                          <p className="text-muted-foreground">
                            No hay recursos disponibles para este reto
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {challengeResources.map((resource) => (
                            <div
                              key={resource.id}
                              className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex-shrink-0 mt-1">
                                {getResourceIcon(resource.resource_type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-sm mb-1">
                                      {resource.title}
                                    </h4>
                                    {resource.description && (
                                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                        {resource.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <Badge variant="outline" className="text-xs">
                                        {resource.resource_type === 'ebook' ? 'Ebook' :
                                         resource.resource_type === 'audio' ? 'Audio' :
                                         resource.resource_type === 'video' ? 'Video' :
                                         resource.resource_type === 'pdf' ? 'PDF' :
                                         resource.resource_type === 'link' ? 'Enlace' : 'Otro'}
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

                {teamId && (
                  <TabsContent value="chat">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Chat de Equipo
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Comunícate con tu equipo en tiempo real
                        </p>
                      </CardHeader>
                      <CardContent>
                        <TeamChat
                          teamId={teamId}
                          currentUserId={userId}
                          teamName={teamName || undefined}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}
              </Tabs>
            </div>
          )}
            </div>
          )}
        </TabsContent>

        {/* Tab de retos creados por el usuario */}
        <TabsContent value="created">
          {createdChallenges.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No has creado retos personales</h3>
                <p className="text-muted-foreground text-center mb-6">
                  Crea tu propio reto personalizado y compártelo con tus amigos
                </p>
                <Button onClick={() => router.push(`/patient/${userId}/my-challenges/new`)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Mi Primer Reto
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {createdChallenges.map((challenge) => (
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
                        <Target className="h-12 w-12 text-primary/40" />
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
                    {challenge.professional_applications && (
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          Supervisado por {challenge.professional_applications.first_name} {challenge.professional_applications.last_name}
                        </Badge>
                        {challenge.professional_applications.is_verified && (
                          <VerifiedBadge size={14} />
                        )}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {challenge.duration_days && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {challenge.duration_days} {challenge.duration_days === 1 ? 'día' : 'días'}
                      </div>
                    )}
                    {challenge.difficulty_level && (
                      <Badge className={`text-xs ${getDifficultyColor(challenge.difficulty_level)}`}>
                        {getDifficultyLabel(challenge.difficulty_level)}
                      </Badge>
                    )}
                  </CardContent>
                  <CardContent className="pt-0">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/patient/${userId}/my-challenges/${challenge.id}/edit`)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          router.push(`/patient/${userId}/my-challenges/${challenge.id}/team/create`);
                        }}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Invitar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(challenge);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog para nuevo check-in */}
      <Dialog open={isCheckinDialogOpen} onOpenChange={setIsCheckinDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Check-in - Día {nextDayNumber}</DialogTitle>
            <DialogDescription>
              Completa tu check-in diario para ganar puntos y mantener tu racha
            </DialogDescription>
          </DialogHeader>
          {selectedChallenge && (
            <CheckinForm
              challengePurchaseId={selectedChallenge.id}
              dayNumber={nextDayNumber}
              challengeDurationDays={selectedChallenge.challenge.duration_days}
              onCheckinComplete={handleCheckinComplete}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación para eliminar reto */}
      <DeleteConfirmation
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        itemName={challengeToDelete?.title || 'este reto'}
        loading={deleting}
      />
    </div>
  );
}
