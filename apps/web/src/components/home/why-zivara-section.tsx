const pillars = [
  { icon: '✓', title: 'Verified Employers', description: 'Every company is identity-checked and trade-license verified before posting a single job.' },
  { icon: '👁', title: 'Transparent Hiring', description: 'See exactly how many positions are open, filled, and how many applicants are competing.' },
  { icon: '🔴', title: 'Live Progress', description: 'Hiring counts update in real time. Always know if a position is available before applying.' },
  { icon: '⚡', title: 'Fast Applications', description: 'Apply in under 2 minutes. No lengthy forms, no unnecessary steps.' },
  { icon: '⭐', title: 'Trusted Platform', description: 'Verified IDs, honest ratings, and audit-logged admin decisions on every interaction.' },
];

export function WhyZivaraSection() {
  return (
    <section
      className="full-screen"
      style={{ backgroundColor: '#0F172A', padding: '0 4vw' }}
      aria-labelledby="why-heading"
    >
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '3vh' }}>
        <div style={{ textAlign: 'center' }}>
          <h2
            id="why-heading"
            style={{
              fontFamily: "'Manrope', system-ui, sans-serif",
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 800, color: '#ffffff', marginBottom: '0.75rem',
            }}
          >
            Why Choose Zivara
          </h2>
          <p style={{ color: '#94A3B8', fontSize: 'clamp(1rem, 1.5vw, 1.2rem)' }}>
            Built around honesty, not just convenience
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '1.5vw',
          width: '100%',
        }}>
          {pillars.map((p) => (
            <div
              key={p.title}
              style={{
                backgroundColor: '#1E293B',
                borderRadius: '20px',
                padding: '3vh 2vw',
                border: '1px solid #334155',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div style={{ fontSize: 'clamp(2rem, 3vw, 3rem)' }} aria-hidden="true">{p.icon}</div>
              <h3 style={{
                fontFamily: "'Manrope', system-ui, sans-serif",
                fontSize: 'clamp(1rem, 1.3vw, 1.25rem)',
                fontWeight: 700, color: '#ffffff',
              }}>
                {p.title}
              </h3>
              <p style={{ fontSize: 'clamp(0.85rem, 1.1vw, 1rem)', color: '#94A3B8', lineHeight: 1.6 }}>
                {p.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
