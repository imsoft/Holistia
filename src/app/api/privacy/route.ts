import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// GET - Obtener configuración de privacidad del usuario
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Obtener configuración de privacidad
    const { data: settings, error: settingsError } = await supabase
      .from("privacy_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (settingsError) {
      console.error("Error fetching privacy settings:", settingsError);
      return NextResponse.json(
        { error: "Error al obtener configuración de privacidad" },
        { status: 500 }
      );
    }

    // Si no existe, crear configuración por defecto
    if (!settings) {
      const { data: newSettings, error: createError } = await supabase
        .from("privacy_settings")
        .insert({ user_id: user.id })
        .select()
        .single();

      if (createError) {
        console.error("Error creating default privacy settings:", createError);
        return NextResponse.json(
          { error: "Error al crear configuración de privacidad" },
          { status: 500 }
        );
      }

      return NextResponse.json({ data: newSettings });
    }

    return NextResponse.json({ data: settings });
  } catch (error) {
    console.error("Error in privacy settings GET:", error);
    return NextResponse.json(
      { error: "Error al obtener configuración de privacidad" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar configuración de privacidad
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();

    // Actualizar configuración
    const { data: updatedSettings, error: updateError } = await supabase
      .from("privacy_settings")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating privacy settings:", updateError);
      return NextResponse.json(
        { error: "Error al actualizar configuración de privacidad" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: updatedSettings,
      message: "Configuración actualizada exitosamente",
    });
  } catch (error) {
    console.error("Error in privacy settings PUT:", error);
    return NextResponse.json(
      { error: "Error al actualizar configuración de privacidad" },
      { status: 500 }
    );
  }
}
