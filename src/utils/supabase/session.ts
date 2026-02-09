import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function getCookieDomain(): string | undefined {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) return undefined;
    const host = new URL(siteUrl).hostname;

    if (host === "localhost" || host.endsWith(".localhost")) return undefined;
    if (host === "holistia.io" || host === "www.holistia.io" || host.endsWith(".holistia.io")) {
      return ".holistia.io";
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export async function updateSession(request: NextRequest) {
  try {
    let supabaseResponse = NextResponse.next({
      request,
    });

    // Verificar que las variables de entorno estén disponibles
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
      console.error('Missing Supabase environment variables');
      return supabaseResponse;
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            const cookieDomain = getCookieDomain();
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) => {
              const nextOptions = cookieDomain ? { ...options, domain: cookieDomain } : options;
              supabaseResponse.cookies.set(name, value, nextOptions);
            });
          },
        },
      }
    );

    // Rutas públicas que no requieren autenticación
    const publicPaths = [
      '/',
      '/login',
      '/signup',
      '/forgot-password',
      '/reset-password',
      '/confirm-password',
      '/confirm-email',
      '/account-deactivated',
      '/error',
      '/auth',
      '/explore',
      '/specialties',
      '/_next',
      '/favicon.ico',
      '/api',
      '/contact',
      '/help',
      '/privacy',
      '/terms',
      '/history',
      '/blog',
      '/become-professional',
      '/companies',
      '/robots.txt',
      '/sitemap.xml'
    ];

    const pathname = request.nextUrl.pathname;

    const isPublicPath = publicPaths.some(path =>
      pathname.startsWith(path)
    );

    // Redirigir URLs antiguas con IDs a nuevas URLs limpias (ANTES de verificaciones de autenticación)

    // Redirigir /patient/[id]/* a rutas limpias
    if (pathname.match(/^\/patient\/[^/]+(.*)$/)) {
      const match = pathname.match(/^\/patient\/[^/]+(.*)$/);
      const newPath = match ? match[1] || '/explore' : '/explore';
      const url = request.nextUrl.clone();
      url.pathname = newPath;
      return NextResponse.redirect(url);
    }

    // Redirigir /professional/[id]/* a rutas limpias
    if (pathname.match(/^\/professional\/[^/]+(.*)$/)) {
      const match = pathname.match(/^\/professional\/[^/]+(.*)$/);
      const newPath = match ? match[1] || '/dashboard' : '/dashboard';
      const url = request.nextUrl.clone();
      url.pathname = newPath;
      return NextResponse.redirect(url);
    }

    // Redirigir /admin/[id]/* a rutas limpias (solo si no es una ruta válida sin ID)
    const adminIdMatch = pathname.match(/^\/admin\/([^/]+)(.*)$/);
    if (adminIdMatch) {
      const firstSegment = adminIdMatch[1];
      const restPath = adminIdMatch[2] || '';

      const validAdminRoutes = [
        'dashboard', 'professionals', 'events', 'challenges', 'blog', 'users',
        'applications', 'analytics', 'finances', 'tickets', 'companies', 'shops',
        'restaurants', 'holistic-centers', 'digital-products',
        'certifications', 'services-costs', 'holistic-services', 'my-events',
        'sync-tools', 'github-commits', 'ai-agent'
      ];

      if (!validAdminRoutes.includes(firstSegment)) {
        const newPath = `/admin${restPath || '/dashboard'}`;
        const url = request.nextUrl.clone();
        url.pathname = newPath;
        return NextResponse.redirect(url);
      }
    }

    // IMPORTANTE: Llamar getUser() en TODAS las rutas para refrescar el JWT token.
    // Sin esto, el token expira silenciosamente en rutas públicas y el usuario
    // pierde la sesión al navegar a una ruta protegida.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Manejar la ruta raíz '/' de forma especial para usuarios autenticados
    // Si tiene ?home=true, permitir ver la landing page sin redirigir
    if (pathname === '/' && !request.nextUrl.searchParams.has('home')) {
      if (user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('type')
            .eq('id', user.id)
            .maybeSingle();

          if (profile) {
            const url = request.nextUrl.clone();

            if (profile.type === 'admin') {
              url.pathname = `/admin/dashboard`;
            } else if (profile.type === 'professional') {
              const { data: professionalApp } = await supabase
                .from('professional_applications')
                .select('id, status')
                .eq('user_id', user.id)
                .maybeSingle();

              if (professionalApp) {
                url.pathname = `/dashboard`;
              } else {
                url.pathname = `/explore`;
              }
            } else {
              url.pathname = `/explore`;
            }

            return NextResponse.redirect(url);
          }
        } catch (error) {
          console.error('Error checking user on home page:', error);
        }
      }

      return supabaseResponse;
    }

    // Si es una ruta pública, continuar (el token ya fue refrescado por getUser() arriba)
    if (isPublicPath) {
      return supabaseResponse;
    }

    // --- Rutas protegidas: verificar autenticación y permisos ---

    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // Verificar si el usuario está desactivado
    if (!pathname.startsWith("/account-deactivated")) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('account_active')
        .eq('id', user.id)
        .maybeSingle();

      if (profile && profile.account_active === false) {
        const url = request.nextUrl.clone();
        url.pathname = "/account-deactivated";
        return NextResponse.redirect(url);
      }
    }

    // Verificar permisos según tipo de usuario
    const { data: profile } = await supabase
      .from('profiles')
      .select('type')
      .eq('id', user.id)
      .maybeSingle();

    // Proteger rutas de admin
    if (pathname.startsWith('/admin/') && profile?.type !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/explore';
      return NextResponse.redirect(url);
    }

    // Proteger rutas de dashboard profesional
    if (pathname.startsWith('/dashboard') && profile?.type !== 'professional') {
      const { data: professionalApp } = await supabase
        .from('professional_applications')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .maybeSingle();

      if (!professionalApp) {
        const url = request.nextUrl.clone();
        url.pathname = '/explore';
        return NextResponse.redirect(url);
      }
    }

    return supabaseResponse;

  } catch (error) {
    console.error('Proxy error:', error);
    // En caso de error crítico, devolver una respuesta básica
    return NextResponse.next({ request });
  }
}
