"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Send,
  Smile,
  MoreVertical,
  Edit2,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { TypingIndicator } from "@/components/ui/typing-indicator";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface TeamMessage {
  id: string;
  team_id: string;
  sender_id: string;
  message_type: string;
  content: string;
  metadata: any;
  reply_to_id: string | null;
  is_edited: boolean;
  edited_at: string | null;
  created_at: string;
  sender_first_name: string;
  sender_last_name: string;
  sender_avatar_url: string | null;
  reactions: Record<string, number> | null;
  total_reactions: number;
  read_count: number;
  user_reaction: string | null;
}

interface TeamChatProps {
  teamId: string;
  currentUserId: string;
  teamName?: string;
}

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '💪'];

export function TeamChat({ teamId, currentUserId, teamName }: TeamChatProps) {
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(true);

  useEffect(() => {
    loadMessages();

    // Auto-refresh cada 5 segundos
    const interval = setInterval(() => {
      loadMessages(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [teamId]);

  useEffect(() => {
    // Auto-scroll al final cuando hay nuevos mensajes
    if (shouldScrollRef.current) {
      scrollToBottom();
    }
  }, [messages]);

  const loadMessages = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      const response = await fetch(`/api/teams/${teamId}/messages?limit=50`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Error al cargar mensajes");

      setMessages(data.data || []);
      setHasMore(data.hasMore || false);

      // Marcar mensajes como leídos
      const unreadMessageIds = (data.data || [])
        .filter((m: TeamMessage) => m.sender_id !== currentUserId)
        .map((m: TeamMessage) => m.id);

      if (unreadMessageIds.length > 0) {
        markAsRead(unreadMessageIds);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Error al cargar mensajes");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const markAsRead = async (messageIds: string[]) => {
    try {
      await fetch(`/api/teams/${teamId}/messages/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageIds }),
      });
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) return;

    try {
      setSending(true);
      shouldScrollRef.current = true;

      const response = await fetch(`/api/teams/${teamId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: message.trim(),
          messageType: "user_message",
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Error al enviar mensaje");

      setMessages((prev) => [...prev, data.data]);
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Error al enviar mensaje");
    } finally {
      setSending(false);
    }
  };

  const handleEditMessage = async (messageId: string) => {
    if (!editContent.trim()) return;

    try {
      const response = await fetch(`/api/teams/${teamId}/messages`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId,
          content: editContent.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Error al editar mensaje");

      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, ...data.data } : m))
      );
      setEditingMessageId(null);
      setEditContent("");
      toast.success("Mensaje editado");
    } catch (error) {
      console.error("Error editing message:", error);
      toast.error("Error al editar mensaje");
    }
  };

  const handleDeleteMessage = async () => {
    if (!messageToDelete) return;

    try {
      const response = await fetch(
        `/api/teams/${teamId}/messages?messageId=${messageToDelete}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al eliminar mensaje");
      }

      setMessages((prev) => prev.filter((m) => m.id !== messageToDelete));
      toast.success("Mensaje eliminado");
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Error al eliminar mensaje");
    } finally {
      setDeleteDialogOpen(false);
      setMessageToDelete(null);
    }
  };

  const handleReaction = async (messageId: string, emoji: string, remove = false) => {
    try {
      const url = `/api/teams/${teamId}/messages/reactions${
        remove ? `?messageId=${messageId}&emoji=${encodeURIComponent(emoji)}` : ""
      }`;

      const response = await fetch(url, {
        method: remove ? "DELETE" : "POST",
        headers: remove ? {} : { "Content-Type": "application/json" },
        body: remove ? undefined : JSON.stringify({ messageId, emoji }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status !== 409) { // Ignorar error de reacción duplicada
          throw new Error(data.error);
        }
        return;
      }

      // Actualizar estado local
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === messageId) {
            const reactions = { ...(m.reactions || {}) };

            if (remove) {
              reactions[emoji] = Math.max((reactions[emoji] || 0) - 1, 0);
              if (reactions[emoji] === 0) delete reactions[emoji];
            } else {
              reactions[emoji] = (reactions[emoji] || 0) + 1;
            }

            return {
              ...m,
              reactions: Object.keys(reactions).length > 0 ? reactions : null,
              total_reactions: remove ? m.total_reactions - 1 : m.total_reactions + 1,
              user_reaction: remove ? null : emoji,
            };
          }
          return m;
        })
      );
    } catch (error) {
      console.error("Error toggling reaction:", error);
      toast.error("Error al reaccionar");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const groupMessagesByDate = (messages: TeamMessage[]) => {
    const groups: { date: string; messages: TeamMessage[] }[] = [];
    let currentDate = "";

    messages.forEach((message) => {
      const messageDate = new Date(message.created_at).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      if (messageDate !== currentDate) {
        currentDate = messageDate;
        groups.push({ date: messageDate, messages: [message] });
      } else {
        groups[groups.length - 1].messages.push(message);
      }
    });

    return groups;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col h-[600px] bg-card rounded-lg border border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h3 className="font-semibold">Chat del Equipo</h3>
          {teamName && (
            <p className="text-sm text-muted-foreground">{teamName}</p>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messageGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              {/* Date separator */}
              <div className="flex items-center justify-center my-4">
                <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                  {group.date}
                </div>
              </div>

              {/* Messages */}
              <AnimatePresence>
                {group.messages.map((msg, index) => {
                  const isOwnMessage = msg.sender_id === currentUserId;
                  const isSystemMessage = msg.message_type === "system_message";
                  const isEditing = editingMessageId === msg.id;

                  // Mensaje del sistema
                  if (isSystemMessage) {
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex justify-center my-2"
                      >
                        <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                          {msg.content}
                        </div>
                      </motion.div>
                    );
                  }

                  // Mensaje de usuario
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={cn(
                        "flex gap-3",
                        isOwnMessage && "flex-row-reverse"
                      )}
                    >
                      {/* Avatar */}
                      {!isOwnMessage && (
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={msg.sender_avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {getUserInitials(msg.sender_first_name, msg.sender_last_name)}
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div className={cn("flex-1 max-w-[70%]", isOwnMessage && "flex flex-col items-end")}>
                        {/* Nombre del remitente */}
                        {!isOwnMessage && (
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            {msg.sender_first_name} {msg.sender_last_name}
                          </p>
                        )}

                        {/* Bubble del mensaje */}
                        <div
                          className={cn(
                            "rounded-lg px-4 py-2 relative group",
                            isOwnMessage
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}
                        >
                          {isEditing ? (
                            <div className="space-y-2">
                              <Input
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleEditMessage(msg.id);
                                  }
                                  if (e.key === "Escape") {
                                    setEditingMessageId(null);
                                    setEditContent("");
                                  }
                                }}
                                className="h-8"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleEditMessage(msg.id)}
                                >
                                  Guardar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingMessageId(null);
                                    setEditContent("");
                                  }}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {msg.content}
                              </p>

                              {/* Opciones del mensaje (solo propios) */}
                              {isOwnMessage && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <MoreVertical className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setEditingMessageId(msg.id);
                                        setEditContent(msg.content);
                                      }}
                                    >
                                      <Edit2 className="h-4 w-4 mr-2" />
                                      Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setMessageToDelete(msg.id);
                                        setDeleteDialogOpen(true);
                                      }}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Eliminar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </>
                          )}
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(msg.created_at), {
                              addSuffix: true,
                              locale: es,
                            })}
                            {msg.is_edited && " (editado)"}
                          </span>
                        </div>

                        {/* Reacciones */}
                        {(msg.reactions || msg.user_reaction) && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {msg.reactions &&
                              Object.entries(msg.reactions).map(([emoji, count]) => (
                                <button
                                  key={emoji}
                                  onClick={() =>
                                    handleReaction(
                                      msg.id,
                                      emoji,
                                      msg.user_reaction === emoji
                                    )
                                  }
                                  className={cn(
                                    "flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors",
                                    msg.user_reaction === emoji
                                      ? "bg-primary/20 border border-primary"
                                      : "bg-muted hover:bg-muted/80 border border-transparent"
                                  )}
                                >
                                  <span>{emoji}</span>
                                  <span className="font-medium">{count}</span>
                                </button>
                              ))}
                          </div>
                        )}

                        {/* Selector de emojis */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity mt-1"
                            >
                              <Smile className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <div className="grid grid-cols-4 gap-1 p-2">
                              {EMOJIS.map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={() =>
                                    handleReaction(
                                      msg.id,
                                      emoji,
                                      msg.user_reaction === emoji
                                    )
                                  }
                                  className="text-2xl hover:scale-125 transition-transform p-1"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <form
        onSubmit={handleSendMessage}
        className="p-4 border-t border-border flex gap-2"
      >
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escribe un mensaje..."
          disabled={sending}
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={sending || !message.trim()}>
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>

      {/* Delete confirmation */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteMessage}
        title="¿Eliminar mensaje?"
        description="Este mensaje se eliminará permanentemente. Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
      />
    </div>
  );
}
