"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/price-utils";
import { formatEventDate, formatEventTime } from "@/utils/date-utils";
import {
  Calendar,
  MapPin,
  Clock,
  Loader2,
  Ticket,
  ArrowRight,
  CalendarCheck,
  MessageSquarePlus,
  CheckCircle2,
  CalendarPlus,
} from "lucide-react";
import { EventFeedbackForm } from "@/components/events/event-feedback-form";

interface EventInfo {
  id: string;
  name: string;
  slug?: string | null;
  event_date: string;
  event_time: string;
  end_date?: string | null;
  end_time?: string | null;
  location: string;
  image_url?: string | null;
  gallery_images?: string[] | null;
  is_free: boolean;
  price?: number | null;
}

interface RegistrationWithEvent {
  id: string;
  event_id: string;
  status: string;
  confirmation_code?: string | null;
  registration_date: string;
  events_workshops: EventInfo | null;
}

function getStatusBadge(status: string) {
  const variants: Record<string, { label: string; className: string }> = {
    pending: { label: "Pendiente", className: "bg-amber-100 text-amber-800 border-amber-200" },
    confirmed: { label: "Confirmado", className: "bg-green-100 text-green-800 border-green-200" },
    cancelled: { label: "Cancelado", className: "bg-red-100 text-red-800 border-red-200" },
    completed: { label: "Completado", className: "bg-slate-100 text-slate-800 border-slate-200" },
  };
  const v = variants[status] || { label: status, className: "bg-muted" };
  return <Badge variant="outline" className={v.className}>{v.label}</Badge>;
}

function getEventSlug(event: EventInfo | null): string {
  if (!event) return "";
  return event.slug || event.id;
}

