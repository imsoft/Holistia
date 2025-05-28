'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, LogIn } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { supabase } from '@/lib/supabaseClient';
// Definir el esquema de validación con Zod
const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Correo electrónico inválido' }),
});

// Tipo derivado del esquema
type SignInFormValues = z.infer<typeof forgotPasswordSchema>;

export const ForgotPassword = () => {
  const [formError, setFormError] = useState<string | null>(null);

  // Configurar useForm con el resolver de Zod
  const form = useForm<SignInFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });
  const redirectUrl =
    process.env.NODE_ENV === 'production'
      ? 'https://tudominio.com/reset-password'
      : 'http://localhost:3000/reset-password';

  // Función para manejar el envío del formulario
  async function onSubmit(data: SignInFormValues) {
    setFormError(null);
    const { email } = data;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `https://www.holistia.ioS/reset-password`,
    });
    if (error) setFormError(`Error: ${error.message}`);
    else setFormError('Revisa tu correo para continuar.');
  }

  return (
    <div className='min-h-screen bg-[#0D0D0D] text-white flex flex-col'>
      {/* Estilos para el gradiente animado */}
      <style
        jsx
        global
      >{`
        .animated-gradient-text {
          background: linear-gradient(
            to right,
            #ffffff,
            #ac89ff,
            #83c7fd,
            #aff344,
            #ffe5be,
            #ac89ff,
            #83c7fd,
            #ffffff
          );
          background-size: 200% auto;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: flow 10s linear infinite;
        }

        @keyframes flow {
          0% {
            background-position: 0% center;
          }
          100% {
            background-position: 200% center;
          }
        }
      `}</style>

      {/* Gradient blobs *
      <div className='absolute top-20 right-0 w-[500px] h-[500px] bg-[#AC89FF]/10 rounded-full blur-[100px] -z-10'></div>
      <div className='absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#83C7FD]/10 rounded-full blur-[100px] -z-10'></div>
      <div className='absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-[#AFF344]/5 rounded-full blur-[120px] -z-10'></div>
      */}
      <div className='container mx-auto px-4 py-12 flex flex-1 items-center justify-center'>
        <div className='w-full max-w-md'>
          <div className='text-center mb-8'>
            <div className='inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-[#AC89FF]/20 to-[#83C7FD]/20 text-[#AC89FF] text-sm font-medium mb-4'>
              <Sparkles className='h-3.5 w-3.5 mr-2' />
              <span>Bienvenido a Holistia</span>
            </div>

            <h1 className='text-3xl font-bold mb-2 animated-gradient-text'>
              Olvide mi contraseña
            </h1>

            <p className='text-white/70'>
              Continúa tu viaje hacia el bienestar integral
            </p>
          </div>

          <div className='bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 shadow-xl'>
            {/* Separador */}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-5'
              >
                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-white/90'>
                        Correo electrónico
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder='tu@email.com'
                          className='bg-white/10 border-white/20 focus:border-[#AC89FF] text-white placeholder:text-white/50'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className='text-red-500 text-xs' />
                    </FormItem>
                  )}
                />
                <Button
                  type='submit'
                  className='w-full bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] hover:from-[#83C7FD] hover:to-[#AC89FF] text-white transition-all duration-300 hover:shadow-lg hover:shadow-[#AC89FF]/20 relative overflow-hidden group mt-2'
                >
                  <span className='relative z-10 flex items-center'>
                    Cambiar contraseña
                    <LogIn className='ml-2 h-4 w-4' />
                  </span>
                  <span className='absolute inset-0 bg-gradient-to-r from-[#AC89FF]/0 via-white/20 to-[#AC89FF]/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out'></span>
                </Button>
                {formError && (
                  <div className='text-red-400 text-sm text-center mt-2'>
                    {formError}
                  </div>
                )}
              </form>
            </Form>
          </div>

          <div className='mt-8 text-center'>
            <p className='text-xs text-white/50'>
              &copy; {new Date().getFullYear()} Holistia. Todos los derechos
              reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
