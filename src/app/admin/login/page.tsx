import Link from "next/link";
import { login } from "./actions";

export default async function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  const params = await searchParams;
  const errorParam = typeof params.error === "string" ? params.error : null;
  const error = errorParam === "1" ? "Incorrect email or password." : errorParam;
  const next = typeof params.next === "string" ? params.next : "/admin";

  return (
    <main className="flex-1 flex items-center justify-center p-8">
      <form action={login} className="w-full max-w-xs flex flex-col gap-3">
        <h1 className="text-lg font-semibold mb-1">Admin</h1>
        <input type="hidden" name="next" value={next} />
        <input
          type="email"
          name="email"
          placeholder="Email"
          autoFocus
          required
          autoComplete="username"
          className="rounded border border-line bg-surface px-3 py-2 text-sm"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          autoComplete="current-password"
          className="rounded border border-line bg-surface px-3 py-2 text-sm"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          className="rounded bg-accent text-white text-sm font-medium py-2 hover:opacity-90"
        >
          Log in
        </button>
        <Link
          href="/admin/forgot-password"
          className="text-sm text-muted underline underline-offset-2 text-center"
        >
          Forgot password?
        </Link>
      </form>
    </main>
  );
}
