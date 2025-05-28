import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
//import { Link } from '@/i18n/navegation';
import Image from 'next/image';

export default function HeroSection() {
  const t = useTranslations('HeroSection');

  return (
    <section className='pt-32 pb-20 md:pt-40 md:pb-32 relative overflow-hidden'>
      {/* Gradient blobs */}
      <div className='absolute top-20 right-0 w-[500px] h-[500px] bg-[#AC89FF]/10 rounded-full blur-[100px] -z-10'></div>
      <div className='absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#83C7FD]/10 rounded-full blur-[100px] -z-10'></div>

      <div className='container mx-auto px-4'>
        <div className='max-w-4xl mx-auto text-center mb-16'>
          <div className='inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-[#AC89FF]/20 to-[#83C7FD]/20 text-[#AC89FF] text-sm font-medium mb-6'>
            <Sparkles className='h-3.5 w-3.5 mr-2' />
            <span>{t('helpMessage')}</span>
          </div>

          <h1 className='text-4xl md:text-6xl py-1 lg:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-[#AC89FF] to-[#83C7FD] bg-clip-text text-transparent'>
            {t('tittle')}
          </h1>

          <p className='text-xl text-white/70 mb-8 max-w-2xl mx-auto'>
            {t('parragraf')}
          </p>

          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Button
              asChild
              size='lg'
              className='bg-gradient-to-r from-[#AFF344] to-[#83C7FD] hover:from-[#83C7FD] hover:to-[#AFF344] text-[#0D0D0D] font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#AFF344]/20 relative overflow-hidden group'
            >
              <Link href='https://wa.me/523339550061?text=Hola%2C%20me%20gustar%C3%ADa%20recibir%20notificaciones%20cuando%20el%20sitio%20de%20Holistia%20est%C3%A9%20en%20l%C3%ADnea.'>
                <span className='relative z-10'>{t('startBtn')}</span>
                <span className='absolute inset-0 bg-gradient-to-r from-[#AFF344]/0 via-white/20 to-[#AFF344]/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out'></span>
              </Link>
            </Button>

            <Button
              asChild
              size='lg'
              className='bg-transparent border-2 border-[#AC89FF] text-[#AC89FF] hover:text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#AC89FF]/20 relative overflow-hidden group'
            >
              <Link href='mailto:hola@holistia.io?subject=Notificarme%20cuando%20lancen&body=Hola%2C%20me%20gustar%C3%ADa%20recibir%20notificaciones%20cuando%20el%20sitio%20est%C3%A9%20en%20l%C3%ADnea.'>
                <span className='relative z-10'>{t('foundMoreBtn')}</span>
                <span className='absolute inset-0 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] opacity-0 group-hover:opacity-100 transition-opacity duration-300'></span>
              </Link>
            </Button>
          </div>
        </div>

        <div className='relative max-w-5xl mx-auto'>
          {/* Decorative elements */}
          <div className='absolute -top-10 -left-10 w-20 h-20 bg-gradient-to-r from-[#AFF344] to-[#AC89FF] rounded-full blur-xl opacity-50'></div>
          <div className='absolute -bottom-10 -right-10 w-20 h-20 bg-gradient-to-r from-[#83C7FD] to-[#FFE5BE] rounded-full blur-xl opacity-50'></div>

          {/* Main image */}
          <div className='relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-[#AC89FF]/10'>
            <Image
              src='/picture8.jpeg'
              alt='Holistia wellness platform'
              width={1200}
              height={600}
              className='w-full  h-[600px] object-cover object-[center_40%]'
              priority
            />

            {/* Overlay with stats */}
            <div className='absolute inset-0 bg-gradient-to-t from-[#0D0D0D] to-transparent flex items-end'>
              <div className='w-full p-6 md:p-8 grid grid-cols-2 md:grid-cols-4 gap-4'>
                <div className='bg-white/10 backdrop-blur-md rounded-lg p-4'>
                  <p className='text-[#AFF344] text-3xl font-bold'>+50</p>
                  <p className='text-white/70 text-sm'>{t('professionals')}</p>
                </div>
                <div className='bg-white/10 backdrop-blur-md rounded-lg p-4'>
                  <p className='text-[#AC89FF] text-3xl font-bold'>+15</p>
                  <p className='text-white/70 text-sm'>{t('Specialties')}</p>
                </div>
                <div className='bg-white/10 backdrop-blur-md rounded-lg p-4'>
                  <p className='text-[#83C7FD] text-3xl font-bold'>+400</p>
                  <p className='text-white/70 text-sm'>{t('activeUsers')}</p>
                </div>
                <div className='bg-white/10 backdrop-blur-md rounded-lg p-4'>
                  <p className='text-[#FF9900] text-3xl font-bold'>+500</p>
                  <p className='text-white/70 text-sm'>{t('sessionsHeld')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
