// Professional dashboard layout — requires authentication with 'professional' role.
// Route protection is enforced in middleware.ts.
export default function ProfessionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-zinc-50">{children}</div>;
}
