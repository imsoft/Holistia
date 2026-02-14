"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Calendar, Target, Loader2, CheckCircle2, Circle, Users, Plus, Edit, Trash2, Link as LinkIcon, Book, Headphones, Video, FileText, ExternalLink, Search, Filter, Share2, UserPlus, Trophy, MessageSquare } from "lucide-react";
import { CheckinForm } from "@/components/ui/checkin-form";
import { ChallengeProgress } from "@/components/ui/challenge-progress";
import { ChallengeBadges } from "@/components/ui/challenge-badges";
import { ChallengeInviteDialog } from "@/components/ui/challenge-invite-dialog";
import { ChallengeChat } from "@/components/ui/challenge-chat";
import { stripHtml } from "@/lib/text-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { DeleteConfirmation } from "@/components/ui/confirmation-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { VideoPlayer } from "@/components/ui/video-player";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    created_by_type?: 'professional' | 'patient' | 'admin';
    linked_professional_id?: string;
    is_active?: boolean;
    is_public?: boolean;
    type?: 'participating' | 'created';
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
  created_at?: string;
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
  is_public?: boolean;
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
  useUserStoreInit();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = useUserId();
  const supabase = createClient();

  const [challenges, setChallenges] = useState<ChallengePurchase[]>([]);
  const [createdChallenges, setCreatedChallenges] = useState<CreatedChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengePurchase | null>(null);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [isCheckinDialogOpen, setIsCheckinDialogOpen] = useState(false);
  const [nextDayNumber, setNextDayNumber] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [challengeToDelete, setChallengeToDelete] = useState<CreatedChallenge | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [challengeResources, setChallengeResources] = useState<any[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [allChallenges, setAllChallenges] = useState<any[]>([]);
  const [filteredChallenges, setFilteredChallenges] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [completionFilter, setCompletionFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [participantsCount, setParticipantsCount] = useState<number>(0);
  const [participants, setParticipants] = useState<Array<{ id: string; first_name: string | null; last_name: string | null; avatar_url: string | null; type?: string | null }>>([]);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  useEffect(() => {
    fetchChallenges();
  }, []);

  // Abrir reto automáticamente si viene de query parameter
  useEffect(() => {
    const challengeId = searchParams.get('challenge');
    
    if (challengeId && allChallenges.length > 0 && !selectedChallenge) {
      const challenge = allChallenges.find((c: any) => c.id === challengeId);
      if (challenge) {
        // Abrir el reto
        handleOpenChallenge(challenge).then(() => {
          // Limpiar query params después de abrir
          setTimeout(() => {
            if (window.history.replaceState) {
              window.history.replaceState({}, '', `/my-challenges`);
            }
          }, 500);
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, allChallenges.length, selectedChallenge]);

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
          created_at,
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
        .eq('participant_id', user.id)
        .eq('access_granted', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transformar datos de Supabase a formato esperado
      const transformedPurchases = (purchases || []).map((purchase: any) => {
        const challenge = Array.isArray(purchase.challenges) && purchase.challenges.length > 0
          ? purchase.challenges[0]
          : purchase.challenges;
        return {
          id: purchase.id,
          challenge_id: purchase.challenge_id,
          access_granted: purchase.access_granted,
          started_at: purchase.started_at,
          completed_at: purchase.completed_at,
          created_at: purchase.created_at,
          challenge: {
            ...challenge,
            is_active: challenge?.is_active ?? true,
          },
        };
      });

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
        .eq('created_by_user_id', user.id)
        .order('created_at', { ascending: false });

      if (createdError) {
        console.error('Error fetching created challenges:', createdError);
        throw createdError;
      }

      console.log('🔍 Retos creados encontrados:', created?.length || 0, created);

      // Transformar datos de retos creados
      const transformedCreated = (created || []).map((challenge: any) => ({
        ...challenge,
        is_active: challenge.is_active ?? true,
        professional_applications: Array.isArray(challenge.professional_applications) && challenge.professional_applications.length > 0
          ? challenge.professional_applications[0]
          : undefined,
      }));

      setCreatedChallenges(transformedCreated);

      // Combinar todos los retos en una sola lista
      const participatingChallenges = transformedPurchases.map((p: any) => ({
        ...p.challenge,
        purchaseId: p.id,
        type: 'participating' as const,
        access_granted: p.access_granted,
        started_at: p.started_at,
        completed_at: p.completed_at,
        created_at: p.created_at,
      }));

      // Marcar retos creados por el usuario
      const createdChallenges = transformedCreated.map((c: any) => ({
        ...c,
        type: 'created' as const,
        purchaseId: null,
      }));

      // Filtrar duplicados: si un reto aparece tanto en participating como en created,
      // verificar si el usuario es el creador y mantenerlo como 'created' si es así
      const createdChallengeIds = new Set(transformedCreated.map((c: any) => c.id));
      
      // Para retos que están en participating, verificar si también fueron creados por el usuario
      // Comparar por ID y también por created_by_user_id para mayor seguridad
      const participatingWithCreatedFlag = participatingChallenges.map((c: any) => {
        // Verificar si el reto fue creado por el usuario comparando IDs y created_by_user_id
        if (createdChallengeIds.has(c.id) || c.created_by_user_id === user.id) {
          return { ...c, type: 'created' as const };
        }
        return c;
      });
      
      const challengeIds = new Set(participatingWithCreatedFlag.map((c: any) => c.id));
      const uniqueCreatedChallenges = createdChallenges.filter((c: any) => !challengeIds.has(c.id));

      const combinedChallenges = [
        ...participatingWithCreatedFlag,
        ...uniqueCreatedChallenges,
      ];

      setAllChallenges(combinedChallenges);
      setFilteredChallenges(combinedChallenges);

    } catch (error) {
      console.error("Error fetching challenges:", error);
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

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter((c) =>
        c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por tipo
    if (typeFilter !== "all") {
      filtered = filtered.filter((c) => c.type === typeFilter);
    }

    // Filtrar por estado (solo para retos creados)
    if (statusFilter !== "all") {
      filtered = filtered.filter((c) => {
        if (c.type === 'created') {
          return statusFilter === "active" ? c.is_active : !c.is_active;
        }
        return true;
      });
    }

    // Filtrar por progreso: Activos (en progreso) vs Completados
    if (completionFilter !== "all") {
      filtered = filtered.filter((c) => {
        const isCompleted = !!c.completed_at;
        return completionFilter === "completed" ? isCompleted : !isCompleted;
      });
    }

    // Filtrar por dificultad
    if (difficultyFilter !== "all") {
      filtered = filtered.filter((c) => c.difficulty_level === difficultyFilter);
    }

    setFilteredChallenges(filtered);
  };

  const fetchCheckins = async (challengePurchaseId: string) => {
    try {
      const response = await fetch(
        `/api/challenges/checkins?challenge_purchase_id=${challengePurchaseId}`
      );
      const data = await response.json();

      if (response.ok) {
        setCheckins(data.checkins || []);
        // El siguiente día se calcula por calendario en el useEffect (desde started_at)
      }
    } catch (error) {
      console.error("Error fetching checkins:", error);
    }
  };

  // Calcular el día del reto que corresponde a "hoy" (fecha local del usuario) para que el título del diálogo coincida con el check-in que se guarda. Usamos la misma fecha que enviará el formulario (hoy en local) y la misma lógica que el API (comparar por día calendario) para que el número mostrado sea el que se guardará.
  useEffect(() => {
    if (!selectedChallenge) return;
    const startRef = selectedChallenge.started_at || selectedChallenge.created_at;
    if (!startRef) {
      setNextDayNumber(1);
      return;
    }
    const start = new Date(startRef);
    const now = new Date();
    // Misma fecha "hoy" que envía CheckinForm (local) para alinearnos con lo que guardará el API
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const todayParsed = new Date(todayStr + "T12:00:00Z");
    const startOnly = { y: start.getUTCFullYear(), m: start.getUTCMonth(), d: start.getUTCDate() };
    const todayOnly = { y: todayParsed.getUTCFullYear(), m: todayParsed.getUTCMonth(), d: todayParsed.getUTCDate() };
    const startMs = Date.UTC(startOnly.y, startOnly.m, startOnly.d);
    const todayMs = Date.UTC(todayOnly.y, todayOnly.m, todayOnly.d);
    const diffDays = Math.floor((todayMs - startMs) / (24 * 60 * 60 * 1000));
    const day = diffDays + 1;
    const maxDay = selectedChallenge.challenge.duration_days ?? 999;
    setNextDayNumber(Math.min(Math.max(day, 1), maxDay));
  }, [selectedChallenge]);

  // Refrescar check-ins al volver a la pestaña para que el botón "Nuevo Check-in" refleje el estado real
  useEffect(() => {
    if (!selectedChallenge) return;
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchCheckins(selectedChallenge.id);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [selectedChallenge]);

  const handlePublishCheckin = async (checkinId: string, isPublic: boolean) => {
    try {
      const response = await fetch('/api/challenges/checkins/publish', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checkin_id: checkinId,
          is_public: !isPublic,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al publicar el check-in');
      }

      toast.success(isPublic ? 'Check-in ocultado del feed exitosamente' : 'Check-in publicado en el feed exitosamente');
      
      // Actualizar el estado local
      setCheckins(prev => prev.map(c => 
        c.id === checkinId ? { ...c, is_public: !isPublic } : c
      ));
    } catch (error) {
      console.error('Error publishing checkin:', error);
      toast.error(error instanceof Error ? error.message : 'Error al publicar el check-in');
    }
  };

  // Verificar si el reto está activo para permitir publicar check-ins
  const isChallengeActive = selectedChallenge?.challenge?.is_active === true;

  const handleOpenChallenge = async (challenge: any): Promise<void> => {
    // Si es un reto participado, usar purchaseId
    if (challenge.type === 'participating' && challenge.purchaseId) {
      const purchaseChallenge: ChallengePurchase = {
        id: challenge.purchaseId,
        challenge_id: challenge.id,
        challenge: {
          ...challenge,
          type: 'participating' as const,
          is_active: challenge.is_active ?? true,
          created_by_type: challenge.created_by_type,
        },
        access_granted: challenge.access_granted,
        started_at: challenge.started_at,
        completed_at: challenge.completed_at,
        created_at: challenge.created_at,
      };
      setSelectedChallenge(purchaseChallenge);
      await fetchCheckins(challenge.purchaseId);
      await fetchResources(challenge.id);
      await fetchParticipantsCount(challenge.id);
      await fetchChallengeParticipants(challenge.id, challenge.created_by_type, challenge.created_by_user_id);
    } else if (challenge.type === 'created') {
      // Si es un reto creado, buscar o crear un purchase automáticamente
      // para que el creador pueda ver progreso, check-ins y badges
      try {
        // Buscar si ya existe un purchase para este reto y usuario
        const response = await fetch(
          `/api/challenges/${challenge.id}/purchase?user_id=${userId || ''}`
        );
        const data = await response.json();
        
        let purchaseId: string;
        
        if (response.ok && data.purchase) {
          // Ya existe un purchase
          purchaseId = data.purchase.id;
        } else {
          // Crear un purchase automáticamente para el creador
          const createResponse = await fetch(`/api/challenges/${challenge.id}/purchase`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ auto_join: true }),
          });
          
          const createData = await createResponse.json();
          
          if (createResponse.ok && createData.purchase) {
            purchaseId = createData.purchase.id;
          } else {
            // Si falla la creación, usar challenge.id como fallback
            purchaseId = challenge.id;
            toast.error('No se pudo crear la participación automática');
          }
        }
        
        const createdChallenge: ChallengePurchase = {
          id: purchaseId,
          challenge_id: challenge.id,
          challenge: {
            ...challenge,
            type: 'created' as const,
            is_active: challenge.is_active ?? true,
            created_by_type: challenge.created_by_type,
          },
          access_granted: true, // Los creadores siempre tienen acceso
          started_at: data.purchase?.started_at ?? undefined,
          completed_at: data.purchase?.completed_at ?? undefined,
          created_at: data.purchase?.created_at ?? undefined,
        };
        setSelectedChallenge(createdChallenge);
        await fetchCheckins(purchaseId);
        await fetchResources(challenge.id);
        await fetchParticipantsCount(challenge.id);
        await fetchChallengeParticipants(challenge.id, challenge.created_by_type, challenge.created_by_user_id);
      } catch (error) {
        console.error('Error al obtener/crear purchase para reto creado:', error);
        // Fallback: mostrar solo recursos
        const createdChallenge: ChallengePurchase = {
          id: challenge.id,
          challenge_id: challenge.id,
          challenge: {
            ...challenge,
            type: 'created' as const,
            is_active: challenge.is_active ?? true,
            created_by_type: challenge.created_by_type,
          },
          access_granted: true,
          started_at: undefined,
          completed_at: undefined,
          created_at: undefined,
        };
        setSelectedChallenge(createdChallenge);
        setCheckins([]);
        await fetchResources(challenge.id);
        await fetchParticipantsCount(challenge.id);
        await fetchChallengeParticipants(challenge.id, challenge.created_by_type, challenge.created_by_user_id);
      }
    }
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

  const fetchParticipantsCount = async (challengeId: string) => {
    try {
      // Obtener información del reto para verificar si fue creado por un profesional
      const { data: challenge, error: challengeError } = await supabase
        .from("challenges")
        .select("created_by_user_id, created_by_type")
        .eq("id", challengeId)
        .single();

      // Contar participantes en challenge_purchases
      const { count, error } = await supabase
        .from("challenge_purchases")
        .select("id", { count: "exact", head: true })
        .eq("challenge_id", challengeId)
        .eq("access_granted", true);

      if (!error && count !== null) {
        let totalCount = count;
        
        // Si el reto fue creado por un profesional, incluir al profesional en el conteo
        // Solo si el profesional no está ya en challenge_purchases
        if (challenge && challenge.created_by_type === 'professional') {
          // Verificar si el profesional creador ya está en challenge_purchases
          const { count: creatorCount } = await supabase
            .from("challenge_purchases")
            .select("id", { count: "exact", head: true })
            .eq("challenge_id", challengeId)
            .eq("participant_id", challenge.created_by_user_id)
            .eq("access_granted", true);
          
          // Si el creador no está en challenge_purchases, agregarlo al conteo
          if (creatorCount === 0) {
            totalCount = count + 1;
          }
        }
        
        setParticipantsCount(totalCount);
      }
    } catch (error) {
      console.error("Error fetching participants count:", error);
    }
  };

  const fetchChallengeParticipants = async (
    challengeId: string,
    createdByType?: string,
    createdByUserId?: string
  ) => {
    try {
      const { data: purchases, error } = await supabase
        .from("challenge_purchases")
        .select("participant_id")
        .eq("challenge_id", challengeId)
        .eq("access_granted", true);

      if (error) throw error;

      const participantIds = [...new Set((purchases || []).map((p: { participant_id: string }) => p.participant_id).filter(Boolean))];

      // Si el reto fue creado por un profesional, incluir al creador si no está en purchases
      if (createdByType === "professional" && createdByUserId && !participantIds.includes(createdByUserId)) {
        participantIds.push(createdByUserId);
      }

      if (participantIds.length === 0) {
        setParticipants([]);
        return;
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url, type")
        .in("id", participantIds);

      if (profilesError) throw profilesError;

      // Para profesionales, usar foto de perfil profesional (professional_applications.profile_photo)
      const professionalUserIds = (profilesData || []).filter((p) => p.type === "professional").map((p) => p.id);
      let professionalPhotoMap = new Map<string, string>();
      if (professionalUserIds.length > 0) {
        const { data: proApps } = await supabase
          .from("professional_applications")
          .select("user_id, profile_photo")
          .in("user_id", professionalUserIds);
        (proApps || []).forEach((pa) => {
          if (pa.profile_photo) professionalPhotoMap.set(pa.user_id, pa.profile_photo);
        });
      }

      setParticipants(
        (profilesData || []).map((p) => ({
          id: p.id,
          first_name: p.first_name ?? null,
          last_name: p.last_name ?? null,
          avatar_url: professionalPhotoMap.get(p.id) ?? p.avatar_url ?? null,
          type: p.type ?? null,
        }))
      );
    } catch (error) {
      console.error("Error fetching challenge participants:", error);
      setParticipants([]);
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


  const handleCheckinComplete = async (data?: { completed: true; challenge_purchase_id: string }) => {
    setIsCheckinDialogOpen(false);
    if (data?.completed && data.challenge_purchase_id) {
      // Redirigir a pantalla de celebración
      router.push(`/my-challenges/completed?challenge=${data.challenge_purchase_id}`);
      return;
    }
    if (selectedChallenge) {
      await fetchCheckins(selectedChallenge.id);
      fetchChallenges();
    }
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

  const getShareUrl = (purchaseId: string) =>
    typeof window !== "undefined"
      ? `${window.location.origin}/my-challenges?challenge=${purchaseId}`
      : `https://www.holistia.io/my-challenges?challenge=${purchaseId}`;

  const getShareMessage = (title: string, purchaseId: string) =>
    `¡Completé el reto "${title}" en Holistia! 🎉 ${getShareUrl(purchaseId)}`;

  const handleShareAchievement = async (title: string, purchaseId: string, action: "whatsapp" | "copy") => {
    const message = getShareMessage(title, purchaseId);
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Mis Retos</h1>
          <p className="text-muted-foreground">
            Gestiona tus retos activos y completa tus check-ins diarios
          </p>
        </div>
        <Button onClick={() => router.push(`/my-challenges/new`)}>
          <Plus className="h-4 w-4 mr-2" />
          Crear Reto Personal
        </Button>
      </div>

      {/* Filtros */}
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

      {/* Lista de retos */}
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
                <a href={`/explore/challenges`}>Explorar Retos</a>
              </Button>
              <Button onClick={() => router.push(`/my-challenges/new`)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Reto
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className={`grid grid-cols-1 gap-6 ${selectedChallenge ? 'lg:grid-cols-3' : 'lg:grid-cols-2 xl:grid-cols-3'}`}>
          {/* Lista de retos */}
          <div className={`space-y-4 ${selectedChallenge ? 'lg:col-span-1' : 'lg:col-span-2 xl:col-span-3'}`}>
            <div className={`grid grid-cols-1 ${selectedChallenge ? '' : 'md:grid-cols-2 xl:grid-cols-3'} gap-6`}>
              {filteredChallenges.map((challenge) => (
                <Card
                  key={`${challenge.type}-${challenge.id}`}
                  className={`hover:shadow-lg transition-shadow overflow-hidden cursor-pointer gap-0 min-h-[400px] flex flex-col relative ${
                    selectedChallenge?.challenge_id === challenge.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleOpenChallenge(challenge)}
                >
                  <div className="absolute top-0 left-0 right-0 h-40">
                    {challenge.cover_image_url ? (
                      <Image
                        src={challenge.cover_image_url}
                        alt={challenge.title}
                        fill
                        className="object-cover rounded-t-lg"
                        sizes="100vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center rounded-t-lg">
                        <Target className="h-12 w-12 text-primary/40" />
                      </div>
                    )}
                    {challenge.type === 'created' && !challenge.is_active && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary">Inactivo</Badge>
                      </div>
                    )}
                    {challenge.completed_at && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-green-600 hover:bg-green-600">Completado</Badge>
                      </div>
                    )}
                    {challenge.type === 'created' && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="default">Creado por ti</Badge>
                      </div>
                    )}
                  </div>
                  <div className="h-40" /> {/* Spacer para el espacio de la imagen */}
                  <CardHeader className="pt-4 pb-2">
                    <CardTitle className="text-lg line-clamp-2">
                      {challenge.title}
                    </CardTitle>
                    {challenge.professional_applications && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm text-muted-foreground">
                          {challenge.professional_applications.first_name}{' '}
                          {challenge.professional_applications.last_name}
                        </span>
                        {challenge.professional_applications.is_verified && (
                          <VerifiedBadge size={14} />
                        )}
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
                        <Badge className={`text-xs ${getDifficultyColor(challenge.difficulty_level)}`}>
                          {getDifficultyLabel(challenge.difficulty_level)}
                        </Badge>
                      )}
                      {challenge.completed_at && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 border-green-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Completado el {new Date(challenge.completed_at).toLocaleDateString('es-MX')}
                        </Badge>
                      )}
                    </div>
                    {challenge.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                        {stripHtml(challenge.description)}
                      </p>
                    )}
                  </CardContent>
                  <div className="px-6 pb-4 mt-auto">
                    {challenge.type === 'created' ? (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/my-challenges/${challenge.id}/edit`);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(challenge);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : challenge.completed_at && challenge.purchaseId ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Share2 className="h-4 w-4 mr-2" />
                            Compartir logro
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem
                            onClick={() => handleShareAchievement(challenge.title || "Reto", challenge.purchaseId, "whatsapp")}
                          >
                            Compartir en WhatsApp
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleShareAchievement(challenge.title || "Reto", challenge.purchaseId, "copy")}
                          >
                            Copiar enlace
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Detalles del reto seleccionado */}
          {selectedChallenge && (
            <div className="lg:col-span-2 space-y-6">
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

                <TabsContent value="progress" className="space-y-4">
                  <ChallengeProgress
                    challengePurchaseId={selectedChallenge.id}
                    challengeDurationDays={selectedChallenge.challenge.duration_days}
                  />
                </TabsContent>

                <TabsContent value="checkins" className="space-y-4">
                    <Card className="py-4">
                      <CardHeader>
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <CardTitle>Check-ins Diarios</CardTitle>
                          <div className="flex gap-2 flex-wrap">
                            {selectedChallenge.completed_at && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Share2 className="h-4 w-4 mr-2" />
                                    Compartir logro
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleShareAchievement(selectedChallenge.challenge?.title || "Reto", selectedChallenge.id, "whatsapp")}
                                  >
                                    Compartir en WhatsApp
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleShareAchievement(selectedChallenge.challenge?.title || "Reto", selectedChallenge.id, "copy")}
                                  >
                                    Copiar enlace
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                            <Button
                              onClick={() => setIsCheckinDialogOpen(true)}
                              disabled={!selectedChallenge.access_granted}
                            >
                              Nuevo Check-in
                            </Button>
                          </div>
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
                              const dayCheckins = checkins.filter(c => c.day_number === day);
                              const startRef = selectedChallenge.started_at || selectedChallenge.created_at;
                              const startDate = startRef ? new Date(startRef) : new Date();
                              const dayDate = new Date(startDate);
                              dayDate.setHours(0, 0, 0, 0);
                              dayDate.setDate(dayDate.getDate() + (day - 1));
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              const isPastDay = dayDate < today;
                              const isLateDay = dayCheckins.length === 0 && isPastDay;
                              const hasCheckins = dayCheckins.length > 0;
                              return (
                                <div
                                  key={day}
                                  className={`flex items-start gap-4 p-4 border rounded-lg ${
                                    hasCheckins ? 'bg-green-50 border-green-200' : isLateDay ? 'bg-amber-50/80 border-amber-200' : 'bg-muted/30'
                                  }`}
                                >
                                  <div className="shrink-0 pt-0.5">
                                    {hasCheckins ? (
                                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                                    ) : (
                                      <Circle className="h-6 w-6 text-muted-foreground" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0 space-y-3">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-semibold">Día {day}</span>
                                      {isLateDay && (
                                        <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-100/80 text-xs">
                                          Día de reto no cumplido
                                        </Badge>
                                      )}
                                    </div>
                                    {dayCheckins.length === 0 ? null : (
                                      <div className="space-y-3">
                                        {dayCheckins.map((checkin) => (
                                          <div key={checkin.id} className="text-sm text-muted-foreground border-l-2 border-green-300 pl-3 py-1">
                                            {checkin.notes && (
                                              <p className="mb-1">{checkin.notes}</p>
                                            )}
                                            {checkin.evidence_url && (
                                              <div className="mt-2">
                                                {checkin.evidence_type === 'video' ? (
                                                  <div className="rounded-lg overflow-hidden w-full max-w-[200px] h-[120px]">
                                                    <VideoPlayer
                                                      url={checkin.evidence_url}
                                                      className="w-full h-full"
                                                      fill
                                                    />
                                                  </div>
                                                ) : checkin.evidence_type === 'photo' ? (
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
                                                    const [y, m, d] = checkin.checkin_date.split('-').map(Number);
                                                    return new Date(y, m - 1, d).toLocaleDateString('es-MX');
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
                                              {isChallengeActive && (
                                                checkin.is_public ? (
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
                                                )
                                              )}
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

                <TabsContent value="badges">
                  <ChallengeBadges challengePurchaseId={selectedChallenge.id} />
                </TabsContent>

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
                              <div className="shrink-0 mt-1">
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
                                        {resource.resource_type === 'ebook' ? 'Workbook' :
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
                      {/* Lista de participantes: mini cards con enlace al perfil + CTA invitar (solo si el reto no lo creó un profesional) */}
                      {(participants.length > 0 || (selectedChallenge.challenge.created_by_type !== "professional" && participantsCount < 5)) && (
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
                                      {p.first_name?.[0]}{p.last_name?.[0] || "?"}
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0 flex flex-col">
                                  <span className="text-sm font-medium truncate max-w-[120px]">
                                    {p.first_name} {p.last_name}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {p.type === "professional" ? "Profesional" : p.type === "admin" ? "Administrador" : "Paciente"}
                                  </span>
                                </div>
                              </Link>
                            ))}
                            {/* CTA invitar: solo si el reto no fue creado por un profesional y hay cupo */}
                            {selectedChallenge.challenge.created_by_type !== "professional" && participantsCount < 5 && (
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

                      {/* Mostrar chat solo si hay 2 o más participantes */}
                      {participantsCount >= 2 ? (
                        <div>
                          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Chat del Reto
                          </h4>
                          <div className="h-[400px] min-h-0 flex flex-col">
                            <ChallengeChat
                              challengeId={selectedChallenge.challenge_id}
                              currentUserId={userId || ""}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center border rounded-lg bg-muted/30">
                          <div className="rounded-full bg-muted p-6 mb-4">
                            <MessageSquare className="h-12 w-12 text-muted-foreground" />
                          </div>
                          <h3 className="text-lg font-semibold mb-2">
                            Invita a alguien para chatear
                          </h3>
                          <p className="text-sm text-muted-foreground mb-6 max-w-md">
                            Cuando haya al menos dos participantes en el reto, aquí podrás chatear con ellos.
                            Los retos en equipo son más divertidos y motivadores.
                          </p>
                          <Button
                            onClick={() => setIsInviteDialogOpen(true)}
                            size="lg"
                            className="gap-2"
                          >
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
            </div>
          )}
        </div>
      )}

      {/* Dialog para invitar participantes */}
      {selectedChallenge && (
        <ChallengeInviteDialog
          open={isInviteDialogOpen}
          onOpenChange={setIsInviteDialogOpen}
          challengeId={selectedChallenge.challenge_id}
          challengeTitle={selectedChallenge.challenge.title}
          currentParticipants={participantsCount}
          onInviteSuccess={() => {
            fetchParticipantsCount(selectedChallenge.challenge_id);
            fetchChallengeParticipants(
              selectedChallenge.challenge_id,
              selectedChallenge.challenge.created_by_type,
              (selectedChallenge.challenge as { created_by_user_id?: string }).created_by_user_id
            );
            fetchChallenges();
          }}
        />
      )}

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
