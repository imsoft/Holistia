"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  Users,
  Heart,
  MessageCircle,
  UserPlus,
  Check,
  X,
  Trophy,
  Flame,
  CheckCheck,
  Trash2,
  CalendarClock,
  CalendarCheck,
  CalendarX,
  CalendarPlus,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  action_url: string | null;
  metadata: any;
  related_user_first_name: string | null;
  related_user_last_name: string | null;
  related_user_avatar: string | null;
  created_at: string;
}

const notificationIcons: Record<string, any> = {
  invitation_accepted: Check,
  invitation_rejected: X,
  new_follower: UserPlus,
  post_like: Heart,
  post_comment: MessageCircle,
  badge_earned: Trophy,
  direct_message: MessageCircle,
  event_reminder: CalendarClock,
  event_updated: CalendarCheck,
  event_cancelled: CalendarX,
  event_spot_available: CalendarPlus,
  event_no_spot_available: CalendarX,
  appointment_reminder: CalendarClock,
};

const notificationColors: Record<string, string> = {
  invitation_accepted: "text-green-500 bg-green-50",
  invitation_rejected: "text-red-500 bg-red-50",
  new_follower: "text-purple-500 bg-purple-50",
  post_like: "text-pink-500 bg-pink-50",
  post_comment: "text-blue-500 bg-blue-50",
  badge_earned: "text-yellow-500 bg-yellow-50",
  direct_message: "text-indigo-500 bg-indigo-50",
  event_reminder: "text-sky-600 bg-sky-50",
  event_updated: "text-amber-600 bg-amber-50",
  event_cancelled: "text-red-600 bg-red-50",
  event_spot_available: "text-green-600 bg-green-50",
  event_no_spot_available: "text-slate-600 bg-slate-50",
  appointment_reminder: "text-sky-600 bg-sky-50",
};

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadNotifications();
    // Polling cada 30 segundos para nuevas notificaciones
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await fetch("/api/notifications?limit=10");
      const data = await response.json();

      if (response.ok) {
        setNotifications(data.data || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, is_read: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllAsRead: true }),
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
        toast.success("Todas las notificaciones marcadas como leídas");
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Error al marcar notificaciones");
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(
        `/api/notifications?notificationId=${notificationId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        toast.success("Notificación eliminada");
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Error al eliminar notificación");
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    if (notification.action_url) {
      setOpen(false);
      router.push(notification.action_url);
    }
  };

  const getIcon = (type: string) => {
    const Icon = notificationIcons[type] || Bell;
    return Icon;
  };

  const getColorClass = (type: string) => {
    return notificationColors[type] || "text-gray-500 bg-gray-50";
  };

  const getUserInitials = (notification: Notification) => {
    if (!notification.related_user_first_name) return "?";
    return `${notification.related_user_first_name.charAt(0)}${
      notification.related_user_last_name?.charAt(0) || ""
    }`.toUpperCase();
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px] p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">Notificaciones</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              disabled={loading}
              className="text-xs h-7"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Marcar todas
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Bell className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground text-center">
                No tienes notificaciones
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const Icon = getIcon(notification.type);
                const colorClass = getColorClass(notification.type);
                const timeAgo = formatDistanceToNow(
                  new Date(notification.created_at),
                  { addSuffix: true, locale: es }
                );

                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`
                      p-4 hover:bg-muted/50 transition-colors cursor-pointer relative group
                      ${!notification.is_read ? "bg-blue-50/30" : ""}
                    `}
                  >
                    <div className="flex gap-3">
                      {/* Avatar o Icono */}
                      {notification.related_user_avatar ||
                      notification.related_user_first_name ? (
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage
                            src={notification.related_user_avatar || undefined}
                          />
                          <AvatarFallback className="text-xs">
                            {getUserInitials(notification)}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                      )}

                      {/* Contenido */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm font-medium leading-tight">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {timeAgo}
                        </p>
                      </div>

                      {/* Indicador de no leída */}
                      {!notification.is_read && (
                        <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1" />
                      )}

                      {/* Botón eliminar */}
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2"
                        onClick={(e) => deleteNotification(notification.id, e)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full text-sm"
                onClick={() => {
                  setOpen(false);
                  router.push("/notifications");
                }}
              >
                Ver todas las notificaciones
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
