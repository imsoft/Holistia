"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare } from "lucide-react";
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

export default function ProfessionalMessagesPage() {
  const params = useParams();
  const router = useRouter();
  const professionalId = params.id as string;
  const supabase = createClient();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadConversations();
      // Polling para actualizar conversaciones cada 5 segundos
      const interval = setInterval(loadConversations, 5000);
      return () => clearInterval(interval);
    }
  }, [currentUserId]);

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

  if (loading || !currentUserId) {
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
          Conversaciones con pacientes
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
                  <p className="text-sm text-muted-foreground">
                    Los pacientes pueden enviarte mensajes desde tu perfil
                  </p>
                </div>
              ) : (
                <div className="overflow-y-auto flex-1">
                  {conversations.map((conversation) => {
                    // Para profesionales, siempre mostrar info del usuario (paciente)
                    const otherUser = {
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
          {selectedConversation && currentUserId ? (
            <Card className="h-full flex flex-col">
              <CardContent className="p-0 flex flex-col h-full">
                <DirectMessageChat
                  conversationId={selectedConversation.id}
                  currentUserId={currentUserId}
                  otherUser={{
                    id: selectedConversation.user_id,
                    name: selectedConversation.user
                      ? `${selectedConversation.user.first_name} ${selectedConversation.user.last_name}`
                      : 'Usuario',
                    avatar_url: selectedConversation.user?.avatar_url || null,
                  }}
                />
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
