import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// GET - Buscar usuarios y profesionales (excluyendo admins)
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json({ data: [] });
    }

    const searchQuery = query.toLowerCase().trim();

    // Buscar usuarios (pacientes y profesionales) excluyendo admins
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar_url, type")
      .neq("type", "admin")
      .eq("account_active", true)
      .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`)
      .limit(20);

    if (profilesError) {
      console.error("Error searching profiles:", profilesError);
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    // Para profesionales, obtener información adicional de professional_applications
    const professionalIds = (profiles || [])
      .filter((p) => p.type === "professional")
      .map((p) => p.id);

    let professionalDataMap: Record<string, any> = {};

    if (professionalIds.length > 0) {
      const { data: professionalApps } = await supabase
        .from("professional_applications")
        .select("user_id, id, profession, slug, is_verified")
        .in("user_id", professionalIds)
        .eq("status", "approved")
        .eq("is_active", true);

      if (professionalApps) {
        professionalApps.forEach((prof) => {
          professionalDataMap[prof.user_id] = prof;
        });
      }
    }

    // Combinar datos de perfiles con información de profesionales
    const results = (profiles || []).map((profile) => {
      const result: any = {
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        avatar_url: profile.avatar_url,
        type: profile.type,
      };

      // Si es profesional, agregar información adicional
      if (profile.type === "professional" && professionalDataMap[profile.id]) {
        const profData = professionalDataMap[profile.id];
        result.professional_id = profData.id;
        result.profession = profData.profession;
        result.slug = profData.slug;
        result.is_verified = profData.is_verified;
      }

      return result;
    });

    return NextResponse.json({ data: results });
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json(
      { error: "Error al buscar usuarios" },
      { status: 500 }
    );
  }
}
