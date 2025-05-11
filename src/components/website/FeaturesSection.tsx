import { Heart, Users, Sparkles, Brain, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
export default function FeaturesSection() {
  const t = useTranslations('FeaturesSection');

  return (
    <section
      id='features'
      className='py-20 md:py-32 relative'
    >
      {/* Gradient blobs */}
      <div className='absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-[#AFF344]/5 rounded-full blur-[120px] -z-10'></div>
      <div className='absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#AC89FF]/5 rounded-full blur-[100px] -z-10'></div>

      <div className='container mx-auto px-4'>
        <div className='max-w-3xl mx-auto text-center mb-16'>
          <div className='inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-[#AFF344]/20 to-[#83C7FD]/20 text-[#AFF344] text-sm font-medium mb-6'>
            <Zap className='h-3.5 w-3.5 mr-2' />
            <span>{t('helpMessage')}</span>
          </div>

          <h2 className='text-3xl md:text-5xl font-bold mb-6'>{t('tittle')}</h2>

          <p className='text-lg text-white/70'>{t('parragraf')}</p>
        </div>

        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
          <FeatureCard
            icon={<Brain className='h-6 w-6 text-[#AC89FF]' />}
            title={t('card1Title')}
            description={t('card1Description')}
            gradient='from-[#AC89FF]/20 to-[#83C7FD]/20'
            hoverGradient='from-[#AC89FF]/30 to-[#83C7FD]/30'
          />

          <FeatureCard
            icon={<Heart className='h-6 w-6 text-[#AFF344]' />}
            title={t('card2Title')}
            description={t('card2Description')}
            gradient='from-[#AFF344]/20 to-[#83C7FD]/20'
            hoverGradient='from-[#AFF344]/30 to-[#83C7FD]/30'
          />

          <FeatureCard
            icon={<Users className='h-6 w-6 text-[#83C7FD]' />}
            title={t('card3Title')}
            description={t('card3Description')}
            gradient='from-[#83C7FD]/20 to-[#FFE5BE]/20'
            hoverGradient='from-[#83C7FD]/30 to-[#FFE5BE]/30'
          />

          <FeatureCard
            icon={<Sparkles className='h-6 w-6 text-[#FFE5BE]' />}
            title={t('card4Title')}
            description={t('card4Description')}
            gradient='from-[#FFE5BE]/20 to-[#FF9900]/20'
            hoverGradient='from-[#FFE5BE]/30 to-[#FF9900]/30'
          />

          <FeatureCard
            icon={<Calendar className='h-6 w-6 text-[#FF9900]' />}
            title={t('card5Title')}
            description={t('card5Description')}
            gradient='from-[#FF9900]/20 to-[#AC89FF]/20'
            hoverGradient='from-[#FF9900]/30 to-[#AC89FF]/30'
          />

          <FeatureCard
            icon={<Zap className='h-6 w-6 text-[#AFF344]' />}
            title={t('card6Title')}
            description={t('card6Description')}
            gradient='from-[#AFF344]/20 to-[#AC89FF]/20'
            hoverGradient='from-[#AFF344]/30 to-[#AC89FF]/30'
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  gradient,
}: // hoverGradient,
{
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  hoverGradient?: string;
}) {
  return (
    <div
      className={`p-6 rounded-2xl bg-gradient-to-br ${gradient} backdrop-blur-sm border border-white/5 hover:border-white/10 transition-all hover:translate-y-[-4px] group`}
    >
      <div className='h-12 w-12 rounded-full bg-[#0D0D0D]/50 backdrop-blur-sm flex items-center justify-center mb-5 group-hover:scale-110 transition-transform'>
        {icon}
      </div>
      <h3 className='text-xl font-semibold mb-3'>{title}</h3>
      <p className='text-white/70'>{description}</p>
    </div>
  );
}

function Calendar(props: React.SVGProps<SVGSVGElement>) {
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
      <rect
        width='18'
        height='18'
        x='3'
        y='4'
        rx='2'
        ry='2'
      />
      <line
        x1='16'
        x2='16'
        y1='2'
        y2='6'
      />
      <line
        x1='8'
        x2='8'
        y1='2'
        y2='6'
      />
      <line
        x1='3'
        x2='21'
        y1='10'
        y2='10'
      />
    </svg>
  );
}
