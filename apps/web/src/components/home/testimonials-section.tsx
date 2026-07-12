const testimonials = [
  {
    stars: 5,
    quote: "I found a construction job in Dubai within 3 days. The live hiring counter told me exactly how many spots were left — I applied and got hired.",
    name: 'Mohammed Al Rashidi', role: 'Scaffolding Supervisor', country: 'Kuwait',
  },
  {
    stars: 5,
    quote: "Posted a job for 20 workers at 9am. By 2pm I had 40 applications and hired all 20 by end of day. The platform just works.",
    name: 'Sarah Mitchell', role: 'HR Manager, Royal Palm Hospitality', country: 'Qatar',
  },
  {
    stars: 5,
    quote: "The verified employer badge gave me confidence. I knew the company was legitimate before I even applied.",
    name: 'Priya Sharma', role: 'Hospitality Professional', country: 'India',
  },
];

export function TestimonialsSection() {
  return (
    <section className="full-screen" style={{ backgroundColor: '#ffffff' }} aria-labelledby="testimonials-heading">
      <div className="screen-content">
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 id="testimonials-heading" style={{
            fontFamily: "'Manrope', system-ui, sans-serif",
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 700, color: '#0F172A', marginBottom: '0.5rem',
          }}>
            Trusted by Thousands
          </h2>
          <p style={{ color: '#64748B', fontSize: '1.0625rem' }}>
            Real experiences from professionals and employers across the GCC
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          {testimonials.map((t) => (
            <figure key={t.name} style={{
              backgroundColor: '#F8FAFC', borderRadius: '16px',
              padding: '2rem', border: '1px solid #E2E8F0', margin: 0,
            }}>
              <div style={{ display: 'flex', gap: '2px', marginBottom: '1.25rem' }}>
                {Array.from({ length: t.stars }).map((_, i) => (
                  <span key={i} style={{ color: '#F59E0B', fontSize: '1.1rem' }} aria-hidden="true">★</span>
                ))}
              </div>
              <blockquote style={{ fontSize: '0.9375rem', color: '#475569', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  backgroundColor: '#14B8A6', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0,
                }} aria-hidden="true">{t.name.charAt(0)}</div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0F172A' }}>{t.name}</p>
                  <p style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{t.role} · {t.country}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
