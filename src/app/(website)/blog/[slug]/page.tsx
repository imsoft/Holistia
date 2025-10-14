import { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { generateBlogMetadata, generateStructuredData } from '@/lib/seo';
import { StructuredData } from '@/components/seo/structured-data';
import { BlogPostClient } from './blog-post-client';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt?: string;
  published_at: string;
  updated_at: string;
  created_at: string;
  status: string;
  featured_image?: string;
  author_id?: string;
  author?: {
    first_name: string;
    last_name: string;
    profession: string;
    profile_photo?: string;
  };
}

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  try {
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select(`
        *,
        author:professional_applications!author_id(
          first_name,
          last_name,
          profession,
          profile_photo
        )
      `)
      .eq('slug', slug)
      .eq('status', 'published')
        .single();

    if (error || !post) {
      return {
        title: 'Artículo no encontrado | Blog Holistia',
        description: 'El artículo que buscas no está disponible.',
      };
    }

    const blogPost = {
      ...post,
      author: post.author ? {
        name: `${post.author.first_name} ${post.author.last_name}`,
        profession: post.author.profession,
      } : undefined,
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
    // Fetch the specific post with author info
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select(`
        *,
        author:professional_applications!author_id(
          id,
          first_name,
          last_name,
          profession,
          profile_photo
        )
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (postError || !post) {
      notFound();
    }

    // Fetch related posts
    const { data: relatedPosts } = await supabase
      .from('blog_posts')
      .select(`
        *,
        author:professional_applications!author_id(
          first_name,
          last_name,
          profession
        )
      `)
      .eq('status', 'published')
      .neq('id', post.id)
      .limit(3)
      .order('published_at', { ascending: false });

    const blogPost = {
      ...post,
      author: post.author ? {
        name: `${post.author.first_name} ${post.author.last_name}`,
        profession: post.author.profession,
        avatar: post.author.profile_photo,
      } : undefined,
    };

    const relatedBlogPosts = (relatedPosts || []).map((relatedPost: BlogPost) => ({
      ...relatedPost,
      author: relatedPost.author ? {
        name: `${relatedPost.author.first_name} ${relatedPost.author.last_name}`,
        profession: relatedPost.author.profession,
      } : undefined,
    }));

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