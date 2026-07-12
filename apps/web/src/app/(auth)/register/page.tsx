import Link from 'next/link';

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900">Create your account</h1>
          <p className="mt-1 text-sm text-zinc-500">Join Zivara — it&apos;s free</p>
        </div>

        <div className="space-y-3">
          <Link
            href="/register/professional"
            className="flex w-full flex-col rounded-lg border border-zinc-200 bg-white px-5 py-4 text-left shadow-sm transition-colors hover:border-zinc-400 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
          >
            <span className="text-sm font-semibold text-zinc-900">I&apos;m looking for work</span>
            <span className="mt-0.5 text-xs text-zinc-500">
              Find jobs and shifts that match your skills
            </span>
          </Link>

          <Link
            href="/register/employer"
            className="flex w-full flex-col rounded-lg border border-zinc-200 bg-white px-5 py-4 text-left shadow-sm transition-colors hover:border-zinc-400 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
          >
            <span className="text-sm font-semibold text-zinc-900">I&apos;m hiring</span>
            <span className="mt-0.5 text-xs text-zinc-500">
              Post jobs and find qualified professionals
            </span>
          </Link>
        </div>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-zinc-900 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
