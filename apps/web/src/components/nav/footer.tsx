import Link from 'next/link';

const footerLinks = {
  Platform: [
    { href: '/jobs', label: 'Browse Jobs' },
    { href: '/employers', label: 'For Employers' },
    { href: '/#how-it-works', label: 'How It Works' },
    { href: '/register/professional', label: 'Join as Professional' },
    { href: '/register/employer', label: 'Join as Employer' },
  ],
  Company: [
    { href: '/about', label: 'About Zivara' },
    { href: '/careers', label: 'Careers' },
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
  ],
  Support: [
    { href: '/help', label: 'Help Centre' },
    { href: '/contact', label: 'Contact Us' },
    { href: '/safety', label: 'Safety & Trust' },
  ],
};

export function Footer() {
  return (
    <footer className="full-screen" style={{ backgroundColor: '#0F172A', justifyContent: 'center' }} aria-label="Site footer">
      <div className="screen-content" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <span className="text-2xl font-extrabold text-[#14B8A6] font-[Manrope]">Zivara</span>
            </Link>
            <p className="text-sm text-[#94A3B8] leading-relaxed max-w-[220px]">
              The GCC&apos;s most trusted workforce marketplace. Verified employers. Transparent hiring.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="text-xs text-[#64748B] font-medium">Language:</span>
              <button className="text-xs font-semibold text-white hover:text-[#14B8A6] transition-colors" aria-label="Switch to English">EN</button>
              <span className="text-[#334155]">|</span>
              <button className="text-xs font-semibold text-[#94A3B8] hover:text-[#14B8A6] transition-colors" aria-label="التبديل إلى العربية" dir="rtl">AR</button>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section} className="space-y-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">{section}</h3>
              <ul className="space-y-3" role="list">
                {links.map((link) => (
                  <li key={link.href} role="listitem">
                    <Link
                      href={link.href}
                      className="text-sm text-[#94A3B8] hover:text-white transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-[#1E293B] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#475569]">
            © {new Date().getFullYear()} Zivara. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-xs text-[#475569] hover:text-[#94A3B8] transition-colors">Privacy</Link>
            <Link href="/terms" className="text-xs text-[#475569] hover:text-[#94A3B8] transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
