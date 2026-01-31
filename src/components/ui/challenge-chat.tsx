"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface ChallengeMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    email: string;
  };
}

interface ChallengeChatProps {
  challengeId: string;
  currentUserId: string;
}

export function ChallengeChat({ challengeId, currentUserId }: ChallengeChatProps) {
  const [messages, setMessages] = useState<ChallengeMessage[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (challengeId) {
      loadConversation();
    }
  }, [challengeId]);

  useEffect(() => {
    if (conversationId) {
      loadMessages();
      subscribeToMessages();
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversation = async () => {
    try {
      // Buscar o crear conversación
      const { data: existingConv } = await supabase
        .from("challenge_conversations")
        .select("id")
        .eq("challenge_id", challengeId)
        .maybeSingle();

      if (existingConv) {
        setConversationId(existingConv.id);
      } else {
        // Crear conversación si no existe
        const { data: newConv, error } = await supabase
          .from("challenge_conversations")
          .insert({ challenge_id: challengeId })
          .select()
          .single();

        if (error && error.code !== "23505") {
          // Ignorar error de duplicado (puede haber sido creado por otro usuario)
          console.error("Error creating conversation:", error);
        } else if (newConv) {
          setConversationId(newConv.id);
        } else {
          // Intentar obtener la conversación nuevamente
          const { data: conv } = await supabase
            .from("challenge_conversations")
            .select("id")
            .eq("challenge_id", challengeId)
            .maybeSingle();
          if (conv) setConversationId(conv.id);
        }
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!conversationId) return;

    try {
      // Obtener mensajes sin join a profiles (sender_id referencia auth.users, no hay FK a profiles)
      const { data: messagesData, error } = await supabase
        .from("challenge_messages")
        .select("id, sender_id, content, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const messagesList = messagesData || [];
      if (messagesList.length === 0) {
        setMessages([]);
        return;
      }

      // Obtener perfiles de los remitentes por separado
      const senderIds = [...new Set(messagesList.map((m: { sender_id: string }) => m.sender_id).filter(Boolean))];
      let profilesMap = new Map<string, { id: string; first_name: string | null; last_name: string | null; avatar_url: string | null; email: string }>();

      if (senderIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, avatar_url, email")
          .in("id", senderIds);
        (profilesData || []).forEach((p) => {
          profilesMap.set(p.id, {
            id: p.id,
            first_name: p.first_name ?? null,
            last_name: p.last_name ?? null,
            avatar_url: p.avatar_url ?? null,
            email: p.email ?? "",
          });
        });
      }

      setMessages(
        messagesList.map((msg: any) => {
          const profile = profilesMap.get(msg.sender_id);
          return {
            id: msg.id,
            sender_id: msg.sender_id,
            content: msg.content,
            created_at: msg.created_at,
            sender: profile
              ? {
                  id: profile.id,
                  first_name: profile.first_name,
                  last_name: profile.last_name,
                  avatar_url: profile.avatar_url,
                  email: profile.email,
                }
              : undefined,
          };
        })
      );
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Error al cargar mensajes");
    }
  };

  const subscribeToMessages = () => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`challenge_messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "challenge_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Obtener información del remitente
          const { data: sender } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, avatar_url, email")
            .eq("id", payload.new.sender_id)
            .single();

          const newMessage: ChallengeMessage = {
            id: payload.new.id,
            sender_id: payload.new.sender_id,
            content: payload.new.content,
            created_at: payload.new.created_at,
            sender: sender
              ? {
                  id: sender.id,
                  first_name: sender.first_name,
                  last_name: sender.last_name,
                  avatar_url: sender.avatar_url,
                  email: sender.email,
                }
              : undefined,
          };

          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !conversationId || sending) return;

    try {
      setSending(true);
      const { error } = await supabase.from("challenge_messages").insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: message.trim(),
      });

      if (error) throw error;

      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Error al enviar mensaje");
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const getSenderName = (message: ChallengeMessage) => {
    if (message.sender) {
      if (message.sender.first_name && message.sender.last_name) {
        return `${message.sender.first_name} ${message.sender.last_name}`;
      }
      return message.sender.email.split("@")[0];
    }
    return "Usuario";
  };

  const getSenderInitials = (message: ChallengeMessage) => {
    if (message.sender) {
      if (message.sender.first_name && message.sender.last_name) {
        return `${message.sender.first_name[0]}${message.sender.last_name[0]}`;
      }
      return message.sender.email[0].toUpperCase();
    }
    return "U";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!conversationId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No se pudo cargar la conversación
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 rounded-lg border bg-card overflow-hidden">
      {/* Mensajes */}
      <ScrollArea className="flex-1 min-h-0 pr-4" ref={scrollRef}>
        <div className="space-y-4 p-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay mensajes aún. ¡Sé el primero en escribir!
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.sender_id === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage
                      src={msg.sender?.avatar_url || undefined}
                    />
                    <AvatarFallback className="text-xs">
                      {getSenderInitials(msg)}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`flex flex-col max-w-[70%] ${
                      isOwn ? "items-end" : "items-start"
                    }`}
                  >
                    {!isOwn && (
                      <p className="text-xs font-medium mb-1">
                        {getSenderName(msg)}
                      </p>
                    )}
                    <div
                      className={`rounded-lg px-3 py-2 ${
                        isOwn
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(msg.created_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Input y botón dentro del mismo contenedor */}
      <div className="shrink-0 flex gap-2 p-3 border-t bg-background">
        <Input
          placeholder="Escribe un mensaje..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          disabled={sending}
          className="flex-1 min-w-0"
        />
        <Button
          onClick={handleSendMessage}
          disabled={!message.trim() || sending}
          size="icon"
          className="shrink-0"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
