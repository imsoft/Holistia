import Header from '../../../components/website/Header';
import HeroSection from '../../../components/website/HeroSection';
import FeaturesSection from '../../../components/website/FeaturesSection';
import CommunitySection from '../../../components/website/CommunitySection';
import TestimonialsSection from '../../../components/website/TestimonialsSection';
import CtaSection from '../../../components/website/CtaSection';
import Footer from '../../../components/website/Footer';

//import { useTranslations } from 'next-intl';
//import { Link } from '../../../i18n/navegation';
const Home = () => {
  return (
    <>
      <div className='min-h-screen bg-[#0D0D0D] text-white overflow-hidden'>
        <Header />
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
};

export default Home;
