import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/utils/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Crea un cliente Supabase para API routes.
 * - Si hay Authorization: Bearer <token>, usa ese token (app móvil).
 * - Si no, usa cookies (web).
 */
export async function createClientForRequest(request: Request): Promise<SupabaseClient> {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (token) {
    return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      }
    );
  }

  return await createServerClient();
}

/** Indica si la petición viene de la app móvil (para usar success/cancel URLs que redirigen a la app) */
export function isMobileRequest(request: Request): boolean {
  return request.headers.get("X-Holistia-Mobile") === "1";
}
