import { useTranslations } from 'next-intl';
//import { Link } from '../../i18n/navegation';
import Link from 'next/link';
import Image from 'next/image';
import LocaleSwitcher from '../ui/LocaleSwitcher';
export default function Header() {
  const t = useTranslations('header');
  return (
    <header className='fixed top-0 left-0 right-0 z-50 bg-[#0D0D0D]/80 backdrop-blur-md'>
      <div className='container mx-auto px-4 py-4 flex items-center justify-between'>
        <Link
          href='/'
          className='flex items-center gap-2 z-10'
        >
          <Image
            src='/holistia-blanco.png'
            alt='Holistia'
            width={120}
            height={40}
            className='h-8 w-auto'
          />
        </Link>

        <nav className='hidden md:flex items-center gap-8'>
          <Link
            href='#features'
            className='text-sm font-medium text-white/80 hover:text-[#AC89FF] transition-colors relative group'
          >
            {t('link1')}
            <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] group-hover:w-full transition-all duration-300'></span>
          </Link>
          <Link
            href='#community'
            className='text-sm font-medium text-white/80 hover:text-[#AC89FF] transition-colors relative group'
          >
            {t('link2')}
            <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] group-hover:w-full transition-all duration-300'></span>
          </Link>
          <Link
            href='#testimonials'
            className='text-sm font-medium text-white/80 hover:text-[#AC89FF] transition-colors relative group'
          >
            {t('link3')}
            <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] group-hover:w-full transition-all duration-300'></span>
          </Link>
          <LocaleSwitcher />
        </nav>

        {/* <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              className="hidden md:flex text-white hover:bg-gradient-to-r hover:from-[#AC89FF]/20 hover:to-[#83C7FD]/20 transition-all duration-300 hover:scale-105 group"
            >
              <span className="bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] bg-clip-text group-hover:text-transparent transition-all duration-300">
                Iniciar sesión
              </span>
            </Button>
            <Button className="bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] hover:from-[#83C7FD] hover:to-[#AC89FF] text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#AC89FF]/20 relative overflow-hidden group">
              <span className="relative z-10">Registrarse</span>
              <span className="absolute inset-0 bg-gradient-to-r from-[#AC89FF]/0 via-white/20 to-[#AC89FF]/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></span>
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden text-white">
              <Menu className="h-5 w-5" />
            </Button>
          </div> */}
      </div>
    </header>
  );
}
