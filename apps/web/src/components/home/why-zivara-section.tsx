const pillars = [
  {
    icon: '✓',
    title: 'Verified Employers',
    description: 'Every company is identity-checked and trade-license verified before they can post a single job.',
  },
  {
    icon: '👁',
    title: 'Transparent Hiring',
    description: 'See exactly how many positions are open, how many are filled, and how many applicants are competing.',
  },
  {
    icon: '🔴',
    title: 'Live Progress',
    description: 'Hiring counts update in real time. You always know if a position is still available before you apply.',
  },
  {
    icon: '⚡',
    title: 'Fast Applications',
    description: 'Apply in under 2 minutes. No lengthy forms, no unnecessary steps.',
  },
  {
    icon: '⭐',
    title: 'Trusted Platform',
    description: 'Verified IDs, honest ratings from both sides, and audit-logged admin decisions.',
  },
];

export function WhyZivaraSection() {
  return (
    <section className="section-full bg-[#0F172A] py-16 lg:py-20" aria-labelledby="why-heading">
      <div className="container-content">
        <div className="text-center mb-12">
          <h2 id="why-heading" className="text-2xl md:text-3xl font-bold text-white font-[Manrope]">
            Why Choose Zivara
          </h2>
          <p className="mt-2 text-[#94A3B8]">Built around honesty, not just convenience</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {pillars.map((p) => (
            <div
              key={p.title}
              className="bg-[#1E293B] rounded-2xl p-6 border border-[#334155] hover:border-[#14B8A6] transition-colors duration-200"
            >
              <div className="text-3xl mb-4" aria-hidden="true">{p.icon}</div>
              <h3 className="text-base font-bold text-white font-[Manrope] mb-2">{p.title}</h3>
              <p className="text-sm text-[#94A3B8] leading-relaxed">{p.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
