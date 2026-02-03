/**
 * Obtiene metadatos de un post público del feed para SEO (Open Graph, Twitter, etc.).
 * Solo devuelve datos de check-ins públicos (la vista social_feed_checkins ya filtra is_public = true).
 * Uso: generateMetadata en /feed/post/[id].
 */

import { createClient } from "@supabase/supabase-js";

export interface PublicPostMeta {
  title: string;
  description: string;
  image: string | null;
  userName: string;
  challengeTitle: string;
}

async function createAdminClient() {
  return createClient(
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

/** Trunca texto para meta description (max ~160 caracteres). */
function truncate(str: string | null | undefined, maxLen: number): string {
  if (!str || !str.trim()) return "";
  const trimmed = str.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return trimmed.slice(0, maxLen - 3) + "...";
}

/**
 * Obtiene metadatos de un post público por checkin_id.
 * Retorna null si el post no existe o no es público (la vista solo incluye is_public = true).
 */
export async function getPublicPostMeta(
  checkinId: string
): Promise<PublicPostMeta | null> {
  if (!checkinId) return null;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;

  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from("social_feed_checkins")
      .select(
        "user_first_name, user_last_name, challenge_title, notes, evidence_url, evidence_type"
      )
      .eq("checkin_id", checkinId)
      .maybeSingle();

    if (error || !data) return null;

    const userName = [data.user_first_name, data.user_last_name]
      .filter(Boolean)
      .join(" ")
      .trim();
    const challengeTitle = data.challenge_title || "Reto";
    const title = userName
      ? `${userName} en ${challengeTitle}`
      : `Publicación - ${challengeTitle}`;
    const description =
      truncate(data.notes, 155) ||
      (userName
        ? `Publicación de ${userName} en el reto ${challengeTitle}.`
        : `Progreso en el reto ${challengeTitle} en Holistia.`);
    const image =
      data.evidence_type === "photo" && data.evidence_url
        ? data.evidence_url
        : null;

    return {
      title,
      description,
      image,
      userName: userName || "Usuario",
      challengeTitle,
    };
  } catch {
    return null;
  }
}
