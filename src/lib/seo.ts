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
  description: 'Plataforma líder de salud integral en México. Conecta con psicólogos certificados, terapeutas, coaches y nutriólogos. Consultas presenciales y online. Reserva tu cita hoy y transforma tu bienestar.',
  keywords: [
    'salud mental México',
    'psicólogos certificados México',
    'terapeutas México',
    'consultas psicológicas online',
    'terapia online México',
    'coaching México',
    'nutriólogos certificados',
    'bienestar integral',
    'salud emocional',
    'terapia psicológica',
    'consultas presenciales',
    'consultas virtuales',
    'eventos de bienestar',
    'talleres de salud mental',
    'workshops bienestar',
    'meditación guiada',
    'mindfulness México',
    'programas de bienestar',
    'programas de meditación',
    'ebooks salud mental',
    'cursos online bienestar',
    'recursos digitales salud',
    'retos de bienestar',
    'desafíos personales',
    'transformación personal',
    'hábitos saludables',
    'crecimiento personal',
    'desarrollo personal',
    'terapia cognitivo conductual',
    'psicoterapia México',
    'ansiedad y depresión',
    'estrés laboral',
    'autoestima',
    'relaciones interpersonales',
    'bienestar corporativo',
    'salud mental empresarial'
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
  
  const url = `${BASE_URL}/explore/professional/${professional.slug}`;
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
  
  const url = `${BASE_URL}/explore/event/${event.slug}`;
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
    logo: {
      '@type': 'ImageObject',
      url: `${BASE_URL}/logos/holistia-black.png`,
      width: '512',
      height: '512'
    },
    description: 'Plataforma de salud integral que conecta usuarios con expertos certificados en México. Consultas presenciales y en línea.',
    slogan: 'Tu bienestar, nuestra prioridad',
    foundingDate: '2024',
    areaServed: {
      '@type': 'Country',
      name: 'México'
    },
    sameAs: [
      'https://facebook.com/holistia',
      'https://instagram.com/holistia_mx',
      'https://twitter.com/holistia_mx',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+52-55-1234-5678',
      contactType: 'customer service',
      availableLanguage: ['Spanish', 'Español'],
      areaServed: 'MX'
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
        url: `${BASE_URL}/explore/professional/${professionalData.slug}`,
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
        url: `${BASE_URL}/explore/event/${eventData.slug}`,
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

// Función para generar FAQ Schema
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  });
}

// Función para generar Local Business Schema
export function generateLocalBusinessSchema(): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    name: 'Holistia',
    image: `${BASE_URL}/logos/holistia-black.png`,
    '@id': BASE_URL,
    url: BASE_URL,
    telephone: '+52-55-1234-5678',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'MX',
      addressLocality: 'México'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 19.4326,
      longitude: -99.1332
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday'
      ],
      opens: '09:00',
      closes: '20:00'
    },
    sameAs: [
      'https://facebook.com/holistia',
      'https://instagram.com/holistia_mx',
      'https://twitter.com/holistia_mx'
    ],
    priceRange: '$$',
    paymentAccepted: ['Cash', 'Credit Card', 'Debit Card'],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '150'
    }
  });
}

// Función para generar Breadcrumb Schema
export function generateBreadcrumbSchema(breadcrumbs: Array<{ name: string; url: string }>): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  });
}

// =====================================================
// FUNCIONES PARA RETOS (CHALLENGES)
// =====================================================

