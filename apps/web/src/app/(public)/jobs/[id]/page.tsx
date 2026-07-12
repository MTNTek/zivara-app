import { notFound } from 'next/navigation';
import Link from 'next/link';

interface Job {
  id: string;
  employerId: string;
  title: Record<string, string>;
  description: Record<string, string>;
  industry: string;
  city: string;
  country: string;
  employmentType: string;
  salaryMin: string | null;
  salaryMax: string | null;
  salaryCurrency: string;
  status: string;
  viewCount: number;
  expiresAt: string;
  skills: { id: string; skillName: string }[];
}

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';
const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: 'Full-time', part_time: 'Part-time',
  shift_based: 'Shift-based', contract: 'Contract',
};

async function getJob(id: string): Promise<Job | null> {
  try {
    const res = await fetch(`${API_URL}/jobs/${id}`, { next: { revalidate: 60 } });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return res.json() as Promise<Job>;
  } catch { return null; }
}

interface PageProps { params: Promise<{ id: string }> }

export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) notFound();

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-zinc-100">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-lg font-semibold text-zinc-900">Zivara</Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-zinc-600 hover:text-zinc-900">Log in</Link>
            <Link href="/register" className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700">Get started</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link href="/jobs" className="text-xs text-zinc-500 hover:text-zinc-900">← Back to jobs</Link>

        <div className="mt-5">
          <h1 className="text-2xl font-semibold text-zinc-900">{job.title['en']}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {job.industry} · {job.city}, {job.country}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-600">
              {EMPLOYMENT_LABELS[job.employmentType] ?? job.employmentType}
            </span>
            {job.salaryMin && job.salaryMax && (
              <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-600">
                {job.salaryCurrency} {Number(job.salaryMin).toLocaleString()} – {Number(job.salaryMax).toLocaleString()} / month
              </span>
            )}
          </div>

          {/* Apply CTA — prompts registration for unauthenticated users */}
          <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-5">
            <p className="text-sm font-medium text-zinc-900">Interested in this role?</p>
            <p className="mt-1 text-sm text-zinc-500">Create a free account to apply in minutes.</p>
            <div className="mt-4 flex gap-3">
              <Link href="/register/professional" className="rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700">
                Apply now
              </Link>
              <Link href="/login" className="rounded-md border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-white">
                Log in
              </Link>
            </div>
          </div>

          {/* Description */}
          <section className="mt-8">
            <h2 className="font-semibold text-zinc-900">Job description</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-600">{job.description['en']}</p>
          </section>

          {/* Skills */}
          {job.skills.length > 0 && (
            <section className="mt-6">
              <h2 className="font-semibold text-zinc-900">Required skills</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {job.skills.map((s) => (
                  <span key={s.id} className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700">
                    {s.skillName}
                  </span>
                ))}
              </div>
            </section>
          )}

          <p className="mt-8 text-xs text-zinc-400">
            Posted · Expires {new Date(job.expiresAt).toLocaleDateString('en-GB')}
          </p>
        </div>
      </div>
    </main>
  );
}
