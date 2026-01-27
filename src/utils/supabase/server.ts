import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function getCookieDomain(): string | undefined {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) return undefined;
    const host = new URL(siteUrl).hostname;

    // Solo en producción para dominio real
    if (host === "localhost" || host.endsWith(".localhost")) return undefined;

    // Compartir sesión entre holistia.io y www.holistia.io
    if (host === "holistia.io" || host === "www.holistia.io" || host.endsWith(".holistia.io")) {
      return ".holistia.io";
    }

    return undefined;
  } catch {
    return undefined;
  }
}

export async function createClient() {
  const cookieStore = await cookies();
  const cookieDomain = getCookieDomain();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              const nextOptions = cookieDomain ? { ...options, domain: cookieDomain } : options;
              cookieStore.set(name, value, nextOptions);
            });
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have proxy refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

// Cliente anónimo para acceso público (sin cookies)
export function createAnonClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
