import { NextRequest, NextResponse } from "next/server";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { validateResetToken, updatePasswordWithToken } from "@/actions/auth/reset-password";

/**
 * API para validar token de reset (GET) y actualizar contraseña (POST).
 * Usado por la app móvil.
 * GET /api/auth/reset-password?token=xxx -> { valid, email? }
 * POST /api/auth/reset-password Body: { token, password } -> { success }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token") || "";

    if (!token) {
      return NextResponse.json(
        { valid: false, error: "Token requerido" },
        { status: 400 }
      );
    }

    const result = await validateResetToken(token);
    if (result.valid) {
      return NextResponse.json({ valid: true, email: result.email });
    }
    return NextResponse.json(
      { valid: false, error: result.error },
      { status: 400 }
    );
  } catch (error) {
    console.error("❌ API reset-password validate error:", error);
    return NextResponse.json(
      { valid: false, error: "Error al validar el token" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token y contraseña son requeridos" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 }
      );
    }

    const formData = new FormData();
    formData.append("token", token);
    formData.append("password", password);

    const result = await updatePasswordWithToken(formData);

    if (result?.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isRedirectError(error)) {
      return NextResponse.json({ success: true });
    }
    console.error("❌ API reset-password update error:", error);
    return NextResponse.json(
      { error: "Ocurrió un error inesperado. Intenta de nuevo." },
      { status: 500 }
    );
  }
}
