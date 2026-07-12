import Link from 'next/link';
import { HiringProgress } from '@/components/ui/hiring-progress';
import { Badge } from '@/components/ui/badge';

// Static demo data — in production this fetches from /jobs?status=active&limit=4
const DEMO_JOBS = [
  {
    id: '1',
    title: 'Senior Site Engineer',
    employer: 'Al Fardan Construction',
    verified: true,
    hourlyRate: 65,
    shiftHours: 8,
    employmentType: 'Full-time',
    city: 'Dubai',
    distance: 12,
    travelTime: 20,
    posted: '2 hours ago',
    total: 20,
    hired: 8,
    applicants: 48,
  },
  {
    id: '2',
    title: 'Solar PV Installer',
    employer: 'SolarVision Gulf',
    verified: true,
    hourlyRate: 42,
    shiftHours: 8,
    employmentType: 'Contract',
    city: 'Riyadh',
    distance: null,
    travelTime: null,
    posted: '5 hours ago',
    total: 10,
    hired: 9,
    applicants: 31,
  },
  {
    id: '3',
    title: 'Front Desk Agent',
    employer: 'Royal Palm Hospitality',
    verified: true,
    hourlyRate: 35,
    shiftHours: 10,
    employmentType: 'Full-time',
    city: 'Doha',
    distance: null,
    travelTime: null,
    posted: '1 day ago',
    total: 5,
    hired: 2,
    applicants: 19,
  },
  {
    id: '4',
    title: 'Office Cleaning Operative',
    employer: 'CleanPro Services',
    verified: true,
    hourlyRate: 22,
    shiftHours: 6,
    employmentType: 'Shift-based',
    city: 'Dubai',
    distance: 8,
    travelTime: 14,
    posted: '3 hours ago',
    total: 15,
    hired: 3,
    applicants: 27,
  },
];

function JobCard({ job }: { job: typeof DEMO_JOBS[0] }) {
  const dailyEarnings = job.hourlyRate * job.shiftHours;
  const isFilled = job.hired >= job.total;

  return (
    <article className="bg-white rounded-2xl border border-[#E2E8F0] hover:border-[#14B8A6] hover:shadow-[0_4px_20px_rgba(0,0,0,0.10)] transition-all duration-200 hover:-translate-y-0.5 flex flex-col overflow-hidden">
      <div className="p-5 flex-1 space-y-4">
        {/* Employer */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F0FDFA] border border-[#CCFBF1] flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-[#14B8A6]">{job.employer.charAt(0)}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0F172A] leading-tight">{job.employer}</p>
              {job.verified && <Badge variant="verified" className="mt-0.5 text-[10px] px-2 py-px" />}
            </div>
          </div>
          <span className="text-xs text-[#94A3B8] flex-shrink-0">{job.posted}</span>
        </div>

        {/* Job title */}
        <h3 className="text-base font-bold text-[#0F172A] font-[Manrope] leading-tight">
          {job.title}
        </h3>

        {/* Pay info */}
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="font-bold text-[#14B8A6] text-base">AED {job.hourlyRate}/hr</span>
          <span className="text-[#94A3B8]">·</span>
          <span className="text-[#64748B]">{job.shiftHours}hr shift</span>
          <span className="text-[#94A3B8]">·</span>
          <span className="font-semibold text-[#0F172A]">AED {dailyEarnings}/day</span>
        </div>

        {/* Location */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
          <svg className="w-3.5 h-3.5 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <span>{job.city}</span>
          {job.distance && (
            <>
              <span className="text-[#CBD5E1]">·</span>
              <span>{job.distance} km</span>
              <span className="text-[#CBD5E1]">·</span>
              <span>{job.travelTime} min</span>
              <button className="text-[#14B8A6] font-medium hover:text-[#0D9488] transition-colors" type="button">
                Map →
              </button>
            </>
          )}
        </div>

        {/* Employment type badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F1F5F9] text-[#475569]">
            {job.employmentType}
          </span>
        </div>

        {/* Hiring progress */}
        <div className="pt-1">
          <HiringProgress
            total={job.total}
            hired={job.hired}
            applicants={job.applicants}
            showLive={!isFilled}
          />
        </div>
      </div>

      {/* Apply button */}
      <div className="px-5 pb-5">
        {isFilled ? (
          <div className="w-full h-11 flex items-center justify-center bg-[#F0FDF4] border border-[#BBF7D0] rounded-[6px] text-sm font-semibold text-[#15803D]">
            ✓ All Positions Filled
          </div>
        ) : (
          <Link
            href={`/jobs/${job.id}`}
            className="w-full h-11 flex items-center justify-center bg-[#14B8A6] text-white text-sm font-semibold rounded-[6px] hover:bg-[#0D9488] hover:shadow-[0_4px_16px_rgba(20,184,166,0.25)] transition-all duration-150 active:scale-[0.98]"
            aria-label={`Apply for ${job.title} at ${job.employer}`}
          >
            Apply Now →
          </Link>
        )}
      </div>
    </article>
  );
}

export function FeaturedJobsSection() {
  return (
    <section className="section-full bg-white py-16 lg:py-20" aria-labelledby="featured-jobs-heading">
      <div className="container-content">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 id="featured-jobs-heading" className="text-2xl md:text-3xl font-bold text-[#0F172A] font-[Manrope]">
              Featured Jobs
            </h2>
            <p className="mt-1 text-[#64748B]">Live opportunities — apply before positions fill up</p>
          </div>
          <Link
            href="/jobs"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-[#14B8A6] hover:text-[#0D9488] transition-colors"
          >
            View all jobs
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {DEMO_JOBS.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#14B8A6] hover:text-[#0D9488] transition-colors"
          >
            View all jobs →
          </Link>
        </div>
      </div>
    </section>
  );
}
