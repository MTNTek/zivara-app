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
    <div className="min-h-screen w-full flex flex-col">
      <Navbar />
      <main id="main-content" className="flex-1 w-full">
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
