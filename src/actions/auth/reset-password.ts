"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { createClient } from "@/utils/supabase/server";
import { sendPasswordResetEmail } from "@/lib/email-sender";
import crypto from "crypto";

// Crear cliente de Supabase con service role para operaciones administrativas
async function createAdminClient() {
  const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// Generar token seguro
function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function resetPassword(formData: FormData) {
  const email = formData.get("email") as string;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  console.log("🔐 Reset password request for:", email);

  try {
    const supabaseAdmin = await createAdminClient();

    // Verificar si el usuario existe
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();

    if (userError) {
      console.error("❌ Error listing users:", userError.message);
      // No revelar si el email existe o no por seguridad
      return { success: true };
    }

    const user = users.users.find((u) => u.email === email);

    if (!user) {
      console.log("⚠️ User not found, but returning success for security");
      // Por seguridad, no revelar si el email existe o no
      return { success: true };
    }

    // Obtener nombre del usuario desde profiles
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single();

    const userName = profile
      ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Usuario"
      : "Usuario";

    // Generar token único
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Invalidar tokens anteriores para este email
    await supabaseAdmin
      .from("password_reset_tokens")
      .delete()
      .eq("email", email);

    // Guardar nuevo token
    const { error: insertError } = await supabaseAdmin
      .from("password_reset_tokens")
      .insert({
        email,
        token,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("❌ Error saving token:", insertError.message);
      return { error: "Error al procesar la solicitud. Intenta de nuevo." };
    }

    // Construir URL de reset
    const resetUrl = `${siteUrl}/reset-password?token=${token}`;

    console.log("📧 Sending password reset email via Resend...");

    // Enviar email con Resend
    const emailResult = await sendPasswordResetEmail({
      user_name: userName,
      user_email: email,
      reset_url: resetUrl,
    });

    if (!emailResult.success) {
      console.error("❌ Error sending email:", emailResult.error);
      // Eliminar el token si falló el envío
      await supabaseAdmin
        .from("password_reset_tokens")
        .delete()
        .eq("token", token);
      return { error: "Error al enviar el correo. Intenta de nuevo." };
    }

    console.log("✅ Password reset email sent successfully via Resend");
    return { success: true };
  } catch (error) {
    console.error("❌ Unexpected error in resetPassword:", error);
    return { error: "Ocurrió un error inesperado. Intenta de nuevo." };
  }
}

export async function validateResetToken(token: string) {
  try {
    const supabaseAdmin = await createAdminClient();

    const { data: tokenData, error } = await supabaseAdmin
      .from("password_reset_tokens")
      .select("*")
      .eq("token", token)
      .is("used_at", null)
      .single();

    if (error || !tokenData) {
      console.log("❌ Token not found or already used");
      return { valid: false, error: "El enlace no es válido o ya fue utilizado." };
    }

    // Verificar si el token expiró
    if (new Date(tokenData.expires_at) < new Date()) {
      console.log("❌ Token expired");
      return { valid: false, error: "El enlace ha expirado. Solicita uno nuevo." };
    }

    return { valid: true, email: tokenData.email };
  } catch (error) {
    console.error("❌ Error validating token:", error);
    return { valid: false, error: "Error al validar el enlace." };
  }
}

export async function updatePasswordWithToken(formData: FormData) {
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;

  if (!token || !password) {
    return { error: "Token y contraseña son requeridos." };
  }

  try {
    const supabaseAdmin = await createAdminClient();

    // Validar el token
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from("password_reset_tokens")
      .select("*")
      .eq("token", token)
      .is("used_at", null)
      .single();

    if (tokenError || !tokenData) {
      return { error: "El enlace no es válido o ya fue utilizado." };
    }

    if (new Date(tokenData.expires_at) < new Date()) {
      return { error: "El enlace ha expirado. Solicita uno nuevo." };
    }

    // Buscar usuario por email
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();

    if (userError) {
      console.error("❌ Error listing users:", userError.message);
      return { error: "Error al procesar la solicitud." };
    }

    const user = users.users.find((u) => u.email === tokenData.email);

    if (!user) {
      return { error: "Usuario no encontrado." };
    }

    // Actualizar contraseña usando Admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password }
    );

    if (updateError) {
      console.error("❌ Error updating password:", updateError.message);
      return { error: "Error al actualizar la contraseña." };
    }

    // Marcar token como usado
    await supabaseAdmin
      .from("password_reset_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("token", token);

    console.log("✅ Password updated successfully for:", tokenData.email);

    // Redirigir al login (redirect() lanza; no debe capturarse como error)
    revalidatePath("/", "layout");
    redirect("/login?message=password_updated");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("❌ Unexpected error in updatePasswordWithToken:", error);
    return { error: "Ocurrió un error inesperado." };
  }
}

// Mantener la función anterior para compatibilidad con confirm-password
export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    console.error("Error al actualizar contraseña:", error.message);
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/login");
}
