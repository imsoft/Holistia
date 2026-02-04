/**
 * Lógica de lista de espera para eventos llenos.
 * Notificar al primero de la lista cuando se libera un cupo.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEventWaitlistSpotAvailableEmail } from "./email-sender";

export interface NotifyFirstWaitlistResult {
  notified: boolean;
  userId?: string;
  error?: string;
}

/**
 * Cuando se libera un cupo (inscripción cancelada), notifica al primer usuario
 * en la lista de espera (si existe) por email y notificación in-app, y marca la fila.
 * Debe llamarse con un cliente que pueda actualizar event_waitlist (admin o service role).
 */
export async function notifyFirstWaitlistUser(
  supabase: SupabaseClient,
  eventId: string
): Promise<NotifyFirstWaitlistResult> {
  try {
    const { data: firstEntry, error: fetchError } = await supabase
      .from("event_waitlist")
      .select("id, user_id, created_at")
      .eq("event_id", eventId)
      .is("notified_spot_available_at", null)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (fetchError || !firstEntry) {
      return { notified: false };
    }

    const { data: event } = await supabase
      .from("events_workshops")
      .select("id, name, slug, event_date, event_time, location")
      .eq("id", eventId)
      .single();

    if (!event) {
      return { notified: false, error: "Evento no encontrado" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, first_name, last_name, full_name")
      .eq("id", firstEntry.user_id)
      .single();

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.holistia.io";
    const eventPath = event.slug ? `/explore/event/${event.slug}` : `/explore/event/${event.id}`;
    const eventUrl = `${baseUrl}${eventPath}`;

    const userName =
      profile?.full_name?.trim() ||
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() ||
      "Participante";
    const userEmail = profile?.email;

    if (userEmail) {
      await sendEventWaitlistSpotAvailableEmail({
        user_name: userName,
        user_email: userEmail,
        event_name: event.name,
        event_date: String(event.event_date ?? ""),
        event_time: String(event.event_time ?? "").slice(0, 8),
        event_location: String(event.location ?? ""),
        event_url: eventUrl,
      });
    }

    await supabase.from("notifications").insert({
      user_id: firstEntry.user_id,
      type: "event_spot_available",
      title: "¡Hay cupo disponible!",
      message: `Se liberó un lugar para "${event.name}". Inscríbete antes de que alguien más lo tome.`,
      action_url: eventPath,
      metadata: {
        event_id: eventId,
        event_name: event.name,
        event_date: event.event_date,
        event_time: event.event_time,
      },
    });

    const { error: updateError } = await supabase
      .from("event_waitlist")
      .update({
        notified_spot_available_at: new Date().toISOString(),
      })
      .eq("id", firstEntry.id);

    if (updateError) {
      console.error("Error marking waitlist as notified:", updateError);
      return { notified: true, userId: firstEntry.user_id, error: updateError.message };
    }

    return { notified: true, userId: firstEntry.user_id };
  } catch (err) {
    console.error("Error in notifyFirstWaitlistUser:", err);
    return {
      notified: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
