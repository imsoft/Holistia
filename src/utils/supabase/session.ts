import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Rutas públicas que no requieren autenticación (sin incluir '/')
    const publicPaths = [
      '/login',
      '/signup',
      '/forgot-password',
      '/confirm-password',
      '/confirm-email',
      '/account-deactivated',
      '/error',
      '/auth',
      '/public', // Páginas públicas (profesionales, comercios, restaurantes)
      '/specialties', // Páginas de especialidades (públicas)
      '/_next',
      '/favicon.ico',
      '/api',
      '/contact',
      '/privacy',
      '/terms',
      '/history',
      '/blog',
      '/explore',
      '/become-professional',
      '/companies', // Página pública para empresas
      '/robots.txt',
      '/sitemap.xml'
    ];

    const isPublicPath = publicPaths.some(path =>
      request.nextUrl.pathname.startsWith(path)
    );

    // Manejar la ruta raíz '/' de forma especial para usuarios autenticados
    if (request.nextUrl.pathname === '/') {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        // Si hay usuario autenticado, redirigir a su dashboard
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('type')
            .eq('id', user.id)
            .maybeSingle();

          if (profile) {
            const url = request.nextUrl.clone();

            // Redirigir según el tipo de usuario (URLs limpias sin IDs)
            if (profile.type === 'admin') {
              url.pathname = `/admin/dashboard`;
            } else if (profile.type === 'professional') {
              // Verificar si el profesional tiene una aplicación aprobada
              const { data: professionalApp } = await supabase
                .from('professional_applications')
                .select('id, status')
                .eq('user_id', user.id)
                .maybeSingle();

              if (professionalApp) {
                url.pathname = `/dashboard`;
              } else {
                // Si no tiene aplicación, redirigir como paciente
                url.pathname = `/explore`;
              }
            } else {
              // Por defecto redirigir como paciente
              url.pathname = `/explore`;
            }

            console.log('🔄 Redirecting authenticated user from / to:', url.pathname);
            return NextResponse.redirect(url);
          }
        }
      } catch (error) {
        console.error('Error checking user on home page:', error);
        // Si hay error, permitir que vea la página de inicio
      }

      // Si no hay usuario o hubo error, permitir ver la página de inicio
      return supabaseResponse;
    }

    // Si es una ruta pública, continuar sin verificar autenticación
    if (isPublicPath) {
      return supabaseResponse;
    }

    // Verificar autenticación solo para rutas protegidas
    try {
      const {
        data: { user },
        error
      } = await supabase.auth.getUser();

      if (error) {
        console.error('Auth error:', error);
        // Si hay error de autenticación, redirigir al login
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
      }

      // Si no hay usuario y no es ruta pública, redirigir al login
      if (!user && !isPublicPath) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
      }

      // Verificar si el usuario está desactivado
      if (user && !request.nextUrl.pathname.startsWith("/account-deactivated")) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('account_active')
          .eq('id', user.id)
          .maybeSingle();

        // Si la cuenta está desactivada, redirigir a página de cuenta desactivada
        if (profile && profile.account_active === false) {
          console.log('Account is deactivated, redirecting user:', user.id);
          const url = request.nextUrl.clone();
          url.pathname = "/account-deactivated";
          return NextResponse.redirect(url);
        }
      }

      // Redirigir URLs antiguas con IDs a nuevas URLs limpias
      const pathname = request.nextUrl.pathname;
      
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
      
      // Redirigir /admin/[id]/* a rutas limpias
      if (pathname.match(/^\/admin\/[^/]+(.*)$/)) {
        const match = pathname.match(/^\/admin\/[^/]+(.*)$/);
        const newPath = match ? `/admin${match[1] || '/dashboard'}` : '/admin/dashboard';
        const url = request.nextUrl.clone();
        url.pathname = newPath;
        return NextResponse.redirect(url);
      }
      
      // Verificar permisos según tipo de usuario para rutas protegidas
      if (user) {
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
      }

    } catch (authError) {
      console.error('Authentication check failed:', authError);
      // En caso de error, permitir continuar para evitar bucles de redirección
    }

    return supabaseResponse;

  } catch (error) {
    console.error('Proxy error:', error);
    // En caso de error crítico, devolver una respuesta básica
    return NextResponse.next({ request });
  }
}
