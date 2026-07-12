import Link from 'next/link';

const categories = [
  { name: 'Construction', icon: '🏗', count: 142, slug: 'Construction' },
  { name: 'Solar Energy', icon: '☀️', count: 38, slug: 'Solar Energy' },
  { name: 'Hospitality', icon: '🏨', count: 89, slug: 'Hospitality' },
  { name: 'Cleaning', icon: '🧹', count: 67, slug: 'Cleaning' },
  { name: 'Domestic Services', icon: '🏠', count: 54, slug: 'Domestic Services' },
  { name: 'Private Tutoring', icon: '📚', count: 24, slug: 'Private Tutoring' },
];

export function CategoriesSection() {
  return (
    <section
      style={{ width: '100%', backgroundColor: '#F8FAFC', padding: '4rem 0' }}
      aria-labelledby="categories-heading"
    >
      <div style={{ width: '100%', maxWidth: '1440px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2
            id="categories-heading"
            style={{ fontFamily: "'Manrope', system-ui, sans-serif", fontSize: '1.875rem', fontWeight: 700, color: '#0F172A' }}
          >
            Browse by Industry
          </h2>
          <p style={{ marginTop: '0.5rem', color: '#64748B', fontSize: '1rem' }}>
            Find opportunities across the GCC&apos;s fastest-growing sectors
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '1rem',
          width: '100%',
        }}>
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/jobs?industry=${encodeURIComponent(cat.slug)}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                padding: '1.5rem 1rem',
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                textDecoration: 'none',
                transition: 'all 200ms',
              }}
              aria-label={`${cat.name} — ${cat.count} jobs available`}
            >
              <span style={{ fontSize: '2.5rem', marginBottom: '0.75rem', display: 'block' }} aria-hidden="true">
                {cat.icon}
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', lineHeight: 1.3 }}>
                {cat.name}
              </span>
              <span style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#94A3B8' }}>
                {cat.count} jobs
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
