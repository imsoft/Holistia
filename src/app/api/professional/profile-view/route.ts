import { createServiceRoleClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST: registrar una vista al perfil público del profesional.
 * Llamado desde la página explore/professional/[slug] (una vez por sesión en cliente).
 * No requiere autenticación del visitante. Inserts con service role.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { professional_id: professionalId, slug } = body as { professional_id?: string; slug?: string };

    if (!professionalId && !slug) {
      return NextResponse.json(
        { error: "Se requiere professional_id o slug" },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();
    let resolvedProfessionalId = professionalId;

    if (!resolvedProfessionalId && slug) {
      const { data: pro, error: proError } = await supabase
        .from("professional_applications")
        .select("id")
        .eq("slug", slug)
        .eq("registration_fee_paid", true)
        .maybeSingle();

      if (proError || !pro?.id) {
        return NextResponse.json({ error: "Profesional no encontrado" }, { status: 404 });
      }
      resolvedProfessionalId = pro.id;
    }

    const { error: insertError } = await supabase
      .from("professional_profile_views")
      .insert({
        professional_id: resolvedProfessionalId,
        viewed_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("Error recording profile view:", insertError);
      return NextResponse.json(
        { error: "Error al registrar la vista" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error in profile-view API:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
