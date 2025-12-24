# Schema.org JSON-LD Implementation Examples

This document provides examples of how to implement Schema.org structured data (JSON-LD) for different pages in the Holistia platform.

## Table of Contents
- [Challenge Pages](#challenge-pages)
- [Team Pages](#team-pages)
- [User Profile Pages](#user-profile-pages)
- [Feed Post Pages](#feed-post-pages)
- [Implementation Pattern](#implementation-pattern)

---

## Challenge Pages

### Example: Challenge Detail Page

**File:** `src/app/(website)/challenges/[id]/page.tsx`

```typescript
import { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { generateChallengeMetadata, generateChallengeSchema } from '@/lib/seo';
import { StructuredData } from '@/components/seo/structured-data';

interface ChallengePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ChallengePageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  try {
    const { data: challenge, error } = await supabase
      .from('challenges')
      .select(`
        *,
        professional:professional_applications(
          first_name,
          last_name,
          user_id
        )
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error || !challenge) {
      return {
        title: 'Reto no encontrado | Holistia',
        description: 'El reto que buscas no está disponible.',
      };
    }

    const creatorName = challenge.professional
      ? `${challenge.professional.first_name} ${challenge.professional.last_name}`
      : undefined;

    return generateChallengeMetadata({
      title: challenge.title,
      description: challenge.description,
      category: challenge.category || 'Bienestar',
      difficulty: challenge.difficulty_level || 'beginner',
      durationDays: challenge.duration_days || 30,
      coverImage: challenge.cover_image_url,
      challengeId: challenge.id,
      creatorName,
    });
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Error | Holistia',
      description: 'Error al cargar el reto.',
    };
  }
}

export default async function ChallengePage({ params }: ChallengePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  try {
    const { data: challenge, error } = await supabase
      .from('challenges')
      .select(`
        *,
        professional:professional_applications(
          first_name,
          last_name,
          user_id
        ),
        challenge_files(
          file_name,
          file_url,
          file_type,
          description
        )
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error || !challenge) {
      notFound();
    }

    // Generate Schema.org JSON-LD
    const creatorName = challenge.professional
      ? `${challenge.professional.first_name} ${challenge.professional.last_name}`
      : 'Holistia';

    const schemaData = generateChallengeSchema({
      title: challenge.title,
      description: challenge.description,
      category: challenge.category || 'Bienestar',
      difficulty: challenge.difficulty_level || 'beginner',
      durationDays: challenge.duration_days || 30,
      price: challenge.price,
      currency: challenge.currency,
      coverImage: challenge.cover_image_url,
      challengeId: challenge.id,
      creatorName,
      createdAt: challenge.created_at,
      updatedAt: challenge.updated_at,
    });

    return (
      <>
        <StructuredData data={schemaData} />

        {/* Challenge content here */}
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-4">{challenge.title}</h1>
          <p className="text-lg text-muted-foreground mb-8">{challenge.description}</p>

          {/* Rest of challenge UI */}
        </div>
      </>
    );
  } catch (error) {
    console.error('Error loading challenge:', error);
    notFound();
  }
}
```

### Generated Schema Output

```json
{
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "Reto de Meditación 21 Días",
  "description": "Transforma tu vida con 21 días de meditación guiada. Aprende técnicas de mindfulness y reduce el estrés.",
  "provider": {
    "@type": "Organization",
    "name": "Holistia",
    "url": "https://holistia.mx"
  },
  "hasCourseInstance": {
    "@type": "CourseInstance",
    "courseMode": "online",
    "duration": "P21D",
    "instructor": {
      "@type": "Person",
      "name": "María García"
    }
  },
  "offers": {
    "@type": "Offer",
    "price": "499.00",
    "priceCurrency": "MXN",
    "availability": "https://schema.org/InStock",
    "url": "https://holistia.mx/challenges/abc-123"
  },
  "image": "https://example.com/challenge-cover.jpg",
  "url": "https://holistia.mx/challenges/abc-123",
  "datePublished": "2025-01-15T10:00:00Z",
  "dateModified": "2025-01-20T14:30:00Z",
  "courseLevel": "Principiante",
  "category": "Mindfulness"
}
```

---

## Team Pages

### Example: Team Detail Page

**File:** `src/app/(dashboard)/teams/[id]/page.tsx`

```typescript
import { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { generateTeamMetadata } from '@/lib/seo';

interface TeamPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: TeamPageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  try {
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        title: 'Acceso Restringido | Holistia',
        description: 'Debes iniciar sesión para ver este contenido.',
        robots: { index: false, follow: false },
      };
    }

    const { data: team, error } = await supabase
      .from('challenge_teams')
      .select(`
        *,
        challenge:challenges(title, category),
        members:team_members(count)
      `)
      .eq('id', id)
      .single();

    if (error || !team) {
      return {
        title: 'Equipo no encontrado | Holistia',
        description: 'El equipo que buscas no está disponible.',
        robots: { index: false, follow: false },
      };
    }

    return generateTeamMetadata({
      teamName: team.name,
      challengeTitle: team.challenge?.title || 'Reto',
      memberCount: team.members?.[0]?.count || 0,
      teamId: team.id,
    });
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Error | Holistia',
      description: 'Error al cargar el equipo.',
      robots: { index: false, follow: false },
    };
  }
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Require authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Teams are private - NO Schema.org markup needed
  // Just render the team content for authenticated users

  // ... rest of page implementation
}
```

**Note:** Team pages should **NOT** include Schema.org JSON-LD because they are private content. The metadata already includes `robots: { index: false }`.

---

## User Profile Pages

### Example: Public User Profile Page

**File:** `src/app/(website)/profile/[username]/page.tsx`

```typescript
import { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { generateUserProfileMetadata } from '@/lib/seo';

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        *,
        privacy:privacy_settings(profile_visibility)
      `)
      .eq('username', username)
      .single();

    if (error || !profile) {
      return {
        title: 'Perfil no encontrado | Holistia',
        description: 'El perfil que buscas no está disponible.',
        robots: { index: false, follow: false },
      };
    }

    // Check privacy settings
    const isPrivate = profile.privacy?.[0]?.profile_visibility !== 'public';

    return generateUserProfileMetadata({
      username: profile.username || username,
      fullName: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
      bio: profile.bio,
      avatarUrl: profile.avatar_url,
      userId: profile.id,
      isPrivate,
    });
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Error | Holistia',
      description: 'Error al cargar el perfil.',
      robots: { index: false, follow: false },
    };
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const supabase = await createClient();

  // ... fetch profile and check privacy settings
  // Profiles are generally private - NO Schema.org markup needed

  // ... rest of page implementation
}
```

**Note:** User profiles should **NOT** include Schema.org JSON-LD unless they are public professional profiles. The metadata includes `robots: { index: false }` for private profiles.

---

## Feed Post Pages

### Example: Individual Feed Post Page

**File:** `src/app/(dashboard)/feed/post/[id]/page.tsx`

```typescript
import { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { generateFeedPostMetadata } from '@/lib/seo';

interface FeedPostPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: FeedPostPageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  try {
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        title: 'Acceso Restringido | Holistia',
        description: 'Debes iniciar sesión para ver este contenido.',
        robots: { index: false, follow: false },
      };
    }

    const { data: post, error } = await supabase
      .from('challenge_checkins')
      .select(`
        *,
        user:profiles(first_name, last_name, username, avatar_url),
        challenge:challenges(title)
      `)
      .eq('id', id)
      .single();

    if (error || !post) {
      return {
        title: 'Publicación no encontrada | Holistia',
        description: 'La publicación que buscas no está disponible.',
        robots: { index: false, follow: false },
      };
    }

    const authorName = post.user
      ? `${post.user.first_name || ''} ${post.user.last_name || ''}`.trim()
      : 'Usuario';

    return generateFeedPostMetadata({
      content: post.notes || post.evidence_description || 'Publicación en el feed',
      authorName,
      authorUsername: post.user?.username,
      challengeTitle: post.challenge?.title,
      imageUrl: post.evidence_url,
      postId: post.id,
      createdAt: post.created_at,
    });
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Error | Holistia',
      description: 'Error al cargar la publicación.',
      robots: { index: false, follow: false },
    };
  }
}

