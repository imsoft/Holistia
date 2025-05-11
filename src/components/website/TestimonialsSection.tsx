import { Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';
export default function TestimonialsSection() {
  const t = useTranslations('TestimonialsSection');
  return (
    <section
      id='testimonials'
      className='py-20 md:py-32 relative'
    >
      {/* Gradient blobs */}
      <div className='absolute top-0 left-0 w-[400px] h-[400px] bg-[#FFE5BE]/10 rounded-full blur-[100px] -z-10'></div>
      <div className='absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#AC89FF]/5 rounded-full blur-[100px] -z-10'></div>

      <div className='container mx-auto px-4'>
        <div className='max-w-3xl mx-auto text-center mb-16'>
          <div className='inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-[#FFE5BE]/20 to-[#FF9900]/20 text-[#FFE5BE] text-sm font-medium mb-6'>
            <Heart className='h-3.5 w-3.5 mr-2' />
            <span> {t('helpMessage')}</span>
          </div>

          <h2 className='text-3xl md:text-5xl font-bold mb-6'>{t('tittle')}</h2>

          <p className='text-lg text-white/70'>{t('parragraf')}</p>
        </div>

        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
          <TestimonialCard
            name='María González'
            role={t('Testimonial1Role')}
            quote={t('Testimonial1Quote')}
            gradient='from-[#AC89FF]/20 to-[#83C7FD]/20'
            avatarGradient='from-[#AC89FF] to-[#83C7FD]'
          />

          <TestimonialCard
            name='Carlos Rodríguez'
            role={t('Testimonial2Role')}
            quote={t('Testimonial2Quote')}
            gradient='from-[#AFF344]/20 to-[#83C7FD]/20'
            avatarGradient='from-[#AFF344] to-[#83C7FD]'
          />

          <TestimonialCard
            name='Laura Martínez'
            role={t('Testimonial3Role')}
            quote={t('Testimonial3Quote')}
            gradient='from-[#FFE5BE]/20 to-[#FF9900]/20'
            avatarGradient='from-[#FFE5BE] to-[#FF9900]'
          />
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({
  name,
  role,
  quote,
  gradient,
  avatarGradient,
}: {
  name: string;
  role: string;
  quote: string;
  gradient: string;
  avatarGradient: string;
}) {
  return (
    <div
      className={`p-6 rounded-2xl bg-gradient-to-br ${gradient} backdrop-blur-sm border border-white/5 hover:border-white/10 transition-all hover:translate-y-[-4px]`}
    >
      <div className='flex items-center gap-4 mb-4'>
        <div
          className={`h-12 w-12 rounded-full bg-gradient-to-r ${avatarGradient} flex items-center justify-center`}
        >
          <span className='text-lg font-bold text-white'>{name.charAt(0)}</span>
        </div>
        <div>
          <h4 className='font-medium'>{name}</h4>
          <p className='text-sm text-white/70'>{role}</p>
        </div>
      </div>
      <p className='italic text-white/80'>{quote}</p>
    </div>
  );
}
