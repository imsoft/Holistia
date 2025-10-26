import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get('next') ?? '/'
  if (!next.startsWith('/')) {
    // if "next" is not a relative URL, use the default
    next = '/'
  }

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      console.log('🔐 User authenticated successfully:', {
        userId: data.user.id,
        email: data.user.email
      });

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
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      console.log('🌍 Environment check:', {
        NODE_ENV: process.env.NODE_ENV,
        isLocalEnv,
        forwardedHost,
        origin
      });
      
      // Determinar la URL de redirección según el tipo de usuario
      let redirectUrl;
      if (userType === 'admin') {
        redirectUrl = `/admin/${data.user.id}/dashboard`;
        console.log('👑 Admin user detected, redirecting to:', redirectUrl);
      } else if (userType === 'professional') {
        redirectUrl = `/professional/${data.user.id}/dashboard`;
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
          redirectUrl = `/professional/${data.user.id}/dashboard`;
          console.log('✅ Approved professional application found, redirecting to:', redirectUrl);
        } else {
          // Por defecto, redirigir al dashboard del paciente
          redirectUrl = `/patient/${data.user.id}/explore`;
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

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
