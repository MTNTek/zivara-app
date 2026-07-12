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
    quote: "The verified employer badge gave me confidence. I knew the company was legitimate before I even applied. That trust means everything.",
    name: 'Priya Sharma', role: 'Hospitality Professional', country: 'India',
  },
];

export function TestimonialsSection() {
  return (
    <section
      className="full-screen"
      style={{ backgroundColor: '#ffffff', padding: '0 4vw' }}
      aria-labelledby="testimonials-heading"
    >
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '3vh' }}>
        <div style={{ textAlign: 'center' }}>
          <h2
            id="testimonials-heading"
            style={{
              fontFamily: "'Manrope', system-ui, sans-serif",
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 800, color: '#0F172A', marginBottom: '0.75rem',
            }}
          >
            Trusted by Thousands
          </h2>
          <p style={{ color: '#64748B', fontSize: 'clamp(1rem, 1.5vw, 1.2rem)' }}>
            Real experiences from professionals and employers across the GCC
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2vw', width: '100%' }}>
          {testimonials.map((t) => (
            <figure
              key={t.name}
              style={{
                backgroundColor: '#F8FAFC', borderRadius: '20px',
                padding: '3vh 2.5vw', border: '1px solid #E2E8F0',
                margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', gap: '3px', marginBottom: '1.25rem' }}>
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <span key={i} style={{ color: '#F59E0B', fontSize: 'clamp(1rem, 1.5vw, 1.5rem)' }} aria-hidden="true">★</span>
                  ))}
                </div>
                <blockquote style={{
                  fontSize: 'clamp(0.9rem, 1.2vw, 1.1rem)',
                  color: '#475569', lineHeight: 1.8,
                }}>
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
              </div>
              <figcaption style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                <div style={{
                  width: 'clamp(40px, 4vw, 56px)', height: 'clamp(40px, 4vw, 56px)',
                  borderRadius: '50%', backgroundColor: '#14B8A6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700,
                  fontSize: 'clamp(0.875rem, 1.2vw, 1.1rem)', flexShrink: 0,
                }} aria-hidden="true">{t.name.charAt(0)}</div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 'clamp(0.875rem, 1.1vw, 1rem)', color: '#0F172A' }}>{t.name}</p>
                  <p style={{ fontSize: 'clamp(0.75rem, 0.9vw, 0.875rem)', color: '#94A3B8' }}>{t.role} · {t.country}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
