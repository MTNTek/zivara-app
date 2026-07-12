import Link from 'next/link';

const categories = [
  { name: 'Construction', icon: '🏗', count: 142, slug: 'construction' },
  { name: 'Solar Energy', icon: '☀️', count: 38, slug: 'solar-energy' },
  { name: 'Hospitality', icon: '🏨', count: 89, slug: 'hospitality' },
  { name: 'Cleaning', icon: '🧹', count: 67, slug: 'cleaning' },
  { name: 'Domestic Services', icon: '🏠', count: 54, slug: 'domestic-services' },
  { name: 'Private Tutoring', icon: '📚', count: 24, slug: 'private-tutoring' },
];

export function CategoriesSection() {
  return (
    <section className="section-full bg-[#F8FAFC] py-16 lg:py-20" aria-labelledby="categories-heading">
      <div className="container-content">
        <div className="text-center mb-10">
          <h2 id="categories-heading" className="text-2xl md:text-3xl font-bold text-[#0F172A] font-[Manrope]">
            Browse by Industry
          </h2>
          <p className="mt-2 text-[#64748B]">Find opportunities across the GCC&apos;s fastest-growing sectors</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/jobs?industry=${encodeURIComponent(cat.name)}`}
              className="group flex flex-col items-center text-center p-5 bg-white rounded-2xl border border-[#E2E8F0] hover:border-[#14B8A6] hover:shadow-[0_4px_16px_rgba(20,184,166,0.15)] transition-all duration-200 hover:-translate-y-0.5"
              aria-label={`${cat.name} — ${cat.count} jobs available`}
            >
              <span className="text-4xl mb-3 block" aria-hidden="true">{cat.icon}</span>
              <span className="text-sm font-semibold text-[#0F172A] group-hover:text-[#14B8A6] transition-colors leading-tight">
                {cat.name}
              </span>
              <span className="mt-1 text-xs text-[#94A3B8]">{cat.count} jobs</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
