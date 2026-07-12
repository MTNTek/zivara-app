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
    <div className="text-center px-8 py-6 relative">
      <p className="text-4xl lg:text-5xl font-extrabold text-white font-[Manrope] tabular-nums">
        {count.toLocaleString()}{suffix}
      </p>
      <p className="mt-2 text-sm font-medium text-[#94A3B8] uppercase tracking-widest">{label}</p>
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
    <section ref={ref} className="section-full bg-[#14B8A6] py-12" aria-label="Platform statistics">
      <div className="container-content">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/20">
          {stats.map((s) => (
            <StatItem key={s.label} {...s} active={active} />
          ))}
        </div>
      </div>
    </section>
  );
}
