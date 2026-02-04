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

  if (!isAdmin && !isCreator) return { supabase: null, user, allowed: false };

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

    const { data: resources, error } = await queryClient
      .from("challenge_resources")
      .select("*")
      .eq("challenge_id", challengeId)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching resources:", error);
      return NextResponse.json(
        { error: "Error al cargar los recursos" },
        { status: 500 }
      );
    }

    return NextResponse.json({ resources });
  } catch (error) {
    console.error("Error in GET /api/challenges/[id]/resources:", error);
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
        { error: "No tienes permiso para agregar recursos a este reto" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      resource_type,
      url,
      file_size_bytes,
      duration_minutes,
      display_order,
    } = body;

    if (!title || !url || !resource_type) {
      return NextResponse.json(
        { error: "Título, URL y tipo de recurso son obligatorios" },
        { status: 400 }
      );
    }

    const { data: existingResources } = await supabaseForWrite
      .from("challenge_resources")
      .select("display_order")
      .eq("challenge_id", challengeId)
      .eq("is_active", true)
      .order("display_order", { ascending: false })
      .limit(1);

    const nextOrder =
      display_order ??
      (existingResources && existingResources.length > 0
        ? existingResources[0].display_order + 1
        : 0);

    const { data: resource, error } = await supabaseForWrite
      .from("challenge_resources")
      .insert([
        {
          challenge_id: challengeId,
          title: title.trim(),
          description: description?.trim() || null,
          resource_type,
          url: url.trim(),
          file_size_bytes: file_size_bytes || null,
          duration_minutes: duration_minutes || null,
          display_order: nextOrder,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating resource:", error);
      return NextResponse.json(
        { error: "Error al crear el recurso" },
        { status: 500 }
      );
    }

    return NextResponse.json({ resource }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/challenges/[id]/resources:", error);
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
    const supabase = await createClient();
    const { id: challengeId } = await params;

    const { supabase: supabaseForWrite, allowed } = await getSupabaseForChallenge(challengeId);
    if (!allowed || !supabaseForWrite) {
      return NextResponse.json(
        { error: "No tienes permiso para actualizar recursos de este reto" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      resourceId,
      title,
      description,
      resource_type,
      url,
      file_size_bytes,
      duration_minutes,
    } = body;

    if (!resourceId) {
      return NextResponse.json(
        { error: "ID del recurso es obligatorio" },
        { status: 400 }
      );
    }

    if (!title || !url || !resource_type) {
      return NextResponse.json(
        { error: "Título, URL y tipo de recurso son obligatorios" },
        { status: 400 }
      );
    }

    const { data: resource, error } = await supabaseForWrite
      .from("challenge_resources")
      .update({
        title: title.trim(),
        description: description?.trim() || null,
        resource_type,
        url: url.trim(),
        file_size_bytes: file_size_bytes || null,
        duration_minutes: duration_minutes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", resourceId)
      .eq("challenge_id", challengeId)
      .select()
      .single();

    if (error) {
      console.error("Error updating resource:", error);
      return NextResponse.json(
        { error: "Error al actualizar el recurso" },
        { status: 500 }
      );
    }

    return NextResponse.json({ resource });
  } catch (error) {
    console.error("Error in PUT /api/challenges/[id]/resources:", error);
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
        { error: "No tienes permiso para eliminar recursos de este reto" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get("resourceId");

    if (!resourceId) {
      return NextResponse.json(
        { error: "ID del recurso es obligatorio" },
        { status: 400 }
      );
    }

    const { error } = await supabaseForWrite
      .from("challenge_resources")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", resourceId)
      .eq("challenge_id", challengeId);

    if (error) {
      console.error("Error deleting resource:", error);
      return NextResponse.json(
        { error: "Error al eliminar el recurso" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/challenges/[id]/resources:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
