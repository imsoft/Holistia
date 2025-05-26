import Header from '../../../components/website/Header';
import HeroSection from '../../../components/website/HeroSection';
import FeaturesSection from '../../../components/website/FeaturesSection';
import CommunitySection from '../../../components/website/CommunitySection';
import TestimonialsSection from '../../../components/website/TestimonialsSection';
import CtaSection from '../../../components/website/CtaSection';
import Footer from '../../../components/website/Footer';
import { getCurrentUser } from '@/services/auth';
import { User } from '@/types/database.types';

//import { useTranslations } from 'next-intl';
//import { Link } from '../../../i18n/navegation';

export default async function Home() {
  const { user, error } = await getCurrentUser();
  return (
    <>
      <div className='min-h-screen bg-[#0D0D0D] text-white overflow-hidden'>
        <Header user={user} />
        <main>
          <HeroSection />
          <FeaturesSection />
          <CommunitySection />
          <TestimonialsSection />
          <CtaSection />
        </main>
        <Footer />
      </div>
    </>
  );
}
