import { Metadata } from 'next';

// Tipos para SEO
interface ProfessionalData {
  first_name: string;
  last_name: string;
  profession: string;
  bio?: string;
  slug: string;
  profile_photo?: string;
  wellness_areas?: string[];
}

interface EventData {
  title: string;
  description?: string;
  slug: string;
  event_date: string;
  featured_image?: string;
  created_at: string;
  updated_at: string;
}

interface BlogPostData {
  title: string;
  excerpt?: string;
  content: string;
  slug: string;
  published_at: string;
  updated_at: string;
  featured_image?: string;
  author?: {
    name: string;
    profession: string;
  };
}

interface StructuredDataInput {
  name?: string;
  description?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
  };
}

// Base URL para la aplicación
export const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://holistia.io';

// Metadatos por defecto para SEO
export const DEFAULT_SEO: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    template: '%s | Holistia',
    default: 'Holistia - Plataforma de Salud Integral y Bienestar',
  },
  description: 'Conecta con expertos certificados en México. Consultas presenciales y en línea para tu bienestar integral. Psicólogos, terapeutas, coaches y más.',
  keywords: [
    'salud mental',
    'bienestar',
    'psicólogos México',
    'terapeutas',
    'coaching',
    'consultas online',
    'salud integral',
    'terapia psicológica',
    'bienestar emocional',
    'expertos',
    'consultas presenciales',
    'eventos de bienestar',
    'workshops',
    'meditación',
    'mindfulness'
  ],
  authors: [{ name: 'Holistia' }],
  creator: 'Holistia',
  publisher: 'Holistia',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    url: BASE_URL,
    siteName: 'Holistia',
    images: [
      {
        url: `${BASE_URL}/logos/holistia-og.png`,
        width: 1200,
        height: 630,
        alt: 'Holistia - Plataforma de Salud Integral',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@holistia_mx',
    creator: '@holistia_mx',
    images: [`${BASE_URL}/logos/holistia-og.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
  },
};

// Función para generar metadata de páginas estáticas
export function generateStaticMetadata({
  title,
  description,
  keywords = [],
  image,
  path,
  type = 'website',
}: {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  path: string;
  type?: 'website' | 'article';
}): Metadata {
  const url = `${BASE_URL}${path}`;
  const imageUrl = image ? `${BASE_URL}${image}` : `${BASE_URL}/logos/holistia-og.png`;

  return {
    title,
    description,
    keywords: [...DEFAULT_SEO.keywords!, ...keywords],
    openGraph: {
      ...DEFAULT_SEO.openGraph,
      type,
      url,
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      ...DEFAULT_SEO.twitter,
      title,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: url,
    },
  };
}

// Función para generar metadata de profesionales
export function generateProfessionalMetadata(professional: ProfessionalData): Metadata {
  const fullName = `${professional.first_name} ${professional.last_name}`;
  const title = `${fullName} - ${professional.profession} | Holistia`;
  const description = `Consulta con ${fullName}, ${professional.profession} certificado en Holistia. ${professional.bio || `Especialista en ${professional.profession.toLowerCase()} con amplia experiencia.`} Reserva tu cita ahora.`;
  
  const path = `/patient/[id]/explore/professional/${professional.slug}`;
  const url = `${BASE_URL}${path}`;
  const imageUrl = professional.profile_photo 
    ? `${BASE_URL}/api/image?url=${encodeURIComponent(professional.profile_photo)}`
    : `${BASE_URL}/logos/holistia-og.png`;

  return {
    title,
    description,
    keywords: [
      professional.profession,
      professional.first_name,
      professional.last_name,
      'consulta online',
      'consulta presencial',
      'profesional certificado',
      'salud mental',
      'bienestar',
      ...(professional.wellness_areas || []),
    ],
    openGraph: {
      ...DEFAULT_SEO.openGraph,
      type: 'profile',
      url,
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${fullName} - ${professional.profession}`,
        },
      ],
    },
    twitter: {
      ...DEFAULT_SEO.twitter,
      title,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: url,
    },
  };
}

