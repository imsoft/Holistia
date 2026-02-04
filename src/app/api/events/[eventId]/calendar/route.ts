import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { buildIcsContent } from "@/lib/ics-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const supabase = await createClient();

    const { data: event, error } = await supabase
      .from("events_workshops")
      .select("id, name, slug, event_date, event_time, end_date, end_time, duration_hours, location, description")
      .eq("id", eventId)
      .eq("is_active", true)
      .single();

    if (error || !event) {
      return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.holistia.io";
    const path = event.slug ? `/explore/event/${event.slug}` : `/explore/event/${event.id}`;
    const eventUrl = `${baseUrl}${path}`;

    const ics = buildIcsContent({
      name: event.name,
      event_date: event.event_date,
      event_time: String(event.event_time ?? "").slice(0, 8) || "00:00:00",
      end_date: event.end_date ?? null,
      end_time: event.end_time != null ? String(event.end_time).slice(0, 8) : null,
      duration_hours: event.duration_hours ?? 1,
      location: event.location ?? "",
      description: event.description ?? null,
      url: eventUrl,
      uid: `holistia-event-${event.id}@holistia.io`,
    });

    const sanitizedName = event.name.replace(/[^\p{L}\p{N}\s-]/gu, "").trim().slice(0, 80) || "evento";
    const filename = `${sanitizedName}.ics`;

    return new NextResponse(ics, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (error) {
    console.error("Error generating calendar .ics:", error);
    return NextResponse.json(
      { error: "Error al generar el archivo del calendario" },
      { status: 500 }
    );
  }
}
