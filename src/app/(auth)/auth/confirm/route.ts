import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const code = searchParams.get('code')
  // const next = searchParams.get('next') ?? '/'

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      // Obtener el usuario y redirigir según su tipo
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const userType = user.user_metadata?.user_type;
        
        if (userType === 'admin') {
          redirect(`/admin/${user.id}/dashboard`);
        } else if (userType === 'professional') {
          redirect(`/professional/${user.id}/dashboard`);
        } else {
          redirect(`/patient/${user.id}/explore`);
        }
      } else {
        redirect('/login')
      }
    }
  } else if (code) {
    // Método con code (confirmación por email)
    const supabase = await createClient()

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Obtener el usuario después del intercambio de código
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const userType = user.user_metadata?.user_type;
        
        if (userType === 'admin') {
          redirect(`/admin/${user.id}/dashboard`);
        } else if (userType === 'professional') {
          redirect(`/professional/${user.id}/dashboard`);
        } else {
          redirect(`/patient/${user.id}/explore`);
        }
      } else {
        redirect('/login')
      }
    }
  }

  // redirect the user to an error page with some instructions
  redirect('/error')
}