import Link from 'next/link';

export function HeroSection() {
  return (
    <section
      className="full-screen"
      style={{ backgroundColor: '#ffffff' }}
      aria-labelledby="hero-heading"
    >
      {/* Teal gradient behind content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 80% 60% at 50% 110%, #CCFBF1 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />

      <div className="screen-content" style={{ textAlign: 'center', position: 'relative' }}>
        {/* Trust badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          backgroundColor: '#F0FDFA', border: '1px solid #CCFBF1',
          borderRadius: '9999px', padding: '6px 18px', marginBottom: '2rem',
        }}>
          <span className="live-dot" aria-hidden="true" />
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0D9488' }}>
            Trusted by 18,000+ professionals across the GCC
          </span>
        </div>

        {/* Headline */}
        <h1
          id="hero-heading"
          style={{
            fontFamily: "'Manrope', system-ui, sans-serif",
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            fontWeight: 800,
            color: '#0F172A',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            marginBottom: '1.25rem',
          }}
        >
          Find Trusted Work.<br />
          <span style={{ color: '#14B8A6' }}>Hire Trusted People.</span>
        </h1>

        {/* Sub */}
        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.2rem)',
          color: '#475569',
          lineHeight: 1.7,
          marginBottom: '2.5rem',
          maxWidth: '540px',
          margin: '0 auto 2.5rem',
        }}>
          The GCC&apos;s most transparent workforce marketplace. Verified employers,
          live hiring progress, and fair pay — all in one place.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '2rem' }}>
          <Link href="/jobs" className="btn-primary">Find Jobs</Link>
          <Link href="/register/employer" className="btn-secondary">Hire Workers</Link>
        </div>

        {/* Social proof */}
        <p style={{ fontSize: '0.875rem', color: '#94A3B8' }}>
          Trusted by Al Fardan Construction, SolarVision Gulf, Royal Palm Hospitality and 300+ more
        </p>
      </div>
    </section>
  );
}
