import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Twitter, Facebook, Linkedin } from 'lucide-react';
export default function Footer() {
  return (
    <footer className='border-t border-white/10 mt-16 py-8'>
      <div className='container mx-auto px-4'>
        <div className='container mx-auto px-6 flex flex-col md:flex-row md:justify-between md:items-start gap-8'>
          <div className='md:w-1/3 text-center md:text-left'>
            <h2 className='text-xl font-bold animated-gradient-text mb-2'>
              Holistia
            </h2>
            <p className='text-white/70 text-sm'>
              Conectando el bienestar integral
            </p>
          </div>
          <div className='md:w-1/3 text-center md:text-left'>
            <div className='flex justify-center md:justify-start space-x-6'>
              <Link
                href='#'
                className='h-10 w-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-gradient-to-r hover:from-[#AC89FF] hover:to-[#83C7FD] transition-all duration-300 hover:scale-110 group'
              >
                <Instagram className='h-5 w-5 text-white/70 group-hover:text-white' />
                <span className='sr-only'>Instagram</span>
              </Link>
              <Link
                href='#'
                className='h-10 w-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-gradient-to-r hover:from-[#AFF344] hover:to-[#83C7FD] transition-all duration-300 hover:scale-110 group'
              >
                <Twitter className='h-5 w-5 text-white/70 group-hover:text-white' />
                <span className='sr-only'>Twitter</span>
              </Link>
              <Link
                href='#'
                className='h-10 w-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-gradient-to-r hover:from-[#83C7FD] hover:to-[#FFE5BE] transition-all duration-300 hover:scale-110 group'
              >
                <Facebook className='h-5 w-5 text-white/70 group-hover:text-white' />
                <span className='sr-only'>Facebook</span>
              </Link>
              <Link
                href='#'
                className='h-10 w-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-gradient-to-r hover:from-[#FFE5BE] hover:to-[#FF9900] transition-all duration-300 hover:scale-110 group'
              >
                <Linkedin className='h-5 w-5 text-white/70 group-hover:text-white' />
                <span className='sr-only'>LinkedIn</span>
              </Link>
            </div>
          </div>
          <div className='md:w-1/3 text-center md:text-left'>
            <div className='flex space-x-6'>
              {/*   <Link
                href='/about'
                className='text-white/70 hover:text-white text-sm'
              >
                Sobre nosotros
              </Link>*/}

              <Link
                href='/contact'
                className='text-white/70 hover:text-white text-sm'
              >
                Contacto
              </Link>
              <Link
                href='/privacy'
                className='text-white/70 hover:text-white text-sm'
              >
                Privacidad
              </Link>
              <Link
                href='/terms'
                className='text-white/70 hover:text-white text-sm'
              >
                Términos
              </Link>
            </div>
          </div>
        </div>
        <div className='mt-8 pt-6 border-t border-white/10 text-center'>
          <p className='text-xs text-white/50'>
            &copy; {new Date().getFullYear()} Holistia. Todos los derechos
            reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
