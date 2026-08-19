const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Home() {
  return (
    <main className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-md text-center space-y-3">
        <h1 className="text-2xl font-semibold">Seattle Venue Atlas</h1>
        <p className="text-gray-600">
          {isSupabaseConfigured
            ? "Supabase is connected. The venue list and filters are next."
            : "Project scaffolded. Add Supabase credentials to .env.local to start loading venues."}
        </p>
      </div>
    </main>
  );
}
