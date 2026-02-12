import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendAppointmentReminderEmail } from "@/lib/email-sender";
import { wallClockToUtcMs } from "@/lib/availability";

const MS_24H = 24 * 60 * 60 * 1000;
const MS_1H = 60 * 60 * 1000;
const WINDOW_MINUTES = 35; // ventana de ~35 min para que el cron horario no se pierda citas

/**
 * Convierte appointment_date (YYYY-MM-DD) y appointment_time (HH:MM:SS) a timestamp UTC.
 * Las citas se almacenan como "wall clock" (hora local de la plataforma, America/Mexico_City).
 * Usamos wallClockToUtcMs para interpretar correctamente en el servidor (que corre en UTC).
 */
function appointmentToMs(dateStr: string, timeStr: string): number {
  const date = String(dateStr).split("T")[0];
  const time = String(timeStr).slice(0, 5) || "00:00";
  return wallClockToUtcMs(date, time);
}

/** Formato fecha para email (es-MX) */
function formatAppointmentDate(dateStr: string): string {
  const [y, m, d] = String(dateStr).split("T")[0].split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

/** Formato hora HH:MM */
function formatAppointmentTime(timeStr: string): string {
  return String(timeStr).slice(0, 5) || "00:00";
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const now = Date.now();
    const windowMs = (WINDOW_MINUTES * 60 * 1000) / 2;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.holistia.io";
    const appointmentsUrl = `${baseUrl}/appointments`;

    const typeLabels: Record<string, string> = {
      presencial: "Presencial",
      online: "Online",
    };

    const { data: appointments, error: appError } = await supabase
      .from("appointments")
      .select(`
        id,
        patient_id,
        professional_id,
        appointment_date,
        appointment_time,
        duration_minutes,
        appointment_type,
        location,
        reminder_sent_24h_at,
        reminder_sent_1h_at
      `)
      .eq("status", "confirmed");

    if (appError || !appointments?.length) {
      return NextResponse.json({
        message: "Appointment reminders run",
        sent_24h: 0,
        sent_1h: 0,
        failed: 0,
      });
    }

    const professionalIds = [...new Set(appointments.map((a) => a.professional_id))];
    const { data: pros } = await supabase
      .from("professional_applications")
      .select("id, user_id, first_name, last_name")
      .in("id", professionalIds);
    const proById = new Map((pros || []).map((p) => [p.id, p]));

    const patientIds = [...new Set(appointments.map((a) => a.patient_id))];
    const profUserIds = (pros || []).map((p) => p.user_id).filter(Boolean);
    const allUserIds = [...new Set([...patientIds, ...profUserIds])];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, first_name, last_name, full_name")
      .in("id", allUserIds);
    const profileById = new Map((profiles || []).map((p) => [p.id, p]));

    let sent24h = 0;
    let sent1h = 0;
    let failed = 0;

    for (const apt of appointments) {
      const aptMs = appointmentToMs(apt.appointment_date, apt.appointment_time);
      const in24hWindow =
        !apt.reminder_sent_24h_at &&
        aptMs >= now + MS_24H - windowMs &&
        aptMs <= now + MS_24H + windowMs;
      const in1hWindow =
        !apt.reminder_sent_1h_at &&
        aptMs >= now + MS_1H - windowMs &&
        aptMs <= now + MS_1H + windowMs;

      if (!in24hWindow && !in1hWindow) continue;

      const pro = proById.get(apt.professional_id);
      const professionalUserId = pro?.user_id;
      const patientProfile = profileById.get(apt.patient_id);
      const professionalProfile = professionalUserId
        ? profileById.get(professionalUserId)
        : null;

      const patientName =
        patientProfile?.full_name?.trim() ||
        [patientProfile?.first_name, patientProfile?.last_name].filter(Boolean).join(" ").trim() ||
        "Paciente";
      const professionalName =
        professionalProfile?.full_name?.trim() ||
        [pro?.first_name, pro?.last_name].filter(Boolean).join(" ").trim() ||
        [professionalProfile?.first_name, professionalProfile?.last_name].filter(Boolean).join(" ").trim() ||
        "Profesional";

      const appointmentDateFormatted = formatAppointmentDate(apt.appointment_date);
      const appointmentTimeFormatted = formatAppointmentTime(apt.appointment_time);
      const duration = apt.duration_minutes ?? 50;
      const appointmentTypeLabel = typeLabels[apt.appointment_type] || apt.appointment_type;
      const location = apt.location?.trim() || "Por definir";

      const sendReminder = async (recipientId: string, isPatient: boolean, hoursLabel: string) => {
        const profile = profileById.get(recipientId);
        const email = profile?.email?.trim();
        if (!email) return false;
        const recipientName =
          profile?.full_name?.trim() ||
          [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() ||
          (isPatient ? "Paciente" : "Profesional");
        const introLine = isPatient
          ? `Tu cita con ${professionalName} es ${hoursLabel === "24 h" ? "mañana" : "en 1 hora"} a las ${appointmentTimeFormatted}.`
          : `Tienes una cita con ${patientName} ${hoursLabel === "24 h" ? "mañana" : "en 1 hora"} a las ${appointmentTimeFormatted}.`;
        const subject =
          hoursLabel === "24 h"
            ? `📅 Recordatorio: tu cita es mañana a las ${appointmentTimeFormatted} | Holistia`
            : `📅 Recordatorio: tu cita es en 1 hora (${appointmentTimeFormatted}) | Holistia`;

        const result = await sendAppointmentReminderEmail({
          recipient_name: recipientName,
          recipient_email: email,
          intro_line: introLine,
          appointment_date: appointmentDateFormatted,
          appointment_time: appointmentTimeFormatted,
          duration_minutes: duration,
          appointment_type: appointmentTypeLabel,
          location,
          appointments_url: appointmentsUrl,
          subject,
        });

        if (result.success && recipientId) {
          try {
            await supabase.from("notifications").insert({
              user_id: recipientId,
              type: "appointment_reminder",
              title: `Recordatorio de cita ${hoursLabel}`,
              message: introLine,
              action_url: "/appointments",
              metadata: {
                appointment_id: apt.id,
                appointment_date: apt.appointment_date,
                appointment_time: apt.appointment_time,
              },
            });
          } catch {
            // ignore notification failure
          }
        }
        return result.success;
      };

      if (in24hWindow) {
        const okPatient = await sendReminder(apt.patient_id, true, "24 h");
        const okPro = professionalUserId
          ? await sendReminder(professionalUserId, false, "24 h")
          : true;
        if (okPatient || okPro) {
          await supabase
            .from("appointments")
            .update({ reminder_sent_24h_at: new Date().toISOString() })
            .eq("id", apt.id);
          sent24h++;
        } else failed++;
      }

      if (in1hWindow) {
        const okPatient = await sendReminder(apt.patient_id, true, "1 h");
        const okPro = professionalUserId
          ? await sendReminder(professionalUserId, false, "1 h")
          : true;
        if (okPatient || okPro) {
          await supabase
            .from("appointments")
            .update({ reminder_sent_1h_at: new Date().toISOString() })
            .eq("id", apt.id);
          sent1h++;
        } else failed++;
      }
    }

    return NextResponse.json({
      message: "Appointment reminders completed",
      sent_24h: sent24h,
      sent_1h: sent1h,
      failed,
    });
  } catch (error) {
    console.error("Error in appointment-reminders cron:", error);
    return NextResponse.json(
      { error: "Cron failed", details: String(error) },
      { status: 500 }
    );
  }
}
