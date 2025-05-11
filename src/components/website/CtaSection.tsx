import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Heart, Users, Sparkles, Brain } from 'lucide-react';
import { useTranslations } from 'next-intl';
export default function CtaSection() {
  const t = useTranslations('CtaSection');
  return (
    <section className='py-20 md:py-32 relative overflow-hidden'>
      {/* Gradient background */}
      <div className='absolute inset-0 bg-gradient-to-br from-[#0D0D0D] via-[#0D0D0D] to-[#0D0D0D]/95 -z-20'></div>

      {/* Gradient blobs */}
      <div className='absolute top-0 left-0 w-[600px] h-[600px] bg-[#AC89FF]/10 rounded-full blur-[150px] -z-10'></div>
      <div className='absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#AFF344]/5 rounded-full blur-[150px] -z-10'></div>

      <div className='container mx-auto px-4'>
        <div className='max-w-4xl mx-auto bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-3xl border border-white/10 p-8 md:p-12'>
          <div className='text-center mb-8'>
            <h2 className='text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-[#AFF344] via-[#AC89FF] to-[#83C7FD] bg-clip-text text-transparent'>
              {t('tittle')}
            </h2>

            <p className='text-xl text-white/70 max-w-3xl mx-auto'>
              {t('parragraf')}
            </p>

            <Button
              asChild
              size='lg'
              className='mt-6 bg-gradient-to-r from-[#AFF344] to-[#AC89FF] hover:from-[#AC89FF] hover:to-[#AFF344] text-[#0D0D0D] font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#AFF344]/20 relative overflow-hidden group sm:w-auto w-full'
            >
              <Link href='https://wa.me/523339550061?text=Hola%2C%20me%20gustar%C3%ADa%20recibir%20notificaciones%20cuando%20el%20sitio%20de%20Holistia%20est%C3%A9%20en%20l%C3%ADnea.'>
                <span className='relative z-10'>{t('registerBtn')}</span>
                <span className='absolute inset-0 bg-gradient-to-r from-[#AFF344]/0 via-white/20 to-[#AFF344]/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out'></span>
              </Link>
            </Button>
          </div>

          {/* Feature highlights */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mt-12'>
            <div className='text-center'>
              <div className='h-10 w-10 rounded-full bg-gradient-to-r from-[#AC89FF]/30 to-[#83C7FD]/30 flex items-center justify-center mx-auto mb-3'>
                <Users className='h-5 w-5 text-white' />
              </div>
              <p className='text-sm text-white/80'>{t('feature1')}</p>
            </div>
            <div className='text-center'>
              <div className='h-10 w-10 rounded-full bg-gradient-to-r from-[#AFF344]/30 to-[#83C7FD]/30 flex items-center justify-center mx-auto mb-3'>
                <Heart className='h-5 w-5 text-white' />
              </div>
              <p className='text-sm text-white/80'>{t('feature2')}</p>
            </div>
            <div className='text-center'>
              <div className='h-10 w-10 rounded-full bg-gradient-to-r from-[#83C7FD]/30 to-[#FFE5BE]/30 flex items-center justify-center mx-auto mb-3'>
                <Brain className='h-5 w-5 text-white' />
              </div>
              <p className='text-sm text-white/80'>{t('feature3')}</p>
            </div>
            <div className='text-center'>
              <div className='h-10 w-10 rounded-full bg-gradient-to-r from-[#FFE5BE]/30 to-[#FF9900]/30 flex items-center justify-center mx-auto mb-3'>
                <Sparkles className='h-5 w-5 text-white' />
              </div>
              <p className='text-sm text-white/80'>{t('feature4')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