// Función para generar metadata de eventos
export function generateEventMetadata(event: EventData): Metadata {
  const title = `${event.title} - Evento de Bienestar | Holistia`;
  const description = `${event.description || `Únete a nuestro evento de bienestar: ${event.title}`}. Fecha: ${new Date(event.event_date).toLocaleDateString('es-MX')}. Reserva tu lugar ahora en Holistia.`;
  
  const path = `/patient/[id]/explore/event/${event.slug}`;
  const url = `${BASE_URL}${path}`;
  const imageUrl = event.featured_image 
    ? `${BASE_URL}/api/image?url=${encodeURIComponent(event.featured_image)}`
    : `${BASE_URL}/logos/holistia-og.png`;

  return {
    title,
    description,
    keywords: [
      event.title,
      'evento de bienestar',
      'workshop',
      'salud mental',
      'bienestar',
      'eventos Holistia',
      'talleres',
      'meditación',
      'mindfulness',
      'crecimiento personal',
    ],
    openGraph: {
      ...DEFAULT_SEO.openGraph,
      type: 'article',
      url,
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: event.title,
        },
      ],
      publishedTime: event.created_at,
      modifiedTime: event.updated_at,
    },
    twitter: {
      ...DEFAULT_SEO.twitter,
      title,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: url,
    },
  };
}

// Función para generar metadata de artículos de blog
export function generateBlogMetadata(post: {
  title: string;
  excerpt?: string;
  content: string;
  slug: string;
  published_at: string;
  featured_image?: string;
  author?: {
    name: string;
    profession: string;
  };
}): Metadata {
  const title = `${post.title} | Blog Holistia`;
  const description = post.excerpt || post.content.substring(0, 160) + '...';
  
  const path = `/blog/${post.slug}`;
  const url = `${BASE_URL}${path}`;
  const imageUrl = post.featured_image 
    ? `${BASE_URL}/api/image?url=${encodeURIComponent(post.featured_image)}`
    : `${BASE_URL}/logos/holistia-og.png`;

  return {
    title,
    description,
    keywords: [
      post.title,
      'blog Holistia',
      'salud mental',
      'bienestar',
      'artículos de salud',
      'consejos de bienestar',
      ...(post.author ? [post.author.profession] : []),
    ],
    openGraph: {
      ...DEFAULT_SEO.openGraph,
      type: 'article',
      url,
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      publishedTime: post.published_at,
      authors: post.author ? [post.author.name] : undefined,
    },
    twitter: {
      ...DEFAULT_SEO.twitter,
      title,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: url,
    },
  };
}

// Función para generar datos estructurados JSON-LD
export function generateStructuredData(type: 'website' | 'professional' | 'event' | 'blog', data: StructuredDataInput | ProfessionalData | EventData | BlogPostData): string {
  const baseStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Holistia',
    url: BASE_URL,
    logo: `${BASE_URL}/logos/holistia-black.png`,
    description: 'Plataforma de salud integral que conecta usuarios con expertos certificados.',
    sameAs: [
      'https://facebook.com/holistia',
      'https://instagram.com/holistia_mx',
      'https://twitter.com/holistia_mx',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+52-55-1234-5678',
      contactType: 'customer service',
      availableLanguage: 'Spanish',
    },
  };

  switch (type) {
    case 'professional':
      const professionalData = data as ProfessionalData;
      return JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: `${professionalData.first_name} ${professionalData.last_name}`,
        jobTitle: professionalData.profession,
        description: professionalData.bio,
        image: professionalData.profile_photo,
        url: `${BASE_URL}/patient/[id]/explore/professional/${professionalData.slug}`,
        worksFor: {
          '@type': 'Organization',
          name: 'Holistia',
        },
        hasCredential: {
          '@type': 'EducationalOccupationalCredential',
          name: 'Profesional Certificado',
          credentialCategory: 'certification',
        },
      });

    case 'event':
      const eventData = data as EventData;
      return JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: eventData.title,
        description: eventData.description,
        startDate: eventData.event_date,
        image: eventData.featured_image,
        url: `${BASE_URL}/patient/[id]/explore/event/${eventData.slug}`,
        location: {
          '@type': 'Place',
          name: 'Evento Online',
        },
        organizer: {
          '@type': 'Organization',
          name: 'Holistia',
        },
      });

    case 'blog':
      const blogData = data as BlogPostData;
      return JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: blogData.title,
        description: blogData.excerpt,
        image: blogData.featured_image,
        datePublished: blogData.published_at,
        dateModified: blogData.updated_at,
        url: `${BASE_URL}/blog/${blogData.slug}`,
        author: blogData.author ? {
          '@type': 'Person',
          name: blogData.author.name,
          jobTitle: blogData.author.profession,
        } : undefined,
        publisher: {
          '@type': 'Organization',
          name: 'Holistia',
          logo: {
            '@type': 'ImageObject',
            url: `${BASE_URL}/logos/holistia-black.png`,
          },
        },
      });

    default:
      return JSON.stringify(baseStructuredData);
  }
}
