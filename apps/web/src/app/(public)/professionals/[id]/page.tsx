import { notFound } from 'next/navigation';

interface Skill {
  id: string;
  skillName: string;
  yearsExperience: number | null;
}

interface Experience {
  id: string;
  jobTitle: string;
  companyName: string;
  industry: string | null;
  startDate: string;
  endDate: string | null;
  description: string | null;
}

interface PublicProfile {
  id: string;
  fullName: string;
  phone: string | null;
  nationality: string | null;
  currentCity: string | null;
  currentCountry: string | null;
  primaryIndustry: string | null;
  bio: string | null;
  profilePhotoUrl: string | null;
  isProfilePublic: boolean;
  verificationStatus: string;
  profileCompleteness: number;
  experience: Experience[];
  skills: Skill[];
}

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

async function getProfile(id: string): Promise<PublicProfile | null> {
  try {
    const res = await fetch(`${API_URL}/professionals/${id}`, {
      next: { revalidate: 60 }, // ISR — revalidate every 60 seconds
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return res.json() as Promise<PublicProfile>;
  } catch {
    return null;
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PublicProfessionalProfilePage({ params }: PageProps) {
  const { id } = await params;
  const profile = await getProfile(id);

  if (!profile) {
    notFound();
  }

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        {profile.profilePhotoUrl ? (
          <img
            src={profile.profilePhotoUrl}
            alt={profile.fullName}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-200 text-2xl font-semibold text-zinc-600"
          >
            {profile.fullName.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-zinc-900">{profile.fullName}</h1>
            {profile.verificationStatus === 'verified' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                ✓ Verified
              </span>
            )}
          </div>
          {profile.primaryIndustry && (
            <p className="text-sm text-zinc-500">{profile.primaryIndustry}</p>
          )}
          {(profile.currentCity ?? profile.currentCountry) && (
            <p className="text-sm text-zinc-400">
              {[profile.currentCity, profile.currentCountry].filter(Boolean).join(', ')}
            </p>
          )}
          {/* Only show nationality if professional opted in */}
          {profile.nationality && (
            <p className="text-xs text-zinc-400">{profile.nationality}</p>
          )}
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-zinc-700">About</h2>
          <p className="mt-1 text-sm text-zinc-600">{profile.bio}</p>
        </section>
      )}

      {/* Skills */}
      {profile.skills.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-zinc-700">Skills</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {profile.skills.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-700"
              >
                {s.skillName}
                {s.yearsExperience != null && (
                  <span className="ml-1 text-zinc-400">{s.yearsExperience}y</span>
                )}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Experience */}
      {profile.experience.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-zinc-700">Experience</h2>
          <div className="mt-3 space-y-4">
            {profile.experience.map((exp) => (
              <div key={exp.id} className="border-l-2 border-zinc-200 pl-4">
                <p className="text-sm font-medium text-zinc-900">{exp.jobTitle}</p>
                <p className="text-sm text-zinc-500">
                  {exp.companyName}
                  {exp.industry ? ` · ${exp.industry}` : ''}
                </p>
                <p className="text-xs text-zinc-400">
                  {exp.startDate} — {exp.endDate ?? 'Present'}
                </p>
                {exp.description && (
                  <p className="mt-1 text-xs text-zinc-500">{exp.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
