"use client";

import { useState, useEffect } from "react";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Search, TrendingUp, Flame, Award, Calendar, CheckCircle2, Circle, Loader2, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VideoPlayer } from "@/components/ui/video-player";

interface Participant {
  purchase_id: string;
  participant_id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_photo?: string;
  challenge_title: string;
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
  badges_count: number;
}

export default function ChallengeParticipantsPage() {
  useUserStoreInit();
  const professionalId = useUserId();
  const supabase = createClient();

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    fetchParticipants();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = participants.filter(p =>
        p.buyer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.buyer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.challenge_title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredParticipants(filtered);
    } else {
      setFilteredParticipants(participants);
    }
  }, [searchTerm, participants]);

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Debes iniciar sesión");
        return;
      }

      // Obtener todas las compras de retos creados por este profesional
      const { data: purchases, error } = await supabase
        .from('challenge_purchases')
        .select(`
          id,
          participant_id,
          challenge_id,
          started_at,
          challenges!inner(
            id,
            title,
            professional_id,
            professional_applications!inner(user_id)
          )
        `)
        .eq('challenges.professional_applications.user_id', user.id)
        .eq('access_granted', true);

      if (error) throw error;

      // Obtener progreso y datos de cada participante
      const participantsData = await Promise.all(
        (purchases || []).map(async (purchase: any) => {
          // Obtener perfil del comprador
          const { data: buyerProfile } = await supabase
            .from('profiles')
            .select('first_name, last_name, email, avatar_url')
            .eq('id', purchase.participant_id)
            .single();

          // Obtener progreso
          const { data: progress } = await supabase
            .from('challenge_progress')
            .select('*')
            .eq('challenge_purchase_id', purchase.id)
            .maybeSingle();

          // Contar check-ins
          const { count: checkinsCount } = await supabase
            .from('challenge_checkins')
            .select('*', { count: 'exact', head: true })
            .eq('challenge_purchase_id', purchase.id);

          // Contar badges
          const { count: badgesCount } = await supabase
            .from('challenge_user_badges')
            .select('*', { count: 'exact', head: true })
            .eq('challenge_purchase_id', purchase.id);

          return {
            purchase_id: purchase.id,
            participant_id: purchase.participant_id,
            buyer_name: buyerProfile
              ? `${buyerProfile.first_name || ''} ${buyerProfile.last_name || ''}`.trim() || buyerProfile.email?.split('@')[0] || 'Usuario'
              : 'Usuario',
            buyer_email: buyerProfile?.email || '',
            buyer_photo: buyerProfile?.avatar_url,
            challenge_title: purchase.challenges.title,
            started_at: purchase.started_at,
            progress: progress || {
              total_points: 0,
              current_streak: 0,
              longest_streak: 0,
              days_completed: 0,
              completion_percentage: 0,
              level: 1,
              status: 'in_progress',
            },
            checkins_count: checkinsCount || 0,
            badges_count: badgesCount || 0,
          };
        })
      );

      setParticipants(participantsData);
      setFilteredParticipants(participantsData);

    } catch (error) {
      console.error("Error fetching participants:", error);
      toast.error("Error al cargar participantes");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (participant: Participant) => {
    setSelectedParticipant(participant);
    setIsDetailsOpen(true);

    // Obtener check-ins del participante
    try {
      const response = await fetch(
        `/api/challenges/checkins?challenge_purchase_id=${participant.purchase_id}`
      );
      const data = await response.json();

      if (response.ok) {
        setCheckins(data.checkins || []);
      }
    } catch (error) {
      console.error("Error fetching checkins:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'abandoned': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return '✅ Completado';
      case 'abandoned': return '❌ Abandonado';
      default: return '🔄 En Progreso';
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Participantes de Retos</h1>
        <p className="text-muted-foreground">
          Visualiza el progreso y check-ins de los usuarios en tus retos
        </p>
      </div>

      {/* Buscador */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email o reto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Participantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{participants.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {participants.filter(p => p.progress.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En Progreso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {participants.filter(p => p.progress.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Check-ins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {participants.reduce((sum, p) => sum + p.checkins_count, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de participantes */}
      {filteredParticipants.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {searchTerm ? 'No se encontraron participantes' : 'No hay participantes aún'}
            </h3>
            <p className="text-muted-foreground text-center">
              {searchTerm
                ? 'Intenta con otros términos de búsqueda'
                : 'Los usuarios que compren tus retos aparecerán aquí'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredParticipants.map((participant) => (
            <Card
              key={participant.purchase_id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleViewDetails(participant)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="relative h-12 w-12 rounded-full overflow-hidden flex-shrink-0">
                    {participant.buyer_photo ? (
                      <Image
                        src={participant.buyer_photo}
                        alt={participant.buyer_name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                    )}
                  </div>

                  {/* Información */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{participant.buyer_name}</h3>
                        <p className="text-sm text-muted-foreground">{participant.buyer_email}</p>
                      </div>
                      <Badge className={getStatusColor(participant.progress.status)}>
                        {getStatusLabel(participant.progress.status)}
                      </Badge>
                    </div>

                    <p className="text-sm font-medium text-primary mb-3">
                      {participant.challenge_title}
                    </p>

                    {/* Progreso */}
                    <div className="space-y-2">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Progreso</span>
                          <span className="text-xs font-semibold">
                            {participant.progress.completion_percentage.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={participant.progress.completion_percentage} className="h-2" />
                      </div>

                      {/* Métricas */}
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-primary" />
                          <span className="text-muted-foreground">
                            {participant.progress.total_points} pts
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Flame className="h-3 w-3 text-orange-500" />
                          <span className="text-muted-foreground">
                            {participant.progress.current_streak} 🔥
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Award className="h-3 w-3 text-yellow-500" />
                          <span className="text-muted-foreground">
                            Nivel {participant.progress.level}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          <span className="text-muted-foreground">
                            {participant.checkins_count} check-ins
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de detalles */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedParticipant?.buyer_name} - {selectedParticipant?.challenge_title}
            </DialogTitle>
            <DialogDescription>
              Detalles del progreso y check-ins
            </DialogDescription>
          </DialogHeader>

          {selectedParticipant && (
            <Tabs defaultValue="progress" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="progress">Progreso</TabsTrigger>
                <TabsTrigger value="checkins">Check-ins ({checkins.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="progress" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-muted-foreground">
                        Puntos Totales
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedParticipant.progress.total_points}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-muted-foreground">
                        Racha Actual
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-500">
                        {selectedParticipant.progress.current_streak} 🔥
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-muted-foreground">
                        Nivel
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedParticipant.progress.level}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-muted-foreground">
                        Días Completados
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedParticipant.progress.days_completed}</div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Progreso General</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Completitud</span>
                        <span className="text-sm font-semibold">
                          {selectedParticipant.progress.completion_percentage.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={selectedParticipant.progress.completion_percentage} className="h-3" />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="checkins" className="space-y-4">
                {checkins.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <Circle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Aún no hay check-ins</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {checkins.map((checkin) => (
                      <Card key={checkin.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="font-bold text-primary">D{checkin.day_number}</span>
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <p className="font-semibold">Día {checkin.day_number}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {(() => { const [y, m, d] = checkin.checkin_date.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }); })()}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary">
                                    +{checkin.points_earned} pts
                                  </Badge>
                                  {checkin.verified_by_professional && (
                                    <Badge variant="default">Verificado</Badge>
                                  )}
                                </div>
                              </div>
                              {checkin.notes && (
                                <p className="text-sm text-muted-foreground mb-2">{checkin.notes}</p>
                              )}
                              {checkin.evidence_url && (
                                <div className="mt-2">
                                  {checkin.evidence_type === 'photo' && (
                                    <Image
                                      src={checkin.evidence_url}
                                      alt="Evidencia"
                                      width={200}
                                      height={200}
                                      className="rounded-lg object-cover"
                                    />
                                  )}
                                  {checkin.evidence_type === 'video' && (
                                    <div className="rounded-lg overflow-hidden max-w-md aspect-video">
                                      <VideoPlayer
                                        url={checkin.evidence_url}
                                        className="w-full h-full"
                                        fill
                                      />
                                    </div>
                                  )}
                                  {checkin.evidence_type === 'audio' && (
                                    <audio
                                      src={checkin.evidence_url}
                                      controls
                                      className="w-full"
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
