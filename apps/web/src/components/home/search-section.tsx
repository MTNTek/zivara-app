'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const COUNTRIES = ['UAE', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Oman'];
const CITIES: Record<string, string[]> = {
  'UAE': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Al Ain', 'Ras Al Khaimah'],
  'Saudi Arabia': ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar'],
  'Qatar': ['Doha', 'Al Wakrah', 'Al Khor', 'Al Rayyan'],
  'Kuwait': ['Kuwait City', 'Hawalli', 'Salmiya', 'Jahra'],
  'Bahrain': ['Manama', 'Muharraq', 'Riffa', 'Hamad Town'],
  'Oman': ['Muscat', 'Salalah', 'Sohar', 'Nizwa'],
};

export function SearchSection() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [country, setCountry] = useState('UAE');
  const [city, setCity] = useState('');
  const [showLocationTip, setShowLocationTip] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword) params.set('q', keyword);
    if (country) params.set('country', country);
    if (city) params.set('city', city);
    router.push(`/jobs?${params.toString()}`);
  };

  return (
    <section className="full-screen" style={{ backgroundColor: '#ffffff' }} aria-labelledby="search-heading">
      <div className="screen-content">
        <h2 id="search-heading" style={{
          fontFamily: "'Manrope', system-ui, sans-serif",
          fontSize: 'clamp(1.5rem, 3vw, 2rem)',
          fontWeight: 700, color: '#0F172A', textAlign: 'center', marginBottom: '2rem',
        }}>
          Find Your Next Opportunity
        </h2>

        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <form onSubmit={handleSearch} role="search" aria-label="Job search">
            {/* Main search box */}
            <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.10)] border border-[#E2E8F0] overflow-hidden">
              {/* Keyword input */}
              <div className="flex items-center px-5 py-1 border-b border-[#E2E8F0]">
                <svg className="w-5 h-5 text-[#94A3B8] flex-shrink-0 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Job title, skill, or company name"
                  className="flex-1 h-14 bg-transparent text-base text-[#0F172A] placeholder-[#CBD5E1] outline-none"
                  aria-label="Search by job title, skill, or company"
                />
                {keyword && (
                  <button type="button" onClick={() => setKeyword('')} className="p-1 text-[#94A3B8] hover:text-[#475569]" aria-label="Clear search">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Location row */}
              <div className="grid grid-cols-1 sm:grid-cols-2">
                <div className="flex items-center px-5 py-1 sm:border-r border-[#E2E8F0]">
                  <svg className="w-5 h-5 text-[#94A3B8] flex-shrink-0 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <select
                    value={country}
                    onChange={(e) => { setCountry(e.target.value); setCity(''); }}
                    className="flex-1 h-12 bg-transparent text-base text-[#0F172A] outline-none cursor-pointer"
                    aria-label="Select country"
                  >
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="flex items-center px-5 py-1">
                  <svg className="w-5 h-5 text-[#94A3B8] flex-shrink-0 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="flex-1 h-12 bg-transparent text-base text-[#0F172A] outline-none cursor-pointer"
                    aria-label="Select city"
                  >
                    <option value="">All cities</option>
                    {(CITIES[country] ?? []).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Search button */}
              <div className="px-4 pb-4 pt-2">
                <button
                  type="submit"
                  className="w-full h-13 bg-[#14B8A6] text-white text-base font-semibold rounded-[6px] hover:bg-[#0D9488] hover:shadow-[0_4px_16px_rgba(20,184,166,0.25)] transition-all duration-150 active:scale-[0.99] py-3"
                  style={{ height: '52px' }}
                >
                  Search Jobs
                </button>
              </div>
            </div>

            {/* Location tip */}
            <div className="mt-4 text-center relative">
              <button
                type="button"
                onClick={() => setShowLocationTip(true)}
                className="inline-flex items-center gap-2 text-sm text-[#14B8A6] font-medium hover:text-[#0D9488] transition-colors"
                aria-expanded={showLocationTip}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                Use My Current Location
              </button>

              {showLocationTip && (
                <div className="absolute top-8 left-1/2 -translate-x-1/2 w-80 bg-white border border-[#E2E8F0] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-5 z-10" role="dialog" aria-label="Location permission info">
                  <h3 className="font-semibold text-[#0F172A] text-sm mb-2">📍 Why allow location?</h3>
                  <p className="text-sm text-[#475569] mb-4 leading-relaxed">
                    See distance and estimated travel time to each job from your exact location.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setShowLocationTip(false); /* GPS request here */ }}
                      className="flex-1 py-2 bg-[#14B8A6] text-white text-sm font-semibold rounded-[6px] hover:bg-[#0D9488] transition-colors"
                    >
                      Allow
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowLocationTip(false)}
                      className="flex-1 py-2 border border-[#E2E8F0] text-[#475569] text-sm font-semibold rounded-[6px] hover:bg-[#F8FAFC] transition-colors"
                    >
                      Not now
                    </button>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
