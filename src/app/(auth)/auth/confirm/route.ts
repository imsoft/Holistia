import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const code = searchParams.get('code')
  const error_description = searchParams.get('error_description')
  const error_code = searchParams.get('error_code')

  console.log('Confirm email params:', { token_hash, type, code, error_description, error_code })

  // Si hay errores en los parámetros de la URL, redirigir con información del error
  if (error_description || error_code) {
    console.error('Error en confirmación de email:', { error_description, error_code })
    redirect(`/error?message=${encodeURIComponent(error_description || 'Error desconocido en la confirmación')}`)
  }

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    
    if (error) {
      console.error('Error verificando OTP:', error.message)
      redirect(`/error?message=${encodeURIComponent('Error verificando el código de confirmación: ' + error.message)}`)
    }

    // Obtener el usuario y redirigir según su tipo
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // Redirigir a página de éxito primero
      redirect('/auth/confirm-success')
    } else {
      redirect('/login')
    }
  } else if (code) {
    // Método con code (confirmación por email)
    const supabase = await createClient()

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Error intercambiando código por sesión:', error.message)
        console.error('Error completo:', error)
        
        // Si el error es por falta de code_verifier, redirigir a login con mensaje
        if (error.message.includes('code_verifier') || error.message.includes('invalid request')) {
          redirect('/login?message=' + encodeURIComponent('Tu email ha sido confirmado. Por favor inicia sesión.'))
        }
        
        redirect(`/error?message=${encodeURIComponent('Error confirmando el email: ' + error.message)}`)
      }

      // Obtener el usuario después del intercambio de código
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Redirigir a página de éxito primero
        redirect('/auth/confirm-success')
      } else {
        redirect('/login')
      }
    } catch (err) {
      console.error('Error inesperado en confirmación:', err)
      redirect('/login?message=' + encodeURIComponent('Tu email ha sido confirmado. Por favor inicia sesión.'))
    }
  } else {
    // No hay parámetros válidos
    console.error('No se encontraron parámetros válidos para confirmación')
    redirect('/error?message=' + encodeURIComponent('Enlace de confirmación inválido'))
  }
}