export function generateChallengeMetadata({
  title,
  description,
  category,
  difficulty,
  durationDays,
  coverImage,
  slug,
  creatorName,
}: {
  title: string;
  description: string;
  category: string;
  difficulty: string;
  durationDays: number;
  coverImage?: string;
  slug: string;
  creatorName?: string;
}): Metadata {
  const pageTitle = `${title} - Reto de ${category} | Holistia`;
  const pageDescription = `${description} Dificultad: ${difficulty}. Duración: ${durationDays} días. ${creatorName ? `Creado por ${creatorName}.` : ''} Únete y transforma tu vida.`;

  const url = `${BASE_URL}/explore/challenge/${slug}`;
  const imageUrl = coverImage
    ? `${BASE_URL}/api/image?url=${encodeURIComponent(coverImage)}`
    : `${BASE_URL}/logos/holistia-og.png`;

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: [
      title,
      `reto de ${category}`,
      category,
      difficulty,
      `${durationDays} días`,
      'desafío personal',
      'hábitos saludables',
      'transformación',
      'bienestar',
    ],
    openGraph: {
      ...DEFAULT_SEO.openGraph,
      type: 'article',
      url,
      title: pageTitle,
      description: pageDescription,
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
      title: pageTitle,
      description: pageDescription,
      images: [imageUrl],
    },
    alternates: {
      canonical: url,
    },
  };
}

export function generateChallengeSchema({
  title,
  description,
  category,
  difficulty,
  durationDays,
  coverImage,
  slug,
  creatorName,
  price,
}: {
  title: string;
  description: string;
  category: string;
  difficulty: string;
  durationDays: number;
  coverImage?: string;
  slug: string;
  creatorName?: string;
  price?: number;
}): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: title,
    description: description,
    provider: {
      '@type': 'Organization',
      name: 'Holistia',
      url: BASE_URL,
    },
    url: `${BASE_URL}/explore/challenge/${slug}`,
    image: coverImage,
    courseCode: slug,
    teaches: category,
    educationalLevel: difficulty,
    timeRequired: `P${durationDays}D`,
    ...(price && {
      offers: {
        '@type': 'Offer',
        price: price,
        priceCurrency: 'MXN',
        availability: 'https://schema.org/InStock',
      },
    }),
    ...(creatorName && {
      author: {
        '@type': 'Person',
        name: creatorName,
      },
    }),
  });
}

// =====================================================
// FUNCIONES PARA COMERCIOS (SHOPS)
// =====================================================

interface ShopData {
  name: string;
  slug: string;
  description?: string;
  category?: string;
  city?: string;
  image_url?: string;
}

export function generateShopMetadata(shop: ShopData): Metadata {
  const title = `${shop.name} - Comercio de Bienestar | Holistia`;
  const description = shop.description 
    ? `${shop.description.substring(0, 150)}${shop.description.length > 150 ? '...' : ''}`
    : `Descubre ${shop.name}, comercio de ${shop.category || 'bienestar'} en ${shop.city || 'México'}. Productos naturales y de bienestar en Holistia.`;

  const url = `${BASE_URL}/explore/shop/${shop.slug}`;
  const imageUrl = shop.image_url
    ? `${BASE_URL}/api/image?url=${encodeURIComponent(shop.image_url)}`
    : `${BASE_URL}/logos/holistia-og.png`;

  return {
    title,
    description,
    keywords: [
      shop.name,
      shop.category || 'bienestar',
      shop.city || 'México',
      'comercio bienestar',
      'productos naturales',
      'tienda holística',
      'productos saludables',
    ],
    openGraph: {
      ...DEFAULT_SEO.openGraph,
      type: 'website',
      url,
      title,
      description,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: shop.name }],
    },
    twitter: {
      ...DEFAULT_SEO.twitter,
      title,
      description,
      images: [imageUrl],
    },
    alternates: { canonical: url },
  };
}

export function generateShopSchema(shop: ShopData): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: shop.name,
    description: shop.description,
    image: shop.image_url,
    url: `${BASE_URL}/explore/shop/${shop.slug}`,
    address: shop.city ? {
      '@type': 'PostalAddress',
      addressLocality: shop.city,
      addressCountry: 'MX',
    } : undefined,
  });
}

// =====================================================
// FUNCIONES PARA RESTAURANTES (RESTAURANTS)
// =====================================================

interface RestaurantData {
  name: string;
  slug: string;
  description?: string;
  cuisine_type?: string;
  price_range?: string;
  address?: string;
  image_url?: string;
}

