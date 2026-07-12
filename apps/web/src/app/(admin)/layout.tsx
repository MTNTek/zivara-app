// Admin portal layout — requires authentication with 'admin' role.
// Route protection is enforced in middleware.ts.
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-zinc-100">{children}</div>;
}
