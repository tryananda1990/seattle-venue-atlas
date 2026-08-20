import Link from "next/link";
import { requestPasswordReset } from "./actions";

export default async function ForgotPasswordPage({
  searchParams,
}: PageProps<"/admin/forgot-password">) {
  const params = await searchParams;
  const sent = params.sent === "1";

  return (
    <main className="flex-1 flex items-center justify-center p-8">
      <div className="w-full max-w-xs flex flex-col gap-3">
        <h1 className="text-lg font-semibold mb-1">Reset password</h1>

        {sent ? (
          <p className="text-sm text-muted">
            If that email has an admin account, a reset link is on its way. Check your inbox.
          </p>
        ) : (
          <form action={requestPasswordReset} className="flex flex-col gap-3">
            <input
              type="email"
              name="email"
              placeholder="Email"
              autoFocus
              required
              className="rounded border border-line bg-surface px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded bg-accent text-white text-sm font-medium py-2 hover:opacity-90"
            >
              Send reset link
            </button>
          </form>
        )}

        <Link href="/admin/login" className="text-sm text-muted underline underline-offset-2">
          Back to log in
        </Link>
      </div>
    </main>
  );
}
