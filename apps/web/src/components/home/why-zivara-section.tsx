const pillars = [
  { icon: '✓', title: 'Verified Employers', description: 'Every company is identity-checked and trade-license verified before they can post a single job.' },
  { icon: '👁', title: 'Transparent Hiring', description: 'See exactly how many positions are open, how many are filled, and how many applicants are competing.' },
  { icon: '🔴', title: 'Live Progress', description: 'Hiring counts update in real time. You always know if a position is still available before you apply.' },
  { icon: '⚡', title: 'Fast Applications', description: 'Apply in under 2 minutes. No lengthy forms, no unnecessary steps.' },
  { icon: '⭐', title: 'Trusted Platform', description: 'Verified IDs, honest ratings from both sides, and audit-logged admin decisions.' },
];

export function WhyZivaraSection() {
  return (
    <section
      style={{ width: '100%', backgroundColor: '#0F172A', padding: '5rem 0' }}
      aria-labelledby="why-heading"
    >
      <div style={{ width: '100%', maxWidth: '1440px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2
            id="why-heading"
            style={{ fontFamily: "'Manrope', system-ui, sans-serif", fontSize: '1.875rem', fontWeight: 700, color: '#ffffff' }}
          >
            Why Choose Zivara
          </h2>
          <p style={{ marginTop: '0.5rem', color: '#94A3B8', fontSize: '1rem' }}>
            Built around honesty, not just convenience
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem',
          width: '100%',
        }}>
          {pillars.map((p) => (
            <div
              key={p.title}
              style={{
                backgroundColor: '#1E293B',
                borderRadius: '16px',
                padding: '1.5rem',
                border: '1px solid #334155',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }} aria-hidden="true">{p.icon}</div>
              <h3 style={{ fontFamily: "'Manrope', system-ui, sans-serif", fontSize: '1rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.5rem' }}>
                {p.title}
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#94A3B8', lineHeight: 1.6 }}>{p.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
