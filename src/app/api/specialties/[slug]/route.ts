import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// Función para normalizar texto (igual que en la página)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remover acentos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    // Normalizar el slug para comparación
    const normalizedSlug = normalizeText(slug);

    // Obtener todos los profesionales aprobados y activos
    const { data: allProfessionals, error: fetchError } = await supabase
      .from("professional_applications")
      .select(
        `
        id,
        user_id,
        first_name,
        last_name,
        profession,
        bio,
        profile_picture_url,
        city,
        state,
        rating,
        slug
      `
      )
      .eq("status", "approved")
      .eq("is_active", true);

    if (fetchError) {
      console.error("Error fetching professionals:", fetchError);
      return NextResponse.json(
        { error: "Error al obtener profesionales", details: fetchError.message },
        { status: 500 }
      );
    }

    if (!allProfessionals || allProfessionals.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron profesionales", professionals: [] },
        { status: 404 }
      );
    }

    // Filtrar profesionales cuyo profession normalizado coincida con el slug
    const professionals = allProfessionals.filter((prof) => {
      if (!prof.profession) return false;
      const normalizedProfession = normalizeText(prof.profession);
      return normalizedProfession === normalizedSlug;
    });

    if (professionals.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron profesionales para esta especialidad", professionals: [] },
        { status: 404 }
      );
    }

    // Ordenar por rating
    professionals.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    // Obtener el nombre de la profesión desde el primer profesional encontrado
    const profession = professionals[0].profession;

    return NextResponse.json({
      profession,
      professionals,
      count: professionals.length,
    });
  } catch (error) {
    console.error("Error in specialties/[slug] API:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
