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

    // Rutas públicas que no requieren autenticación
    const publicPaths = [
      '/',
      '/login',
      '/signup',
      '/forgot-password',
      '/confirm-password',
      '/confirm-email',
      '/error',
      '/auth',
      '/_next',
      '/favicon.ico',
      '/api'
    ];

    const isPublicPath = publicPaths.some(path => 
      request.nextUrl.pathname.startsWith(path)
    );

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

      // Redirigir administradores a la URL correcta si están usando un ID incorrecto
      if (user && request.nextUrl.pathname.startsWith("/admin/")) {
        // Obtener tipo de usuario desde profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('type')
          .eq('id', user.id)
          .maybeSingle();
        
        if (profile?.type === 'admin') {
          const pathSegments = request.nextUrl.pathname.split('/');
          const currentAdminId = pathSegments[2]; // /admin/[id]/...
          
          if (currentAdminId !== user.id) {
            // Redirigir a la URL correcta con el ID del usuario autenticado
            const url = request.nextUrl.clone();
            url.pathname = `/admin/${user.id}${pathSegments.slice(3).join('/')}`;
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
    console.error('Middleware error:', error);
    // En caso de error crítico, devolver una respuesta básica
    return NextResponse.next({ request });
  }
}
