import { Users, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

export default function CommunitySection() {
  const t = useTranslations('CommunitySection');
  return (
    <section
      id='community'
      className='py-20 md:py-32 relative'
    >
      {/* Gradient blobs */}
      <div className='absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#83C7FD]/10 rounded-full blur-[100px] -z-10'></div>
      <div className='container mx-auto px-4'>
        <div className='grid lg:grid-cols-2 gap-16 items-center'>
          <div className='order-2 lg:order-1'>
            <div className='inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-[#83C7FD]/20 to-[#FFE5BE]/20 text-[#83C7FD] text-sm font-medium mb-6'>
              <Users className='h-3.5 w-3.5 mr-2' />
              <span>{t('helpMessage')}</span>
            </div>

            <h2 className='text-3xl md:text-5xl font-bold mb-6'>
              {t('tittle')}
            </h2>

            <p className='text-lg text-white/70 mb-8'>{t('parragraf')}</p>

            <ul className='space-y-4 mb-8'>
              <li className='flex items-start gap-3'>
                <div className='h-6 w-6 rounded-full bg-gradient-to-r from-[#AFF344]/30 to-[#83C7FD]/30 flex items-center justify-center flex-shrink-0 mt-1'>
                  <ChevronRight className='h-3.5 w-3.5 text-white' />
                </div>
                <p className='text-white/80'>{t('list1')}</p>
              </li>
              <li className='flex items-start gap-3'>
                <div className='h-6 w-6 rounded-full bg-gradient-to-r from-[#AFF344]/30 to-[#83C7FD]/30 flex items-center justify-center flex-shrink-0 mt-1'>
                  <ChevronRight className='h-3.5 w-3.5 text-white' />
                </div>
                <p className='text-white/80'>{t('list2')}</p>
              </li>
              <li className='flex items-start gap-3'>
                <div className='h-6 w-6 rounded-full bg-gradient-to-r from-[#AFF344]/30 to-[#83C7FD]/30 flex items-center justify-center flex-shrink-0 mt-1'>
                  <ChevronRight className='h-3.5 w-3.5 text-white' />
                </div>
                <p className='text-white/80'>{t('list3')}</p>
              </li>
            </ul>

            <Button
              asChild
              className='bg-gradient-to-r from-[#83C7FD] to-[#FFE5BE] hover:from-[#FFE5BE] hover:to-[#83C7FD] text-[#0D0D0D] font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#83C7FD]/20 relative overflow-hidden group'
            >
              <Link href='https://wa.me/523339550061?text=Hola%2C%20me%20gustar%C3%ADa%20recibir%20notificaciones%20cuando%20el%20sitio%20de%20Holistia%20est%C3%A9%20en%20l%C3%ADnea.'>
                <span className='relative z-10'>{t('JoinBtn')}</span>
                <span className='absolute inset-0 bg-gradient-to-r from-[#83C7FD]/0 via-white/20 to-[#83C7FD]/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out'></span>
              </Link>
            </Button>
          </div>

          <div className='order-1 lg:order-2'>
            <div className='relative'>
              {/* Decorative elements */}
              <div className='absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-r from-[#83C7FD] to-[#AFF344] rounded-full blur-xl opacity-50'></div>
              <div className='absolute -bottom-10 -left-10 w-20 h-20 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] rounded-full blur-xl opacity-50'></div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-4'>
                  <div className='rounded-2xl overflow-hidden border border-white/10 aspect-square'>
                    <Image
                      src='https://images.unsplash.com/photo-1556760544-74068565f05c?q=80&w=2929&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
                      alt='Community member'
                      width={400}
                      height={400}
                      className='w-full h-full object-cover'
                    />
                  </div>
                  <div className='rounded-2xl overflow-hidden border border-white/10 aspect-video'>
                    <Image
                      src='https://images.unsplash.com/photo-1483137140003-ae073b395549?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
                      alt='Wellness activity'
                      width={400}
                      height={300}
                      className='w-full h-full object-cover'
                    />
                  </div>
                </div>
                <div className='space-y-4 pt-10'>
                  <div className='rounded-2xl overflow-hidden border border-white/10 aspect-video'>
                    <Image
                      src='https://images.unsplash.com/photo-1619968987472-4d1b2784592e?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
                      alt='Group session'
                      width={400}
                      height={300}
                      className='w-full h-full object-cover'
                    />
                  </div>
                  <div className='rounded-2xl overflow-hidden border border-white/10 aspect-square'>
                    <Image
                      src='https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
                      alt='Meditation class'
                      width={400}
                      height={400}
                      className='w-full h-full object-cover'
                    />
                  </div>
                </div>
              </div>

              {/* Floating card */}
              <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-[#0D0D0D]/80 backdrop-blur-md rounded-xl border border-white/10 p-4 w-3/4 shadow-xl'>
                <div className='flex items-center gap-3'>
                  <div className='h-10 w-10 rounded-full bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] flex items-center justify-center'>
                    <Users className='h-5 w-5 text-white' />
                  </div>
                  <div>
                    <p className='font-medium'>{t('helpMessage2')}</p>
                    <p className='text-sm text-white/70'>
                      {t('helpMessage2Description')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
