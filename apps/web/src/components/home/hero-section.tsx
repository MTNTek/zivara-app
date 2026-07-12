import Link from 'next/link';

export function HeroSection() {
  return (
    <section
      className="full-screen"
      style={{ backgroundColor: '#ffffff', padding: '0 4vw' }}
      aria-labelledby="hero-heading"
    >
      {/* Full-bleed teal radial gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 90% 70% at 50% 110%, #CCFBF1 0%, transparent 65%)',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />

      <div
        style={{
          width: '100%',
          maxWidth: '900px',
          textAlign: 'center',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2.5vh',
        }}
      >
        {/* Trust badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '10px',
          backgroundColor: '#F0FDFA', border: '1px solid #CCFBF1',
          borderRadius: '9999px', padding: '8px 20px',
        }}>
          <span className="live-dot" aria-hidden="true" />
          <span style={{ fontSize: 'clamp(0.8rem, 1.2vw, 1rem)', fontWeight: 600, color: '#0D9488' }}>
            Trusted by 18,000+ professionals across the GCC
          </span>
        </div>

        {/* Headline */}
        <h1
          id="hero-heading"
          style={{
            fontFamily: "'Manrope', system-ui, sans-serif",
            fontSize: 'clamp(2.5rem, 7vw, 5.5rem)',
            fontWeight: 800,
            color: '#0F172A',
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
          }}
        >
          Find Trusted Work.<br />
          <span style={{ color: '#14B8A6' }}>Hire Trusted People.</span>
        </h1>

        {/* Sub */}
        <p style={{
          fontSize: 'clamp(1rem, 1.8vw, 1.35rem)',
          color: '#475569',
          lineHeight: 1.7,
          maxWidth: '600px',
        }}>
          The GCC&apos;s most transparent workforce marketplace. Verified employers,
          live hiring progress, and fair pay — all in one place.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/jobs" className="btn-primary" style={{ height: '60px', padding: '0 2.5rem', fontSize: 'clamp(0.95rem, 1.2vw, 1.1rem)' }}>
            Find Jobs
          </Link>
          <Link href="/register/employer" className="btn-secondary" style={{ height: '60px', padding: '0 2.5rem', fontSize: 'clamp(0.95rem, 1.2vw, 1.1rem)' }}>
            Hire Workers
          </Link>
        </div>

        {/* Social proof */}
        <p style={{ fontSize: 'clamp(0.8rem, 1vw, 0.95rem)', color: '#94A3B8' }}>
          Trusted by Al Fardan Construction, SolarVision Gulf, Royal Palm Hospitality and 300+ more
        </p>
      </div>
    </section>
  );
}
