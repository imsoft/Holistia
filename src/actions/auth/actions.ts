"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/utils/supabase/server";

// Helper para detectar errores de redirección de Next.js
// En Next.js 16, el redirect() lanza un error con digest que empieza con 'NEXT_REDIRECT'
function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: string }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

async function getRedirectPathForUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<
  | { redirectTo: string }
  | { redirectTo: string; deactivated: true }
> {
  // Nota: usamos rutas limpias (sin IDs) y dejamos que el middleware aplique restricciones.
  // Priorizamos `profiles.type` si existe; si no, caemos a revisar si tiene aplicación profesional aprobada.

  const { data: profile } = await supabase
    .from("profiles")
    .select("type, account_active")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.account_active === false) {
    return { redirectTo: "/account-deactivated", deactivated: true };
  }

  if (profile?.type === "admin") {
    return { redirectTo: "/admin/dashboard" };
  }

  // Profesionales y “profesionales por aplicación aprobada” van al dashboard profesional.
  // Si no está aprobado, cae a /explore.
  if (profile?.type === "professional") {
    const { data: professionalApp } = await supabase
      .from("professional_applications")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "approved")
      .maybeSingle();

    return { redirectTo: professionalApp ? "/dashboard" : "/explore" };
  }

  // Si no es admin/professional, podría ser paciente o aún no tener profile.type seteado.
  const { data: professionalApp } = await supabase
    .from("professional_applications")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "approved")
    .maybeSingle();

  return { redirectTo: professionalApp ? "/dashboard" : "/explore" };
}

export async function login(formData: FormData) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  try {
    const { data: result, error } = await supabase.auth.signInWithPassword(data);

    if (error) {
      console.error("Error en login:", error.message);
      return { error: error.message };
    }

    // Si el login es exitoso, verificar el tipo de usuario y redirigir apropiadamente
    if (result.user) {
      const redirectInfo = await getRedirectPathForUser(supabase, result.user.id);
      revalidatePath("/", "layout");
      return { success: true, redirectTo: redirectInfo.redirectTo };
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    // Verificar si es un error de redirección de Next.js
    if (isRedirectError(error)) {
      throw error; // Re-lanzar para que Next.js maneje la redirección
    }

    console.error("Error inesperado en login:", error);
    return { error: "Ocurrió un error inesperado. Por favor, intenta de nuevo." };
  }
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const becomeProfessional = formData.get("becomeProfessional") === "true";

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    options: {
      data: {
        first_name: formData.get("firstName") as string,
        last_name: formData.get("lastName") as string,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/confirm`
    }
  };

  try {
    const { data: result, error } = await supabase.auth.signUp(data);

    if (error) {
      console.error("Error en registro:", error.message);
      return { error: error.message };
    }

    // Si el registro es exitoso y el usuario está confirmado
    if (result.user && !result.user.email_confirmed_at) {
      // Usuario necesita confirmar email
      revalidatePath("/", "layout");
      return { success: true, needsConfirmation: true };
    } else if (result.user) {
      const redirectInfo = await getRedirectPathForUser(supabase, result.user.id);
      revalidatePath("/", "layout");
      return { success: true, redirectTo: redirectInfo.redirectTo };
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    // Verificar si es un error de redirección de Next.js
    if (isRedirectError(error)) {
      throw error; // Re-lanzar para que Next.js maneje la redirección
    }

    console.error("Error inesperado en registro:", error);
    return { error: "Ocurrió un error inesperado. Por favor, intenta de nuevo." };
  }
}

export async function signInWithGoogle() {
  try {
    const supabase = await createClient();

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.holistia.io';
    const redirectTo = `${siteUrl}/auth/callback`;

    console.log("🔐 Iniciando Google OAuth con redirectTo:", redirectTo);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.error("❌ Error en Google OAuth:", error);
      return { error: error.message || "Error al conectar con Google" };
    }

    if (!data?.url) {
      console.error("❌ No se recibió URL de autenticación");
      return { error: "No se pudo generar la URL de autenticación" };
    }

    console.log("✅ URL de Google OAuth generada correctamente");
    return { success: true, url: data.url };
  } catch (error) {
    console.error("❌ Error inesperado en signInWithGoogle:", error);
    return { 
      error: error instanceof Error ? error.message : "Error inesperado al iniciar sesión con Google" 
    };
  }
}
