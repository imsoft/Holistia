import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      // Configuración de cookies para persistencia de sesión
      cookieOptions: {
        // Duración de la sesión: 7 días (en segundos)
        maxAge: 60 * 60 * 24 * 7, // 7 días
        // Path de la cookie
        path: '/',
        // SameSite=Lax permite que la cookie se envíe en navegación normal
        sameSite: 'lax',
        // Secure solo en producción (HTTPS)
        secure: process.env.NODE_ENV === 'production',
      },
    }
  );
}
