"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  try {
    // type-casting here for convenience
    // in practice, you should validate your inputs
    const data = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    const { data: result, error } = await supabase.auth.signInWithPassword(data);

    if (error) {
      console.error("Error en login:", error.message);
      return { error: error.message };
    }

    // Si el login es exitoso, verificar el tipo de usuario y redirigir apropiadamente
    if (result.user) {
      const userType = result.user.user_metadata?.user_type;
      
      revalidatePath("/", "layout");
      
      // Redirigir según el tipo de usuario
      if (userType === 'admin') {
        redirect(`/admin/${result.user.id}/dashboard`);
      } else if (userType === 'professional') {
        redirect(`/professional/${result.user.id}/dashboard`);
      } else {
        // Verificar si el usuario tiene una aplicación profesional aprobada
        const { data: application } = await supabase
          .from('professional_applications')
          .select('id, status')
          .eq('user_id', result.user.id)
          .eq('status', 'approved')
          .single();

        if (application) {
          // Si tiene una aplicación aprobada, redirigir al dashboard de profesionales
          redirect(`/professional/${result.user.id}/dashboard`);
        } else {
          // Por defecto, redirigir al dashboard del paciente
          redirect(`/patient/${result.user.id}/explore`);
        }
      }
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Error inesperado en login:", error);
    return { error: "Ocurrió un error inesperado. Por favor, intenta de nuevo." };
  }
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  try {
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
      // Usuario ya confirmado, verificar tipo y redirigir apropiadamente
      const userType = result.user.user_metadata?.user_type;
      
      revalidatePath("/", "layout");
      
      if (userType === 'admin') {
        redirect(`/admin/${result.user.id}/dashboard`);
      } else if (userType === 'professional') {
        redirect(`/professional/${result.user.id}/dashboard`);
      } else {
        // Verificar si el usuario tiene una aplicación profesional aprobada
        const { data: application } = await supabase
          .from('professional_applications')
          .select('id, status')
          .eq('user_id', result.user.id)
          .eq('status', 'approved')
          .single();

        if (application) {
          // Si tiene una aplicación aprobada, redirigir al dashboard de profesionales
          redirect(`/professional/${result.user.id}/dashboard`);
        } else {
          // Por defecto, redirigir al dashboard del paciente
          redirect(`/patient/${result.user.id}/explore`);
        }
      }
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Error inesperado en registro:", error);
    return { error: "Ocurrió un error inesperado. Por favor, intenta de nuevo." };
  }
}

export async function signInWithGoogle() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    console.error("Error en Google OAuth:", error.message);
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }

  return { success: true };
}