export default async function FeedPostPage({ params }: FeedPostPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Require authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Feed posts are private - NO Schema.org markup needed

  // ... rest of page implementation
}
```

**Note:** Feed posts should **NOT** include Schema.org JSON-LD because they are user-generated content behind authentication. The metadata includes `robots: { index: false }`.

---

## Implementation Pattern

### Standard Pattern for All Pages

1. **Create `generateMetadata` function** - Uses the SEO helper functions from `/src/lib/seo.ts`
2. **Check authentication/privacy** - For private content, return metadata with `robots: { index: false }`
3. **Generate Schema.org JSON-LD** (only for public content) - Use the schema helper functions
4. **Include `<StructuredData>` component** - Only on public pages that should be indexed

### Public vs Private Content

| Content Type | Include Schema.org? | Index in Search? | Reasoning |
|--------------|---------------------|------------------|-----------|
| Challenges (Active) | ✅ Yes | ✅ Yes | Public course offerings that should be discovered |
| Blog Posts | ✅ Yes | ✅ Yes | Public content marketing |
| Teams | ❌ No | ❌ No | Private user groups |
| User Profiles | ❌ No | ❌ No | Privacy-protected user data |
| Feed Posts | ❌ No | ❌ No | Private user-generated content |
| Professional Profiles | ✅ Yes | ✅ Yes | Public directory listings |

### Where Schema Functions are Defined

All Schema.org helper functions are located in:
- **File:** `/src/lib/seo.ts`
- **Functions:**
  - `generateChallengeMetadata()` - Open Graph metadata for challenges
  - `generateChallengeSchema()` - Schema.org Course JSON-LD for challenges
  - `generateTeamMetadata()` - Metadata for teams (private, noindex)
  - `generateUserProfileMetadata()` - Metadata for user profiles (private, noindex)
  - `generateFeedPostMetadata()` - Metadata for feed posts (private, noindex)

### StructuredData Component

The `<StructuredData>` component is a simple wrapper that renders JSON-LD:

**File:** `/src/components/seo/structured-data.tsx`

```typescript
interface StructuredDataProps {
  data: string;
}

