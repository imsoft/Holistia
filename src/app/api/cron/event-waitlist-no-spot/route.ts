import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEventWaitlistNoSpotEmail } from "@/lib/email-sender";

/**
 * Cron: notificar a usuarios en lista de espera que el evento ya pasó y no se liberaron cupos.
 * Ejecutar una vez al día (ej. 2:00 UTC).
 */
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

    const now = new Date();
    const nowMs = now.getTime();

    const { data: events } = await supabase
      .from("events_workshops")
      .select("id, name, event_date, event_time, end_time, duration_hours")
      .eq("is_active", true);

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.holistia.io";
    const exploreUrl = `${baseUrl}/explore/events`;
    let notified = 0;
    let failed = 0;

    for (const event of events ?? []) {
      const dateStr = (event.event_date ?? "").toString().split("T")[0];
      const [y, m, d] = dateStr.split("-").map(Number);
      if (!y || !m || !d) continue;
      const timeStr = String(event.event_time ?? "").slice(0, 8) || "00:00:00";
      const [hh, mm, ss] = timeStr.split(":").map(Number);
      let endMs: number;
      if (event.end_time) {
        const et = String(event.end_time).slice(0, 8).split(":");
        endMs = new Date(y, m - 1, d, Number(et[0]) || 0, Number(et[1]) || 0, Number(et[2]) || 0).getTime();
      } else {
        const durationHours = Number(event.duration_hours) || 1;
        endMs = new Date(y, m - 1, d, hh || 0, mm || 0, ss || 0).getTime() + durationHours * 60 * 60 * 1000;
      }
      if (endMs >= nowMs) continue;

      const { data: waitlistRows } = await supabase
        .from("event_waitlist")
        .select("id, user_id")
        .eq("event_id", event.id)
        .is("notified_spot_available_at", null)
        .is("notified_no_spot_at", null);

      for (const row of waitlistRows ?? []) {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, email, first_name, last_name, full_name")
            .eq("id", row.user_id)
            .single();

          const userName =
            profile?.full_name?.trim() ||
            [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() ||
            "Participante";
          const userEmail = profile?.email;

          if (userEmail) {
            await sendEventWaitlistNoSpotEmail({
              user_name: userName,
              user_email: userEmail,
              event_name: event.name ?? "Evento",
              explore_events_url: exploreUrl,
            });
          }

          await supabase.from("notifications").insert({
            user_id: row.user_id,
            type: "event_no_spot_available",
            title: "Evento finalizado sin cupos liberados",
            message: `El evento "${event.name}" ya tuvo lugar y no se liberaron cupos. Te invitamos a explorar otros eventos.`,
            action_url: "/explore/events",
            metadata: {
              event_id: event.id,
              event_name: event.name,
            },
          });

          await supabase
            .from("event_waitlist")
            .update({ notified_no_spot_at: new Date().toISOString() })
            .eq("id", row.id);

          notified++;
        } catch (err) {
          console.error("Error notifying waitlist user (no spot):", row.user_id, err);
          failed++;
        }
      }
    }

    return NextResponse.json({
      message: "Event waitlist no-spot notifications completed",
      notified,
      failed,
    });
  } catch (error) {
    console.error("Error in event-waitlist-no-spot cron:", error);
    return NextResponse.json(
      { error: "Cron failed", details: String(error) },
      { status: 500 }
    );
  }
}
