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
      className="full-screen"
      style={{ backgroundColor: '#F8FAFC', padding: '0 4vw' }}
      aria-labelledby="categories-heading"
    >
      {/* Header — takes natural space */}
      <div style={{ textAlign: 'center', marginBottom: '3vh' }}>
        <h2
          id="categories-heading"
          style={{
            fontFamily: "'Manrope', system-ui, sans-serif",
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 800,
            color: '#0F172A',
            marginBottom: '0.75rem',
          }}
        >
          Browse by Industry
        </h2>
        <p style={{ color: '#64748B', fontSize: 'clamp(1rem, 1.5vw, 1.2rem)' }}>
          Find opportunities across the GCC&apos;s fastest-growing sectors
        </p>
      </div>

      {/* Cards — fill all remaining width, equal height */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '1.5vw',
          width: '100%',
        }}
      >
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/jobs?industry=${encodeURIComponent(cat.slug)}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '3vh 1vw',
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              border: '1px solid #E2E8F0',
              textDecoration: 'none',
              aspectRatio: '1 / 1.1',
              transition: 'box-shadow 200ms, border-color 200ms',
            }}
            aria-label={`${cat.name} — ${cat.count} jobs available`}
          >
            <span style={{ fontSize: 'clamp(3rem, 5vw, 5rem)', marginBottom: '1rem', display: 'block', lineHeight: 1 }} aria-hidden="true">
              {cat.icon}
            </span>
            <span style={{ fontSize: 'clamp(0.9rem, 1.2vw, 1.1rem)', fontWeight: 700, color: '#0F172A', lineHeight: 1.3 }}>
              {cat.name}
            </span>
            <span style={{ marginTop: '0.5rem', fontSize: 'clamp(0.75rem, 1vw, 0.9rem)', color: '#94A3B8' }}>
              {cat.count} jobs
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
