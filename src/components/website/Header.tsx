'use client';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import LocaleSwitcher from '../ui/LocaleSwitcher';
import { useState } from 'react';
import { User } from '@/types/database.types';

type Props = {
  user: User | null;
};
export default function Header({ user }: Props) {
  const t = useTranslations('header');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      {/*CHECK IF THE SIDEBAR ARE OPENED O CLOSED */}
      {sidebarOpen && (
        <div
          className='fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden'
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* menu web if !user show sessions in sidebar , and if user show explore in side bar */}
      {!user ? (
        <aside
          className={` lg:hidden fixed top-0 right-0 h-full w-64 bg-[#0D0D0D]/80 shadow-md z-50 transform
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'} 
          transition-transform duration-300 ease-in-out  md:shadow-none `}
        >
          <div className='p-6 flex flex-col h-full text-white'>
            {/* BUTTON CLOSE ( X )*/}
            <div className='flex justify-end mb-6 lg:hidden'>
              <button
                className='text-gray-500 hover:text-red-500'
                onClick={() => setSidebarOpen(false)}
                aria-label='Cerrar menú'
              >
                ✕
              </button>
            </div>
            <h2 className='text-2xl font-bold mb-6'>Menú</h2>
            <div className='flex flex-col space-y-4'>
              <Link
                href='/signin'
                className='whitespace-nowrap text-md font-medium text-white/80 hover:text-[#AC89FF] transition-colors relative group'
              >
                {t('signin')}
                <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] group-hover:w-full transition-all duration-300'></span>
              </Link>
              <Link
                href='/signup'
                className='text-md font-medium text-white/80 hover:text-[#AC89FF] transition-colors relative group'
              >
                {t('signup')}
                <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] group-hover:w-full transition-all duration-300'></span>
              </Link>
              <LocaleSwitcher />
            </div>
          </div>
        </aside>
      ) : (
        <aside
          className={` lg:hidden fixed top-0 right-0 h-full w-64 bg-[#0D0D0D]/80 shadow-md z-50 transform
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'} 
          transition-transform duration-300 ease-in-out  md:shadow-none `}
        >
          <div className='p-6 flex flex-col h-full text-white'>
            {/* BUTTON CLOSE ( X )*/}
            <div className='flex justify-end mb-6 lg:hidden'>
              <button
                className='text-gray-500 hover:text-red-500'
                onClick={() => setSidebarOpen(false)}
                aria-label='Cerrar menú'
              >
                ✕
              </button>
            </div>
            <h2 className='text-2xl font-bold mb-6'>Menú</h2>
            <div className='flex flex-col space-y-4'>
              <Link
                href='/explore'
                className='whitespace-nowrap text-md font-medium text-white/80 hover:text-[#AC89FF] transition-colors relative group'
              >
                {t('explore')}
                <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] group-hover:w-full transition-all duration-300'></span>
              </Link>
              <LocaleSwitcher />
            </div>
          </div>
        </aside>
      )}
      {/* SIDEBAR*/}

      <header className='fixed top-0 left-0 right-0 z-30 bg-[#0D0D0D]/80 backdrop-blur-md'>
        <div className='container mx-auto px-4 py-4 flex items-center justify-between'>
          <div className='flex items-center space-x-8'>
            {/* Logo */}
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
            {/* NAV LINKS  */}
            <nav className='hidden md:flex items-center gap-8'>
              <Link
                href='#features'
                className='text-md font-medium text-white/80 hover:text-[#AC89FF] transition-colors relative group'
              >
                {t('link1')}
                <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] group-hover:w-full transition-all duration-300'></span>
              </Link>
              <Link
                href='#community'
                className='text-md font-medium text-white/80 hover:text-[#AC89FF] transition-colors relative group'
              >
                {t('link2')}
                <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] group-hover:w-full transition-all duration-300'></span>
              </Link>
              <Link
                href='#testimonials'
                className='text-md font-medium text-white/80 hover:text-[#AC89FF] transition-colors relative group'
              >
                {t('link3')}
                <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] group-hover:w-full transition-all duration-300'></span>
              </Link>
            </nav>
          </div>
          {/* menu web if !user show sessions, and if user show explore */}
          {!user ? (
            <div className='hidden lg:flex items-center gap-4'>
              <Link
                href='signin'
                className='whitespace-nowrap text-md font-medium text-white/80 hover:text-[#AC89FF] transition-colors relative group'
              >
                {t('signin')}
                <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] group-hover:w-full transition-all duration-300'></span>
              </Link>
              <Link
                href='/signup'
                className='text-md font-medium text-white/80 hover:text-[#AC89FF] transition-colors relative group'
              >
                {t('signup')}
                <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] group-hover:w-full transition-all duration-300'></span>
              </Link>
              <LocaleSwitcher />
            </div>
          ) : (
            <div className='hidden lg:flex items-center gap-4'>
              <Link
                href='/explore'
                className='whitespace-nowrap text-md font-medium text-white/80 hover:text-[#AC89FF] transition-colors relative group'
              >
                {t('explore')}
                <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] group-hover:w-full transition-all duration-300'></span>
              </Link>
              <LocaleSwitcher />
            </div>
          )}

          {/*      <div className='hidden md:flex items-center gap-4'>
            <Button
              variant='ghost'
              className='hidden md:flex text-white hover:bg-gradient-to-r hover:from-[#AC89FF]/20 hover:to-[#83C7FD]/20 transition-all duration-300 hover:scale-105 group'
            >
              <span className='bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] bg-clip-text group-hover:text-transparent transition-all duration-300'>
                Iniciar sesión
              </span>
            </Button>
            <Button className='bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] hover:from-[#83C7FD] hover:to-[#AC89FF] text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#AC89FF]/20 relative overflow-hidden group'>
              <span className='relative z-10'>Registrarse</span>
              <span className='absolute inset-0 bg-gradient-to-r from-[#AC89FF]/0 via-white/20 to-[#AC89FF]/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out'></span>
            </Button>
            <Button
              variant='ghost'
              size='icon'
              className='md:hidden text-white'
            >
              <Menu className='h-5 w-5' />
            </Button>
            <LocaleSwitcher />
          </div> */}

          {/* SIDE BAR BUTTON */}
          <button
            className='text-gray-700 lg:hidden'
            onClick={() => setSidebarOpen(true)}
          >
            <svg
              className='w-6 h-6'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M4 6h16M4 12h16M4 18h16'
              />
            </svg>
          </button>
        </div>
      </header>
    </>
  );
}
