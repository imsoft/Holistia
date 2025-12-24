import { MetadataRoute } from 'next';
import { createClient } from '@/utils/supabase/server';
import { BASE_URL } from '@/lib/seo';

interface ProfessionalSitemap {
  slug: string;
  updated_at: string;
}

interface EventSitemap {
  slug: string;
  updated_at: string;
  event_date: string;
}

interface BlogPostSitemap {
  slug: string;
  updated_at: string;
}

interface ChallengeSitemap {
  id: string;
  updated_at: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  
  // Páginas estáticas
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/history`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  try {
    // Obtener retos activos
    const { data: challenges } = await supabase
      .from('challenges')
      .select('id, updated_at')
      .eq('is_active', true);

    const challengePages: MetadataRoute.Sitemap = (challenges || []).map((challenge: ChallengeSitemap) => ({
      url: `${BASE_URL}/challenges/${challenge.id}`,
      lastModified: new Date(challenge.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    }));

    // Obtener profesionales aprobados
    const { data: professionals } = await supabase
      .from('professional_applications')
      .select('slug, updated_at')
      .eq('status', 'approved')
      .not('slug', 'is', null);

    const professionalPages: MetadataRoute.Sitemap = (professionals || []).map((professional: ProfessionalSitemap) => ({
      url: `${BASE_URL}/profesionales/${professional.slug}`,
      lastModified: new Date(professional.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    // Obtener eventos activos
    const { data: events } = await supabase
      .from('events_workshops')
      .select('slug, updated_at, event_date')
      .eq('is_active', true)
      .not('slug', 'is', null)
      .gte('event_date', new Date().toISOString());

    const eventPages: MetadataRoute.Sitemap = (events || []).map((event: EventSitemap) => ({
      url: `${BASE_URL}/eventos/${event.slug}`,
      lastModified: new Date(event.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    // Obtener artículos de blog publicados
    const { data: blogPosts } = await supabase
      .from('blog_posts')
      .select('slug, updated_at')
      .eq('status', 'published')
      .not('slug', 'is', null);

    const blogPages: MetadataRoute.Sitemap = (blogPosts || []).map((post: BlogPostSitemap) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.updated_at),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));

    return [...staticPages, ...challengePages, ...professionalPages, ...eventPages, ...blogPages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return staticPages;
  }
}
