"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Send, Loader2, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
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

  useEffect(() => {
    if (isProfessional && professionalId) {
      loadServices();
    }
  }, [isProfessional, professionalId, loadServices]);

  // Cargar detalles de servicios cuando hay mensajes con metadata (para usuarios que reciben servicios)
  useEffect(() => {
    if (!professionalId || isProfessional) return; // Solo para usuarios (pacientes) que reciben servicios

    const loadServiceDetails = async () => {
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
    };

    loadServiceDetails();
  }, [messages, professionalId, isProfessional, serviceDetails, supabase]);

  const handleSendMessage = async (e: React.FormEvent, serviceMetadata?: { service_id: string }) => {
    e.preventDefault();

    const contentToSend = serviceMetadata 
      ? `Te comparto mi servicio: ${serviceDetails[serviceMetadata.service_id]?.name || 'Servicio'}`
      : message.trim();

    if (!contentToSend) return;

    try {
      setSending(true);

      const response = await fetch(`/api/messages/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: contentToSend,
          metadata: serviceMetadata || {},
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Error al enviar mensaje");

      setMessages((prev) => [...prev, data.message]);
      setMessage("");
      setIsServicesDialogOpen(false);
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
          <div>
            <h3 className="font-semibold">{otherUser.name}</h3>
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

              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3",
                    isOwnMessage ? "justify-end" : "justify-start"
                  )}
                >
                  {!isOwnMessage && (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={msg.sender?.avatar_url || undefined} />
                      <AvatarFallback>
                        {msg.sender 
                          ? getUserInitials(msg.sender.first_name, msg.sender.last_name)
                          : 'U'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn(
                    "flex flex-col max-w-[70%]",
                    isOwnMessage ? "items-end" : "items-start"
                  )}>
                    {/* Mostrar ServiceCard si el mensaje tiene metadata con service_id */}
                    {msg.metadata?.service_id && serviceDetails[msg.metadata.service_id] ? (
                      <ServiceMessageCard
                        service={serviceDetails[msg.metadata.service_id]}
                        userId={isOwnMessage ? currentUserId : otherUser.id}
                        professionalId={professionalId || ''}
                        className={cn(
                          isOwnMessage ? "ml-auto" : "mr-auto"
                        )}
                      />
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
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={msg.sender?.avatar_url || undefined} />
                      <AvatarFallback>
                        {msg.sender 
                          ? getUserInitials(msg.sender.first_name, msg.sender.last_name)
                          : 'U'}
                      </AvatarFallback>
                    </Avatar>
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
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setIsServicesDialogOpen(true)}
              disabled={sending || servicesLoading}
              title="Enviar servicio"
            >
              <Briefcase className="h-4 w-4" />
            </Button>
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
                                    ? `$${service.cost.toFixed(2)}`
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
    </div>
  );
}
