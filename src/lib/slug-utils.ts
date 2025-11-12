/**
 * Genera un slug válido a partir de un texto
 * @param text - El texto a convertir en slug
 * @returns El slug generado
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase() // Convertir a minúsculas
    .trim() // Eliminar espacios al inicio y final
    .replace(/[^\w\s-]/g, '') // Eliminar caracteres especiales excepto espacios y guiones
    .replace(/[\s_-]+/g, '-') // Reemplazar espacios y guiones múltiples con un solo guión
    .replace(/^-+|-+$/g, ''); // Eliminar guiones al inicio y final
}

/**
 * Verifica si un slug es válido
 * @param slug - El slug a validar
 * @returns true si es válido, false si no
 */
export function isValidSlug(slug: string): boolean {
  // Un slug válido debe:
  // - No estar vacío
  // - Solo contener letras minúsculas, números y guiones
  // - No empezar o terminar con guión
  // - Tener entre 3 y 200 caracteres
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slug.length >= 3 && slug.length <= 200 && slugRegex.test(slug);
}

/**
 * Verifica si un slug ya existe en la base de datos
 * @param slug - El slug a verificar
 * @param currentPostId - ID del post actual (para edición)
 * @param supabase - Cliente de Supabase
 * @returns Promise<boolean> - true si existe, false si está disponible
 */
export async function checkSlugExists(
  slug: string, 
  currentPostId: string | null, 
  supabase: any // eslint-disable-line @typescript-eslint/no-explicit-any
): Promise<boolean> {
  try {
    let query = supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', slug);

    // Si estamos editando un post, excluir el post actual
    if (currentPostId) {
      query = query.neq('id', currentPostId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error checking slug:', error);
      return false; // En caso de error, asumir que está disponible
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking slug:', error);
    return false;
  }
}

/**
 * Genera un slug único agregando un número si es necesario
 * @param baseSlug - El slug base
 * @param currentPostId - ID del post actual (para edición)
 * @param supabase - Cliente de Supabase
 * @returns Promise<string> - El slug único generado
 */
export async function generateUniqueSlug(
  baseSlug: string,
  currentPostId: string | null,
  supabase: any // eslint-disable-line @typescript-eslint/no-explicit-any
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (await checkSlugExists(slug, currentPostId, supabase)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}
