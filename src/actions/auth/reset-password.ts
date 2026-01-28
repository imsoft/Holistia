"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

export async function resetPassword(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/confirm-password`
  });

  if (error) {
    console.error("Error en reset de contraseña:", error.message);
    return { error: error.message };
  }

  return { success: true };
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();

  const password = formData.get("password") as string;

  const { error } = await supabase.auth.updateUser({
    password: password
  });

  if (error) {
    console.error("Error al actualizar contraseña:", error.message);
    return { error: error.message };
  }

  // Después de actualizar la contraseña, redirigir al login
  revalidatePath("/", "layout");
  redirect("/login");

  return { success: true };
}
