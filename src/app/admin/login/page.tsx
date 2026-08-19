import { login } from "./actions";

export default async function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  const params = await searchParams;
  const error = params.error === "1";
  const next = typeof params.next === "string" ? params.next : "/admin";

  return (
    <main className="flex-1 flex items-center justify-center p-8">
      <form action={login} className="w-full max-w-xs flex flex-col gap-3">
        <h1 className="text-lg font-semibold mb-1">Admin</h1>
        <input type="hidden" name="next" value={next} />
        <input
          type="password"
          name="pin"
          placeholder="PIN"
          autoFocus
          required
          autoComplete="off"
          className="rounded border border-line bg-surface px-3 py-2 text-sm"
        />
        {error && <p className="text-sm text-red-500">Incorrect PIN.</p>}
        <button
          type="submit"
          className="rounded bg-accent text-white text-sm font-medium py-2 hover:opacity-90"
        >
          Log in
        </button>
      </form>
    </main>
  );
}
