"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import dynamic from "next/dynamic";
const RichTextEditor = dynamic(
  () => import("@/components/ui/rich-text-editor").then(mod => mod.RichTextEditor),
  { ssr: false, loading: () => <div className="h-[200px] rounded-md border border-input bg-background animate-pulse" /> }
);
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WellnessAreasSelector } from "@/components/ui/wellness-areas-selector";
import { Upload, X, Loader2, Plus, Trash2, BookOpen, Headphones, Video, FileText, ExternalLink, File, UserPlus, Users, Eye, EyeOff, Calendar, Clock, Copy, CheckCircle2, Edit } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { formatPrice } from "@/lib/price-utils";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  ChallengeMeeting,
  MeetingFormData,
  MEETING_PLATFORM_OPTIONS,
  RECURRENCE_OPTIONS,
  TIMEZONE_OPTIONS,
} from "@/types/challenge";
import { ORDERED_DAYS, DAY_LABELS } from "@/lib/challenge-schedule";

interface ChallengeFormProps {
  userId: string;
  challenge?: any | null;
  redirectPath: string;
  userType?: 'professional' | 'patient' | 'admin'; // Tipo de usuario creando el reto
  professionalId?: string | null; // ID del profesional para asignar el reto (solo para creación)
  onFormSubmit?: () => void; // Callback cuando se envía el formulario
  showButtons?: boolean; // Si se muestran los botones dentro del formulario
}

interface ChallengeFormData {
  title: string;
  description: string;
  cover_image_url: string;
  duration_days: string;
  difficulty_level: string;
  category: string;
  wellness_areas: string[];
  linked_professional_id: string;
  price: string;
  currency: string;
  is_active: boolean;
  is_public: boolean;
  suggested_schedule_days: number[];
}

interface ResourceFormData {
  id?: string;
  title: string;
  description: string;
  resource_type: 'ebook' | 'audio' | 'video' | 'pdf' | 'link' | 'other';
  url: string;
  pages_count?: string;
  duration_minutes?: string;
  file_size_mb?: string;
}

const DIFFICULTY_OPTIONS = [
  { value: 'beginner', label: 'Principiante' },
  { value: 'intermediate', label: 'Intermedio' },
  { value: 'advanced', label: 'Avanzado' },
  { value: 'expert', label: 'Experto' },
] as const;

const RESOURCE_TYPE_OPTIONS = [
  { value: 'ebook', label: 'Workbook', icon: BookOpen },
  { value: 'audio', label: 'Audio', icon: Headphones },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'pdf', label: 'Documento PDF', icon: FileText },
  { value: 'link', label: 'Enlace externo', icon: ExternalLink },
  { value: 'other', label: 'Otro', icon: File },
] as const;

