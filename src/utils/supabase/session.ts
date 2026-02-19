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

type RolePrefix = "patient" | "expert" | "admin" | null;

const VALID_ADMIN_ROUTES = [
  "dashboard",
  "professionals",
  "events",
  "challenges",
  "blog",
  "users",
  "applications",
  "analytics",
  "finances",
  "tickets",
  "companies",
  "shops",
  "restaurants",
  "holistic-centers",
  "digital-products",
  "certifications",
  "services-costs",
  "holistic-services",
  "my-events",
  "sync-tools",
  "github-commits",
  "ai-agent",
  "cron-sync-logs",
  "event-registrations",
] as const;

function startsWithSegment(pathname: string, segment: string): boolean {
  return pathname === segment || pathname.startsWith(`${segment}/`);
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeRolePath(pathname: string): { rolePrefix: RolePrefix; effectivePath: string } {
  if (pathname === "/patient" || pathname.startsWith("/patient/")) {
    const rest = pathname.slice("/patient".length);
    const effectivePath = !rest || rest === "/" ? "/explore" : rest;
    return { rolePrefix: "patient", effectivePath };
  }

  if (pathname === "/expert" || pathname.startsWith("/expert/")) {
    const rest = pathname.slice("/expert".length);
    const effectivePath = !rest || rest === "/" ? "/dashboard" : rest;
    return { rolePrefix: "expert", effectivePath };
  }

  if (pathname === "/admin") {
    return { rolePrefix: "admin", effectivePath: "/admin/dashboard" };
  }

  if (pathname.startsWith("/admin/")) {
    return { rolePrefix: "admin", effectivePath: pathname };
  }

  return { rolePrefix: null, effectivePath: pathname };
}

function isPatientPath(pathname: string): boolean {
  const patientPrefixes = [
    "/explore",
    "/feed",
    "/messages",
    "/my-challenges",
    "/my-products",
    "/my-registrations",
    "/notifications",
  ];

  if (patientPrefixes.some((prefix) => startsWithSegment(pathname, prefix))) {
    return true;
  }

  if (pathname.startsWith("/profile/")) {
    return true;
  }

  if (pathname === "/appointments/confirmation") {
    return true;
  }

  return /^\/appointments\/[^/]+\/(cancel|no-show|pay|reschedule)$/.test(pathname);
}

function isExpertPath(pathname: string): boolean {
  const expertPrefixes = [
    "/dashboard",
    "/appointments",
    "/availability",
    "/challenges",
    "/consultations",
    "/cotizaciones",
    "/digital-products",
    "/finances",
    "/gallery",
    "/my-events",
    "/patients",
    "/profile",
    "/schedule",
    "/services",
    "/settings",
    "/professional",
  ];

  return expertPrefixes.some((prefix) => startsWithSegment(pathname, prefix));
}

function getCanonicalRolePrefix(pathname: string): RolePrefix {
  if (startsWithSegment(pathname, "/admin")) {
    return "admin";
  }

  if (isPatientPath(pathname)) {
    return "patient";
  }

  if (isExpertPath(pathname)) {
    return "expert";
  }

  return null;
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
    const { rolePrefix, effectivePath } = normalizeRolePath(pathname);
    const canonicalRole = getCanonicalRolePrefix(effectivePath);

    if (pathname === "/patient" || pathname === "/patient/") {
      const url = request.nextUrl.clone();
      url.pathname = "/patient/explore";
      return NextResponse.redirect(url);
    }

    if (pathname === "/expert" || pathname === "/expert/") {
      const url = request.nextUrl.clone();
      url.pathname = "/expert/dashboard";
      return NextResponse.redirect(url);
    }

    const isPublicPath = publicPaths.some(path =>
      effectivePath.startsWith(path)
    );

    // Redirigir URLs antiguas con IDs a nuevas URLs limpias (ANTES de verificaciones de autenticación)

    // Redirigir /patient/[uuid]/* a nuevo formato /patient/*
    const legacyPatientMatch = pathname.match(/^\/patient\/([^/]+)(.*)$/);
    if (legacyPatientMatch && isUuid(legacyPatientMatch[1])) {
      const restPath = legacyPatientMatch[2] || "";
      const url = request.nextUrl.clone();
      url.pathname = restPath ? `/patient${restPath}` : "/patient/explore";
      return NextResponse.redirect(url);
    }

    // Redirigir /professional/[id]/* a nuevo formato /expert/*
    if (pathname.match(/^\/professional\/[^/]+(.*)$/)) {
      const match = pathname.match(/^\/professional\/[^/]+(.*)$/);
      const newPath = match ? match[1] || '/dashboard' : '/dashboard';
      const url = request.nextUrl.clone();
      url.pathname = `/expert${newPath}`;
      return NextResponse.redirect(url);
    }

    // Redirigir /admin/[id]/* a rutas limpias (solo si no es una ruta válida sin ID)
    const adminIdMatch = pathname.match(/^\/admin\/([^/]+)(.*)$/);
    if (adminIdMatch) {
      const firstSegment = adminIdMatch[1];
      const restPath = adminIdMatch[2] || '';

      if (!VALID_ADMIN_ROUTES.includes(firstSegment as (typeof VALID_ADMIN_ROUTES)[number])) {
        const newPath = `/admin${restPath || '/dashboard'}`;
        const url = request.nextUrl.clone();
        url.pathname = newPath;
        return NextResponse.redirect(url);
      }
    }

    // Canonicalizar prefijos de rutas para mantener formato:
    // /patient/*, /expert/*, /admin/*
    if (rolePrefix && !canonicalRole && rolePrefix !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = effectivePath;
      return NextResponse.redirect(url);
    }

    if (canonicalRole === "patient" && rolePrefix !== "patient") {
      const url = request.nextUrl.clone();
      url.pathname = `/patient${effectivePath}`;
      return NextResponse.redirect(url);
    }

    if (canonicalRole === "expert" && rolePrefix !== "expert") {
      const url = request.nextUrl.clone();
      url.pathname = `/expert${effectivePath}`;
      return NextResponse.redirect(url);
    }

    if (canonicalRole === "admin" && pathname !== effectivePath) {
      const url = request.nextUrl.clone();
      url.pathname = effectivePath;
      return NextResponse.redirect(url);
    }

    // IMPORTANTE: Llamar getUser() en TODAS las rutas para refrescar el JWT token.
    // Sin esto, el token expira silenciosamente en rutas públicas y el usuario
    // pierde la sesión al navegar a una ruta protegida.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Manejar la ruta raíz '/' de forma especial para usuarios autenticados
    // Si tiene ?home=true, permitir ver la landing page sin redirigir
    if (effectivePath === '/' && !request.nextUrl.searchParams.has('home')) {
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
                url.pathname = `/expert/dashboard`;
              } else {
                url.pathname = `/patient/explore`;
              }
            } else {
              url.pathname = `/patient/explore`;
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

    // Obtener perfil del usuario (una sola query para account_active + type)
    const { data: profile } = await supabase
      .from('profiles')
      .select('type, account_active')
      .eq('id', user.id)
      .maybeSingle();

    // Verificar si el usuario está desactivado
    if (!effectivePath.startsWith("/account-deactivated") && profile && profile.account_active === false) {
      const url = request.nextUrl.clone();
      url.pathname = "/account-deactivated";
      return NextResponse.redirect(url);
    }

    // Proteger rutas de admin
    if (effectivePath.startsWith('/admin/') && profile?.type !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/patient/explore';
      return NextResponse.redirect(url);
    }

    // Proteger rutas de experto
    if (canonicalRole === "expert" && profile?.type !== 'professional') {
      const { data: professionalApp } = await supabase
        .from('professional_applications')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .maybeSingle();

      if (!professionalApp) {
        const url = request.nextUrl.clone();
        url.pathname = '/patient/explore';
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
