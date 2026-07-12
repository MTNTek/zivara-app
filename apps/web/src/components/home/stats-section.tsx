'use client';

import { useEffect, useRef, useState } from 'react';

const stats = [
  { value: 2847, label: 'Active Jobs', suffix: '' },
  { value: 18421, label: 'Professionals', suffix: '+' },
  { value: 312, label: 'Employers', suffix: '' },
  { value: 9104, label: 'Successful Hires', suffix: '' },
];

function useCountUp(target: number, duration = 1500, active: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, active]);
  return count;
}

function StatItem({ value, label, suffix, active }: typeof stats[0] & { active: boolean }) {
  const count = useCountUp(value, 1500, active);
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', flex: 1, padding: '2vw',
      borderRight: '1px solid rgba(255,255,255,0.2)',
    }}>
      <p style={{
        fontFamily: "'Manrope', system-ui, sans-serif",
        fontSize: 'clamp(2.5rem, 6vw, 5rem)',
        fontWeight: 800, color: '#ffffff', lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {count.toLocaleString()}{suffix}
      </p>
      <p style={{
        marginTop: '0.75rem', fontSize: 'clamp(0.8rem, 1.2vw, 1rem)',
        fontWeight: 600, color: 'rgba(255,255,255,0.7)',
        textTransform: 'uppercase', letterSpacing: '0.1em',
      }}>
        {label}
      </p>
    </div>
  );
}

export function StatsSection() {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setActive(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="full-screen"
      style={{ backgroundColor: '#14B8A6' }}
      aria-label="Platform statistics"
    >
      <div style={{ display: 'flex', width: '100%', height: '100%', flex: 1 }}>
        {stats.map((s, i) => (
          <StatItem key={s.label} {...s} active={active}
            style={i === stats.length - 1 ? { borderRight: 'none' } : {}} />
        ))}
      </div>
    </section>
  );
}
