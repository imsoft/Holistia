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
        .eq('id', post.author_id)
        .single();

      if (professionalAuthor) {
        authorName = `${professionalAuthor.first_name} ${professionalAuthor.last_name}`;
        authorProfession = professionalAuthor.profession;
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
      // Try to get from professional_applications first
      const { data: professionalAuthor } = await supabase
        .from('professional_applications')
        .select('id, first_name, last_name, profession, profile_photo')
        .eq('id', post.author_id)
        .single();

      if (professionalAuthor) {
        authorInfo = {
          name: `${professionalAuthor.first_name} ${professionalAuthor.last_name}`,
          profession: professionalAuthor.profession,
          avatar: professionalAuthor.profile_photo,
        };
      } else {
        // If not found in professionals, could be from auth.users
        // For now, use default
        authorInfo = {
          name: 'Holistia',
          profession: 'Equipo Holistia',
          avatar: undefined,
        };
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
          const { data: professionalAuthor } = await supabase
            .from('professional_applications')
            .select('first_name, last_name, profession')
            .eq('id', relatedPost.author_id)
            .single();

          if (professionalAuthor) {
            relatedAuthorInfo = {
              name: `${professionalAuthor.first_name} ${professionalAuthor.last_name}`,
              profession: professionalAuthor.profession,
            };
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