"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  Bell,
  Check,
  CheckCheck,
  Flame,
  Heart,
  Loader2,
  MessageCircle,
  Trash2,
  Trophy,
  UserPlus,
  Users,
  X,
  CalendarClock,
  CalendarCheck,
  CalendarX,
  CalendarPlus,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  action_url: string | null;
  metadata: Record<string, unknown> | null;
  related_user_first_name: string | null;
  related_user_last_name: string | null;
  related_user_avatar: string | null;
  created_at: string;
}

type NotificationsApiResponse = {
  data?: NotificationItem[];
  unreadCount?: number;
  hasMore?: boolean;
  count?: number;
  error?: string;
};

const notificationIcons: Record<string, LucideIcon> = {
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
};

function getIcon(type: string) {
  return notificationIcons[type] ?? Bell;
}

function getColorClass(type: string) {
  return notificationColors[type] ?? "text-gray-500 bg-gray-50";
}

function getUserInitials(notification: NotificationItem) {
  if (!notification.related_user_first_name) return "?";
  return `${notification.related_user_first_name.charAt(0)}${
    notification.related_user_last_name?.charAt(0) || ""
  }`.toUpperCase();
}

export function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const pageSize = 20;

  const offset = useMemo(() => notifications.length, [notifications.length]);
  const clientUnreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  );
  const displayUnreadCount = Math.max(unreadCount, clientUnreadCount);

  const loadNotifications = async (opts?: { reset?: boolean }) => {
    const reset = Boolean(opts?.reset);
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const currentOffset = reset ? 0 : offset;
      const response = await fetch(
        `/api/notifications?limit=${pageSize}&offset=${currentOffset}`
      );
      const data = (await response.json()) as NotificationsApiResponse;

      if (!response.ok) {
        toast.error(data.error || "No se pudieron cargar las notificaciones");
        return;
      }

      const next = data.data ?? [];
      const nextList = reset ? next : [...notifications, ...next];

      setNotifications(nextList);
      // Si el API no trae unreadCount fiable, usa el conteo local como fallback.
      const computedUnread = nextList.filter((n) => !n.is_read).length;
      setUnreadCount(typeof data.unreadCount === "number" ? data.unreadCount : computedUnread);
      setHasMore(Boolean(data.hasMore));
    } catch (error) {
      console.error("Error loading notifications:", error);
      toast.error("Error al cargar notificaciones");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadNotifications({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (displayUnreadCount === 0) return;

      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllAsRead: true }),
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
        toast.success("Todas las notificaciones marcadas como leídas");
      } else {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        toast.error(data?.error || "Error al marcar notificaciones");
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Error al marcar notificaciones");
    }
  };

  const deleteNotification = async (notification: NotificationItem) => {
    try {
      const response = await fetch(
        `/api/notifications?notificationId=${notification.id}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
        if (!notification.is_read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        toast.success("Notificación eliminada");
      } else {
        toast.error("Error al eliminar notificación");
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Error al eliminar notificación");
    }
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    if (notification.action_url) {
      router.push(notification.action_url);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
      <Card className="py-4">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones
            {displayUnreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {displayUnreadCount}
              </Badge>
            )}
          </CardTitle>
          <CardAction className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => loadNotifications({ reset: true })}>
              Actualizar
            </Button>
            <Button
              variant="ghost"
              onClick={markAllAsRead}
              disabled={displayUnreadCount === 0}
              className="gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              Marcar todas
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className="pt-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="animate-pulse space-y-4 w-full max-w-md">
                <div className="h-16 bg-muted rounded-lg" />
                <div className="h-24 bg-muted rounded-lg" />
                <div className="h-24 bg-muted rounded-lg" />
                <div className="h-24 bg-muted rounded-lg" />
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Bell className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground text-center">
                No tienes notificaciones
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <ScrollArea className="h-[520px] pr-3">
                <div className="divide-y rounded-lg border">
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
                        className={cn(
                          "p-4 hover:bg-muted/50 transition-colors cursor-pointer relative group",
                          !notification.is_read && "bg-blue-50/30"
                        )}
                      >
                        <div className="flex gap-3">
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
                              className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                                colorClass
                              )}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0 space-y-1">
                            <p className="text-sm font-medium leading-tight">
                              {notification.title}
                            </p>
                            <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground">{timeAgo}</p>
                          </div>

                          {!notification.is_read && (
                            <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1" />
                          )}

                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification);
                            }}
                            aria-label="Eliminar notificación"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {hasMore && (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => loadNotifications()}
                    disabled={loadingMore}
                  >
                    {loadingMore ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Cargar más</span>
                      </span>
                    ) : "Cargar más"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

