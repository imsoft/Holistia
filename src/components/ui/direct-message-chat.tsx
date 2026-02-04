"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Send, Loader2, Briefcase, Calendar, Package, Target, MapPin, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/price-utils";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { Service } from "@/types/service";
import { ServiceMessageCard } from "@/components/ui/service-message-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DirectMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: 'user' | 'professional';
  content: string;
  metadata?: {
    service_id?: string;
    availability_slot?: {
      date: string;
      start_time: string;
      end_time: string;
      type?: 'available' | 'block';
    };
    program_id?: string;
    challenge_id?: string;
    location?: {
      address: string;
      city: string;
      state: string;
      country: string;
    };
    [key: string]: any;
  };
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  sender?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

interface DirectMessageChatProps {
  conversationId: string;
  currentUserId: string;
  otherUser: {
    id: string;
    name: string;
    avatar_url?: string | null;
    isProfessional?: boolean; // Si el otro usuario es profesional
  };
  professionalId?: string; // ID del profesional para obtener servicios
  isProfessional?: boolean; // Si el usuario actual es profesional
}

export function DirectMessageChat({ 
  conversationId, 
  currentUserId,
  otherUser,
  professionalId,
  isProfessional = false
}: DirectMessageChatProps) {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [isServicesDialogOpen, setIsServicesDialogOpen] = useState(false);
  const [serviceDetails, setServiceDetails] = useState<Record<string, Service>>({});
  const [professionalSlug, setProfessionalSlug] = useState<string | null>(null);
  
  // Nuevos estados para las opciones del profesional
  const [isQuickOptionsOpen, setIsQuickOptionsOpen] = useState(false);
  const [isAvailabilityDialogOpen, setIsAvailabilityDialogOpen] = useState(false);
  const [isProgramsDialogOpen, setIsProgramsDialogOpen] = useState(false);
  const [isChallengesDialogOpen, setIsChallengesDialogOpen] = useState(false);
  
  // Datos para las opciones
  const [availabilitySlots, setAvailabilitySlots] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [professionalLocation, setProfessionalLocation] = useState<any>(null);
  const [professionalWorkingHours, setProfessionalWorkingHours] = useState<{
    working_start_time: string;
    working_end_time: string;
    working_days: number[];
  } | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [loadingChallenges, setLoadingChallenges] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    loadMessages();
    // Polling para nuevos mensajes cada 3 segundos
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/messages/conversations/${conversationId}/messages`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar mensajes");
      }

      const messagesList = data.messages || [];
      setMessages(messagesList);
    } catch (error) {
      console.error("Error loading messages:", error);
      if (loading) {
        toast.error("Error al cargar mensajes");
      }
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  // Cargar servicios del profesional (solo si es profesional)
  const loadServices = useCallback(async () => {
    if (!professionalId || !isProfessional) return;

    try {
      setServicesLoading(true);
      
      // El professionalId puede ser user_id o professional_id
      // Primero intentamos obtener el professional_id desde professional_applications
      let actualProfessionalId = professionalId;
      
      // Verificar si professionalId es un user_id buscando en professional_applications
      const { data: professionalApp } = await supabase
        .from("professional_applications")
        .select("id")
        .eq("user_id", professionalId)
        .eq("status", "approved")
        .maybeSingle();

      // Si encontramos una aplicación profesional, usar su id como professional_id
      if (professionalApp) {
        actualProfessionalId = professionalApp.id;
      }

      // Intentar primero con professional_id
      let { data, error } = await supabase
        .from("professional_services")
        .select("*")
        .eq("professional_id", actualProfessionalId)
        .eq("isactive", true)
        .order("created_at", { ascending: false });

      // Si no hay resultados y professionalId podría ser user_id, intentar con user_id
      if ((!data || data.length === 0) && !professionalApp) {
        const { data: userData, error: userError } = await supabase
          .from("professional_services")
          .select("*")
          .eq("user_id", professionalId)
          .eq("isactive", true)
          .order("created_at", { ascending: false });

        if (!userError && userData) {
          data = userData;
          error = null;
        } else {
          error = userError;
        }
      }

      if (error) throw error;

      const servicesList = data || [];
      setServices(servicesList);

      // Crear un mapa de detalles de servicios para acceso rápido
      const detailsMap: Record<string, Service> = {};
      servicesList.forEach((service) => {
        if (service.id) {
          detailsMap[service.id] = service as Service;
        }
      });
      setServiceDetails(detailsMap);
    } catch (error) {
      console.error("Error loading services:", error);
      toast.error("Error al cargar servicios");
    } finally {
      setServicesLoading(false);
    }
  }, [professionalId, isProfessional, supabase]);

  // Cargar todos los datos del profesional cuando se inicia el componente
  useEffect(() => {
    if (isProfessional && professionalId) {
      loadServices();
      loadPrograms();
      loadChallenges();
      loadLocation();
    }
  }, [isProfessional, professionalId]);

  // Cargar datos del profesional para construir el slug
  useEffect(() => {
    const loadProfessionalData = async () => {
      if (!professionalId) return;

      try {
        // El professionalId puede ser user_id o professional_applications.id
        // Intentar primero como professional_applications.id
        let { data: professionalData } = await supabase
          .from('professional_applications')
          .select('id, slug, first_name, last_name, user_id')
          .eq('id', professionalId)
          .eq('status', 'approved')
          .maybeSingle();

        // Si no se encuentra, intentar como user_id
        if (!professionalData) {
          const { data: userData } = await supabase
            .from('professional_applications')
            .select('id, slug, first_name, last_name, user_id')
            .eq('user_id', professionalId)
            .eq('status', 'approved')
            .maybeSingle();

          if (userData) {
            professionalData = userData;
          }
        }

        if (professionalData) {
          const slug = professionalData.slug || `${professionalData.first_name?.toLowerCase() || ''}-${professionalData.last_name?.toLowerCase() || ''}`;
          setProfessionalSlug(slug);
        }
      } catch (error) {
        console.error('Error loading professional data for slug:', error);
      }
    };

    loadProfessionalData();
  }, [professionalId, supabase]);

  // Cargar detalles de servicios, programas y retos cuando hay mensajes con metadata
  useEffect(() => {
    if (!professionalId || isProfessional) return; // Solo para usuarios (pacientes) que reciben contenido

    const loadMessageDetails = async () => {
      // Cargar detalles de servicios
      const serviceIds = messages
        .filter((msg) => msg.metadata?.service_id)
        .map((msg) => msg.metadata!.service_id!)
        .filter((id: string | undefined): id is string => !!id);

      if (serviceIds.length > 0) {
        const missingServiceIds = serviceIds.filter(id => !serviceDetails[id]);
        
        if (missingServiceIds.length > 0) {
          try {
            const { data: servicesData, error: servicesError } = await supabase
              .from("professional_services")
              .select("*")
              .in("id", missingServiceIds);

            if (!servicesError && servicesData) {
              const newDetails: Record<string, Service> = { ...serviceDetails };
              servicesData.forEach((service) => {
                if (service.id) {
                  newDetails[service.id] = service as Service;
                }
              });
              setServiceDetails(newDetails);
            }
          } catch (error) {
            console.error("Error loading service details:", error);
          }
        }
      }

      // Cargar detalles de programas si hay mensajes con program_id
      const programIds = messages
        .filter((msg) => msg.metadata?.program_id)
        .map((msg) => msg.metadata!.program_id!)
        .filter((id: string | undefined): id is string => !!id);

      if (programIds.length > 0) {
        const missingProgramIds = programIds.filter(id => !programs.find(p => p.id === id));
        
        if (missingProgramIds.length > 0) {
          try {
            const { data: programsData, error: programsError } = await supabase
              .from("digital_products")
              .select("*")
              .in("id", missingProgramIds);

            if (!programsError && programsData) {
              setPrograms((prev) => {
                const existingIds = new Set(prev.map(p => p.id));
                const newPrograms = programsData.filter(p => !existingIds.has(p.id));
                return [...prev, ...newPrograms];
              });
            }
          } catch (error) {
            console.error("Error loading program details:", error);
          }
        }
      }

      // Cargar detalles de retos si hay mensajes con challenge_id
      const challengeIds = messages
        .filter((msg) => msg.metadata?.challenge_id)
        .map((msg) => msg.metadata!.challenge_id!)
        .filter((id: string | undefined): id is string => !!id);

      if (challengeIds.length > 0) {
        const missingChallengeIds = challengeIds.filter(id => !challenges.find(c => c.id === id));
        
        if (missingChallengeIds.length > 0) {
          try {
            const { data: challengesData, error: challengesError } = await supabase
              .from("challenges")
              .select("*")
              .in("id", missingChallengeIds);

            if (!challengesError && challengesData) {
              setChallenges((prev) => {
                const existingIds = new Set(prev.map(c => c.id));
                const newChallenges = challengesData.filter(c => !existingIds.has(c.id));
                return [...prev, ...newChallenges];
              });
            }
          } catch (error) {
            console.error("Error loading challenge details:", error);
          }
        }
      }
    };

    loadMessageDetails();
  }, [messages, professionalId, isProfessional, serviceDetails, programs, challenges, supabase]);

  const handleSendMessage = async (
    e: React.FormEvent, 
    customMetadata?: {
      service_id?: string;
      availability_slot?: any;
      program_id?: string;
      challenge_id?: string;
      location?: any;
      [key: string]: any;
    },
    customContent?: string
  ) => {
    e.preventDefault();

    let contentToSend: string;
    
    if (customContent) {
      contentToSend = customContent;
    } else if (customMetadata?.service_id) {
      contentToSend = `Te comparto mi servicio: ${serviceDetails[customMetadata.service_id]?.name || 'Servicio'}`;
    } else if (customMetadata?.program_id) {
      const program = programs?.find(p => p.id === customMetadata.program_id);
      contentToSend = `Te comparto mi programa: ${program?.title || 'Programa'}`;
    } else if (customMetadata?.challenge_id) {
      const challenge = challenges?.find(c => c.id === customMetadata.challenge_id);
      contentToSend = `Te comparto mi reto: ${challenge?.title || 'Reto'}`;
    } else if (customMetadata?.availability_slot) {
      const date = new Date(customMetadata.availability_slot.date);
      contentToSend = `Cita disponible: ${date.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} de ${customMetadata.availability_slot.start_time} a ${customMetadata.availability_slot.end_time}`;
    } else if (customMetadata?.location) {
      contentToSend = `Mi ubicación: ${customMetadata.location.address}, ${customMetadata.location.city}, ${customMetadata.location.state}`;
    } else {
      contentToSend = message.trim();
    }

    if (!contentToSend) return;

    try {
      setSending(true);

      const response = await fetch(`/api/messages/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: contentToSend,
          metadata: customMetadata || {},
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Error al enviar mensaje");

      setMessages((prev) => [...prev, data.message]);
      setMessage("");
      setIsServicesDialogOpen(false);
      setIsAvailabilityDialogOpen(false);
      setIsProgramsDialogOpen(false);
      setIsChallengesDialogOpen(false);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Error al enviar mensaje");
    } finally {
      setSending(false);
    }
  };

  const handleServiceSelect = (service: Service) => {
    if (!service.id) return;
    handleSendMessage(new Event('submit') as any, { service_id: service.id });
  };

  // Handlers para enviar cada tipo (definidos antes de loadAvailabilitySlots para evitar errores)
  const handleSendAvailability = (slot: any) => {
    handleSendMessage(new Event('submit') as any, { availability_slot: slot });
  };

  const handleSendProgram = (program: any) => {
    if (!program.id) return;
    handleSendMessage(new Event('submit') as any, { program_id: program.id });
  };

  const handleSendChallenge = (challenge: any) => {
    if (!challenge.id) return;
    handleSendMessage(new Event('submit') as any, { challenge_id: challenge.id });
  };

  const handleSendLocation = () => {
    if (!professionalLocation) {
      toast.error("No se pudo cargar la ubicación");
      return;
    }
    handleSendMessage(new Event('submit') as any, { location: professionalLocation });
  };

  // Cargar citas disponibles (availability blocks o slots libres)
  const loadAvailabilitySlots = useCallback(async () => {
    if (!professionalId || !isProfessional) return;

    try {
      setLoadingAvailability(true);
      
      // Obtener el professional_id correcto
      let actualProfessionalId = professionalId;
      const { data: professionalApp } = await supabase
        .from("professional_applications")
        .select("id")
        .eq("user_id", professionalId)
        .eq("status", "approved")
        .maybeSingle();

      if (professionalApp) {
        actualProfessionalId = professionalApp.id;
      }

      // Obtener citas próximas disponibles (sin citas confirmadas)
      const today = new Date().toISOString().split('T')[0];
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select('appointment_date, appointment_time, duration_minutes')
        .eq('professional_id', actualProfessionalId)
        .in('status', ['confirmed', 'pending'])
        .gte('appointment_date', today)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      // Obtener bloqueos de disponibilidad
      const { data: blocksData } = await supabase
        .from('availability_blocks')
        .select('*')
        .eq('professional_id', actualProfessionalId)
        .gte('start_date', today)
        .order('start_date', { ascending: true })
        .order('start_time', { ascending: true });

      // Obtener horarios de trabajo del profesional
      const { data: professionalData } = await supabase
        .from('professional_applications')
        .select('working_start_time, working_end_time, working_days')
        .eq('id', actualProfessionalId)
        .single();

      // Guardar horarios de trabajo para mostrarlos si no hay slots disponibles
      if (professionalData) {
        setProfessionalWorkingHours({
          working_start_time: professionalData.working_start_time || '09:00',
          working_end_time: professionalData.working_end_time || '18:00',
          working_days: professionalData.working_days || [1, 2, 3, 4, 5]
        });
      }

      // Generar slots disponibles para los próximos 14 días
      const slots: any[] = [];
      const workingStart = professionalData?.working_start_time || '09:00';
      const workingEnd = professionalData?.working_end_time || '18:00';
      const workingDays = professionalData?.working_days || [1, 2, 3, 4, 5];

      for (let i = 0; i < 14; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();

        // Solo generar slots para días de trabajo
        if (!workingDays.includes(dayOfWeek)) continue;

        // Verificar si hay bloqueo de día completo
        const fullDayBlock = blocksData?.find(b => 
          b.start_date <= dateStr && 
          (b.end_date || b.start_date) >= dateStr &&
          b.block_type === 'full_day'
        );

        if (fullDayBlock) continue;

        // Generar slots de hora en hora
        const [startHour, startMin] = workingStart.split(':').map(Number);
        const [endHour, endMin] = workingEnd.split(':').map(Number);
        
        for (let hour = startHour; hour < endHour; hour++) {
          const timeStr = `${hour.toString().padStart(2, '0')}:00`;
          
          // Verificar si está bloqueado
          const isBlocked = blocksData?.some(b => 
            b.start_date <= dateStr && 
            (b.end_date || b.start_date) >= dateStr &&
            b.block_type === 'time_range' &&
            b.start_time &&
            b.end_time &&
            timeStr >= b.start_time &&
            timeStr < b.end_time
          );

          // Verificar si hay cita
          const hasAppointment = appointmentsData?.some(a => 
            a.appointment_date === dateStr &&
            a.appointment_time?.substring(0, 5) === timeStr
          );

          if (!isBlocked && !hasAppointment) {
            slots.push({
              date: dateStr,
              start_time: timeStr,
              end_time: `${(hour + 1).toString().padStart(2, '0')}:00`,
              type: 'available'
            });
          }
        }
      }

      setAvailabilitySlots(slots.slice(0, 20)); // Limitar a 20 slots
    } catch (error) {
      console.error("Error loading availability slots:", error);
      toast.error("Error al cargar citas disponibles");
    } finally {
      setLoadingAvailability(false);
    }
  }, [professionalId, isProfessional, supabase]);

  // Cargar programas digitales
  const loadPrograms = useCallback(async () => {
    if (!professionalId || !isProfessional) return;

    try {
      setLoadingPrograms(true);
      
      let actualProfessionalId = professionalId;
      const { data: professionalApp } = await supabase
        .from("professional_applications")
        .select("id")
        .eq("user_id", professionalId)
        .eq("status", "approved")
        .maybeSingle();

      if (professionalApp) {
        actualProfessionalId = professionalApp.id;
      }

      const { data: programsData, error } = await supabase
        .from("digital_products")
        .select("*")
        .eq("professional_id", actualProfessionalId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPrograms(programsData || []);
    } catch (error) {
      console.error("Error loading programs:", error);
      toast.error("Error al cargar programas");
    } finally {
      setLoadingPrograms(false);
    }
  }, [professionalId, isProfessional, supabase]);

  // Cargar retos
  const loadChallenges = useCallback(async () => {
    if (!professionalId || !isProfessional) return;

    try {
      setLoadingChallenges(true);
      
      // Los retos se crean con created_by_user_id, no professional_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: challengesData, error } = await supabase
        .from("challenges")
        .select("*")
        .eq("created_by_user_id", user.id)
        .eq("created_by_type", "professional")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setChallenges(challengesData || []);
    } catch (error) {
      console.error("Error loading challenges:", error);
      toast.error("Error al cargar retos");
    } finally {
      setLoadingChallenges(false);
    }
  }, [professionalId, isProfessional, supabase]);

  // Cargar ubicación del profesional
  const loadLocation = useCallback(async () => {
    if (!professionalId || !isProfessional) return;

    try {
      setLoadingLocation(true);
      
      let actualProfessionalId = professionalId;
      const { data: professionalApp } = await supabase
        .from("professional_applications")
        .select("id")
        .eq("user_id", professionalId)
        .eq("status", "approved")
        .maybeSingle();

      if (professionalApp) {
        actualProfessionalId = professionalApp.id;
      }

      const { data: professionalData, error } = await supabase
        .from("professional_applications")
        .select("address, city, state, country")
        .eq("id", actualProfessionalId)
        .single();

      if (error) throw error;

      if (professionalData) {
        setProfessionalLocation({
          address: professionalData.address,
          city: professionalData.city,
          state: professionalData.state,
          country: professionalData.country || 'México'
        });
      }
    } catch (error) {
      console.error("Error loading location:", error);
      toast.error("Error al cargar ubicación");
    } finally {
      setLoadingLocation(false);
    }
  }, [professionalId, isProfessional, supabase]);

  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4 shrink-0">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={otherUser.avatar_url || undefined} />
            <AvatarFallback>
              {otherUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{otherUser.name}</h3>
            <Badge 
              variant={otherUser.isProfessional ? "default" : "secondary"}
              className="text-xs"
            >
              {otherUser.isProfessional ? "Experto" : "Paciente"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No hay mensajes aún. Envía el primer mensaje.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwnMessage = msg.sender_id === currentUserId;
              const senderName = msg.sender 
                ? `${msg.sender.first_name} ${msg.sender.last_name}`
                : 'Usuario';
              // Determinar si el remitente es profesional basado en sender_type
              const senderIsProfessional = msg.sender_type === 'professional';

              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3",
                    isOwnMessage ? "justify-end" : "justify-start"
                  )}
                >
                  {!isOwnMessage && (
                    <div className="flex flex-col items-center gap-1">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={msg.sender?.avatar_url || undefined} />
                        <AvatarFallback>
                          {msg.sender 
                            ? getUserInitials(msg.sender.first_name, msg.sender.last_name)
                            : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <Badge 
                        variant={senderIsProfessional ? "default" : "secondary"}
                        className="text-xs px-1.5 py-0"
                      >
                        {senderIsProfessional ? "Experto" : "Paciente"}
                      </Badge>
                    </div>
                  )}
                  <div className={cn(
                    "flex flex-col max-w-[70%]",
                    isOwnMessage ? "items-end" : "items-start"
                  )}>
                    {/* Mostrar componentes especiales según el tipo de metadata */}
                    {msg.metadata?.service_id && serviceDetails[msg.metadata.service_id] ? (
                      <ServiceMessageCard
                        service={serviceDetails[msg.metadata.service_id]}
                        userId={isOwnMessage ? currentUserId : otherUser.id}
                        professionalId={professionalId || ''}
                        professionalSlug={professionalSlug || undefined}
                        conversationId={conversationId}
                        isProfessional={isProfessional}
                        className={cn(
                          isOwnMessage ? "ml-auto" : "mr-auto"
                        )}
                      />
                    ) : msg.metadata?.availability_slot ? (
                      <Card className={cn(
                        "w-full max-w-sm border-2 border-primary/20",
                        isOwnMessage ? "ml-auto" : "mr-auto"
                      )}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            <div className="flex-1">
                              <p className="font-semibold">Cita Disponible</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(msg.metadata.availability_slot.date).toLocaleDateString('es-MX', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {msg.metadata.availability_slot.start_time} - {msg.metadata.availability_slot.end_time}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : msg.metadata?.program_id ? (
                      (() => {
                        const program = programs.find(p => p.id === msg.metadata?.program_id);
                        return program ? (
                          <Card className={cn(
                            "w-full max-w-sm border-2 border-primary/20",
                            isOwnMessage ? "ml-auto" : "mr-auto"
                          )}>
                            {program.cover_image_url && (
                              <div className="relative w-full h-32">
                                <Image
                                  src={program.cover_image_url}
                                  alt={program.title}
                                  fill
                                  className="object-cover rounded-t-lg"
                                />
                              </div>
                            )}
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3 mb-2">
                                <Package className="h-5 w-5 text-primary shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold line-clamp-1">{program.title}</p>
                                  {program.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                      {program.description.replace(/<[^>]*>/g, '')}
                                    </p>
                                  )}
                                  {program.price !== null && program.price > 0 && (
                                    <p className="text-sm font-semibold text-primary mt-1">
                                      {formatPrice(program.price, program.currency || "MXN")}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          <div className={cn(
                            "rounded-lg px-4 py-2",
                            isOwnMessage
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}>
                            <p className="text-sm whitespace-pre-wrap wrap-break-word">
                              {msg.content}
                            </p>
                          </div>
                        );
                      })()
                    ) : msg.metadata?.challenge_id ? (
                      (() => {
                        const challenge = challenges.find(c => c.id === msg.metadata?.challenge_id);
                        return challenge ? (
                          <Card className={cn(
                            "w-full max-w-sm border-2 border-primary/20",
                            isOwnMessage ? "ml-auto" : "mr-auto"
                          )}>
                            {challenge.cover_image_url && (
                              <div className="relative w-full h-32">
                                <Image
                                  src={challenge.cover_image_url}
                                  alt={challenge.title}
                                  fill
                                  className="object-cover rounded-t-lg"
                                />
                              </div>
                            )}
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3 mb-2">
                                <Target className="h-5 w-5 text-primary shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold line-clamp-1">{challenge.title}</p>
                                  {challenge.short_description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                      {challenge.short_description}
                                    </p>
                                  )}
                                  <div className="flex flex-wrap gap-2 text-xs mt-2">
                                    {challenge.duration_days && (
                                      <Badge variant="secondary">
                                        {challenge.duration_days} días
                                      </Badge>
                                    )}
                                    {challenge.price !== null && challenge.price > 0 && (
                                      <Badge variant="secondary">
                                        {formatPrice(challenge.price, challenge.currency || "MXN")}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          <div className={cn(
                            "rounded-lg px-4 py-2",
                            isOwnMessage
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}>
                            <p className="text-sm whitespace-pre-wrap wrap-break-word">
                              {msg.content}
                            </p>
                          </div>
                        );
                      })()
                    ) : msg.metadata?.location ? (
                      <Card className={cn(
                        "w-full max-w-sm border-2 border-primary/20",
                        isOwnMessage ? "ml-auto" : "mr-auto"
                      )}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            <div className="flex-1">
                              <p className="font-semibold">Ubicación</p>
                              <p className="text-sm text-muted-foreground">
                                {msg.metadata.location.address}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {msg.metadata.location.city}, {msg.metadata.location.state}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {msg.metadata.location.country}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <div
                        className={cn(
                          "rounded-lg px-4 py-2",
                          isOwnMessage
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap wrap-break-word">
                          {msg.content}
                        </p>
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(msg.created_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                  </div>
                  {isOwnMessage && (
                    <div className="flex flex-col items-center gap-1">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={msg.sender?.avatar_url || undefined} />
                        <AvatarFallback>
                          {msg.sender 
                            ? getUserInitials(msg.sender.first_name, msg.sender.last_name)
                            : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <Badge 
                        variant={isProfessional ? "default" : "secondary"}
                        className="text-xs px-1.5 py-0"
                      >
                        {isProfessional ? "Experto" : "Paciente"}
                      </Badge>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="border-t p-4 shrink-0">
        <div className="flex gap-2">
          {isProfessional && professionalId && (
            <>
              <DropdownMenu open={isQuickOptionsOpen} onOpenChange={setIsQuickOptionsOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={sending}
                    title="Enviar contenido rápido"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem
                    onClick={() => {
                      setIsQuickOptionsOpen(false);
                      loadAvailabilitySlots();
                      setIsAvailabilityDialogOpen(true);
                    }}
                    disabled={loadingAvailability}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Citas Disponibles
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setIsQuickOptionsOpen(false);
                      setIsProgramsDialogOpen(true);
                    }}
                    disabled={loadingPrograms || programs.length === 0}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Programas
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setIsQuickOptionsOpen(false);
                      setIsChallengesDialogOpen(true);
                    }}
                    disabled={loadingChallenges || challenges.length === 0}
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Retos
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => {
                      setIsQuickOptionsOpen(false);
                      if (!professionalLocation) {
                        await loadLocation();
                      }
                      // Esperar un momento para que se actualice el estado y obtener el valor más reciente
                      setTimeout(() => {
                        if (professionalLocation) {
                          handleSendMessage(new Event('submit') as any, { location: professionalLocation });
                        } else {
                          // Intentar obtener la ubicación nuevamente
                          supabase
                            .from("professional_applications")
                            .select("address, city, state, country")
                            .eq("id", professionalId || '')
                            .single()
                            .then(({ data, error }) => {
                              if (!error && data) {
                                const loc = {
                                  address: data.address,
                                  city: data.city,
                                  state: data.state,
                                  country: data.country || 'México'
                                };
                                handleSendMessage(new Event('submit') as any, { location: loc });
                              } else {
                                toast.error("No se pudo cargar la ubicación");
                              }
                            });
                        }
                      }, 100);
                    }}
                    disabled={loadingLocation}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Ubicación
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setIsQuickOptionsOpen(false);
                      setIsServicesDialogOpen(true);
                    }}
                    disabled={servicesLoading}
                  >
                    <Briefcase className="h-4 w-4 mr-2" />
                    Servicios
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1"
            disabled={sending}
          />
          <Button type="submit" disabled={sending || !message.trim()}>
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>

      {/* Dialog de Servicios */}
      {isProfessional && professionalId && (
        <Dialog open={isServicesDialogOpen} onOpenChange={setIsServicesDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Seleccionar Servicio</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto py-4">
              {servicesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : services.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No tienes servicios activos</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {services.map((service) => (
                    <Card
                      key={service.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleServiceSelect(service)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{service.name}</h3>
                              <Badge variant="outline">
                                {service.type === "session" ? "Sesión" : "Programa"}
                              </Badge>
                            </div>
                            {service.description && (
                              <div 
                                className="text-sm text-muted-foreground line-clamp-2 mb-2 prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: service.description }}
                              />
                            )}
                            <div className="flex flex-wrap gap-2 text-xs">
                              <Badge variant="secondary">
                                {service.modality === "presencial" 
                                  ? "Presencial" 
                                  : service.modality === "online"
                                  ? "En línea"
                                  : "Presencial y en línea"}
                              </Badge>
                              <Badge variant="secondary">
                                {service.type === "session"
                                  ? `${service.duration} min`
                                  : service.program_duration
                                  ? `${service.program_duration.value} ${service.program_duration.unit}`
                                  : "Duración variable"}
                              </Badge>
                              {service.cost !== null && (
                                <Badge variant="secondary">
                                  {service.pricing_type === "quote"
                                    ? "Cotización"
                                    : typeof service.cost === "number"
                                    ? formatPrice(service.cost, "MXN")
                                    : "Precio no disponible"}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog de Citas Disponibles */}
      {isProfessional && professionalId && (
        <Dialog open={isAvailabilityDialogOpen} onOpenChange={setIsAvailabilityDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Seleccionar Cita Disponible</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto py-4">
              {loadingAvailability ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : availabilitySlots.length === 0 ? (
                <div className="py-8">
                  {professionalWorkingHours ? (
                    <div className="space-y-4">
                      <div className="text-center mb-6">
                        <p className="text-sm font-semibold text-foreground mb-2">
                          Horarios de Trabajo Disponibles
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Estos son los horarios generales de trabajo. Puedes solicitar una cita en estos horarios.
                        </p>
                      </div>
                      <div className="space-y-3">
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-primary" />
                                <div>
                                  <p className="font-semibold">Horario de Trabajo</p>
                                  <p className="text-sm text-muted-foreground">
                                    {professionalWorkingHours.working_start_time} - {professionalWorkingHours.working_end_time}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <Calendar className="h-5 w-5 text-primary" />
                              <div>
                                <p className="font-semibold">Días de Trabajo</p>
                                <p className="text-sm text-muted-foreground">
                                  {professionalWorkingHours.working_days
                                    .map(day => {
                                      const dayNames = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
                                      return dayNames[day];
                                    })
                                    .filter(Boolean)
                                    .join(', ')}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No hay citas disponibles en los próximos días</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid gap-2">
                  {availabilitySlots.map((slot, index) => (
                    <Card
                      key={index}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleSendAvailability(slot)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-semibold">
                                {new Date(slot.date).toLocaleDateString('es-MX', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {slot.start_time} - {slot.end_time}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">Disponible</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog de Programas */}
      {isProfessional && professionalId && (
        <Dialog open={isProgramsDialogOpen} onOpenChange={setIsProgramsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Seleccionar Programa</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto py-4">
              {loadingPrograms ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : programs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No tienes programas activos</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {programs.map((program) => (
                    <Card
                      key={program.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleSendProgram(program)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Package className="h-5 w-5 text-primary" />
                              <h3 className="font-semibold">{program.title}</h3>
                              <Badge variant="outline">{program.category || 'Programa'}</Badge>
                            </div>
                            {program.description && (
                              <div 
                                className="text-sm text-muted-foreground line-clamp-2 mb-2 prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: program.description }}
                              />
                            )}
                            {program.price !== null && program.price > 0 && (
                              <div className="text-sm font-semibold text-primary">
                                {formatPrice(program.price, program.currency || "MXN")}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog de Retos */}
      {isProfessional && professionalId && (
        <Dialog open={isChallengesDialogOpen} onOpenChange={setIsChallengesDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Seleccionar Reto</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto py-4">
              {loadingChallenges ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : challenges.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No tienes retos activos</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {challenges.map((challenge) => (
                    <Card
                      key={challenge.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleSendChallenge(challenge)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Target className="h-5 w-5 text-primary" />
                              <h3 className="font-semibold">{challenge.title}</h3>
                              <Badge variant="outline">{challenge.difficulty_level || 'Reto'}</Badge>
                            </div>
                            {challenge.short_description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                {challenge.short_description}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2 text-xs">
                              {challenge.duration_days && (
                                <Badge variant="secondary">
                                  {challenge.duration_days} días
                                </Badge>
                              )}
                              {challenge.price !== null && challenge.price > 0 && (
                                <Badge variant="secondary">
                                  {formatPrice(challenge.price, challenge.currency || "MXN")}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
