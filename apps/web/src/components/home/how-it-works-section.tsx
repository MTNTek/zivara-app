'use client';
import { useState } from 'react';

const steps = {
  professionals: [
    { n: '1', title: 'Create your profile', desc: 'Add your skills, experience, and preferred industries. Takes under 2 minutes.' },
    { n: '2', title: 'Find and apply', desc: 'Browse verified jobs with live hiring progress. Apply with one tap.' },
    { n: '3', title: 'Confirm and earn', desc: 'Confirm your shift, complete the work, and receive your payment.' },
  ],
  employers: [
    { n: '1', title: 'Register your company', desc: 'Submit your trade license. Our team verifies it within 1 business day.' },
    { n: '2', title: 'Post a job in minutes', desc: 'Set the role, pay, location, and how many workers you need.' },
    { n: '3', title: 'Review and hire', desc: 'Browse applicants, shortlist the best, and confirm your hires.' },
  ],
};

export function HowItWorksSection() {
  const [tab, setTab] = useState<'professionals' | 'employers'>('professionals');

  return (
    <section className="full-screen" style={{ backgroundColor: '#F8FAFC' }} aria-labelledby="how-heading" id="how-it-works">
      <div className="screen-content">
        <div className="text-center mb-10">
          <h2 id="how-heading" className="text-2xl md:text-3xl font-bold text-[#0F172A] font-[Manrope]">
            How It Works
          </h2>
          <p className="mt-2 text-[#64748B]">Simple for everyone</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-white border border-[#E2E8F0] rounded-xl p-1" role="tablist">
            {(['professionals', 'employers'] as const).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
                  tab === t
                    ? 'bg-[#14B8A6] text-white shadow-sm'
                    : 'text-[#475569] hover:text-[#0F172A]'
                }`}
              >
                {t === 'professionals' ? 'For Professionals' : 'For Employers'}
              </button>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto" role="tabpanel">
          {steps[tab].map((step, i) => (
            <div key={step.n} className="flex flex-col items-center text-center relative">
              {/* Connector line */}
              {i < 2 && (
                <div className="hidden md:block absolute top-7 left-[calc(50%+2.5rem)] w-[calc(100%-5rem)] h-0.5 bg-[#E2E8F0]" aria-hidden="true" />
              )}
              <div className="w-14 h-14 rounded-full bg-[#14B8A6] text-white text-xl font-extrabold flex items-center justify-center mb-5 font-[Manrope] flex-shrink-0 z-10">
                {step.n}
              </div>
              <h3 className="text-base font-bold text-[#0F172A] font-[Manrope] mb-2">{step.title}</h3>
              <p className="text-sm text-[#64748B] leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
