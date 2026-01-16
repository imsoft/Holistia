"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

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
      // Obtener tipo de usuario y estado de cuenta desde profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('type, account_active')
        .eq('id', result.user.id)
        .maybeSingle();

      // Verificar si la cuenta está desactivada
      if (profile && profile.account_active === false) {
        revalidatePath("/", "layout");
        redirect('/account-deactivated');
      }

      const userType = profile?.type;
      
      revalidatePath("/", "layout");
      
      // Redirigir seg?n el tipo de usuario
      if (userType === 'admin') {
        redirect(`/admin/dashboard`);
      } else if (userType === 'professional') {
        redirect(`/professional/${result.user.id}/dashboard`);
      } else {
        // Verificar si el usuario tiene una aplicación profesional aprobada
        try {
          const { data: application, error: appError } = await supabase
            .from('professional_applications')
            .select('id, status')
            .eq('user_id', result.user.id)
            .eq('status', 'approved')
            .single();

          if (appError && appError.code !== 'PGRST116') {
            // PGRST116 = no rows found, que es normal
            console.error('Error consultando professional_applications:', appError);
            // Si hay error en la consulta, redirigir al dashboard del paciente por defecto
            redirect(`/patient/${result.user.id}/explore`);
          }

          if (application) {
            // Si tiene una aplicación aprobada, redirigir al dashboard de profesionales
            redirect(`/professional/${result.user.id}/dashboard`);
          } else {
            // Por defecto, redirigir al dashboard del paciente
            redirect(`/patient/${result.user.id}/explore`);
          }
        } catch (queryError) {
          console.error('Error inesperado consultando professional_applications:', queryError);
          // En caso de error, redirigir al dashboard del paciente por defecto
          redirect(`/patient/${result.user.id}/explore`);
        }
      }
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    // Verificar si es un error de redirección de Next.js
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      // Es una redirección, no un error real
      throw error; // Re-lanzar para que Next.js la maneje
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
      // Usuario ya confirmado, verificar tipo y redirigir apropiadamente
      // Obtener tipo de usuario desde profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('type')
        .eq('id', result.user.id)
        .maybeSingle();

      const userType = profile?.type;
      
      revalidatePath("/", "layout");
      
      if (userType === 'admin') {
        redirect(`/admin/dashboard`);
      } else if (userType === 'professional') {
        redirect(`/professional/${result.user.id}/dashboard`);
      } else {
        // Verificar si el usuario tiene una aplicación profesional aprobada
        try {
          const { data: application, error: appError } = await supabase
            .from('professional_applications')
            .select('id, status')
            .eq('user_id', result.user.id)
            .eq('status', 'approved')
            .single();

          if (appError && appError.code !== 'PGRST116') {
            // PGRST116 = no rows found, que es normal
            console.error('Error consultando professional_applications:', appError);
            // Si hay error en la consulta, redirigir al dashboard del paciente por defecto
            redirect(`/patient/${result.user.id}/explore`);
          }

          if (application) {
            // Si tiene una aplicación aprobada, redirigir al dashboard de profesionales
            redirect(`/professional/${result.user.id}/dashboard`);
          } else {
            // Por defecto, redirigir al dashboard del paciente
            redirect(`/patient/${result.user.id}/explore`);
          }
        } catch (queryError) {
          console.error('Error inesperado consultando professional_applications:', queryError);
          // En caso de error, redirigir al dashboard del paciente por defecto
          redirect(`/patient/${result.user.id}/explore`);
        }
      }
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    // Verificar si es un error de redirección de Next.js
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      // Es una redirección, no un error real
      throw error; // Re-lanzar para que Next.js la maneje
    }
    
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
    // Retornar la URL en lugar de hacer redirect aquí
    // El cliente hará el redirect para evitar problemas con server actions
    return { success: true, url: data.url };
  }

  return { error: "No se pudo obtener la URL de autenticación" };
}
