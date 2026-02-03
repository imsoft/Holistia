import { MetadataRoute } from 'next';
import { BASE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/feed', '/feed/post/'],
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/dashboard/',
          '/patient/',
          '/professional/',
          '/private/',
          '/_next/',
          '/_vercel/',
          '/teams/',
          '/profile/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: ['/', '/feed', '/feed/post/'],
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/dashboard/',
          '/patient/',
          '/professional/',
          '/private/',
          '/_next/',
          '/_vercel/',
          '/teams/',
          '/profile/',
        ],
        crawlDelay: 0,
      },
      {
        userAgent: 'Bingbot',
        allow: ['/', '/feed', '/feed/post/'],
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/dashboard/',
          '/patient/',
          '/professional/',
          '/private/',
          '/_next/',
          '/_vercel/',
          '/teams/',
          '/profile/',
        ],
        crawlDelay: 0,
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
