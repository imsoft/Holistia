"use server";

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const getSupabaseServerClient = async () => {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  );
};

export const getSupabaseServerClientWithAuth = async () => {
  const cookieStore = await cookies();

  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${
            cookieStore.get("supabase-auth-token")?.value
          }`,
        },
      },
    }
  );
};
