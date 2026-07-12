import { Navbar } from '@/components/nav/navbar';
import { HeroSection } from '@/components/home/hero-section';
import { SearchSection } from '@/components/home/search-section';
import { CategoriesSection } from '@/components/home/categories-section';
import { FeaturedJobsSection } from '@/components/home/featured-jobs-section';
import { WhyZivaraSection } from '@/components/home/why-zivara-section';
import { HowItWorksSection } from '@/components/home/how-it-works-section';
import { StatsSection } from '@/components/home/stats-section';
import { TestimonialsSection } from '@/components/home/testimonials-section';
import { Footer } from '@/components/nav/footer';

export default function HomePage() {
  return (
    <>
      {/* Navbar is fixed over all sections */}
      <Navbar />
      {/* Each section fills 100vw × 100vh and snaps into place */}
      <HeroSection />
      <SearchSection />
      <CategoriesSection />
      <FeaturedJobsSection />
      <WhyZivaraSection />
      <HowItWorksSection />
      <StatsSection />
      <TestimonialsSection />
      <Footer />
    </>
  );
}
