"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { 
  Search, 
  TrendingUp, 
  Flame, 
  Award, 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Loader2, 
  User,
  ArrowLeft,
  Trophy,
  Star,
  Target
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ParticipantProgress {
  purchase_id: string;
  participant_id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_photo?: string;
  started_at?: string;
  progress: {
    total_points: number;
    current_streak: number;
    longest_streak: number;
    days_completed: number;
    completion_percentage: number;
    level: number;
    status: string;
    last_checkin_date?: string;
  };
  checkins_count: number;
  badges: Array<{
    id: string;
    name: string;
    description: string;
    icon?: string;
    badge_type: string;
    earned_at: string;
  }>;
}

export default function ChallengeProgressPage() {
  useUserStoreInit();
  const params = useParams();
  const router = useRouter();
  const professionalId = useUserId();
  const challengeId = params.challengeId as string;
  const supabase = createClient();

  const [challenge, setChallenge] = useState<any>(null);
  const [participants, setParticipants] = useState<ParticipantProgress[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<ParticipantProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantProgress | null>(null);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    fetchChallenge();
    fetchParticipants();
  }, [challengeId]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = participants.filter(p =>
        p.buyer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.buyer_email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredParticipants(filtered);
    } else {
      setFilteredParticipants(participants);
    }
  }, [searchTerm, participants]);

  const fetchChallenge = async () => {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', challengeId)
        .single();

      if (error) throw error;
      setChallenge(data);
    } catch (error) {
      console.error("Error fetching challenge:", error);
      toast.error("Error al cargar el reto");
    }
  };

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Debes iniciar sesión");
        return;
      }

      // Obtener todas las compras de este reto específico
      const { data: purchases, error: purchasesError } = await supabase
        .from('challenge_purchases')
        .select(`
          id,
          participant_id,
          started_at
        `)
        .eq('challenge_id', challengeId)
        .eq('access_granted', true);

      if (purchasesError) throw purchasesError;

      // Obtener progresos y badges para cada compra
      const participantsData: ParticipantProgress[] = [];

      for (const purchase of purchases || []) {
        // Obtener perfil del usuario
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, photo_url')
          .eq('id', purchase.participant_id)
          .single();

        // Obtener progreso
        const { data: progressData } = await supabase
          .from('challenge_progress')
          .select('*')
          .eq('challenge_purchase_id', purchase.id)
          .single();

        // Obtener badges
        const { data: badgesData } = await supabase
          .from('challenge_user_badges')
          .select(`
            id,
            earned_at,
            challenge_badges!inner(
              id,
              name,
              description,
              icon,
              badge_type
            )
          `)
          .eq('challenge_purchase_id', purchase.id);

        // Contar check-ins
        const { data: checkinsData } = await supabase
          .from('challenge_checkins')
          .select('id', { count: 'exact', head: true })
          .eq('challenge_purchase_id', purchase.id);

        const profile = profileData;
        participantsData.push({
          purchase_id: purchase.id,
          participant_id: purchase.participant_id,
          buyer_name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Usuario',
          buyer_email: profile?.email || '',
          buyer_photo: profile?.photo_url || undefined,
          started_at: purchase.started_at,
          progress: progressData ? {
            total_points: progressData.total_points || 0,
            current_streak: progressData.current_streak || 0,
            longest_streak: progressData.longest_streak || 0,
            days_completed: progressData.days_completed || 0,
            completion_percentage: Number(progressData.completion_percentage) || 0,
            level: progressData.level || 1,
            status: progressData.status || 'in_progress',
            last_checkin_date: progressData.last_checkin_date || undefined,
          } : {
            total_points: 0,
            current_streak: 0,
            longest_streak: 0,
            days_completed: 0,
            completion_percentage: 0,
            level: 1,
            status: 'in_progress',
          },
          checkins_count: checkinsData?.length || 0,
          badges: (badgesData || []).map((b: any) => ({
            id: b.challenge_badges.id,
            name: b.challenge_badges.name,
            description: b.challenge_badges.description,
            icon: b.challenge_badges.icon,
            badge_type: b.challenge_badges.badge_type,
            earned_at: b.earned_at,
          })),
        });
      }

      // Ordenar por puntos totales (descendente)
      participantsData.sort((a, b) => b.progress.total_points - a.progress.total_points);

      setParticipants(participantsData);
      setFilteredParticipants(participantsData);
    } catch (error) {
      console.error("Error fetching participants:", error);
      toast.error("Error al cargar los participantes");
    } finally {
      setLoading(false);
    }
  };

  const fetchCheckins = async (purchaseId: string) => {
    try {
      const { data, error } = await supabase
        .from('challenge_checkins')
        .select('*')
        .eq('challenge_purchase_id', purchaseId)
        .order('checkin_date', { ascending: false })
        .order('day_number', { ascending: false });

      if (error) throw error;
      setCheckins(data || []);
    } catch (error) {
      console.error("Error fetching checkins:", error);
      toast.error("Error al cargar los check-ins");
    }
  };

  const handleViewDetails = async (participant: ParticipantProgress) => {
    setSelectedParticipant(participant);
    setIsDetailsOpen(true);
    await fetchCheckins(participant.purchase_id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completado</Badge>;
      case 'abandoned':
        return <Badge variant="destructive">Abandonado</Badge>;
      default:
        return <Badge variant="secondary">En progreso</Badge>;
    }
  };

  const getLevelColor = (level: number) => {
    if (level >= 10) return "text-purple-600";
    if (level >= 7) return "text-blue-600";
    if (level >= 4) return "text-green-600";
    return "text-gray-600";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b px-6 py-4">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/challenges')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Avances del Reto</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {challenge?.title || <span className="inline-block h-5 w-48 bg-muted rounded animate-pulse" />}
            </p>
          </div>
        </div>

        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar participantes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {filteredParticipants.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">
                {searchTerm ? "No se encontraron participantes" : "Aún no hay participantes en este reto"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredParticipants.map((participant) => (
              <Card key={participant.purchase_id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {participant.buyer_photo ? (
                      <Image
                        src={participant.buyer_photo}
                        alt={participant.buyer_name}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{participant.buyer_name}</CardTitle>
                      <p className="text-xs text-muted-foreground truncate">{participant.buyer_email}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Estado */}
                  <div className="flex items-center justify-between">
                    {getStatusBadge(participant.progress.status)}
                    <div className="flex items-center gap-1">
                      <Star className={`h-4 w-4 ${getLevelColor(participant.progress.level)}`} />
                      <span className={`text-sm font-semibold ${getLevelColor(participant.progress.level)}`}>
                        Nivel {participant.progress.level}
                      </span>
                    </div>
                  </div>

                  {/* Progreso */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progreso</span>
                      <span className="font-semibold">{participant.progress.completion_percentage.toFixed(0)}%</span>
                    </div>
                    <Progress value={participant.progress.completion_percentage} />
                  </div>

                  {/* Estadísticas */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-muted-foreground text-xs">Puntos</p>
                        <p className="font-semibold">{participant.progress.total_points}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <div>
                        <p className="text-muted-foreground text-xs">Racha</p>
                        <p className="font-semibold">{participant.progress.current_streak} días</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="text-muted-foreground text-xs">Completados</p>
                        <p className="font-semibold">{participant.progress.days_completed} días</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-yellow-500" />
                      <div>
                        <p className="text-muted-foreground text-xs">Medallas</p>
                        <p className="font-semibold">{participant.badges.length}</p>
                      </div>
                    </div>
                  </div>

                  {/* Medallas destacadas */}
                  {participant.badges.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {participant.badges.slice(0, 3).map((badge) => (
                        <Badge key={badge.id} variant="outline" className="text-xs">
                          {badge.icon || '🏆'} {badge.name}
                        </Badge>
                      ))}
                      {participant.badges.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{participant.badges.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Botón ver detalles */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleViewDetails(participant)}
                  >
                    Ver Detalles
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de detalles */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedParticipant?.buyer_name}
            </DialogTitle>
            <DialogDescription>
              Detalles del progreso y actividad
            </DialogDescription>
          </DialogHeader>

          {selectedParticipant && (
            <div className="space-y-6">
              {/* Estadísticas principales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{selectedParticipant.progress.total_points}</p>
                      <p className="text-xs text-muted-foreground">Puntos Totales</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-500">{selectedParticipant.progress.current_streak}</p>
                      <p className="text-xs text-muted-foreground">Racha Actual</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-500">{selectedParticipant.progress.days_completed}</p>
                      <p className="text-xs text-muted-foreground">Días Completados</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-500">{selectedParticipant.badges.length}</p>
                      <p className="text-xs text-muted-foreground">Medallas</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Medallas */}
              {selectedParticipant.badges.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Medallas Desbloqueadas
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedParticipant.badges.map((badge) => (
                      <Card key={badge.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{badge.icon || '🏆'}</div>
                            <div className="flex-1">
                              <p className="font-semibold">{badge.name}</p>
                              <p className="text-xs text-muted-foreground">{badge.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(badge.earned_at).toLocaleDateString('es-MX')}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Check-ins recientes */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Check-ins Recientes ({checkins.length})
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {checkins.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Aún no hay check-ins registrados
                    </p>
                  ) : (
                    checkins.map((checkin) => (
                      <Card key={checkin.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline">Día {checkin.day_number}</Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(checkin.checkin_date).toLocaleDateString('es-MX')}
                                </span>
                              </div>
                              {checkin.notes && (
                                <p className="text-sm">{checkin.notes}</p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span>+{checkin.points_earned} puntos</span>
                                {checkin.verified_by_professional && (
                                  <Badge variant="secondary" className="text-xs">Verificado</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
