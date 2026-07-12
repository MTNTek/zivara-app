import Link from 'next/link';

export function HeroSection() {
  return (
    <section
      style={{ width: '100%', backgroundColor: '#ffffff', position: 'relative', overflow: 'hidden' }}
      aria-labelledby="hero-heading"
    >
      {/* Full-bleed teal gradient at bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '200px',
          background: 'linear-gradient(to top, #F0FDFA, transparent)',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />

      <div className="page-content" style={{ padding: '5rem 0 6rem', position: 'relative' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: '720px', margin: '0 auto' }}>
          {/* Trust badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#F0FDFA',
              border: '1px solid #CCFBF1',
              borderRadius: '9999px',
              padding: '6px 16px',
              marginBottom: '2rem',
            }}
          >
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
              fontSize: 'clamp(2.25rem, 5vw, 3.75rem)',
              fontWeight: 800,
              color: '#0F172A',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              marginBottom: '1.5rem',
            }}
          >
            Find Trusted Work.<br />
            <span style={{ color: '#14B8A6' }}>Hire Trusted People.</span>
          </h1>

          {/* Sub */}
          <p
            style={{
              fontSize: '1.125rem',
              color: '#475569',
              lineHeight: 1.7,
              marginBottom: '2.5rem',
              maxWidth: '520px',
            }}
          >
            The GCC&apos;s most transparent workforce marketplace. Verified employers, live hiring progress, and fair pay — all in one place.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link
              href="/jobs"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '56px',
                padding: '0 2rem',
                backgroundColor: '#14B8A6',
                color: '#ffffff',
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: '6px',
                textDecoration: 'none',
                transition: 'background-color 150ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#0D9488')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#14B8A6')}
            >
              Find Jobs
            </Link>
            <Link
              href="/register/employer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '56px',
                padding: '0 2rem',
                backgroundColor: '#ffffff',
                color: '#0F172A',
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: '6px',
                border: '1.5px solid #E2E8F0',
                textDecoration: 'none',
                transition: 'all 150ms',
              }}
            >
              Hire Workers
            </Link>
          </div>

          {/* Social proof */}
          <p style={{ marginTop: '2rem', fontSize: '0.875rem', color: '#94A3B8' }}>
            Trusted by Al Fardan Construction, SolarVision Gulf, Royal Palm Hospitality and 300+ more
          </p>
        </div>
      </div>
    </section>
  );
}
