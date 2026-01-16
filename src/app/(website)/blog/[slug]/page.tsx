import { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { generateBlogMetadata, generateStructuredData } from '@/lib/seo';
import { StructuredData } from '@/components/seo/structured-data';
import { BlogPostClient } from './blog-post-client';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  try {
    // Primero obtener el post sin el autor
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error || !post) {
      return {
        title: 'Artículo no encontrado | Blog Holistia',
        description: 'El artículo que buscas no está disponible.',
      };
    }

    // Intentar obtener el autor desde professional_applications
    let authorName = 'Holistia';
    let authorProfession = 'Equipo Holistia';

    if (post.author_id) {
      const { data: professionalAuthor } = await supabase
        .from('professional_applications')
        .select('first_name, last_name, profession')
        .eq('user_id', post.author_id)
        .eq('status', 'approved')
        .single();

      if (professionalAuthor) {
        authorName = `${professionalAuthor.first_name} ${professionalAuthor.last_name}`;
        authorProfession = professionalAuthor.profession;
      } else {
        // If not found in professionals, try to get from profiles table
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, type')
          .eq('id', post.author_id)
          .single();

        if (profileData) {
          authorName = `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || 'Holistia';
          authorProfession = profileData.type === 'Admin' || profileData.type === 'admin' ? 'Equipo Holistia' : 'Colaborador';
        }
      }
    }

    const blogPost = {
      ...post,
      author: {
        name: authorName,
        profession: authorProfession,
      },
    };

    return generateBlogMetadata(blogPost);
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Error | Blog Holistia',
      description: 'Error al cargar el artículo.',
    };
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  try {
    // Fetch the specific post without author join
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (postError || !post) {
      notFound();
    }

    // Fetch author info if author_id exists
    let authorInfo = undefined;
    if (post.author_id) {
      // Try to get from professional_applications first (including non-approved ones for link purposes)
      // Try by user_id first (most common case)
      let professionalAuthor = null;
      const { data: professionalByUserId, error: professionalAuthorError } = await supabase
        .from('professional_applications')
        .select('id, first_name, last_name, profession, profile_photo, slug, status')
        .eq('user_id', post.author_id)
        .maybeSingle();

      // Manejar error PGRST116 (no rows found) - es normal si el autor no es un profesional
      if (professionalAuthorError && professionalAuthorError.code !== 'PGRST116') {
        console.error('Error fetching professional author:', professionalAuthorError);
      }

      professionalAuthor = professionalByUserId;

      // If not found by user_id, try by id directly (in case author_id points to professional_applications.id)
      if (!professionalAuthor) {
        const { data: professionalById } = await supabase
          .from('professional_applications')
          .select('id, first_name, last_name, profession, profile_photo, slug, status')
          .eq('id', post.author_id)
          .maybeSingle();
        
        professionalAuthor = professionalById;
      }

      if (professionalAuthor) {
        // Generate slug if not available
        const generatedSlug = professionalAuthor.slug || 
          `${professionalAuthor.first_name?.toLowerCase() || ''}-${professionalAuthor.last_name?.toLowerCase() || ''}-${professionalAuthor.id}`.replace(/\s+/g, '-');
        
        authorInfo = {
          name: `${professionalAuthor.first_name} ${professionalAuthor.last_name}`,
          profession: professionalAuthor.profession,
          avatar: professionalAuthor.profile_photo,
          professionalId: professionalAuthor.id,
          professionalSlug: generatedSlug,
          isProfessional: professionalAuthor.status === 'approved', // Solo es "profesional" si está aprobado
        };
      } else {
        // If not found in professionals, try to get from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, type, avatar_url')
          .eq('id', post.author_id)
          .maybeSingle();

        // Manejar error PGRST116 (no rows found) - es normal si el perfil no existe
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching profile:', profileError);
        }

        if (profileData) {
          // Try one more time to find professional by matching name from profile
          const fullName = `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim();
          if (fullName) {
            // Try exact match first (case-insensitive)
            let professionalByName = null;
            const { data: exactMatch } = await supabase
              .from('professional_applications')
              .select('id, slug, first_name, last_name, profession, profile_photo')
              .ilike('first_name', profileData.first_name || '')
              .ilike('last_name', profileData.last_name || '')
              .maybeSingle();
            
            professionalByName = exactMatch;

            // If still no match, try searching all professionals and match by full name
            if (!professionalByName) {
              const { data: allProfessionals } = await supabase
                .from('professional_applications')
                .select('id, slug, first_name, last_name, profession, profile_photo')
                .limit(1000); // Limitar para no sobrecargar
              
              // Find the best match by comparing full names
              if (allProfessionals && allProfessionals.length > 0) {
                const normalizedFullName = fullName.toLowerCase().trim();
                professionalByName = allProfessionals.find(p => {
                  const profFullName = `${p.first_name} ${p.last_name}`.toLowerCase().trim();
                  return profFullName === normalizedFullName;
                });
              }
            }
            
            if (professionalByName) {
              const generatedSlug = professionalByName.slug || 
                `${professionalByName.first_name?.toLowerCase() || profileData.first_name?.toLowerCase() || ''}-${professionalByName.last_name?.toLowerCase() || profileData.last_name?.toLowerCase() || ''}-${professionalByName.id}`.replace(/\s+/g, '-');
              
              authorInfo = {
                name: fullName || 'Holistia',
                profession: professionalByName.profession || (profileData.type === 'Admin' || profileData.type === 'admin' ? 'Equipo Holistia' : 'Colaborador'),
                avatar: professionalByName.profile_photo || profileData.avatar_url || undefined,
                professionalId: professionalByName.id,
                professionalSlug: generatedSlug,
                isProfessional: true,
              };
            } else {
              // Even if not found as professional, if we have a profile, we can still try to create a link
              // by searching in professional_applications with a more lenient search
              const firstName = (profileData.first_name || '').split(' ')[0];
              const lastName = (profileData.last_name || '').split(' ')[0];
              const { data: lenientMatch } = await supabase
                .from('professional_applications')
                .select('id, slug, first_name, last_name')
                .or(`first_name.ilike.%${firstName}%,last_name.ilike.%${lastName}%`)
                .limit(10);
              
              if (lenientMatch && lenientMatch.length > 0) {
                // Try to find the best match
                const bestMatch = lenientMatch.find(p => {
                  const profFullName = `${p.first_name} ${p.last_name}`.toLowerCase();
                  return profFullName.includes(fullName.toLowerCase()) || fullName.toLowerCase().includes(profFullName);
                });
                
                if (bestMatch) {
                  const generatedSlug = bestMatch.slug || 
                    `${bestMatch.first_name?.toLowerCase() || ''}-${bestMatch.last_name?.toLowerCase() || ''}-${bestMatch.id}`.replace(/\s+/g, '-');
                  
                  authorInfo = {
                    name: fullName || 'Holistia',
                    profession: profileData.type === 'Admin' || profileData.type === 'admin' ? 'Equipo Holistia' : 'Colaborador',
                    avatar: profileData.avatar_url || undefined,
                    professionalId: bestMatch.id,
                    professionalSlug: generatedSlug,
                    isProfessional: true,
                  };
                } else {
                  authorInfo = {
                    name: fullName || 'Holistia',
                    profession: profileData.type === 'Admin' || profileData.type === 'admin' ? 'Equipo Holistia' : 'Colaborador',
                    avatar: profileData.avatar_url || undefined,
                    isProfessional: false,
                  };
                }
              } else {
                authorInfo = {
                  name: fullName || 'Holistia',
                  profession: profileData.type === 'Admin' || profileData.type === 'admin' ? 'Equipo Holistia' : 'Colaborador',
                  avatar: profileData.avatar_url || undefined,
                  isProfessional: false,
                };
              }
            }
          } else {
            authorInfo = {
              name: 'Holistia',
              profession: 'Equipo Holistia',
              avatar: profileData.avatar_url || undefined,
              isProfessional: false,
            };
          }
        } else {
          // Use default if not found anywhere
          authorInfo = {
            name: 'Holistia',
            profession: 'Equipo Holistia',
            avatar: undefined,
            isProfessional: false,
          };
        }
      }
    }

    // Fetch related posts
    const { data: relatedPosts } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .neq('id', post.id)
      .limit(3)
      .order('published_at', { ascending: false });

    // Fetch authors for related posts
    const relatedBlogPosts = await Promise.all(
      (relatedPosts || []).map(async (relatedPost) => {
        let relatedAuthorInfo = undefined;

        if (relatedPost.author_id) {
          const { data: professionalAuthor, error: relatedProfessionalError } = await supabase
            .from('professional_applications')
            .select('first_name, last_name, profession')
            .eq('user_id', relatedPost.author_id)
            .eq('status', 'approved')
            .maybeSingle();

          // Manejar error PGRST116 (no rows found) - es normal si el autor no es un profesional
          if (relatedProfessionalError && relatedProfessionalError.code !== 'PGRST116') {
            console.error('Error fetching related professional author:', relatedProfessionalError);
          }

          if (professionalAuthor) {
            relatedAuthorInfo = {
              name: `${professionalAuthor.first_name} ${professionalAuthor.last_name}`,
              profession: professionalAuthor.profession,
            };
          } else {
            // If not found in professionals, try to get from profiles table
            const { data: profileData, error: relatedProfileError } = await supabase
              .from('profiles')
              .select('id, first_name, last_name, type')
              .eq('id', relatedPost.author_id)
              .maybeSingle();

            // Manejar error PGRST116 (no rows found) - es normal si el perfil no existe
            if (relatedProfileError && relatedProfileError.code !== 'PGRST116') {
              console.error('Error fetching related profile:', relatedProfileError);
            }

            if (profileData) {
              relatedAuthorInfo = {
                name: `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || 'Holistia',
                profession: profileData.type === 'Admin' || profileData.type === 'admin' ? 'Equipo Holistia' : 'Colaborador',
              };
            }
          }
        }

        return {
          ...relatedPost,
          author: relatedAuthorInfo,
        };
      })
    );

    const blogPost = {
      ...post,
      author: authorInfo,
    };

    const structuredData = generateStructuredData('blog', blogPost);

    return (
      <>
        <StructuredData data={structuredData} />
        <BlogPostClient
          post={blogPost}
          relatedPosts={relatedBlogPosts}
        />
      </>
    );
  } catch (error) {
    console.error('Error fetching blog post:', error);
    notFound();
  }
}