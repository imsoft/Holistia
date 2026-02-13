"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, MessageSquare, Users } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { DirectMessageChat } from "@/components/ui/direct-message-chat";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserId, useProfessionalData } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";
import { SidebarTrigger } from "@/components/ui/sidebar";

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

function ConsultationsPageContent() {
  useUserStoreInit();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = useUserId();
  const professionalData = useProfessionalData();
  const supabase = createClient();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [professionalId, setProfessionalId] = useState<string | null>(null);

  // Obtener professionalId
  useEffect(() => {
    const getProfessionalId = async () => {
      if (!userId) return;

      if (professionalData?.professional_id) {
        setProfessionalId(professionalData.professional_id);
        return;
      }

      try {
        const { data: professionalApp } = await supabase
          .from('professional_applications')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'approved')
          .maybeSingle();

        if (professionalApp) {
          setProfessionalId(professionalApp.id);
        }
      } catch (error) {
        console.error('Error checking professional status:', error);
      }
    };

    getProfessionalId();
  }, [userId, professionalData, supabase]);

  useEffect(() => {
    if (!userId || !professionalId) return;
    loadConversations();
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, [userId, professionalId]);

  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    if (conversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation) {
        setSelectedConversation(conversation);
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

  if (loading) {
    return (
      <div className="professional-page-content">
        <div className="mb-8">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 min-h-[62dvh] lg:h-[calc(100dvh-18rem)]">
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

  return (
    <div className="professional-page-shell">
      {/* Header */}
      <div className="professional-page-header w-full">
        <div className="professional-page-header-inner professional-page-header-inner-row w-full">
          <div className="flex items-center gap-3 sm:gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                Consultas
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Mensajes de tus pacientes y prospectos
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="professional-page-content">

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 min-h-[62dvh] lg:h-[calc(100dvh-18rem)]">
        <div className={`lg:col-span-1 ${selectedConversation ? 'hidden lg:block' : ''}`}>
          <Card className="h-full flex flex-col">
            <CardContent className="p-0 flex flex-col h-full">
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No tienes consultas</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Los mensajes de tus pacientes aparecerán aquí
                  </p>
                </div>
              ) : (
                <div className="overflow-y-auto flex-1">
                  {conversations.map((conversation) => {
                    const patient = conversation.user;

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
                            <AvatarImage src={patient?.avatar_url || undefined} />
                            <AvatarFallback>
                              {patient?.first_name?.[0] || ''}{patient?.last_name?.[0] || ''}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <h3 className="font-semibold text-sm truncate">
                                  {patient ? `${patient.first_name} ${patient.last_name}` : 'Paciente'}
                                </h3>
                                <Badge variant="secondary" className="shrink-0 text-xs">
                                  Paciente
                                </Badge>
                              </div>
                              {conversation.professional_unread_count > 0 && (
                                <Badge variant="default" className="ml-2 shrink-0">
                                  {conversation.professional_unread_count}
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

        <div className={`lg:col-span-2 ${selectedConversation ? '' : 'hidden lg:block'}`}>
          {selectedConversation && (
            <Button
              variant="outline"
              size="sm"
              className="mb-2 lg:hidden"
              onClick={() => setSelectedConversation(null)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a conversaciones
            </Button>
          )}
          {selectedConversation ? (
            <Card className="h-full flex flex-col">
              <CardContent className="p-0 flex flex-col h-full">
                {(() => {
                  const patient = selectedConversation.user;
                  const otherUser = {
                    id: selectedConversation.user_id,
                    name: patient
                      ? `${patient.first_name} ${patient.last_name}`
                      : 'Paciente',
                    avatar_url: patient?.avatar_url || null,
                    isProfessional: false,
                  };

                  return (
                    <DirectMessageChat
                      conversationId={selectedConversation.id}
                      currentUserId={userId || ''}
                      otherUser={otherUser}
                      professionalId={professionalId || undefined}
                      isProfessional={true}
                    />
                  );
                })()}
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center p-8">
                <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Selecciona una consulta</h3>
                <p className="text-sm text-muted-foreground">
                  Elige una conversación de la lista para ver los mensajes
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

export default function ConsultationsPage() {
  return (
    <Suspense fallback={
      <div className="professional-page-content">
        <div className="mb-8">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 min-h-[62dvh] lg:h-[calc(100dvh-18rem)]">
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
      <ConsultationsPageContent />
    </Suspense>
  );
}