export function generateRestaurantMetadata(restaurant: RestaurantData): Metadata {
  const title = `${restaurant.name} - Restaurante Saludable | Holistia`;
  const cuisineLabel = restaurant.cuisine_type || 'saludable';
  const description = restaurant.description 
    ? `${restaurant.description.substring(0, 150)}${restaurant.description.length > 150 ? '...' : ''}`
    : `Descubre ${restaurant.name}, restaurante de cocina ${cuisineLabel}. ${restaurant.price_range ? `Rango de precios: ${restaurant.price_range}.` : ''} Encuentra opciones saludables en Holistia.`;

  const url = `${BASE_URL}/explore/restaurant/${restaurant.slug}`;
  const imageUrl = restaurant.image_url
    ? `${BASE_URL}/api/image?url=${encodeURIComponent(restaurant.image_url)}`
    : `${BASE_URL}/logos/holistia-og.png`;

  return {
    title,
    description,
    keywords: [
      restaurant.name,
      cuisineLabel,
      'restaurante saludable',
      'comida saludable',
      'alimentación consciente',
      'restaurante vegano',
      'restaurante vegetariano',
      'comida orgánica',
    ],
    openGraph: {
      ...DEFAULT_SEO.openGraph,
      type: 'website',
      url,
      title,
      description,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: restaurant.name }],
    },
    twitter: {
      ...DEFAULT_SEO.twitter,
      title,
      description,
      images: [imageUrl],
    },
    alternates: { canonical: url },
  };
}

export function generateRestaurantSchema(restaurant: RestaurantData): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: restaurant.name,
    description: restaurant.description,
    image: restaurant.image_url,
    url: `${BASE_URL}/explore/restaurant/${restaurant.slug}`,
    servesCuisine: restaurant.cuisine_type,
    priceRange: restaurant.price_range,
    address: restaurant.address ? {
      '@type': 'PostalAddress',
      streetAddress: restaurant.address,
      addressCountry: 'MX',
    } : undefined,
  });
}

// =====================================================
// FUNCIONES PARA CENTROS HOLÍSTICOS (HOLISTIC CENTERS)
// =====================================================

interface HolisticCenterData {
  name: string;
  slug: string;
  description?: string;
  city?: string;
  address?: string;
  image_url?: string;
}

export function generateHolisticCenterMetadata(center: HolisticCenterData): Metadata {
  const title = `${center.name} - Centro Holístico | Holistia`;
  const description = center.description 
    ? `${center.description.substring(0, 150)}${center.description.length > 150 ? '...' : ''}`
    : `Descubre ${center.name}, centro holístico en ${center.city || 'México'}. Servicios de bienestar integral, terapias alternativas y más en Holistia.`;

  const url = `${BASE_URL}/explore/holistic-center/${center.slug}`;
  const imageUrl = center.image_url
    ? `${BASE_URL}/api/image?url=${encodeURIComponent(center.image_url)}`
    : `${BASE_URL}/logos/holistia-og.png`;

  return {
    title,
    description,
    keywords: [
      center.name,
      center.city || 'México',
      'centro holístico',
      'bienestar integral',
      'terapias alternativas',
      'spa holístico',
      'meditación',
      'yoga',
      'sanación',
    ],
    openGraph: {
      ...DEFAULT_SEO.openGraph,
      type: 'website',
      url,
      title,
      description,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: center.name }],
    },
    twitter: {
      ...DEFAULT_SEO.twitter,
      title,
      description,
      images: [imageUrl],
    },
    alternates: { canonical: url },
  };
}

