"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { DirectMessageChat } from "@/components/ui/direct-message-chat";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserId, useUserType, useProfessionalData } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";

interface Conversation {
  id: string;
  user_id: string;
  professional_id: string;
  last_message_at: string;
  last_message_preview: string | null;
  user_unread_count: number;
  professional_unread_count: number;
  created_at: string;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  professional?: {
    id: string;
    first_name: string;
    last_name: string;
    profile_photo: string | null;
  };
}

function MessagesPageContent() {
  useUserStoreInit(); // Inicializar store de Zustand
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = useUserId(); // Obtener userId del store
  const userType = useUserType(); // Obtener tipo de usuario del store
  const professionalData = useProfessionalData(); // Obtener datos del profesional
  const supabase = createClient();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isProfessional, setIsProfessional] = useState(false);
  const [professionalId, setProfessionalId] = useState<string | null>(null);

  // Verificar si el usuario es profesional
  useEffect(() => {
    const checkIfProfessional = async () => {
      if (!userId) return;

      // Verificar si es profesional por tipo de usuario
      if (userType === 'professional' && professionalData?.professional_id) {
        setIsProfessional(true);
        setProfessionalId(professionalData.professional_id);
        return;
      }

      // Si no está en el store, verificar directamente en la base de datos
      try {
        const { data: professionalApp } = await supabase
          .from('professional_applications')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'approved')
          .maybeSingle();

        if (professionalApp) {
          setIsProfessional(true);
          setProfessionalId(professionalApp.id);
        }
      } catch (error) {
        console.error('Error checking professional status:', error);
      }
    };

    checkIfProfessional();
  }, [userId, userType, professionalData, supabase]);

  useEffect(() => {
    if (!userId) return; // Esperar a que userId esté disponible
    loadConversations();
    // Polling para actualizar conversaciones cada 5 segundos
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, [userId]);
  
  // No renderizar si no hay userId
  if (!userId) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          <div className="lg:col-span-1">
            <Card className="h-full flex flex-col">
              <CardContent className="p-0 flex flex-col h-full">
                <div className="overflow-y-auto flex-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="p-4 border-b">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                        <div className="flex-1 min-w-0 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2">
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center p-8">
                <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
                <Skeleton className="h-6 w-48 mx-auto mb-2" />
                <Skeleton className="h-4 w-64 mx-auto" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Abrir conversación desde parámetro de URL
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    if (conversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation) {
        setSelectedConversation(conversation);
        // Limpiar el parámetro de la URL después de abrir la conversación
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.delete('conversation');
        const newUrl = newSearchParams.toString() 
          ? `${window.location.pathname}?${newSearchParams.toString()}`
          : window.location.pathname;
        router.replace(newUrl);
      }
    }
  }, [conversations, searchParams, router]);

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/messages/conversations');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar conversaciones');
      }

      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
      if (loading) {
        toast.error('Error al cargar conversaciones');
      }
    } finally {
      setLoading(false);
    }
  };

  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };


  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Lista de conversaciones skeleton */}
          <div className="lg:col-span-1">
            <Card className="h-full flex flex-col">
              <CardContent className="p-0 flex flex-col h-full">
                <div className="overflow-y-auto flex-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="p-4 border-b">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                        <div className="flex-1 min-w-0 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat skeleton */}
          <div className="lg:col-span-2">
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center p-8">
                <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
                <Skeleton className="h-6 w-48 mx-auto mb-2" />
                <Skeleton className="h-4 w-64 mx-auto" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
          <MessageSquare className="h-8 w-8" />
          Mensajes
        </h1>
        <p className="text-muted-foreground">
          {isProfessional ? 'Conversa con pacientes' : 'Conversa con expertos'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Lista de conversaciones */}
        <div className={`lg:col-span-1 ${selectedConversation ? 'hidden lg:block' : ''}`}>
          <Card className="h-full flex flex-col">
            <CardContent className="p-0 flex flex-col h-full">
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No tienes conversaciones</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Envía un mensaje a un experto para comenzar
                  </p>
                  <Button onClick={() => router.push(`/explore/professionals`)}>
                    Explorar Expertos
                  </Button>
                </div>
              ) : (
                <div className="overflow-y-auto flex-1">
                  {conversations.map((conversation) => {
                    const otherUser = conversation.user_id === userId
                      ? {
                          id: conversation.professional_id,
                          name: conversation.professional
                            ? `${conversation.professional.first_name} ${conversation.professional.last_name}`
                            : 'Experto',
                          avatar_url: conversation.professional?.profile_photo || null,
                          unreadCount: conversation.user_unread_count,
                          isProfessional: true, // El otro usuario es profesional
                        }
                      : {
                          id: conversation.user_id,
                          name: conversation.user
                            ? `${conversation.user.first_name} ${conversation.user.last_name}`
                            : 'Usuario',
                          avatar_url: conversation.user?.avatar_url || null,
                          unreadCount: conversation.professional_unread_count,
                          isProfessional: false, // El otro usuario es paciente
                        };

                    return (
                      <div
                        key={conversation.id}
                        className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                          selectedConversation?.id === conversation.id ? 'bg-muted' : ''
                        }`}
                        onClick={() => setSelectedConversation(conversation)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12 shrink-0">
                            <AvatarImage src={otherUser.avatar_url || undefined} />
                            <AvatarFallback>
                              {otherUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <h3 className="font-semibold text-sm truncate">
                                  {otherUser.name}
                                </h3>
                                <Badge 
                                  variant={otherUser.isProfessional ? "default" : "secondary"}
                                  className="shrink-0 text-xs"
                                >
                                  {otherUser.isProfessional ? "Experto" : "Paciente"}
                                </Badge>
                              </div>
                              {otherUser.unreadCount > 0 && (
                                <Badge variant="default" className="ml-2 shrink-0">
                                  {otherUser.unreadCount}
                                </Badge>
                              )}
                            </div>
                            {conversation.last_message_preview && (
                              <p className="text-xs text-muted-foreground truncate">
                                {conversation.last_message_preview}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(conversation.last_message_at), {
                                addSuffix: true,
                                locale: es,
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat */}
        <div className={`lg:col-span-2 ${selectedConversation ? '' : 'hidden lg:block'}`}>
          {selectedConversation ? (
            <Card className="h-full flex flex-col">
              <CardContent className="p-0 flex flex-col h-full">
                {(() => {
                  const otherUser = selectedConversation.user_id === userId
                    ? {
                        id: selectedConversation.professional_id,
                        name: selectedConversation.professional
                          ? `${selectedConversation.professional.first_name} ${selectedConversation.professional.last_name}`
                          : 'Profesional',
                        avatar_url: selectedConversation.professional?.profile_photo || null,
                        isProfessional: true, // El otro usuario es profesional
                      }
                    : {
                        id: selectedConversation.user_id,
                        name: selectedConversation.user
                          ? `${selectedConversation.user.first_name} ${selectedConversation.user.last_name}`
                          : 'Usuario',
                        avatar_url: selectedConversation.user?.avatar_url || null,
                        isProfessional: false, // El otro usuario es paciente
                      };

                  // Determinar professionalId: si el usuario actual es profesional, usar su professionalId
                  // Si el otro usuario es profesional, usar el professionalId de la conversación
                  const currentUserProfessionalId = isProfessional && professionalId 
                    ? professionalId 
                    : selectedConversation.user_id === userId 
                      ? selectedConversation.professional_id 
                      : null;

                  return (
                    <DirectMessageChat
                      conversationId={selectedConversation.id}
                      currentUserId={userId || ''}
                      otherUser={otherUser}
                      professionalId={currentUserProfessionalId || undefined}
                      isProfessional={isProfessional}
                    />
                  );
                })()}
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center p-8">
                <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Selecciona una conversación</h3>
                <p className="text-sm text-muted-foreground">
                  Elige una conversación de la lista para ver los mensajes
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          <div className="lg:col-span-1">
            <Card className="h-full flex flex-col">
              <CardContent className="p-0 flex flex-col h-full">
                <div className="overflow-y-auto flex-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="p-4 border-b">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                        <div className="flex-1 min-w-0 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2">
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center p-8">
                <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
                <Skeleton className="h-6 w-48 mx-auto mb-2" />
                <Skeleton className="h-4 w-64 mx-auto" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    }>
      <MessagesPageContent />
    </Suspense>
  );
}
