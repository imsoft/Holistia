"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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

export default function MessagesPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = params.id as string;
  const supabase = createClient();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    loadConversations();
    // Polling para actualizar conversaciones cada 5 segundos
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, []);

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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          Conversa con expertos
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
                  <Button onClick={() => router.push(`/patient/${userId}/explore/professionals`)}>
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
                        }
                      : {
                          id: conversation.user_id,
                          name: conversation.user
                            ? `${conversation.user.first_name} ${conversation.user.last_name}`
                            : 'Usuario',
                          avatar_url: conversation.user?.avatar_url || null,
                          unreadCount: conversation.professional_unread_count,
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
                              <h3 className="font-semibold text-sm truncate">
                                {otherUser.name}
                              </h3>
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
                      }
                    : {
                        id: selectedConversation.user_id,
                        name: selectedConversation.user
                          ? `${selectedConversation.user.first_name} ${selectedConversation.user.last_name}`
                          : 'Usuario',
                        avatar_url: selectedConversation.user?.avatar_url || null,
                      };

                  return (
                    <DirectMessageChat
                      conversationId={selectedConversation.id}
                      currentUserId={userId}
                      otherUser={otherUser}
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
