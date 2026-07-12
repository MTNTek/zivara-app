const pillars = [
  { icon: '✓', title: 'Verified Employers', description: 'Every company is identity-checked and trade-license verified before posting jobs.' },
  { icon: '👁', title: 'Transparent Hiring', description: 'See exactly how many positions are open, filled, and how many applicants are competing.' },
  { icon: '🔴', title: 'Live Progress', description: 'Hiring counts update in real time. Always know if a position is available before applying.' },
  { icon: '⚡', title: 'Fast Applications', description: 'Apply in under 2 minutes. No lengthy forms, no unnecessary steps.' },
  { icon: '⭐', title: 'Trusted Platform', description: 'Verified IDs, honest ratings, and audit-logged decisions on every interaction.' },
];

export function WhyZivaraSection() {
  return (
    <section className="full-screen" style={{ backgroundColor: '#0F172A' }} aria-labelledby="why-heading">
      <div className="screen-content">
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 id="why-heading" style={{
            fontFamily: "'Manrope', system-ui, sans-serif",
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 700, color: '#ffffff', marginBottom: '0.5rem',
          }}>
            Why Choose Zivara
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '1.0625rem' }}>Built around honesty, not just convenience</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1.25rem' }}>
          {pillars.map((p) => (
            <div key={p.title} style={{
              backgroundColor: '#1E293B', borderRadius: '16px',
              padding: '1.75rem 1.5rem', border: '1px solid #334155',
            }}>
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
