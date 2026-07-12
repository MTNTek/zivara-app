import { Navbar } from '@/components/nav/navbar';
import { Footer } from '@/components/nav/footer';
import { HeroSection } from '@/components/home/hero-section';
import { SearchSection } from '@/components/home/search-section';
import { CategoriesSection } from '@/components/home/categories-section';
import { FeaturedJobsSection } from '@/components/home/featured-jobs-section';
import { WhyZivaraSection } from '@/components/home/why-zivara-section';
import { HowItWorksSection } from '@/components/home/how-it-works-section';
import { StatsSection } from '@/components/home/stats-section';
import { TestimonialsSection } from '@/components/home/testimonials-section';

export default function HomePage() {
  return (
    // This div fills the 95vw × 95vh rounded card from layout.tsx
    <div style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main id="main-content" style={{ flex: 1, width: '100%' }}>
        <HeroSection />
        <SearchSection />
        <CategoriesSection />
        <FeaturedJobsSection />
        <WhyZivaraSection />
        <HowItWorksSection />
        <StatsSection />
        <TestimonialsSection />
      </main>
      <Footer />
    </div>
  );
}
