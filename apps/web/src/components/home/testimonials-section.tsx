const testimonials = [
  {
    stars: 5,
    quote: "I found a construction job in Dubai within 3 days. The live hiring counter told me exactly how many spots were left — I applied immediately and got hired.",
    name: 'Mohammed Al Rashidi',
    role: 'Scaffolding Supervisor',
    country: 'Kuwait',
  },
  {
    stars: 5,
    quote: "As an employer, I posted a job for 20 workers at 9am. By 2pm I had 40 applications and hired all 20 by end of day. The platform just works.",
    name: 'Sarah Mitchell',
    role: 'HR Manager, Royal Palm Hospitality',
    country: 'Qatar',
  },
  {
    stars: 5,
    quote: "The verified employer badge gave me confidence. I knew the company was legitimate before I even applied. That trust means everything when you're far from home.",
    name: 'Priya Sharma',
    role: 'Hospitality Professional',
    country: 'India',
  },
];

export function TestimonialsSection() {
  return (
    <section className="section-full bg-white py-16 lg:py-20" aria-labelledby="testimonials-heading">
      <div className="container-content">
        <div className="text-center mb-12">
          <h2 id="testimonials-heading" className="text-2xl md:text-3xl font-bold text-[#0F172A] font-[Manrope]">
            Trusted by Thousands
          </h2>
          <p className="mt-2 text-[#64748B]">Real experiences from professionals and employers across the GCC</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="bg-[#F8FAFC] rounded-2xl p-6 border border-[#E2E8F0] hover:border-[#14B8A6] hover:shadow-[0_4px_16px_rgba(20,184,166,0.1)] transition-all duration-200"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4" aria-label={`${t.stars} out of 5 stars`}>
                {Array.from({ length: t.stars }).map((_, i) => (
                  <span key={i} className="text-[#F59E0B] text-lg" aria-hidden="true">★</span>
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-sm text-[#475569] leading-relaxed mb-6">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              {/* Attribution */}
              <figcaption className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full bg-[#14B8A6] flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  aria-hidden="true"
                >
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0F172A]">{t.name}</p>
                  <p className="text-xs text-[#94A3B8]">{t.role} · {t.country}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
