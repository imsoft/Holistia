import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// Función para generar slug
function generateSlug(profession: string): string {
  return profession
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remover acentos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  try {
    const supabase = await createClient();

    // Obtener profesiones únicas y contar profesionales aprobados
    const { data, error } = await supabase
      .from("professional_applications")
      .select("profession")
      .eq("status", "approved");

    if (error) {
      console.error("Error fetching specialties:", error);
      return NextResponse.json(
        { error: "Error al obtener especialidades" },
        { status: 500 }
      );
    }

    // Agrupar por profesión y contar
    const specialtyMap = new Map<string, number>();

    data.forEach((item) => {
      const count = specialtyMap.get(item.profession) || 0;
      specialtyMap.set(item.profession, count + 1);
    });

    // Convertir a array y ordenar por cantidad
    const specialties = Array.from(specialtyMap.entries())
      .map(([name, count]) => ({
        name,
        count,
        slug: generateSlug(name),
      }))
      .sort((a, b) => b.count - a.count); // Ordenar por cantidad descendente

    return NextResponse.json({
      specialties,
      total: specialties.length,
    });
  } catch (error) {
    console.error("Error in specialties API:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
