// Employer dashboard layout — requires authentication with 'employer' role.
// Route protection is enforced in middleware.ts.
export default function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-zinc-50">{children}</div>;
}
