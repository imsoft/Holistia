import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const type = searchParams.get('type')
    const errorParam = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    
    let next = searchParams.get('next') ?? '/'
    if (!next.startsWith('/')) {
      next = '/'
    }

    console.log('🔗 Callback received with params:', {
      code: code ? 'present' : 'missing',
      type,
      next,
      errorParam,
      errorDescription
    });

    if (errorParam) {
      console.error('❌ Google OAuth error:', errorParam, errorDescription);
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorDescription || errorParam)}`);
    }

    if (!code) {
      console.error('❌ No code parameter found');
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Código de autorización no encontrado')}`);
    }

    // Crear cliente de Supabase con manejo explícito de cookies en la respuesta
    let supabaseResponse = NextResponse.next({ request });
    const cookieDomain = getCookieDomain();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => {
              request.cookies.set(name, value);
            });
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) => {
              const nextOptions = cookieDomain ? { ...options, domain: cookieDomain } : options;
              supabaseResponse.cookies.set(name, value, nextOptions);
            });
          },
        },
      }
    );
    
    // Intercambiar código por sesión
    console.log('🔄 Exchanging code for session...');
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('❌ Error exchanging code for session:', error);
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message || 'Error al iniciar sesión')}`);
    }

    if (!data?.user) {
      console.error('❌ No user data after exchange');
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('No se pudo obtener información del usuario')}`);
    }

    if (!data?.session) {
      console.error('❌ No session data after exchange');
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('No se pudo crear la sesión')}`);
    }

    console.log('✅ Session created successfully for user:', data.user.id);
    console.log('🔐 User authenticated successfully:', {
      userId: data.user.id,
      email: data.user.email
    });

    const forwardedHost = request.headers.get('x-forwarded-host');
    const isLocalEnv = process.env.NODE_ENV === 'development';

    // Detectar si es un flujo de recuperación de contraseña
    const sessionAny = data.session as any;
    const amr = sessionAny?.amr as Array<{ method: string }> | undefined;
    const isRecoveryFromAMR = amr?.some((method) => method.method === 'recovery' || method.method === 'otp') ?? false;
    const isRecoveryFromType = type === 'recovery';
    const isRecoveryFlow = isRecoveryFromType || isRecoveryFromAMR;

    // Si hay un parámetro 'next' válido O es un flujo de recovery, redirigir
    if (next !== '/' || isRecoveryFlow) {
      const targetUrl = isRecoveryFlow ? '/confirm-password' : next;
      const finalUrl = isLocalEnv
        ? `${origin}${targetUrl}`
        : forwardedHost
          ? `https://${forwardedHost}${targetUrl}`
          : `${origin}${targetUrl}`;
      
      console.log('🚀 Redirecting to:', finalUrl);
      return NextResponse.redirect(finalUrl);
    }

    // Redirigir inmediatamente a /explore
    // El middleware manejará la redirección según el tipo de usuario
    const redirectUrl = `/explore`;
    const finalUrl = isLocalEnv
      ? `${origin}${redirectUrl}`
      : forwardedHost
        ? `https://${forwardedHost}${redirectUrl}`
        : `${origin}${redirectUrl}`;

    console.log('🚀 Redirecting to explore (middleware will handle user type):', finalUrl);
    
    // Usar la respuesta que ya tiene las cookies establecidas y redirigir
    const redirectResponse = NextResponse.redirect(finalUrl);
    
    // Copiar todas las cookies de la respuesta de Supabase a la respuesta de redirección
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        ...cookie,
        ...(cookieDomain ? { domain: cookieDomain } : {})
      });
    });
    
    return redirectResponse;
  } catch (error) {
    console.error('❌ Error inesperado en callback:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorMessage)}`);
  }
}
