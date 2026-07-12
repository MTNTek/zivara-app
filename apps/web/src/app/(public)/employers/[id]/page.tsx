import { notFound } from 'next/navigation';

interface EmployerPublicProfile {
  id: string;
  companyName: string;
  industry: string;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  employeeCountRange: string | null;
  operatingCountry: string;
  verificationStatus: string;
  isBadgeVisible: boolean;
}

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

async function getEmployer(id: string): Promise<EmployerPublicProfile | null> {
  try {
    const res = await fetch(`${API_URL}/employers/${id}`, { next: { revalidate: 60 } });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return res.json() as Promise<EmployerPublicProfile>;
  } catch {
    return null;
  }
}

interface PageProps { params: Promise<{ id: string }> }

export default async function PublicEmployerProfilePage({ params }: PageProps) {
  const { id } = await params;
  const employer = await getEmployer(id);

  if (!employer) notFound();

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-4">
        {employer.logoUrl ? (
          <img src={employer.logoUrl} alt={employer.companyName} className="h-14 w-14 rounded-lg object-cover" />
        ) : (
          <div aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-lg bg-zinc-100 text-xl font-semibold text-zinc-500">
            {employer.companyName.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-zinc-900">{employer.companyName}</h1>
            {employer.isBadgeVisible && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">✓ Verified Employer</span>
            )}
          </div>
          <p className="text-sm text-zinc-500">{employer.industry} · {employer.operatingCountry}</p>
          {employer.websiteUrl && (
            <a href={employer.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-400 hover:underline">{employer.websiteUrl}</a>
          )}
        </div>
      </div>

      {employer.description && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-zinc-700">About</h2>
          <p className="mt-1 text-sm text-zinc-600">{employer.description}</p>
        </section>
      )}

      {employer.employeeCountRange && (
        <div className="mt-4 text-sm text-zinc-500">
          <span className="font-medium text-zinc-700">Team size:</span> {employer.employeeCountRange} employees
        </div>
      )}
    </main>
  );
}
