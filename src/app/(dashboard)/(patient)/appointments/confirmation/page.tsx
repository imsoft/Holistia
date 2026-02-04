"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Calendar, Clock, MapPin, Monitor, ExternalLink, Video } from "lucide-react";
import { formatPrice } from "@/lib/price-utils";

type AppointmentType = "presencial" | "online";

export default function AppointmentConfirmationPage() {
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("appointment_id");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    appointment: {
      id: string;
      appointment_date: string;
      appointment_time: string;
      duration_minutes: number;
      appointment_type: AppointmentType;
      cost: number;
      location: string | null;
      meeting_link: string | null;
      status: string;
    };
    professional: { first_name: string; last_name: string; profession: string };
  } | null>(null);

  useEffect(() => {
    if (!appointmentId) {
      setError("Falta el identificador de la cita.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Debes iniciar sesión para ver esta página.");
        setLoading(false);
        return;
      }

      const { data: appointment, error: aptError } = await supabase
        .from("appointments")
        .select("id, professional_id, appointment_date, appointment_time, duration_minutes, appointment_type, cost, location, meeting_link, status")
        .eq("id", appointmentId)
        .eq("patient_id", user.id)
        .single();

      if (aptError || !appointment) {
        setError("No se encontró la cita o no tienes permiso para verla.");
        setLoading(false);
        return;
      }

      const { data: pro, error: proError } = await supabase
        .from("professional_applications")
        .select("first_name, last_name, profession")
        .eq("id", appointment.professional_id)
        .single();

      if (proError || !pro) {
        setError("No se pudo cargar la información del profesional.");
        setLoading(false);
        return;
      }

      setData({
        appointment: {
          id: appointment.id,
          appointment_date: appointment.appointment_date,
          appointment_time: appointment.appointment_time,
          duration_minutes: appointment.duration_minutes ?? 50,
          appointment_type: appointment.appointment_type as AppointmentType,
          cost: Number(appointment.cost),
          location: appointment.location ?? null,
          meeting_link: appointment.meeting_link ?? null,
          status: appointment.status,
        },
        professional: pro,
      });
      setLoading(false);
    };

    fetchData();
  }, [appointmentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">{error ?? "Error al cargar la cita."}</p>
            <Button asChild>
              <Link href="/explore/appointments">Ver mis citas</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { appointment, professional } = data;
  const professionalName = `${professional.first_name} ${professional.last_name}`.trim();
  const dateFormatted = new Date(appointment.appointment_date + "T12:00:00").toLocaleDateString(
    "es-ES",
    { weekday: "long", year: "numeric", month: "long", day: "numeric" }
  );
  const timeFormatted = String(appointment.appointment_time).slice(0, 5);
  const isOnline = appointment.appointment_type === "online";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-2">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Cita confirmada</CardTitle>
          <p className="text-muted-foreground text-sm">
            Tu reserva y pago se han registrado correctamente. Recibirás un email con el ticket y los detalles.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <p className="font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {dateFormatted}
            </p>
            <p className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {timeFormatted} · {appointment.duration_minutes} min
            </p>
            <p className="flex items-center gap-2">
              {isOnline ? (
                <Monitor className="h-4 w-4" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
              {isOnline ? "En línea" : (appointment.location || "Por definir")}
            </p>
            <p className="text-sm text-muted-foreground">
              Con {professionalName} · {professional.profession}
            </p>
            <p className="text-sm font-medium">
              {formatPrice(appointment.cost, "MXN")} pagados
            </p>
          </div>

          {isOnline && appointment.meeting_link && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <p className="font-medium flex items-center gap-2 mb-2">
                <Video className="h-4 w-4" />
                Enlace de videollamada
              </p>
              <a
                href={appointment.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline break-all text-sm flex items-center gap-1"
              >
                {appointment.meeting_link}
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
              <p className="text-xs text-muted-foreground mt-2">
                El día de la cita usa este enlace para unirte. También lo encontrarás en el email y en Mis citas.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button asChild className="flex-1">
              <Link href="/explore/appointments" className="inline-flex items-center gap-2">
                Ver mis citas
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link href="/explore">Seguir explorando</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
