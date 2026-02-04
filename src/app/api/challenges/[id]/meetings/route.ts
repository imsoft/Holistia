import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/utils/supabase/server";

async function getSupabaseForChallenge(challengeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase: null, user: null, allowed: false };

  const { data: challenge, error: challengeError } = await supabase
    .from("challenges")
    .select("created_by_user_id")
    .eq("id", challengeId)
    .single();

  if (challengeError || !challenge) return { supabase: null, user, allowed: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("type, account_active")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.type === "admin" && profile?.account_active === true;
  const isCreator = challenge.created_by_user_id === user.id;

  if (!isAdmin && !isCreator) return { supabase, user, allowed: false };

  if (isAdmin) {
    return { supabase: createServiceRoleClient(), user, allowed: true };
  }
  return { supabase, user, allowed: true };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: challengeId } = await params;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { supabase: supabaseForQuery, allowed } = await getSupabaseForChallenge(challengeId);
    const queryClient = allowed && supabaseForQuery ? supabaseForQuery : supabase;

    const { data: meetings, error } = await queryClient
      .from("challenge_meetings")
      .select("*")
      .eq("challenge_id", challengeId)
      .eq("is_active", true)
      .order("scheduled_date", { ascending: true })
      .order("scheduled_time", { ascending: true });

    if (error) {
      console.error("Error fetching meetings:", error);
      return NextResponse.json(
        { error: "Error al cargar las reuniones" },
        { status: 500 }
      );
    }

    return NextResponse.json({ meetings });
  } catch (error) {
    console.error("Error in GET /api/challenges/[id]/meetings:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: challengeId } = await params;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { supabase: supabaseForWrite, allowed } = await getSupabaseForChallenge(challengeId);
    if (!allowed || !supabaseForWrite) {
      return NextResponse.json(
        { error: "No tienes permiso para agregar reuniones a este reto" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      platform,
      meeting_url,
      meeting_id,
      passcode,
      scheduled_date,
      scheduled_time,
      duration_minutes,
      timezone,
      is_recurring,
      recurrence_pattern,
      recurrence_end_date,
      max_participants,
    } = body;

    // Validate required fields
    if (!title || !meeting_url || !scheduled_date || !scheduled_time) {
      return NextResponse.json(
        { error: "Título, URL, fecha y hora son obligatorios" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(meeting_url);
    } catch {
      return NextResponse.json(
        { error: "La URL de la reunión no es válida" },
        { status: 400 }
      );
    }

    // Validate platform
    const validPlatforms = ["meet", "zoom", "teams", "other"];
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json(
        { error: "Plataforma no válida" },
        { status: 400 }
      );
    }

    const { data: meeting, error } = await supabaseForWrite
      .from("challenge_meetings")
      .insert([
        {
          challenge_id: challengeId,
          title: title.trim(),
          description: description?.trim() || null,
          platform,
          meeting_url: meeting_url.trim(),
          meeting_id: meeting_id?.trim() || null,
          passcode: passcode?.trim() || null,
          scheduled_date,
          scheduled_time,
          duration_minutes: duration_minutes || 60,
          timezone: timezone || "America/Mexico_City",
          is_recurring: is_recurring || false,
          recurrence_pattern: is_recurring ? recurrence_pattern : null,
          recurrence_end_date:
            is_recurring && recurrence_end_date ? recurrence_end_date : null,
          max_participants: max_participants || null,
          status: "scheduled",
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating meeting:", error);
      return NextResponse.json(
        { error: "Error al crear la reunión" },
        { status: 500 }
      );
    }

    return NextResponse.json({ meeting }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/challenges/[id]/meetings:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: challengeId } = await params;

    const { supabase: supabaseForWrite, allowed } = await getSupabaseForChallenge(challengeId);
    if (!allowed || !supabaseForWrite) {
      return NextResponse.json(
        { error: "No tienes permiso para actualizar reuniones de este reto" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      meetingId,
      title,
      description,
      platform,
      meeting_url,
      meeting_id,
      passcode,
      scheduled_date,
      scheduled_time,
      duration_minutes,
      timezone,
      is_recurring,
      recurrence_pattern,
      recurrence_end_date,
      max_participants,
      status,
    } = body;

    if (!meetingId) {
      return NextResponse.json(
        { error: "ID de la reunión es obligatorio" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!title || !meeting_url || !scheduled_date || !scheduled_time) {
      return NextResponse.json(
        { error: "Título, URL, fecha y hora son obligatorios" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(meeting_url);
    } catch {
      return NextResponse.json(
        { error: "La URL de la reunión no es válida" },
        { status: 400 }
      );
    }

    const updateData: any = {
      title: title.trim(),
      description: description?.trim() || null,
      platform,
      meeting_url: meeting_url.trim(),
      meeting_id: meeting_id?.trim() || null,
      passcode: passcode?.trim() || null,
      scheduled_date,
      scheduled_time,
      duration_minutes: duration_minutes || 60,
      timezone: timezone || "America/Mexico_City",
      is_recurring: is_recurring || false,
      recurrence_pattern: is_recurring ? recurrence_pattern : null,
      recurrence_end_date:
        is_recurring && recurrence_end_date ? recurrence_end_date : null,
      max_participants: max_participants || null,
      updated_at: new Date().toISOString(),
    };

    if (status) {
      updateData.status = status;
    }

    const { data: meeting, error } = await supabaseForWrite
      .from("challenge_meetings")
      .update(updateData)
      .eq("id", meetingId)
      .eq("challenge_id", challengeId)
      .select()
      .single();

    if (error) {
      console.error("Error updating meeting:", error);
      return NextResponse.json(
        { error: "Error al actualizar la reunión" },
        { status: 500 }
      );
    }

    return NextResponse.json({ meeting });
  } catch (error) {
    console.error("Error in PUT /api/challenges/[id]/meetings:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: challengeId } = await params;

    const { supabase: supabaseForWrite, allowed } = await getSupabaseForChallenge(challengeId);
    if (!allowed || !supabaseForWrite) {
      return NextResponse.json(
        { error: "No tienes permiso para eliminar reuniones de este reto" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const meetingId = searchParams.get("meetingId");

    if (!meetingId) {
      return NextResponse.json(
        { error: "ID de la reunión es obligatorio" },
        { status: 400 }
      );
    }

    // Soft delete: set is_active to false and status to cancelled
    const { error } = await supabaseForWrite
      .from("challenge_meetings")
      .update({
        is_active: false,
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", meetingId)
      .eq("challenge_id", challengeId);

    if (error) {
      console.error("Error deleting meeting:", error);
      return NextResponse.json(
        { error: "Error al eliminar la reunión" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/challenges/[id]/meetings:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