export default function MyRegistrationsPage() {
  useUserStoreInit();
  const userId = useUserId();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<RegistrationWithEvent[]>([]);
  const [feedbackGivenIds, setFeedbackGivenIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");
  const [feedbackDialog, setFeedbackDialog] = useState<{
    eventId: string;
    eventName: string;
    eventRegistrationId: string;
  } | null>(null);

  useEffect(() => {
    if (!userId) return;
    fetchRegistrations();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const fetchFeedbackIds = async () => {
      const { data } = await supabase
        .from("event_feedback")
        .select("event_registration_id")
        .eq("user_id", userId);
      setFeedbackGivenIds(
        new Set((data || []).map((r: { event_registration_id: string }) => r.event_registration_id))
      );
    };
    fetchFeedbackIds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("event_registrations")
        .select(
          `
          id,
          event_id,
          status,
          confirmation_code,
          registration_date,
          events_workshops (
            id,
            name,
            slug,
            event_date,
            event_time,
            end_date,
            end_time,
            location,
            image_url,
            gallery_images,
            is_free,
            price
          )
        `
        )
        .eq("user_id", userId)
        .order("registration_date", { ascending: false });

      if (error) throw error;

      const list = (data || []).map((r: any) => ({
        ...r,
        events_workshops: Array.isArray(r.events_workshops)
          ? r.events_workshops[0]
          : r.events_workshops,
      }));
      setRegistrations(list);
    } catch (error) {
      console.error("Error fetching registrations:", error);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const upcoming = registrations.filter((r) => {
    const ev = r.events_workshops;
    if (!ev?.event_date) return false;
    const [y, m, d] = ev.event_date.split("-").map(Number);
    const eventDate = new Date(y, m - 1, d);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate >= now && r.status !== "cancelled";
  });

  const past = registrations.filter((r) => {
    const ev = r.events_workshops;
    if (!ev?.event_date) return true;
    const [y, m, d] = ev.event_date.split("-").map(Number);
    const eventDate = new Date(y, m - 1, d);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate < now || r.status === "cancelled";
  });

  const filtered =
    filter === "upcoming" ? upcoming : filter === "past" ? past : registrations;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mis inscripciones</h1>
        <p className="text-muted-foreground">
          Eventos en los que te has inscrito. Aquí puedes ver fecha, lugar y tu código de confirmación.
        </p>
      </div>

      {registrations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CalendarCheck className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Sin inscripciones</h3>
            <p className="text-muted-foreground text-center mb-6">
              Aún no te has inscrito a ningún evento. Explora los eventos disponibles y regístrate.
            </p>
            <Button asChild>
              <Link href="/explore/events">
                Explorar eventos
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex gap-2 mb-6">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              Todos ({registrations.length})
            </Button>
            <Button
              variant={filter === "upcoming" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("upcoming")}
            >
              Próximos ({upcoming.length})
            </Button>
            <Button
              variant={filter === "past" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("past")}
            >
              Pasados ({past.length})
            </Button>
          </div>

          <div className="space-y-4">
            {filtered.map((reg) => {
              const event = reg.events_workshops;
              if (!event) return null;

              const slug = getEventSlug(event);
              const eventUrl = slug ? `/explore/event/${slug}` : "#";
              const imgSrc =
                event.image_url ||
                (Array.isArray(event.gallery_images) && event.gallery_images[0]
                  ? event.gallery_images[0]
                  : null);

              const isPast = (() => {
                if (!event.event_date) return true;
                const [y, m, d] = event.event_date.split("-").map(Number);
                const eventDate = new Date(y, m - 1, d);
                eventDate.setHours(0, 0, 0, 0);
                return eventDate < now;
              })();
              const canGiveFeedback =
                isPast && reg.status === "confirmed" && !feedbackGivenIds.has(reg.id);
              const alreadyGaveFeedback =
                isPast && reg.status === "confirmed" && feedbackGivenIds.has(reg.id);

              return (
                <Card key={reg.id} className="overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    <Link href={eventUrl} className="flex flex-1 min-w-0">
                      {imgSrc && (
                        <div className="relative w-full sm:w-48 h-36 sm:h-auto shrink-0 bg-muted">
                          <Image
                            src={imgSrc}
                            alt={event.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, 192px"
                          />
                        </div>
                      )}
                      <div className="flex-1 p-4 sm:p-6">
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                          <CardTitle className="text-lg">{event.name}</CardTitle>
                          {getStatusBadge(reg.status)}
                        </div>
                        <div className="space-y-1.5 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 shrink-0" />
                            <span>{formatEventDate(event.event_date)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 shrink-0" />
                            <span>
                              {formatEventTime(event.event_time)}
                              {event.end_time
                                ? ` - ${formatEventTime(event.end_time)}`
                                : ""}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 shrink-0" />
                            <span className="line-clamp-1">{event.location}</span>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          {reg.confirmation_code && reg.status === "confirmed" && (
                            <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5">
                              <Ticket className="h-4 w-4 text-muted-foreground" />
                              <span className="font-mono text-sm font-medium">
                                {reg.confirmation_code}
                              </span>
                            </div>
                          )}
                          {!event.is_free && event.price != null && (
                            <Badge variant="outline">
                              {formatPrice(event.price, "MXN")}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            Inscrito:{" "}
                            {new Date(reg.registration_date).toLocaleDateString("es-ES", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </Link>
                    <div className="flex flex-col items-center justify-center gap-2 p-4 sm:p-6 shrink-0 border-t sm:border-t-0 sm:border-l">
                      <Link
                        href={`/api/events/${event.id}/calendar`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 gap-1.5"
                      >
                        <CalendarPlus className="h-4 w-4" />
                        Añadir al calendario
                      </Link>
                      <Link href={eventUrl} className="text-muted-foreground hover:text-foreground">
                        <ArrowRight className="h-5 w-5" />
                      </Link>
                    </div>
                  </div>
                  {canGiveFeedback && (
                    <div className="border-t px-4 sm:px-6 py-3 flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          setFeedbackDialog({
                            eventId: event.id,
                            eventName: event.name,
                            eventRegistrationId: reg.id,
                          });
                        }}
                      >
                        <MessageSquarePlus className="h-4 w-4 mr-2" />
                        Dejar feedback
                      </Button>
                    </div>
                  )}
                  {alreadyGaveFeedback && (
                    <div className="border-t px-4 sm:px-6 py-3">
                      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Gracias por tu feedback
                      </Badge>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {feedbackDialog && (
            <EventFeedbackForm
              eventId={feedbackDialog.eventId}
              eventName={feedbackDialog.eventName}
              eventRegistrationId={feedbackDialog.eventRegistrationId}
              open={!!feedbackDialog}
              onOpenChange={(open) => !open && setFeedbackDialog(null)}
              onSuccess={() => {
                setFeedbackGivenIds((prev) =>
                  new Set(prev).add(feedbackDialog.eventRegistrationId)
                );
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
