import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type') // Supabase incluye 'type=recovery' para reset de contraseña
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get('next') ?? '/'
  if (!next.startsWith('/')) {
    // if "next" is not a relative URL, use the default
    next = '/'
  }

  console.log('🔗 Callback received with params:', {
    code: code ? 'present' : 'missing',
    type,
    next,
    allParams: Object.fromEntries(searchParams.entries())
  });

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    // Si hay error (ej: rate limit), redirigir a login con mensaje
    if (error) {
      console.error('❌ Error en exchangeCodeForSession:', error);
      const errorMsg = error.message || 'Error al iniciar sesión';
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorMsg)}`);
    }
    
    if (data?.user) {
      console.log('🔐 User authenticated successfully:', {
        userId: data.user.id,
        email: data.user.email
      });

      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'

      console.log('🌍 Environment check:', {
        NODE_ENV: process.env.NODE_ENV,
        isLocalEnv,
        forwardedHost,
        origin
      });

      // Detectar si es un flujo de recuperación de contraseña
      // Método 1: Verificar el parámetro 'type=recovery' en la URL
      // Método 2: Verificar el AMR (Authentication Methods Reference) de la sesión
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sessionAny = data.session as any;
      const amr = sessionAny?.amr as Array<{ method: string }> | undefined;
      const isRecoveryFromAMR = amr?.some((method) => method.method === 'recovery' || method.method === 'otp') ?? false;
      const isRecoveryFromType = type === 'recovery';
      const isRecoveryFlow = isRecoveryFromType || isRecoveryFromAMR;

      console.log('🔑 Auth flow detection:', {
        next,
        type,
        isRecoveryFromType,
        isRecoveryFromAMR,
        isRecoveryFlow,
        amr
      });

      // Si hay un parámetro 'next' válido O es un flujo de recovery, redirigir a confirm-password
      if (next !== '/' || isRecoveryFlow) {
        const targetUrl = isRecoveryFlow ? '/confirm-password' : next;
        console.log('🔄 Redirecting to:', targetUrl, isRecoveryFlow ? '(recovery flow detected)' : '(next param)');
        const finalUrl = isLocalEnv
          ? `${origin}${targetUrl}`
          : forwardedHost
            ? `https://${forwardedHost}${targetUrl}`
            : `${origin}${targetUrl}`;

        console.log('🚀 Final redirect URL:', finalUrl);
        return NextResponse.redirect(finalUrl);
      }

      // Obtener tipo de usuario y estado de cuenta desde profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('type, account_active')
        .eq('id', data.user.id)
        .maybeSingle();

      // Verificar si la cuenta está desactivada
      if (profile && profile.account_active === false) {
        return NextResponse.redirect(`${origin}/account-deactivated`);
      }

      const userType = profile?.type;

      // Determinar la URL de redirección según el tipo de usuario
      let redirectUrl;
      if (userType === 'admin') {
        redirectUrl = `/admin/dashboard`;
        console.log('👑 Admin user detected, redirecting to:', redirectUrl);
      } else if (userType === 'professional') {
        redirectUrl = `/dashboard`;
        console.log('👨‍⚕️ Professional user detected, redirecting to:', redirectUrl);
      } else {
        console.log('🔍 Checking professional application for user:', data.user.id);
        // Verificar si el usuario tiene una aplicación profesional aprobada
        const { data: application, error: appError } = await supabase
          .from('professional_applications')
          .select('id, status')
          .eq('user_id', data.user.id)
          .eq('status', 'approved')
          .maybeSingle();

        console.log('📋 Application check result:', { application, appError });

        if (application) {
          // Si tiene una aplicación aprobada, redirigir al dashboard de profesionales
          redirectUrl = `/dashboard`;
          console.log('✅ Approved professional application found, redirecting to:', redirectUrl);
        } else {
          // Por defecto, redirigir al dashboard del paciente
          redirectUrl = `/explore`;
          console.log('👤 Default patient redirect to:', redirectUrl);
        }
      }

      const finalUrl = isLocalEnv
        ? `${origin}${redirectUrl}`
        : forwardedHost
          ? `https://${forwardedHost}${redirectUrl}`
          : `${origin}${redirectUrl}`;

      console.log('🚀 Final redirect URL:', finalUrl);

      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(finalUrl)
      } else if (forwardedHost) {
        return NextResponse.redirect(finalUrl)
      } else {
        return NextResponse.redirect(finalUrl)
      }
    }
  }

  // Sin código o error: redirigir a login con mensaje claro
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('No se recibió el código de autorización. Intenta iniciar sesión de nuevo.')}`)
}
