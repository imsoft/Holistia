import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * POST /api/professional-applications/submit
 * Envía o actualiza la solicitud de profesional (evita que el cliente se quede colgado).
 * Body: mismo payload que antes (applicationData).
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "No autenticado. Inicia sesión e intenta de nuevo." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const applicationData = {
      user_id: user.id,
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email,
      phone: body.phone ?? null,
      profession: body.profession,
      specializations: body.specializations ?? [],
      languages: body.languages ?? ["Español"],
      experience: body.experience,
      services: body.services ?? [],
      address: body.address,
      city: body.city,
      state: body.state,
      country: body.country ?? "México",
      biography: body.biography ?? null,
      wellness_areas: body.wellness_areas ?? [],
      instagram: body.instagram ?? null,
      profile_photo: body.profile_photo ?? null,
      terms_accepted: Boolean(body.terms_accepted),
      privacy_accepted: Boolean(body.privacy_accepted),
      status: "pending",
    };

    const { data: existing } = await supabase
      .from("professional_applications")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("professional_applications")
        .update(applicationData)
        .eq("id", existing.id);

      if (error) {
        console.error("❌ Error al actualizar solicitud profesional:", error);
        return NextResponse.json(
          { error: error.message || "Error al actualizar la solicitud" },
          { status: 400 }
        );
      }
      return NextResponse.json({ ok: true, updated: true });
    }

    const { error } = await supabase
      .from("professional_applications")
      .insert([applicationData]);

    if (error) {
      if (error.code === "23505") {
        const { data: byEmail } = await supabase
          .from("professional_applications")
          .select("id")
          .eq("email", body.email)
          .maybeSingle();
        if (byEmail) {
          const { error: updateError } = await supabase
            .from("professional_applications")
            .update(applicationData)
            .eq("id", byEmail.id);
          if (!updateError) {
            return NextResponse.json({ ok: true, updated: true });
          }
        }
      }
      console.error("❌ Error al insertar solicitud profesional:", error);
      return NextResponse.json(
        { error: error.message || "Error al enviar la solicitud" },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("❌ Error en submit professional application:", e);
    return NextResponse.json(
      { error: "Error interno. Intenta de nuevo más tarde." },
      { status: 500 }
    );
  }
}
