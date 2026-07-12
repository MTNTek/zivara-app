import Link from 'next/link';

interface Skill { id: string; skillName: string }
interface Job {
  id: string;
  title: Record<string, string>;
  industry: string;
  city: string;
  country: string;
  employmentType: string;
  salaryMin: string | null;
  salaryMax: string | null;
  salaryCurrency: string;
  status: string;
  skills: Skill[];
}
interface SearchResult { data: Job[]; total: number; page: number; totalPages: number }

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: 'Full-time', part_time: 'Part-time',
  shift_based: 'Shift-based', contract: 'Contract',
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function getJobs(params: Record<string, string | string[] | undefined>): Promise<SearchResult> {
  const query = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val && typeof val === 'string') query.set(key, val);
  }
  try {
    const res = await fetch(`${API_URL}/jobs?${query.toString()}`, { next: { revalidate: 30 } });
    if (!res.ok) return { data: [], total: 0, page: 1, totalPages: 0 };
    return res.json() as Promise<SearchResult>;
  } catch {
    return { data: [], total: 0, page: 1, totalPages: 0 };
  }
}

export default async function JobsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const result = await getJobs(params);

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-zinc-100">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-lg font-semibold text-zinc-900">Zivara</Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-zinc-600 hover:text-zinc-900">Log in</Link>
            <Link href="/register" className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700">Get started</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Browse jobs</h1>
        <p className="mt-1 text-sm text-zinc-500">{result.total} job{result.total !== 1 ? 's' : ''} available</p>

        {/* Filters */}
        <form method="GET" className="mt-5 flex flex-wrap gap-3">
          <input name="industry" defaultValue={typeof params['industry'] === 'string' ? params['industry'] : ''} placeholder="Industry" className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none" />
          <input name="city" defaultValue={typeof params['city'] === 'string' ? params['city'] : ''} placeholder="City" className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none" />
          <input name="country" defaultValue={typeof params['country'] === 'string' ? params['country'] : ''} placeholder="Country" className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none" />
          <select name="employmentType" defaultValue={typeof params['employmentType'] === 'string' ? params['employmentType'] : ''} className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none">
            <option value="">All types</option>
            {Object.entries(EMPLOYMENT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <button type="submit" className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700">Search</button>
          {Object.keys(params).length > 0 && (
            <Link href="/jobs" className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50">Clear</Link>
          )}
        </form>

        {/* Job list */}
        <div className="mt-6 space-y-3">
          {result.data.length === 0 && (
            <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-6 py-10 text-center">
              <p className="text-sm text-zinc-500">No jobs match your search. Try adjusting your filters.</p>
            </div>
          )}
          {result.data.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`} className="block rounded-lg border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-400">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-medium text-zinc-900">{job.title['en'] ?? ''}</h2>
                  <p className="mt-0.5 text-sm text-zinc-500">
                    {job.industry} · {job.city}, {job.country}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs text-zinc-600">
                      {EMPLOYMENT_LABELS[job.employmentType] ?? job.employmentType}
                    </span>
                    {job.salaryMin && job.salaryMax && (
                      <span className="text-xs text-zinc-500">
                        {job.salaryCurrency} {Number(job.salaryMin).toLocaleString()} – {Number(job.salaryMax).toLocaleString()}
                      </span>
                    )}
                    {job.skills.slice(0, 3).map((s) => (
                      <span key={s.id} className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600">{s.skillName}</span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
