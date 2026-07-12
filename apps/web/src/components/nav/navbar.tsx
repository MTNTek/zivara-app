'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const navLinks = [
  { href: '/jobs', label: 'Jobs' },
  { href: '/employers', label: 'Employers' },
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/about', label: 'About' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-200 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-sm shadow-[0_2px_8px_rgba(0,0,0,0.07)] border-b border-[#E2E8F0]'
            : 'bg-white'
        }`}
        aria-label="Main navigation"
      >
        <div className="container-content">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0" aria-label="Zivara home">
              <span className="text-2xl font-extrabold text-[#14B8A6] font-[Manrope]">Zivara</span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden lg:flex items-center gap-8" role="list">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-[#475569] hover:text-[#14B8A6] transition-colors duration-150 relative group"
                  role="listitem"
                >
                  {link.label}
                  <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-[#14B8A6] transition-all duration-200 group-hover:w-full rounded-full" />
                </Link>
              ))}
            </div>

            {/* Desktop auth */}
            <div className="hidden lg:flex items-center gap-3">
              <Link href="/login" className="text-sm font-semibold text-[#475569] hover:text-[#0F172A] transition-colors px-3 py-2">
                Log in
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center h-12 px-6 bg-[#14B8A6] text-white text-[15px] font-semibold rounded-[6px] hover:bg-[#0D9488] hover:shadow-[0_4px_16px_rgba(20,184,166,0.25)] transition-all duration-150 active:scale-[0.98] whitespace-nowrap"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2 rounded-lg text-[#475569] hover:bg-[#F1F5F9] transition-colors"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Spacer to prevent content jumping under fixed nav */}
      <div className="h-16" aria-hidden="true" />

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-0 right-0 bottom-0 w-80 bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
              <span className="text-xl font-extrabold text-[#14B8A6] font-[Manrope]">Zivara</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg text-[#475569] hover:bg-[#F1F5F9] transition-colors"
                aria-label="Close navigation menu"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center px-6 py-4 text-base font-medium text-[#0F172A] hover:bg-[#F0FDFA] hover:text-[#14B8A6] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="px-6 py-6 border-t border-[#E2E8F0] space-y-3">
              <Link href="/login" className="block w-full text-center py-3 px-4 text-sm font-semibold text-[#475569] hover:text-[#0F172A] border border-[#E2E8F0] rounded-[6px] hover:bg-[#F8FAFC] transition-colors">
                Log in
              </Link>
              <Link href="/register" className="block w-full text-center py-3 px-4 text-sm font-semibold text-white bg-[#14B8A6] hover:bg-[#0D9488] rounded-[6px] transition-colors">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
