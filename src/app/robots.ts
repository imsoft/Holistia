import { MetadataRoute } from 'next';
import { BASE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
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
          '/teams/', // Equipos son privados
          '/profile/', // Perfiles son privados
          '/feed/post/', // Posts individuales pueden ser privados
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
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
          '/feed/post/',
        ],
        crawlDelay: 0,
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
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
          '/feed/post/',
        ],
        crawlDelay: 0,
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