export function generateHolisticCenterSchema(center: HolisticCenterData): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'HealthAndBeautyBusiness',
    name: center.name,
    description: center.description,
    image: center.image_url,
    url: `${BASE_URL}/explore/holistic-center/${center.slug}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: center.address,
      addressLocality: center.city,
      addressCountry: 'MX',
    },
  });
}

// =====================================================
// FUNCIONES PARA EQUIPOS (TEAMS)
// =====================================================

export function generateTeamMetadata({
  teamName,
  challengeTitle,
  memberCount,
  totalPoints,
  teamId,
}: {
  teamName: string;
  challengeTitle: string;
  memberCount: number;
  totalPoints?: number;
  teamId: string;
}): Metadata {
  const pageTitle = `Equipo ${teamName} - ${challengeTitle} | Holistia`;
  const pageDescription = `Equipo de ${memberCount} ${memberCount === 1 ? 'miembro' : 'miembros'} trabajando juntos en "${challengeTitle}". ${totalPoints ? `${totalPoints} puntos acumulados.` : ''} Únete y alcanza tus metas con apoyo grupal.`;

  const url = `${BASE_URL}/teams/${teamId}`;

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: [
      teamName,
      challengeTitle,
      'equipo',
      'reto en equipo',
      'motivación grupal',
      'trabajo en equipo',
      'apoyo mutuo',
    ],
    openGraph: {
      ...DEFAULT_SEO.openGraph,
      type: 'website',
      url,
      title: pageTitle,
      description: pageDescription,
    },
    twitter: {
      ...DEFAULT_SEO.twitter,
      title: pageTitle,
      description: pageDescription,
    },
    alternates: {
      canonical: url,
    },
    robots: {
      index: false, // Equipos no se indexan por privacidad
      follow: false,
    },
  };
}

export function generateTeamSchema({
  teamName,
  challengeTitle,
  memberCount,
  teamId,
}: {
  teamName: string;
  challengeTitle: string;
  memberCount: number;
  teamId: string;
}): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'SportsTeam',
    name: teamName,
    description: `Equipo trabajando en el reto "${challengeTitle}"`,
    url: `${BASE_URL}/teams/${teamId}`,
    numberOfMembers: memberCount,
    sport: challengeTitle,
  });
}

// =====================================================
// FUNCIONES PARA PERFILES DE USUARIO
// =====================================================

export function generateUserProfileMetadata({
  firstName,
  lastName,
  role,
  bio,
  avatarUrl,
  userId,
  totalChallenges,
  totalPoints,
}: {
  firstName: string;
  lastName: string;
  role: string;
  bio?: string;
  avatarUrl?: string;
  userId: string;
  totalChallenges?: number;
  totalPoints?: number;
}): Metadata {
  const fullName = `${firstName} ${lastName}`;
  const roleLabel = role === 'professional' ? 'Profesional' : 'Miembro';
  const pageTitle = `${fullName} - ${roleLabel} | Holistia`;
  const pageDescription = bio || `Perfil de ${fullName}, ${roleLabel.toLowerCase()} en Holistia. ${totalChallenges ? `${totalChallenges} retos completados.` : ''} ${totalPoints ? `${totalPoints} puntos ganados.` : ''}`;

  const url = `${BASE_URL}/profile/${userId}`;
  const imageUrl = avatarUrl
    ? `${BASE_URL}/api/image?url=${encodeURIComponent(avatarUrl)}`
    : `${BASE_URL}/logos/holistia-og.png`;

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: [
      fullName,
      roleLabel,
      'perfil',
      'usuario Holistia',
    ],
    openGraph: {
      ...DEFAULT_SEO.openGraph,
      type: 'profile',
      url,
      title: pageTitle,
      description: pageDescription,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: fullName,
        },
      ],
    },
    twitter: {
      ...DEFAULT_SEO.twitter,
      title: pageTitle,
      description: pageDescription,
      images: [imageUrl],
    },
    alternates: {
      canonical: url,
    },
    robots: {
      index: false, // Perfiles no se indexan por privacidad
      follow: false,
    },
  };
}

// =====================================================
// FUNCIONES PARA PROGRAMAS
// =====================================================

interface DigitalProductData {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  cover_image_url?: string;
  professional_id: string;
  sales_count?: number;
  professional?: {
    first_name: string;
    last_name: string;
    profession: string;
    slug: string;
  };
  created_at: string;
  updated_at: string;
}

export function generateDigitalProductMetadata(product: DigitalProductData): Metadata {
  const professionalName = product.professional 
    ? `${product.professional.first_name} ${product.professional.last_name}`
    : 'Profesional certificado';
  
  const categoryLabels: Record<string, string> = {
    meditation: 'Meditación',
    ebook: 'Ebook',
    manual: 'Manual',
    course: 'Curso',
    guide: 'Guía',
    audio: 'Audio',
    video: 'Video',
    other: 'Recurso'
  };

  const categoryLabel = categoryLabels[product.category] || product.category;
  const title = `${product.title} - ${categoryLabel} por ${professionalName} | Holistia`;
  const description = `${product.description.substring(0, 150)}${product.description.length > 150 ? '...' : ''} ${categoryLabel} creado por ${professionalName}. Precio: $${product.price} ${product.currency}. Descarga inmediata después del pago.`;

  const url = `${BASE_URL}/productos/${product.id}`;
  const imageUrl = product.cover_image_url
    ? `${BASE_URL}/api/image?url=${encodeURIComponent(product.cover_image_url)}`
    : `${BASE_URL}/logos/holistia-og.png`;

  return {
    title,
    description,
    keywords: [
      product.title,
      categoryLabel,
      professionalName,
      'programa',
      'programa de bienestar',
      'meditación guiada',
      'ebook salud mental',
      'curso online',
      'recursos digitales',
      'descarga inmediata',
      'bienestar integral',
      'crecimiento personal',
    ],
    openGraph: {
      ...DEFAULT_SEO.openGraph,
      type: 'website',
      url,
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: product.title,
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

export function generateDigitalProductSchema(product: DigitalProductData): string {
  const professionalName = product.professional 
    ? `${product.professional.first_name} ${product.professional.last_name}`
    : 'Profesional certificado';

  const categoryLabels: Record<string, string> = {
    meditation: 'Meditación',
    ebook: 'Ebook',
    manual: 'Manual',
    course: 'Curso',
    guide: 'Guía',
    audio: 'Audio',
    video: 'Video',
    other: 'Recurso Digital'
  };

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: product.cover_image_url,
    brand: {
      '@type': 'Organization',
      name: 'Holistia',
    },
    category: categoryLabels[product.category] || product.category,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency,
      availability: 'https://schema.org/InStock',
      url: `${BASE_URL}/productos/${product.id}`,
      seller: {
        '@type': 'Person',
        name: professionalName,
        jobTitle: product.professional?.profession || 'Profesional de bienestar',
      },
    },
    manufacturer: {
      '@type': 'Person',
      name: professionalName,
    },
    aggregateRating: product.sales_count && product.sales_count > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: '4.5',
      reviewCount: product.sales_count.toString(),
    } : undefined,
  });
}

// =====================================================
// FUNCIONES PARA FEED SOCIAL
// =====================================================

export function generateFeedPostMetadata({
  userName,
  challengeTitle,
  notes,
  imageUrl,
  postId,
}: {
  userName: string;
  challengeTitle: string;
  notes?: string;
  imageUrl?: string;
  postId: string;
}): Metadata {
  const pageTitle = `${userName} - ${challengeTitle} | Holistia`;
  const pageDescription = notes || `${userName} completó un día del reto "${challengeTitle}". Descubre su progreso y únete a la comunidad.`;

  const url = `${BASE_URL}/feed/post/${postId}`;
  const ogImage = imageUrl
    ? `${BASE_URL}/api/image?url=${encodeURIComponent(imageUrl)}`
    : `${BASE_URL}/logos/holistia-og.png`;

  return {
    title: pageTitle,
    description: pageDescription,
    openGraph: {
      ...DEFAULT_SEO.openGraph,
      type: 'article',
      url,
      title: pageTitle,
      description: pageDescription,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${userName} - ${challengeTitle}`,
        },
      ],
    },
    twitter: {
      ...DEFAULT_SEO.twitter,
      title: pageTitle,
      description: pageDescription,
      images: [ogImage],
    },
    alternates: {
      canonical: url,
    },
  };
}
