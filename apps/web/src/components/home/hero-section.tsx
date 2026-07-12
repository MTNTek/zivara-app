import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="section-full bg-white relative overflow-hidden" aria-labelledby="hero-heading">
      {/* Background gradient arc */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 pointer-events-none" aria-hidden="true">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[120%] h-64 bg-gradient-to-t from-[#F0FDFA] to-transparent rounded-t-[50%]" />
      </div>

      <div className="container-content relative py-20 lg:py-28">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 bg-[#F0FDFA] border border-[#CCFBF1] rounded-full px-4 py-2 mb-8">
            <span className="live-dot" aria-hidden="true" />
            <span className="text-sm font-semibold text-[#0D9488]">Trusted by 18,000+ professionals across the GCC</span>
          </div>

          {/* Headline */}
          <h1
            id="hero-heading"
            className="text-[2.5rem] md:text-[3.25rem] lg:text-[3.75rem] font-extrabold text-[#0F172A] leading-[1.1] tracking-tight mb-6 font-[Manrope]"
          >
            Find Trusted Work.<br />
            <span className="text-[#14B8A6]">Hire Trusted People.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-[#475569] leading-relaxed mb-10 max-w-xl">
            The GCC&apos;s most transparent workforce marketplace. Verified employers, live hiring progress, and fair pay — all in one place.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link
              href="/jobs"
              className="inline-flex items-center justify-center h-14 px-8 bg-[#14B8A6] text-white text-base font-semibold rounded-[6px] hover:bg-[#0D9488] hover:shadow-[0_4px_16px_rgba(20,184,166,0.25)] transition-all duration-150 active:scale-[0.98]"
            >
              Find Jobs
            </Link>
            <Link
              href="/register/employer"
              className="inline-flex items-center justify-center h-14 px-8 bg-white text-[#0F172A] text-base font-semibold rounded-[6px] border-[1.5px] border-[#E2E8F0] hover:border-[#14B8A6] hover:text-[#14B8A6] hover:bg-[#F0FDFA] transition-all duration-150 active:scale-[0.98]"
            >
              Hire Workers
            </Link>
          </div>

          {/* Social proof */}
          <p className="mt-8 text-sm text-[#94A3B8]">
            Trusted by Al Fardan Construction, SolarVision Gulf, Royal Palm Hospitality and 300+ more
          </p>
        </div>
      </div>
    </section>
  );
}
