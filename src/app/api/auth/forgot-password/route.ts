import { NextRequest, NextResponse } from "next/server";
import { resetPassword } from "@/actions/auth/reset-password";

/**
 * API route para solicitar restablecimiento de contraseña.
 * Usado por la app móvil (no puede llamar server actions directamente).
 * POST /api/auth/forgot-password
 * Body: { email: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim() : "";

    if (!email) {
      return NextResponse.json(
        { error: "El correo electrónico es requerido" },
        { status: 400 }
      );
    }

    const formData = new FormData();
    formData.append("email", email);

    const result = await resetPassword(formData);

    if (result?.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Por seguridad, siempre devolvemos success (no revelar si el email existe)
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ API forgot-password error:", error);
    return NextResponse.json(
      { error: "Ocurrió un error inesperado. Intenta de nuevo." },
      { status: 500 }
    );
  }
}
