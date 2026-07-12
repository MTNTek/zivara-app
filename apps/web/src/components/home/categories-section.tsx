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
    <section className="full-screen" style={{ backgroundColor: '#F8FAFC' }} aria-labelledby="categories-heading">
      <div className="screen-content">
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 id="categories-heading" style={{
            fontFamily: "'Manrope', system-ui, sans-serif",
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 700, color: '#0F172A', marginBottom: '0.5rem',
          }}>
            Browse by Industry
          </h2>
          <p style={{ color: '#64748B', fontSize: '1.0625rem' }}>
            Find opportunities across the GCC&apos;s fastest-growing sectors
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '1rem',
        }}>
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/jobs?industry=${encodeURIComponent(cat.slug)}`}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                textAlign: 'center', padding: '1.75rem 1rem',
                backgroundColor: '#ffffff', borderRadius: '16px',
                border: '1px solid #E2E8F0', textDecoration: 'none',
              }}
              aria-label={`${cat.name} — ${cat.count} jobs`}
            >
              <span style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }} aria-hidden="true">{cat.icon}</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0F172A', lineHeight: 1.3 }}>{cat.name}</span>
              <span style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#94A3B8' }}>{cat.count} jobs</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
