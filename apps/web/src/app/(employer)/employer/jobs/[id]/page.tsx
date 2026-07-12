interface EmployerJobDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function EmployerJobDetailPage({ params }: EmployerJobDetailPageProps) {
  const { id } = await params;
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold">Job Detail</h1>
      <p className="mt-2 text-zinc-500">Job ID: {id}</p>
    </main>
  );
}
