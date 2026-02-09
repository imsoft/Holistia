import { MetadataRoute } from 'next';
import { createClient } from '@/utils/supabase/server';
import { BASE_URL } from '@/lib/seo';

interface SlugSitemap {
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

interface IdSitemap {
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
    // Páginas de exploración (listados)
    {
      url: `${BASE_URL}/explore/professionals`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/explore/events`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/explore/challenges`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/explore/programs`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/explore/shops`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/explore/restaurants`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/explore/holistic-centers`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    // Páginas de autenticación
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    // Páginas informativas
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/help`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/history`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/companies`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/feed`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/become-professional`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    // Páginas legales
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
      .select('slug, updated_at')
      .eq('is_active', true)
      .not('slug', 'is', null);

    const challengePages: MetadataRoute.Sitemap = (challenges || []).map((challenge: SlugSitemap) => ({
      url: `${BASE_URL}/explore/challenge/${challenge.slug}`,
      lastModified: new Date(challenge.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    }));

    // Obtener profesionales aprobados
    const { data: professionals } = await supabase
      .from('professional_applications')
      .select('slug, updated_at')
      .eq('status', 'approved')
      .eq('is_active', true)
      .not('slug', 'is', null);

    const professionalPages: MetadataRoute.Sitemap = (professionals || []).map((professional: SlugSitemap) => ({
      url: `${BASE_URL}/explore/professional/${professional.slug}`,
      lastModified: new Date(professional.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    }));

    // Obtener eventos activos
    const { data: events } = await supabase
      .from('events_workshops')
      .select('slug, updated_at, event_date')
      .eq('is_active', true)
      .not('slug', 'is', null)
      .gte('event_date', new Date().toISOString());

    const eventPages: MetadataRoute.Sitemap = (events || []).map((event: EventSitemap) => ({
      url: `${BASE_URL}/explore/event/${event.slug}`,
      lastModified: new Date(event.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    // Obtener comercios activos
    const { data: shops } = await supabase
      .from('shops')
      .select('slug, updated_at')
      .eq('is_active', true)
      .not('slug', 'is', null);

    const shopPages: MetadataRoute.Sitemap = (shops || []).map((shop: SlugSitemap) => ({
      url: `${BASE_URL}/explore/shop/${shop.slug}`,
      lastModified: new Date(shop.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    // Obtener restaurantes activos
    const { data: restaurants } = await supabase
      .from('restaurants')
      .select('slug, updated_at')
      .eq('is_active', true)
      .not('slug', 'is', null);

    const restaurantPages: MetadataRoute.Sitemap = (restaurants || []).map((restaurant: SlugSitemap) => ({
      url: `${BASE_URL}/explore/restaurant/${restaurant.slug}`,
      lastModified: new Date(restaurant.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    // Obtener centros holísticos activos
    const { data: holisticCenters } = await supabase
      .from('holistic_centers')
      .select('slug, updated_at')
      .eq('is_active', true)
      .not('slug', 'is', null);

    const holisticCenterPages: MetadataRoute.Sitemap = (holisticCenters || []).map((center: SlugSitemap) => ({
      url: `${BASE_URL}/explore/holistic-center/${center.slug}`,
      lastModified: new Date(center.updated_at),
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

    // Obtener productos digitales activos de profesionales verificados
    const { data: digitalProducts } = await supabase
      .from('digital_products')
      .select(`
        id,
        slug,
        updated_at,
        professional_applications!inner(
          is_verified,
          status
        )
      `)
      .eq('is_active', true)
      .eq('professional_applications.is_verified', true)
      .eq('professional_applications.status', 'approved');

    interface DigitalProductSitemap {
      id: string;
      slug?: string;
      updated_at: string;
    }

    const digitalProductPages: MetadataRoute.Sitemap = (digitalProducts || []).map((product: DigitalProductSitemap) => ({
      url: `${BASE_URL}/explore/program/${product.slug || product.id}`,
      lastModified: new Date(product.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    return [
      ...staticPages, 
      ...professionalPages,
      ...challengePages, 
      ...eventPages, 
      ...shopPages,
      ...restaurantPages,
      ...holisticCenterPages,
      ...blogPages, 
      ...digitalProductPages
    ];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return staticPages;
  }
}
