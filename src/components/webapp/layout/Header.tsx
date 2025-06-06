'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { signOut } from '@/services/auth';
import { Profile, User } from '@/types/database.types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { toast } from 'sonner';
import router from 'next/router';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

type HeaderProps = {
  user: User | null;
  profile: Profile | null;
};
async function handleSignOut() {
  const error = await signOut();
  if (error) {
    toast.error('No se pudo cerrar la sesión');
  } else {
    toast.success('sesión cerrada correctamente');
    router.push('/');
  }
}

export default function Header({ user, profile }: HeaderProps) {
  const pathname = usePathname();

  // Cierra el menú al cambiar la ruta
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const [open, setOpen] = useState(false);
  return (
    <>
      <header className='border-b border-white/10 backdrop-blur-sm bg-[#0D0D0D]/80 sticky top-0 z-50'>
        <div className='container mx-auto px-4 py-4 flex items-center justify-between'>
          <div className='flex items-center space-x-8'>
            <Link
              href='/'
              className='text-xl font-bold animated-gradient-text'
            >
              Holistia
            </Link>
            <nav className='hidden md:flex items-center space-x-6'>
              <Link
                href='/explore'
                className='text-white/70 hover:text-white transition-colors'
              >
                Explorar
              </Link>
              <Link
                //href='/appointments'
                href='#'
                className='text-white/70 hover:text-white transition-colors'
              >
                Mis Citas
              </Link>
              <Link
                // href='/messages'
                href='#'
                className='text-white/70 hover:text-white transition-colors'
              >
                Mensajes
              </Link>
              <Link
                //href='/favorites'
                href='#'
                className='text-white/70 hover:text-white transition-colors'
              >
                Favoritos
              </Link>
            </nav>
          </div>
          <div className='flex items-center space-x-4'>
            <Button
              variant='ghost'
              className='text-white/70 hover:text-white hover:bg-white/10'
            >
              <Bell className='h-5 w-5' />
            </Button>
            <DropdownMenu
              open={open}
              onOpenChange={setOpen}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  className='relative h-10 w-10 rounded-full'
                >
                  <Avatar className='h-10 w-10 border border-[#AC89FF]'>
                    <AvatarImage
                      //profile?. avatar_url||
                      src={''}
                      alt={profile?.full_name || user?.email || ''}
                    />
                    <AvatarFallback className='bg-[#AC89FF]/20 text-[#AC89FF]'>
                      {(profile?.full_name
                        ? profile.full_name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                        : user?.email?.charAt(0) || 'US'
                      ).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className='w-56 bg-[#1A1A1A] border-white/10 text-white'
                align='end'
                forceMount
              >
                <DropdownMenuItem className='hover:bg-white/5'>
                  <Link
                    href='/profile'
                    onClick={() => setOpen(false)}
                    className='flex items-center w-full'
                  >
                    Mi Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className='hover:bg-white/5'>
                  <Link
                    // href='/settings'
                    href='#'
                    onClick={() => setOpen(false)}
                    className='flex items-center w-full'
                  >
                    Configuración
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className='hover:bg-white/5 text-red-400'>
                  <Link
                    href='/'
                    className='flex items-center w-full'
                    onClick={handleSignOut}
                  >
                    Cerrar Sesión
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </>
  );
}
const Bell = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      {...props}
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <path d='M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9' />
      <path d='M10.3 21a1.94 1.94 0 0 0 3.4 0' />
    </svg>
  );
};