export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: data }}
    />
  );
}
```

**Usage:**
```typescript
const schemaData = generateChallengeSchema({ /* ... */ });
return (
  <>
    <StructuredData data={schemaData} />
    {/* Rest of page content */}
  </>
);
```

---

## Testing Schema Markup

### Google Rich Results Test

1. Visit: https://search.google.com/test/rich-results
2. Enter your page URL or paste HTML
3. Verify that Google recognizes the Course schema

### Expected Results for Challenges

- **Type:** Course
- **Provider:** Holistia
- **Price:** Displayed correctly
- **Duration:** P21D format (ISO 8601)
- **Image:** Valid URL
- **Instructor:** Creator name

### Common Issues

1. **Missing required fields** - Ensure all required Course properties are included
2. **Invalid duration format** - Must use ISO 8601 (e.g., "P21D" for 21 days)
3. **Invalid price** - Must be numeric string (e.g., "499.00")
4. **Invalid image URL** - Must be absolute URL, not relative

---

## Next Steps

1. **Create public challenge pages** - Implement the challenge detail page at `/challenges/[id]`
2. **Add to sitemap** - Already done in `/src/app/sitemap.ts`
3. **Test in Google Search Console** - Submit URLs and monitor indexing
4. **Monitor performance** - Track clicks, impressions, and CTR in Search Console

---

## References

- [Schema.org Course](https://schema.org/Course)
- [Google Course Structured Data](https://developers.google.com/search/docs/appearance/structured-data/course)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