export function ChallengeForm({ userId, challenge, redirectPath, userType = 'patient', professionalId, onFormSubmit, showButtons = true }: ChallengeFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const isProfessional = userType === 'professional';
  const isAdmin = userType === 'admin';
  // Cualquier usuario puede agregar personas a su reto
  const canAddPatients = true;
  const [isDescriptionValid, setIsDescriptionValid] = useState(true);

  const isRichTextEffectivelyEmpty = (html: string) => {
    const plain = (html || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return plain.length === 0;
  };

  const [formData, setFormData] = useState<ChallengeFormData>({
    title: "",
    description: "",
    cover_image_url: "",
    duration_days: "",
    difficulty_level: "",
    category: "",
    wellness_areas: [],
    linked_professional_id: "none",
    price: "",
    currency: "MXN",
    is_active: true,
    // Por defecto:
    // - Profesionales/admins: público (aparece en Exploración)
    // - Pacientes: privado
    is_public: isProfessional || isAdmin,
    suggested_schedule_days: [],
  });

  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loadingProfessionals, setLoadingProfessionals] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverFileInputRef = React.useRef<HTMLInputElement>(null);
  const [resources, setResources] = useState<ResourceFormData[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const initialResourceIdsRef = React.useRef<string[]>([]);
  const [editingResourceIndex, setEditingResourceIndex] = useState<number | null>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>([]);
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [searchedPatients, setSearchedPatients] = useState<any[]>([]);
  const [existingParticipants, setExistingParticipants] = useState<any[]>([]);
  const [loadingExistingParticipants, setLoadingExistingParticipants] = useState(false);
  const [removeParticipantDialogOpen, setRemoveParticipantDialogOpen] = useState(false);
  const [removingParticipantId, setRemovingParticipantId] = useState<string | null>(null);
  const [removingParticipant, setRemovingParticipant] = useState(false);

  const existingParticipantIds = useMemo(() => {
    return new Set((existingParticipants || []).map((p) => p.id));
  }, [existingParticipants]);

  const filteredFrequentPatients = useMemo(() => {
    return (patients || []).filter((p) => !existingParticipantIds.has(p.id));
  }, [patients, existingParticipantIds]);

  // Estados para reuniones
  const [meetings, setMeetings] = useState<ChallengeMeeting[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [isAddingMeeting, setIsAddingMeeting] = useState(false);
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const [meetingFormData, setMeetingFormData] = useState<MeetingFormData>({
    title: "",
    description: "",
    platform: "meet",
    meeting_url: "",
    meeting_id: "",
    passcode: "",
    scheduled_date: "",
    scheduled_time: "",
    duration_minutes: "60",
    timezone: "America/Mexico_City",
    is_recurring: false,
    recurrence_pattern: "",
    recurrence_end_date: "",
    max_participants: "",
  });
  const [submittingMeeting, setSubmittingMeeting] = useState(false);
  const [deleteMeetingDialogOpen, setDeleteMeetingDialogOpen] = useState(false);
  const [deletingMeetingId, setDeletingMeetingId] = useState<string | null>(null);
  const [copiedMeetingUrl, setCopiedMeetingUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchProfessionals();
  }, []);

  useEffect(() => {
    if (canAddPatients) {
      fetchPatients();
    }
  }, [canAddPatients, userId, professionalId]);

  // Cargar datos del challenge cuando esté disponible (prioridad)
  useEffect(() => {
    if (challenge && challenge.id) {
      const newFormData: ChallengeFormData = {
        title: challenge.title || "",
        description: challenge.description || "",
        cover_image_url: challenge.cover_image_url || "",
        duration_days: challenge.duration_days !== null && challenge.duration_days !== undefined ? challenge.duration_days.toString() : "",
        difficulty_level: challenge.difficulty_level || "",
        category: challenge.category || "",
        wellness_areas: challenge.wellness_areas || [],
        linked_professional_id: challenge.linked_professional_id ? challenge.linked_professional_id : "none",
        // Si price es null o undefined, usar string vacío para que el input se muestre vacío
        price: challenge.price !== null && challenge.price !== undefined && challenge.price !== 0 ? challenge.price.toString() : "",
        currency: challenge.currency || "MXN",
        is_active: challenge.is_active !== undefined ? challenge.is_active : true,
        is_public: challenge.is_public !== undefined ? challenge.is_public : false,
        suggested_schedule_days: Array.isArray(challenge.suggested_schedule_days) ? challenge.suggested_schedule_days : [],
      };
      
      // Forzar actualización del estado con los valores exactos del challenge
      setFormData(newFormData);
    }
  }, [challenge]);

  // Cargar reuniones cuando hay un challenge
  useEffect(() => {
    if (challenge?.id) {
      fetchMeetings();
    }
  }, [challenge?.id]);

  // Cargar recursos cuando hay un challenge (edición)
  useEffect(() => {
    if (challenge?.id) {
      fetchResources();
    }
  }, [challenge?.id]);

  // Cargar participantes existentes cuando hay un challenge (para edición)
  useEffect(() => {
    if (challenge?.id && canAddPatients) {
      fetchExistingParticipants();
    }
  }, [challenge?.id, canAddPatients]);

  // Si es profesional y NO hay challenge cargado, vincular automáticamente al profesional actual
  useEffect(() => {
    if (isProfessional && userId && !challenge) {
      // Buscar el professional_id basado en el user_id
      const findProfessionalId = async () => {
        try {
          const { data: professionalData } = await supabase
            .from('professional_applications')
            .select('id')
            .eq('user_id', userId)
            .eq('status', 'approved')
            .single();

          if (professionalData) {
            setFormData((prev) => {
              // Solo actualizar si linked_professional_id está en "none"
              if (prev.linked_professional_id === "none") {
                return { ...prev, linked_professional_id: professionalData.id };
              }
              return prev;
            });
          }
        } catch (error) {
          console.error('Error finding professional ID:', error);
        }
      };
      findProfessionalId();
    }
  }, [isProfessional, userId, challenge, supabase]);

  const fetchProfessionals = async () => {
    try {
      setLoadingProfessionals(true);
      const { data, error } = await supabase
        .from('professional_applications')
        .select('id, first_name, last_name, profession, is_verified')
        .eq('status', 'approved')
        .eq('is_active', true)
        .order('first_name', { ascending: true });

      if (error) {
        console.error('Error cargando profesionales:', error);
        return;
      }

      setProfessionals(data || []);
    } catch (error) {
      console.error("Error fetching professionals:", error);
    } finally {
      setLoadingProfessionals(false);
    }
  };

  const fetchPatients = async () => {
    try {
      setLoadingPatients(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      let targetProfessionalId: string | null = null;

      // Si es admin, usar directamente el professionalId prop
      if (isAdmin && professionalId) {
        targetProfessionalId = professionalId;
      } else if (isProfessional) {
        // Si es profesional, buscar su professional_id
        const { data: professionalApp } = await supabase
          .from('professional_applications')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'approved')
          .single();

        if (professionalApp) {
          targetProfessionalId = professionalApp.id;
        }
      }

      if (!targetProfessionalId) return;

      // Obtener pacientes que han tenido citas con el profesional
      const { data: appointments } = await supabase
        .from('appointments')
        .select('patient_id')
        .eq('professional_id', targetProfessionalId);

      if (!appointments || appointments.length === 0) {
        setPatients([]);
        return;
      }

      // Obtener IDs únicos de pacientes
      const uniquePatientIds = [...new Set(appointments.map(apt => apt.patient_id))];

      // Obtener información de pacientes
      const { data: patientsData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, avatar_url')
        .in('id', uniquePatientIds)
        .eq('type', 'patient')
        .eq('account_active', true)
        .order('first_name', { ascending: true });

      setPatients(patientsData || []);
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setLoadingPatients(false);
    }
  };

  // Función para cargar participantes existentes del reto
  const fetchExistingParticipants = async () => {
    if (!challenge?.id) return;

    try {
      setLoadingExistingParticipants(true);

      // Obtener los IDs de participantes del reto
      const { data: purchases, error: purchasesError } = await supabase
        .from('challenge_purchases')
        .select('participant_id')
        .eq('challenge_id', challenge.id);

      if (purchasesError || !purchases || purchases.length === 0) {
        setExistingParticipants([]);
        return;
      }

      const participantIds = purchases.map(p => p.participant_id);

      // Obtener información de los participantes
      const { data: participantsData, error: participantsError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, avatar_url')
        .in('id', participantIds)
        .order('first_name', { ascending: true });

      if (participantsError) {
        console.error('Error fetching existing participants:', participantsError);
        return;
      }

      setExistingParticipants(participantsData || []);
    } catch (error) {
      console.error("Error fetching existing participants:", error);
    } finally {
      setLoadingExistingParticipants(false);
    }
  };

  // Función para buscar pacientes por nombre o email
  const searchPatients = async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSearchedPatients([]);
      return;
    }

    try {
      setSearchingPatients(true);
      const searchTerm = query.trim().toLowerCase();

      // Buscar pacientes por nombre o email
      const { data: patientsData, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, avatar_url')
        .eq('type', 'patient')
        .eq('account_active', true)
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .limit(20)
        .order('first_name', { ascending: true });

      if (error) {
        console.error('Error searching patients:', error);
        return;
      }

      // Filtrar los que ya están en la lista de pacientes frecuentes
      const frequentPatientIds = new Set(patients.map(p => p.id));
      const newPatients = (patientsData || []).filter(p => !frequentPatientIds.has(p.id) && !existingParticipantIds.has(p.id));

      setSearchedPatients(newPatients);
    } catch (error) {
      console.error("Error searching patients:", error);
    } finally {
      setSearchingPatients(false);
    }
  };

  const openRemoveParticipantDialog = (participantId: string) => {
    setRemovingParticipantId(participantId);
    setRemoveParticipantDialogOpen(true);
  };

  const handleRemoveParticipantConfirm = async () => {
    if (!challenge?.id || !removingParticipantId) return;

    try {
      setRemovingParticipant(true);
      const response = await fetch(`/api/challenges/${challenge.id}/participants`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participant_id: removingParticipantId }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Error al eliminar participante");
      }

      toast.success("Participante eliminado del reto");
      setRemoveParticipantDialogOpen(false);
      setRemovingParticipantId(null);
      await fetchExistingParticipants();
    } catch (error) {
      console.error("Error removing participant:", error);
      toast.error(error instanceof Error ? error.message : "Error al eliminar participante");
    } finally {
      setRemovingParticipant(false);
    }
  };

  // Debounce para la búsqueda
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (patientSearchQuery) {
        searchPatients(patientSearchQuery);
      } else {
        setSearchedPatients([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [patientSearchQuery]);

  // Funciones para manejar reuniones
  const fetchMeetings = async () => {
    if (!challenge?.id) return;
    try {
      setLoadingMeetings(true);
      if (isAdmin) {
        const res = await fetch(`/api/challenges/${challenge.id}/meetings`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Error al cargar reuniones");
        setMeetings(data.meetings || []);
      } else {
        const { data, error } = await supabase
          .from("challenge_meetings")
          .select("*")
          .eq("challenge_id", challenge.id)
          .eq("is_active", true)
          .order("scheduled_date", { ascending: true })
          .order("scheduled_time", { ascending: true });

        if (error) throw error;
        setMeetings(data || []);
      }
    } catch (error) {
      console.error("Error fetching meetings:", error);
      toast.error("Error al cargar las reuniones");
    } finally {
      setLoadingMeetings(false);
    }
  };

  const fetchResources = async () => {
    if (!challenge?.id) return;
    try {
      setLoadingResources(true);
      const res = await fetch(`/api/challenges/${challenge.id}/resources`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error al cargar recursos");
      const rawList = (data.resources || []).map((r: { id: string; title: string; description?: string; resource_type: string; url: string; duration_minutes?: number }) => ({
        id: r.id,
        title: r.title || "",
        description: r.description || "",
        resource_type: r.resource_type as ResourceFormData["resource_type"],
        url: r.url || "",
        duration_minutes: r.duration_minutes != null ? String(r.duration_minutes) : "",
      }));

      // 1) Filtrar duplicados por id (mismo registro dos veces)
      const seenIds = new Set<string>();
      const byId = rawList.filter((r: ResourceFormData) => {
        if (r.id && seenIds.has(r.id)) return false;
        if (r.id) seenIds.add(r.id);
        return true;
      });

      // 2) Detectar duplicados por contenido (mismo título + URL): mantener uno y eliminar el resto en BD
      const contentKey = (r: ResourceFormData) => `${(r.title || "").trim()}|${(r.url || "").trim()}`;
      const keptByContent = new Map<string, ResourceFormData>();
      const duplicateIdsToDelete: string[] = [];
      for (const r of byId) {
        const key = contentKey(r);
        if (keptByContent.has(key)) {
          if (r.id) duplicateIdsToDelete.push(r.id);
          continue;
        }
        keptByContent.set(key, r);
      }
      const list = Array.from(keptByContent.values());

      for (const resourceId of duplicateIdsToDelete) {
        try {
          await fetch(
            `/api/challenges/${challenge.id}/resources?resourceId=${encodeURIComponent(resourceId)}`,
            { method: "DELETE" }
          );
        } catch (e) {
          console.error("Error eliminando recurso duplicado:", e);
        }
      }

      setResources(list);
      initialResourceIdsRef.current = list.map((r: ResourceFormData) => r.id).filter((id: string | undefined): id is string => Boolean(id));
    } catch (error) {
      console.error("Error fetching resources:", error);
      toast.error("Error al cargar los recursos");
    } finally {
      setLoadingResources(false);
    }
  };

  const handleAddMeeting = () => {
    setIsAddingMeeting(true);
    setEditingMeetingId(null);
    const today = new Date().toISOString().split('T')[0];
    setMeetingFormData({
      title: "",
      description: "",
      platform: "meet",
      meeting_url: "",
      meeting_id: "",
      passcode: "",
      scheduled_date: today,
      scheduled_time: "10:00",
      duration_minutes: "60",
      timezone: "America/Mexico_City",
      is_recurring: false,
      recurrence_pattern: "",
      recurrence_end_date: "",
      max_participants: "",
    });
  };

  const handleEditMeeting = (meeting: ChallengeMeeting) => {
    setEditingMeetingId(meeting.id);
    setIsAddingMeeting(false);
    setMeetingFormData({
      title: meeting.title,
      description: meeting.description || "",
      platform: meeting.platform,
      meeting_url: meeting.meeting_url,
      meeting_id: meeting.meeting_id || "",
      passcode: meeting.passcode || "",
      scheduled_date: meeting.scheduled_date,
      scheduled_time: meeting.scheduled_time.substring(0, 5),
      duration_minutes: meeting.duration_minutes.toString(),
      timezone: meeting.timezone,
      is_recurring: meeting.is_recurring,
      recurrence_pattern: meeting.recurrence_pattern || "",
      recurrence_end_date: meeting.recurrence_end_date || "",
      max_participants: meeting.max_participants?.toString() || "",
    });
  };

  const handleCancelMeeting = () => {
    setIsAddingMeeting(false);
    setEditingMeetingId(null);
    setMeetingFormData({
      title: "",
      description: "",
      platform: "meet",
      meeting_url: "",
      meeting_id: "",
      passcode: "",
      scheduled_date: "",
      scheduled_time: "",
      duration_minutes: "60",
      timezone: "America/Mexico_City",
      is_recurring: false,
      recurrence_pattern: "",
      recurrence_end_date: "",
      max_participants: "",
    });
  };

  const handleSubmitMeeting = async () => {
    if (!challenge?.id) return;
    if (!meetingFormData.title.trim() || !meetingFormData.meeting_url.trim() || !meetingFormData.scheduled_date || !meetingFormData.scheduled_time) {
      toast.error("Título, URL, fecha y hora son obligatorios");
      return;
    }

    try {
      new URL(meetingFormData.meeting_url);
    } catch {
      toast.error("La URL de la reunión no es válida");
      return;
    }

    try {
      setSubmittingMeeting(true);
      const meetingPayload = {
        title: meetingFormData.title.trim(),
        description: meetingFormData.description?.trim() || null,
        platform: meetingFormData.platform,
        meeting_url: meetingFormData.meeting_url.trim(),
        meeting_id: meetingFormData.meeting_id?.trim() || null,
        passcode: meetingFormData.passcode?.trim() || null,
        scheduled_date: meetingFormData.scheduled_date,
        scheduled_time: meetingFormData.scheduled_time,
        duration_minutes: parseInt(meetingFormData.duration_minutes) || 60,
        timezone: meetingFormData.timezone,
        is_recurring: meetingFormData.is_recurring,
        recurrence_pattern: meetingFormData.is_recurring ? meetingFormData.recurrence_pattern : null,
        recurrence_end_date: meetingFormData.is_recurring && meetingFormData.recurrence_end_date ? meetingFormData.recurrence_end_date : null,
        max_participants: meetingFormData.max_participants ? parseInt(meetingFormData.max_participants) : null,
        status: "scheduled",
      };

      if (isAdmin) {
        const url = `/api/challenges/${challenge.id}/meetings`;
        if (editingMeetingId) {
          const res = await fetch(url, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...meetingPayload, meetingId: editingMeetingId }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data?.error || "Error al actualizar reunión");
          toast.success("Reunión actualizada correctamente");
        } else {
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(meetingPayload),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data?.error || "Error al agregar reunión");
          toast.success("Reunión agregada correctamente");
        }
      } else {
        const meetingData = {
          challenge_id: challenge.id,
          ...meetingPayload,
          is_active: true,
        };
        if (editingMeetingId) {
          const { error } = await supabase
            .from("challenge_meetings")
            .update(meetingData)
            .eq("id", editingMeetingId);
          if (error) throw error;
          toast.success("Reunión actualizada correctamente");
        } else {
          const { error } = await supabase
            .from("challenge_meetings")
            .insert([meetingData]);
          if (error) throw error;
          toast.success("Reunión agregada correctamente");
        }
      }

      handleCancelMeeting();
      await fetchMeetings();
    } catch (error) {
      console.error("Error saving meeting:", error);
      toast.error("Error al guardar la reunión");
    } finally {
      setSubmittingMeeting(false);
    }
  };

  const handleDeleteMeetingClick = (id: string) => {
    setDeletingMeetingId(id);
    setDeleteMeetingDialogOpen(true);
  };

  const handleDeleteMeetingConfirm = async () => {
    if (!deletingMeetingId || !challenge?.id) return;
    try {
      if (isAdmin) {
        const res = await fetch(
          `/api/challenges/${challenge.id}/meetings?meetingId=${encodeURIComponent(deletingMeetingId)}`,
          { method: "DELETE" }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Error al cancelar reunión");
      } else {
        const { error } = await supabase
          .from("challenge_meetings")
          .update({ is_active: false, status: "cancelled", updated_at: new Date().toISOString() })
          .eq("id", deletingMeetingId);
        if (error) throw error;
      }
      toast.success("Reunión cancelada correctamente");
      setDeleteMeetingDialogOpen(false);
      setDeletingMeetingId(null);
      await fetchMeetings();
    } catch (error) {
      console.error("Error deleting meeting:", error);
      toast.error("Error al cancelar la reunión");
    }
  };

  const handleCopyMeetingUrl = async (url: string, meetingId: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedMeetingUrl(meetingId);
      toast.success("URL copiada al portapapeles");
      setTimeout(() => setCopiedMeetingUrl(null), 2000);
    } catch (error) {
      toast.error("Error al copiar URL");
    }
  };

  const formatMeetingDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatMeetingTime = (timeStr: string) => {
    return timeStr.substring(0, 5);
  };

  const getPlatformBadgeColor = (platform: string) => {
    switch (platform) {
      case 'meet': return 'bg-blue-100 text-blue-800';
      case 'zoom': return 'bg-purple-100 text-purple-800';
      case 'teams': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen válido');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo es demasiado grande. El tamaño máximo es 5MB.');
      return;
    }

    try {
      setUploadingCover(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Debes iniciar sesión");
        return;
      }

      let challengeId = challenge?.id;

      // Si estamos creando (no hay challenge.id), crear reto temporal
      if (!challengeId) {
        const tempChallenge = {
          created_by_user_id: user.id,
          created_by_type: 'patient',
          title: formData.title || "Nuevo Reto",
          description: formData.description || "",
          linked_professional_id: formData.linked_professional_id && formData.linked_professional_id !== 'none' ? formData.linked_professional_id : null,
          is_active: false,
        };

        const response = await fetch('/api/challenges', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tempChallenge),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Error al crear reto temporal");

        challengeId = data.challenge.id;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `cover.${fileExt}`;
      const filePath = `${challengeId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('challenges')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('challenges')
        .getPublicUrl(filePath);

      setFormData({ ...formData, cover_image_url: publicUrl });
      toast.success("Imagen de portada subida exitosamente");

    } catch (error) {
      console.error("Error uploading cover image:", error);
      toast.error("Error al subir la imagen de portada");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isDescriptionValid) {
      toast.error("La descripción excede el límite de caracteres. Por favor, reduce el texto.");
      return;
    }

    if (!formData.title?.trim() || isRichTextEffectivelyEmpty(formData.description)) {
      toast.error("Por favor completa el título y la descripción");
      return;
    }

    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Debes iniciar sesión");
        return;
      }

      // Validar precio si es profesional
      if (isProfessional && formData.price && parseFloat(formData.price) < 0) {
        toast.error("El precio no puede ser negativo");
        return;
      }

      // Si es profesional, obtener el professional_id basado en user_id
      let finalProfessionalId = professionalId || challenge?.professional_id;
      if (isProfessional && !finalProfessionalId) {
        const { data: professionalData } = await supabase
          .from('professional_applications')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'approved')
          .single();
        
        if (professionalData) {
          finalProfessionalId = professionalData.id;
        }
      }

      const challengeData: any = {
        professional_id: finalProfessionalId || null,
        created_by_user_id: user.id,
        created_by_type: userType,
        title: formData.title.trim(),
        description: formData.description.trim(),
        cover_image_url: formData.cover_image_url || null,
        duration_days: formData.duration_days ? parseInt(formData.duration_days) : null,
        difficulty_level: formData.difficulty_level || null,
        category: formData.category || null,
        wellness_areas: formData.wellness_areas || [],
        linked_professional_id: formData.linked_professional_id && formData.linked_professional_id !== 'none' ? formData.linked_professional_id : null,
        // Convertir price: si está vacío o es 0, guardar null. Si tiene valor, parsear como float.
        price: formData.price && formData.price.trim() !== '' && parseFloat(formData.price) > 0 ? parseFloat(formData.price) : null,
        // currency solo se guarda si hay un price válido
        currency: formData.price && formData.price.trim() !== '' && parseFloat(formData.price) > 0 ? (formData.currency || 'MXN') : (formData.currency || 'MXN'),
        is_active: formData.is_active,
      };

      // Agregar is_public si está definido (después de ejecutar la migración 175)
      if (typeof formData.is_public === 'boolean') {
        challengeData.is_public = formData.is_public;
      }

      // Días sugeridos para el reto
      challengeData.suggested_schedule_days = formData.suggested_schedule_days.length > 0
        ? formData.suggested_schedule_days
        : null;

      let createdChallengeId: string;

      if (challenge && challenge.id) {
        // Actualizar reto existente
        const response = await fetch(`/api/challenges/${challenge.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(challengeData),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Error al actualizar reto");

        createdChallengeId = challenge.id;
        toast.success("Reto actualizado exitosamente");

        // Sincronizar recursos en edición: eliminar quitados, crear nuevos, actualizar existentes
        const currentIds = new Set(resources.filter((r) => r.id).map((r) => r.id));
        const deletedIds = initialResourceIdsRef.current.filter((id) => !currentIds.has(id));
        for (const resourceId of deletedIds) {
          try {
            await fetch(`/api/challenges/${challenge.id}/resources?resourceId=${encodeURIComponent(resourceId)}`, { method: "DELETE" });
          } catch (e) {
            console.error("Error eliminando recurso:", e);
          }
        }
        for (let i = 0; i < resources.length; i++) {
          const resource = resources[i];
          if (!resource.title?.trim() || !resource.url?.trim()) continue;
          const duration = resource.duration_minutes ? parseInt(resource.duration_minutes, 10) : null;
          if (resource.id) {
            await fetch(`/api/challenges/${challenge.id}/resources`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                resourceId: resource.id,
                title: resource.title.trim(),
                description: resource.description?.trim() || null,
                resource_type: resource.resource_type,
                url: resource.url.trim(),
                duration_minutes: duration,
              }),
            });
          } else {
            const res = await fetch(`/api/challenges/${challenge.id}/resources`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: resource.title.trim(),
                description: resource.description?.trim() || null,
                resource_type: resource.resource_type,
                url: resource.url.trim(),
                duration_minutes: duration,
                display_order: i,
              }),
            });
            const created = await res.json();
            if (created?.resource?.id) {
              initialResourceIdsRef.current.push(created.resource.id);
            }
          }
        }
        
        // Actualizar el estado local con los datos actualizados del servidor
        if (data.challenge) {
          const updatedFormData = {
            title: data.challenge.title || "",
            description: data.challenge.description || "",
            cover_image_url: data.challenge.cover_image_url || "",
            duration_days: data.challenge.duration_days?.toString() || "",
            difficulty_level: data.challenge.difficulty_level || "",
            category: data.challenge.category || "",
            wellness_areas: data.challenge.wellness_areas || [],
            linked_professional_id: data.challenge.linked_professional_id ? data.challenge.linked_professional_id : "none",
            price: data.challenge.price !== null && data.challenge.price !== undefined ? data.challenge.price.toString() : "",
            currency: data.challenge.currency || "MXN",
            is_active: data.challenge.is_active !== undefined ? data.challenge.is_active : true,
            is_public: data.challenge.is_public !== undefined ? data.challenge.is_public : false,
            suggested_schedule_days: Array.isArray(data.challenge.suggested_schedule_days) ? data.challenge.suggested_schedule_days : [],
          };
          setFormData(updatedFormData);
        }
        
        setSaving(false);
        
        if (onFormSubmit) {
          onFormSubmit();
        } else if (showButtons) {
          router.push(redirectPath);
        }
      } else {
        // Crear nuevo reto
        const response = await fetch('/api/challenges', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(challengeData),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Error al crear reto");

        createdChallengeId = data.challenge.id;
        toast.success("Reto creado exitosamente");
        
        if (onFormSubmit) {
          onFormSubmit();
        } else if (showButtons) {
          router.push(redirectPath);
        }
      }

      // Agregar personas seleccionadas al reto
      if (selectedPatientIds.length > 0 && createdChallengeId) {
        try {
          const addPatientsResponse = await fetch(`/api/challenges/${createdChallengeId}/add-patients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ patient_ids: selectedPatientIds }),
          });

          const addPatientsData = await addPatientsResponse.json();
          
          if (!addPatientsResponse.ok) {
            console.error('Error agregando pacientes:', addPatientsData);
            toast.warning("El reto se creó pero algunos pacientes no se pudieron agregar");
          } else {
            toast.success(`${selectedPatientIds.length} paciente(s) agregado(s) al reto`);
          }
        } catch (error) {
          console.error('Error agregando pacientes:', error);
          toast.warning("El reto se creó pero hubo un error al agregar pacientes");
        }
      }

      // Guardar recursos si hay alguno
      if (resources.length > 0 && createdChallengeId) {
        try {
          for (let i = 0; i < resources.length; i++) {
            const resource = resources[i];
            if (!resource.title.trim() || !resource.url.trim()) {
              continue; // Saltar recursos incompletos
            }

            const resourceData: any = {
              challenge_id: createdChallengeId,
              title: resource.title.trim(),
              description: resource.description?.trim() || null,
              resource_type: resource.resource_type,
              url: resource.url.trim(),
              display_order: i,
              is_active: true,
            };

            // Agregar campos específicos según el tipo
            if (resource.resource_type === 'ebook' || resource.resource_type === 'pdf') {
              // Para workbooks/PDFs, podríamos usar file_size_bytes si tenemos el tamaño
              // Por ahora solo guardamos la URL
            }

            if (resource.resource_type === 'audio' || resource.resource_type === 'video') {
              if (resource.duration_minutes) {
                resourceData.duration_minutes = parseInt(resource.duration_minutes);
              }
            }

            const resourceResponse = await fetch(`/api/challenges/${createdChallengeId}/resources`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(resourceData),
            });

            if (!resourceResponse.ok) {
              const errorData = await resourceResponse.json();
              console.error('Error guardando recurso:', errorData);
              // Continuar con los demás recursos aunque uno falle
            }
          }
        } catch (error) {
          console.error('Error guardando recursos:', error);
          // No bloquear la navegación si falla guardar recursos
          toast.error("El reto se creó pero algunos recursos no se pudieron guardar");
        }
      }

      // Solo redirigir si showButtons es true
      if (showButtons && !onFormSubmit) {
        router.push(redirectPath);
      }
    } catch (error) {
      console.error("Error saving challenge:", error);
      toast.error(error instanceof Error ? error.message : "Error al guardar reto");
    } finally {
      setSaving(false);
    }
  };

  // Agregar un id al formulario para poder encontrarlo desde fuera
  return (
    <form id="challenge-form" onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader className="py-4">
          <CardTitle>{challenge ? "Editar Reto Personal" : "Crear Reto Personal"}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {challenge
              ? "Modifica la información de tu reto personalizado"
              : "Crea tu propio reto personalizado. Podrás invitar hasta 5 amigos y opcionalmente vincularlo a un profesional para supervisión."}
          </p>
        </CardHeader>
        <CardContent className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ej: Reto de Meditación 21 Días"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción *</Label>
            <RichTextEditor
              content={formData.description || ""}
              onChange={(content) => setFormData({ ...formData, description: content })}
              placeholder="Describe el reto en detalle..."
              maxLength={2000}
              onValidationChange={setIsDescriptionValid}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linked_professional_id">
              {isProfessional ? "Profesional Vinculado" : "Vincular a Profesional (Opcional)"}
            </Label>
            <Select
              key={`linked-prof-${formData.linked_professional_id || 'none'}`}
              value={formData.linked_professional_id || "none"}
              onValueChange={(value) => {
                setFormData({ ...formData, linked_professional_id: value });
              }}
              disabled={loadingProfessionals || isProfessional}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={loadingProfessionals ? "Selecciona..." : isProfessional ? "Este reto está vinculado a ti" : "Selecciona un profesional (opcional)"} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {!isProfessional && <SelectItem value="none">Ninguno (Reto público)</SelectItem>}
                {professionals.map((prof) => (
                  <SelectItem key={prof.id} value={prof.id}>
                    {prof.first_name} {prof.last_name}{prof.profession ? ` - ${prof.profession}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.linked_professional_id && formData.linked_professional_id !== "none" && professionals.length > 0 && null}
            {isProfessional && (
              <p className="text-xs text-muted-foreground">
                Este reto se vinculará automáticamente a tu perfil profesional
              </p>
            )}
          </div>

          {/* Visibilidad Pública/Privada - Para todos los usuarios */}
          <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                {formData.is_public ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
                <Label htmlFor="is_public" className="cursor-pointer">
                  {formData.is_public ? "Reto Público" : "Reto Privado"}
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                {formData.is_public
                  ? "El reto será visible para todos los usuarios en la plataforma"
                  : isProfessional
                    ? "El reto será privado, solo visible para los pacientes que agregues"
                    : "El reto será privado, solo visible para ti y las personas que invites"}
              </p>
            </div>
            <Switch
              id="is_public"
              checked={formData.is_public}
              onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration_days">Duración (días)</Label>
              <Input
                id="duration_days"
                type="number"
                min="1"
                value={formData.duration_days}
                onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                placeholder="Ej: 21"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulty_level">Nivel de Dificultad</Label>
              <Select
                key={`difficulty-${formData.difficulty_level || 'empty'}`}
                value={formData.difficulty_level || ""}
                onValueChange={(value) => {
                  setFormData({ ...formData, difficulty_level: value });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona nivel" />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.difficulty_level && null}
            </div>
          </div>

          {/* Días sugeridos para el reto */}
          <div className="space-y-2">
            <Label>
              Días sugeridos{" "}
              <span className="text-muted-foreground font-normal text-xs">(opcional)</span>
            </Label>
            <p className="text-xs text-muted-foreground -mt-1">
              Los participantes verán estos días como sugerencia y podrán ajustarlos a su horario.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {ORDERED_DAYS.map((day) => {
                const selected = formData.suggested_schedule_days.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      const current = formData.suggested_schedule_days;
                      const next = selected
                        ? current.filter((d) => d !== day)
                        : [...current, day];
                      setFormData({ ...formData, suggested_schedule_days: next });
                    }}
                    className={cn(
                      "h-9 w-12 rounded-md border text-sm font-medium transition-colors",
                      selected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-input hover:bg-muted"
                    )}
                  >
                    {DAY_LABELS[day]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoría</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="Ej: Meditación, Fitness, Nutrición"
            />
          </div>

          <WellnessAreasSelector
            selectedAreas={formData.wellness_areas}
            onAreasChange={(areas) => setFormData({ ...formData, wellness_areas: areas })}
            label="Áreas de Bienestar"
            description="Selecciona las áreas de bienestar relacionadas con este reto"
          />

          {/* Precio - Solo mostrar para profesionales */}
          {isProfessional && (
            <div className="space-y-2">
              <Label htmlFor="price">Precio (MXN)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price || ""}
                onChange={(e) => {
                  setFormData({ ...formData, price: e.target.value });
                }}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">
                Establece el precio del reto para los participantes
              </p>
              {formData.price && (
                <p className="text-xs text-green-600">
                  Precio actual: {formatPrice(Number(formData.price) || 0, formData.currency || "MXN")}
                </p>
              )}
            </div>
          )}

          {canAddPatients && (
            <>
              <div className="space-y-3">
                <Label>Agregar Personas al Reto (Opcional)</Label>
                <p className="text-xs text-muted-foreground">
                  Busca y selecciona las personas que deseas agregar a este reto
                </p>

                {/* Campo de búsqueda */}
                <div className="relative">
                  <Input
                    placeholder="Buscar persona por nombre o email..."
                    value={patientSearchQuery}
                    onChange={(e) => setPatientSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                  {searchingPatients && (
                    <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  )}
                </div>

                {/* Resultados de búsqueda */}
                {searchedPatients.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">Resultados de búsqueda:</p>
                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3 bg-muted/30">
                      {searchedPatients.map((patient) => {
                        const isSelected = selectedPatientIds.includes(patient.id);
                        return (
                          <div
                            key={patient.id}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-primary/10 border border-primary'
                                : 'hover:bg-muted border border-transparent'
                            }`}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedPatientIds(selectedPatientIds.filter(id => id !== patient.id));
                              } else {
                                setSelectedPatientIds([...selectedPatientIds, patient.id]);
                              }
                            }}
                          >
                            <div className="flex items-center gap-2 flex-1">
                              {patient.avatar_url ? (
                                <Image
                                  src={patient.avatar_url}
                                  alt={`${patient.first_name} ${patient.last_name}`}
                                  width={32}
                                  height={32}
                                  className="rounded-full"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                  <Users className="h-4 w-4 text-primary" />
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-medium">
                                  {patient.first_name} {patient.last_name}
                                </p>
                                {patient.email && (
                                  <p className="text-xs text-muted-foreground">{patient.email}</p>
                                )}
                              </div>
                            </div>
                            {isSelected ? (
                              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                <X className="h-3 w-3 text-primary-foreground" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center">
                                <Plus className="h-3 w-3 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Mensaje cuando no hay resultados de búsqueda */}
                {patientSearchQuery.length >= 2 && !searchingPatients && searchedPatients.length === 0 && patients.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No se encontraron personas con &quot;{patientSearchQuery}&quot;
                  </p>
                )}

                {/* Pacientes frecuentes (de citas anteriores) */}
                {loadingPatients ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="inline-block h-4 w-24 bg-muted rounded animate-pulse" />
                  </div>
                ) : filteredFrequentPatients.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">Pacientes frecuentes:</p>
                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                      {filteredFrequentPatients.map((patient) => {
                        const isSelected = selectedPatientIds.includes(patient.id);
                        return (
                          <div
                            key={patient.id}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-primary/10 border border-primary'
                                : 'hover:bg-muted border border-transparent'
                            }`}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedPatientIds(selectedPatientIds.filter(id => id !== patient.id));
                              } else {
                                setSelectedPatientIds([...selectedPatientIds, patient.id]);
                              }
                            }}
                          >
                            <div className="flex items-center gap-2 flex-1">
                              {patient.avatar_url ? (
                                <Image
                                  src={patient.avatar_url}
                                  alt={`${patient.first_name} ${patient.last_name}`}
                                  width={32}
                                  height={32}
                                  className="rounded-full"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                  <Users className="h-4 w-4 text-primary" />
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-medium">
                                  {patient.first_name} {patient.last_name}
                                </p>
                                {patient.email && (
                                  <p className="text-xs text-muted-foreground">{patient.email}</p>
                                )}
                              </div>
                            </div>
                            {isSelected ? (
                              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                <X className="h-3 w-3 text-primary-foreground" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center">
                                <Plus className="h-3 w-3 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Participantes existentes (solo en modo edición) */}
                {challenge?.id && (
                  loadingExistingParticipants ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="inline-block h-4 w-36 bg-muted rounded animate-pulse" />
                    </div>
                  ) : existingParticipants.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">Participantes actuales del reto:</p>
                      <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3 bg-green-50/50">
                        {existingParticipants.map((participant) => (
                          <div
                            key={participant.id}
                            className="flex items-center gap-3 p-2 rounded-lg bg-green-100/50 border border-green-200"
                          >
                            <div className="flex items-center gap-2 flex-1">
                              {participant.avatar_url ? (
                                <Image
                                  src={participant.avatar_url}
                                  alt={`${participant.first_name} ${participant.last_name}`}
                                  width={32}
                                  height={32}
                                  className="rounded-full"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center">
                                  <Users className="h-4 w-4 text-green-700" />
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-medium">
                                  {participant.first_name} {participant.last_name}
                                </p>
                                {participant.email && (
                                  <p className="text-xs text-muted-foreground">{participant.email}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={() => openRemoveParticipantDialog(participant.id)}
                                disabled={removingParticipant}
                                className="h-8 w-8"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                <CheckCircle2 className="h-3 w-3 text-white" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}

                {/* Pacientes seleccionados (nuevos a agregar) */}
                {selectedPatientIds.length > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg">
                    <UserPlus className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium text-primary">
                      {selectedPatientIds.length} nueva(s) persona(s) a agregar
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Confirmación para eliminar participante */}
          <AlertDialog open={removeParticipantDialogOpen} onOpenChange={setRemoveParticipantDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar participante?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción quitará a la persona del reto. Podrá volver a ser agregada después si lo necesitas.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={removingParticipant}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleRemoveParticipantConfirm} disabled={removingParticipant}>
                  {removingParticipant ? "Eliminando..." : "Sí, eliminar"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="space-y-2">
            <Label>Imagen de Portada</Label>
            {formData.cover_image_url && formData.cover_image_url.trim() !== "" && null}
            <div className="space-y-3">
              {formData.cover_image_url && formData.cover_image_url.trim() !== "" ? (
                <div key={`cover-${formData.cover_image_url}`} className="relative h-48 w-full rounded-lg overflow-hidden border-2 border-dashed border-muted">
                  <Image
                    src={formData.cover_image_url}
                    alt="Portada"
                    fill
                    className="object-cover"
                    unoptimized
                    onError={(e) => {
                      // Error silencioso - la imagen no se cargará
                    }}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 shadow-lg"
                    onClick={() => setFormData({ ...formData, cover_image_url: "" })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative h-48 w-full rounded-lg border-2 border-dashed border-muted bg-muted/10 flex flex-col items-center justify-center gap-2 hover:bg-muted/20 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Subir imagen de portada</p>
                  <input
                    ref={coverFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => coverFileInputRef.current?.click()}
                    disabled={uploadingCover}
                  >
                    {uploadingCover ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      "Seleccionar Imagen"
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sección de Recursos - Solo mostrar si showButtons es true (creación) */}
      {/* NOTA: Esta sección está oculta cuando showButtons=false para evitar duplicación con ChallengeResourcesManager */}
      {showButtons !== false && (
      <Card className="py-4">
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recursos del Reto</CardTitle>
              <p className="text-sm text-muted-foreground">
                Agrega enlaces, archivos y materiales de apoyo para los participantes
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setResources([...resources, {
                  title: "",
                  description: "",
                  resource_type: "link",
                  url: "",
                }]);
                setEditingResourceIndex(resources.length);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Recurso
            </Button>
          </div>
        </CardHeader>
        <CardContent className="py-4 space-y-4">
          {resources.length === 0 ? (
            <div className="py-4">
              <p className="text-center text-muted-foreground">
                No hay recursos agregados aún
              </p>
              <p className="text-center text-muted-foreground text-sm mt-2">
                Haz clic en "Agregar Recurso" para comenzar
              </p>
            </div>
          ) : (
            resources.map((resource, index) => {
              const ResourceIcon = RESOURCE_TYPE_OPTIONS.find(opt => opt.value === resource.resource_type)?.icon || File;
              const isEditing = editingResourceIndex === index;
              const showPages = resource.resource_type === 'ebook' || resource.resource_type === 'pdf';
              const showDuration = resource.resource_type === 'audio' || resource.resource_type === 'video';
              const resourceKey = resource.id || `temp-${index}`;

              return (
                <Card key={resourceKey} className="border-2">
                  <CardContent className="py-4 space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <ResourceIcon className="h-5 w-5 text-muted-foreground" />
                        <span className="font-semibold">Recurso {index + 1}</span>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        disabled={loadingResources}
                        onClick={async () => {
                          if (resource.id && challenge?.id) {
                            try {
                              const deleteRes = await fetch(
                                `/api/challenges/${challenge.id}/resources?resourceId=${encodeURIComponent(resource.id)}`,
                                { method: "DELETE" }
                              );
                              if (!deleteRes.ok) {
                                const errorData = await deleteRes.json().catch(() => ({}));
                                throw new Error(errorData?.error || "Error al eliminar recurso");
                              }
                              toast.success("Recurso eliminado");
                              initialResourceIdsRef.current = initialResourceIdsRef.current.filter(id => id !== resource.id);
                              // Refrescar lista desde el servidor para evitar desincronización
                              await fetchResources();
                              return;
                            } catch (error) {
                              console.error("Error eliminando recurso:", error);
                              toast.error(error instanceof Error ? error.message : "Error al eliminar el recurso. Intenta de nuevo.");
                              return;
                            }
                          }
                          setResources(resources.filter((_, i) => i !== index));
                          if (editingResourceIndex === index) {
                            setEditingResourceIndex(null);
                          } else if (editingResourceIndex !== null && editingResourceIndex > index) {
                            setEditingResourceIndex(editingResourceIndex - 1);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>Título del Recurso *</Label>
                      <Input
                        value={resource.title}
                        onChange={(e) => {
                          const updated = [...resources];
                          updated[index].title = e.target.value;
                          setResources(updated);
                        }}
                        placeholder="Ej: Guía de Meditación"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tipo de Recurso *</Label>
                      <Select
                        value={resource.resource_type}
                        onValueChange={(value: 'ebook' | 'audio' | 'video' | 'pdf' | 'link' | 'other') => {
                          const updated = [...resources];
                          updated[index].resource_type = value;
                          // Limpiar campos específicos cuando cambia el tipo
                          if (value !== 'ebook' && value !== 'pdf') {
                            delete updated[index].pages_count;
                          }
                          if (value !== 'audio' && value !== 'video') {
                            delete updated[index].duration_minutes;
                          }
                          setResources(updated);
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {RESOURCE_TYPE_OPTIONS.map((option) => {
                            const Icon = option.icon;
                            return (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4" />
                                  {option.label}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>URL del Recurso *</Label>
                      <Input
                        type="url"
                        value={resource.url}
                        onChange={(e) => {
                          const updated = [...resources];
                          updated[index].url = e.target.value;
                          setResources(updated);
                        }}
                        placeholder="https://ejemplo.com/recurso"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Descripción (Opcional)</Label>
                      <Textarea
                        value={resource.description}
                        onChange={(e) => {
                          const updated = [...resources];
                          updated[index].description = e.target.value;
                          setResources(updated);
                        }}
                        placeholder="Descripción breve del recurso"
                        rows={2}
                      />
                    </div>

                    {showPages && (
                      <div className="space-y-2">
                        <Label>Número de Páginas</Label>
                        <Input
                          type="number"
                          min="0"
                          value={resource.pages_count || ""}
                          onChange={(e) => {
                            const updated = [...resources];
                            updated[index].pages_count = e.target.value;
                            setResources(updated);
                          }}
                          placeholder="Ej: 150"
                        />
                      </div>
                    )}

                    {showDuration && (
                      <div className="space-y-2">
                        <Label>Duración (minutos)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={resource.duration_minutes || ""}
                          onChange={(e) => {
                            const updated = [...resources];
                            updated[index].duration_minutes = e.target.value;
                            setResources(updated);
                          }}
                          placeholder="Ej: 30"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </CardContent>
      </Card>
      )}

      {/* Sección de Reuniones - No mostrar para admin (mejor subir enlaces como recurso) */}
      {challenge?.id && showButtons !== false && !isAdmin && (
        <Card className="py-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Reuniones Programadas</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Agenda videollamadas por Meet, Zoom u otras plataformas
                </p>
              </div>
              {!isAddingMeeting && !editingMeetingId && (
                <Button onClick={handleAddMeeting} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Agendar Reunión
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Meeting Form */}
            {(isAddingMeeting || editingMeetingId) && (
              <Card className="border-2 border-primary/20 bg-muted/30 py-4">
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="meeting-title">
                      Título <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="meeting-title"
                      value={meetingFormData.title}
                      onChange={(e) =>
                        setMeetingFormData({ ...meetingFormData, title: e.target.value })
                      }
                      placeholder="Sesión grupal de meditación"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="platform">Plataforma</Label>
                    <Select
                      value={meetingFormData.platform}
                      onValueChange={(value) =>
                        setMeetingFormData({ ...meetingFormData, platform: value })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MEETING_PLATFORM_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meeting-url">
                      URL de la Reunión <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="meeting-url"
                      type="url"
                      value={meetingFormData.meeting_url}
                      onChange={(e) =>
                        setMeetingFormData({ ...meetingFormData, meeting_url: e.target.value })
                      }
                      placeholder="https://meet.google.com/abc-defg-hij"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="meeting-id">ID de Reunión (Opcional)</Label>
                      <Input
                        id="meeting-id"
                        value={meetingFormData.meeting_id}
                        onChange={(e) =>
                          setMeetingFormData({ ...meetingFormData, meeting_id: e.target.value })
                        }
                        placeholder="123-456-789"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="passcode">Contraseña (Opcional)</Label>
                      <Input
                        id="passcode"
                        value={meetingFormData.passcode}
                        onChange={(e) =>
                          setMeetingFormData({ ...meetingFormData, passcode: e.target.value })
                        }
                        placeholder="••••••"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="scheduled-date">
                        Fecha <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="scheduled-date"
                        type="date"
                        value={meetingFormData.scheduled_date}
                        onChange={(e) =>
                          setMeetingFormData({ ...meetingFormData, scheduled_date: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="scheduled-time">
                        Hora <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="scheduled-time"
                        type="time"
                        value={meetingFormData.scheduled_time}
                        onChange={(e) =>
                          setMeetingFormData({ ...meetingFormData, scheduled_time: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duración (minutos)</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="15"
                        max="480"
                        value={meetingFormData.duration_minutes}
                        onChange={(e) =>
                          setMeetingFormData({
                            ...meetingFormData,
                            duration_minutes: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timezone">Zona Horaria</Label>
                      <Select
                        value={meetingFormData.timezone}
                        onValueChange={(value) =>
                          setMeetingFormData({ ...meetingFormData, timezone: value })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMEZONE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción (Opcional)</Label>
                    <Textarea
                      id="description"
                      value={meetingFormData.description}
                      onChange={(e) =>
                        setMeetingFormData({ ...meetingFormData, description: e.target.value })
                      }
                      placeholder="Tema: Técnicas de respiración consciente"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="recurring">Reunión Recurrente</Label>
                        <p className="text-xs text-muted-foreground">
                          Programa esta reunión de forma repetitiva
                        </p>
                      </div>
                      <Switch
                        id="recurring"
                        checked={meetingFormData.is_recurring}
                        onCheckedChange={(checked) =>
                          setMeetingFormData({ ...meetingFormData, is_recurring: checked })
                        }
                      />
                    </div>

                    {meetingFormData.is_recurring && (
                      <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-muted">
                        <div className="space-y-2">
                          <Label htmlFor="recurrence-pattern">Frecuencia</Label>
                          <Select
                            value={meetingFormData.recurrence_pattern}
                            onValueChange={(value) =>
                              setMeetingFormData({ ...meetingFormData, recurrence_pattern: value })
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {RECURRENCE_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="recurrence-end">Fecha Final</Label>
                          <Input
                            id="recurrence-end"
                            type="date"
                            value={meetingFormData.recurrence_end_date}
                            onChange={(e) =>
                              setMeetingFormData({
                                ...meetingFormData,
                                recurrence_end_date: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-participants">
                      Límite de Participantes (Opcional)
                    </Label>
                    <Input
                      id="max-participants"
                      type="number"
                      min="1"
                      value={meetingFormData.max_participants}
                      onChange={(e) =>
                        setMeetingFormData({
                          ...meetingFormData,
                          max_participants: e.target.value,
                        })
                      }
                      placeholder="Sin límite"
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelMeeting}
                      disabled={submittingMeeting}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleSubmitMeeting} disabled={submittingMeeting}>
                      {submittingMeeting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Guardando...
                        </>
                      ) : editingMeetingId ? (
                        "Actualizar"
                      ) : (
                        "Agendar"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Meetings List */}
            {loadingMeetings ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : meetings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay reuniones programadas</p>
                <p className="text-sm mt-2">
                  Haz clic en &quot;Agendar Reunión&quot; para comenzar
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {meetings.map((meeting) => {
                  const platformOption = MEETING_PLATFORM_OPTIONS.find(
                    (opt) => opt.value === meeting.platform
                  );

                  return (
                    <Card key={meeting.id}>
                      <CardContent className="py-4">
                        <div className="flex items-start gap-4">
                          <div className="mt-1">
                            <Video className="h-5 w-5 text-primary" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <h4 className="font-medium">{meeting.title}</h4>
                                {meeting.description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {meeting.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Badge className={getPlatformBadgeColor(meeting.platform)}>
                                  {platformOption?.label}
                                </Badge>
                                <Badge className={getStatusBadgeColor(meeting.status)}>
                                  {meeting.status === 'scheduled' && 'Programada'}
                                  {meeting.status === 'in_progress' && 'En curso'}
                                  {meeting.status === 'completed' && 'Completada'}
                                  {meeting.status === 'cancelled' && 'Cancelada'}
                                </Badge>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground mb-3">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span className="capitalize">{formatMeetingDate(meeting.scheduled_date)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {formatMeetingTime(meeting.scheduled_time)} ({meeting.duration_minutes} min)
                                </span>
                              </div>
                              {meeting.max_participants && (
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  <span>Máx. {meeting.max_participants} participantes</span>
                                </div>
                              )}
                              {meeting.is_recurring && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <span className="capitalize">
                                    {meeting.recurrence_pattern === 'weekly' && 'Semanal'}
                                    {meeting.recurrence_pattern === 'biweekly' && 'Quincenal'}
                                    {meeting.recurrence_pattern === 'monthly' && 'Mensual'}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                              >
                                <a
                                  href={meeting.meeting_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-3 w-3 mr-2" />
                                  Unirse
                                </a>
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCopyMeetingUrl(meeting.meeting_url, meeting.id)}
                              >
                                {copiedMeetingUrl === meeting.id ? (
                                  <>
                                    <CheckCircle2 className="h-3 w-3 mr-2" />
                                    Copiado
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3 mr-2" />
                                    Copiar URL
                                  </>
                                )}
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditMeeting(meeting)}
                              >
                                <Edit className="h-3 w-3 mr-2" />
                                Editar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteMeetingClick(meeting.id)}
                              >
                                <Trash2 className="h-3 w-3 mr-2" />
                                Cancelar
                              </Button>
                            </div>

                            {(meeting.meeting_id || meeting.passcode) && (
                              <div className="mt-3 pt-3 border-t text-xs text-muted-foreground space-y-1">
                                {meeting.meeting_id && (
                                  <div>ID: {meeting.meeting_id}</div>
                                )}
                                {meeting.passcode && (
                                  <div>Contraseña: {meeting.passcode}</div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={deleteMeetingDialogOpen} onOpenChange={setDeleteMeetingDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Cancelar reunión?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción cancelará la reunión. Los participantes ya no podrán
                  acceder a ella.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Volver</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteMeetingConfirm}>
                  Cancelar Reunión
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Card>
      )}

      {showButtons && (
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(redirectPath)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={saving || !isDescriptionValid}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              challenge ? "Actualizar Reto" : "Crear Reto"
            )}
          </Button>
        </div>
      )}
    </form>
  );
}
